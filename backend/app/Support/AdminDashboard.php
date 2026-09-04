<?php

namespace App\Support;

use App\Models\Attendance;
use App\Models\ClassGroup;
use App\Models\Payment;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Los números del panel de administración.
 *
 * Todo se agrega EN LA BASE. Ni un solo dato de esta clase sale de recorrer
 * páginas en el cliente: un porcentaje calculado sobre los diez registros que
 * cupieron en la primera página no es el porcentaje del centro, es el de esos
 * diez, y se parece lo bastante a la verdad como para que nadie lo note.
 *
 * Todas las consultas pasan por los modelos, nunca por `DB::table`. Es lo que
 * mantiene el global scope de organización en pie: un `DB::table('attendances')`
 * aquí mezclaría los datos de todos los centros en un solo porcentaje.
 *
 * ── Qué se considera «asistencia» ───────────────────────────────────────────
 *
 * El porcentaje es PRESENTES sobre el total de registros. No se suman los
 * retrasos ni las faltas justificadas: el centro las registra por separado
 * precisamente para distinguirlas, y meterlas en el mismo saco desharía esa
 * distinción justo en el número que se mira primero. Así el titular coincide
 * siempre con la línea «Presente» del desglose, que es lo que uno espera al
 * verlos juntos.
 */
class AdminDashboard
{
    /** Ventana del titular y de las alertas. Un mes es lo que cubre un ciclo de cobro. */
    private const WINDOW_DAYS = 30;

    /** Por debajo de esto, el alumno aparece en «Requiere atención». */
    private const LOW_ATTENDANCE = 75.0;

    /** Sin al menos estos registros, un porcentaje por alumno no dice nada. */
    private const MIN_RECORDS_FOR_ALERT = 4;

    public function payload(): array
    {
        $rate = $this->attendanceRate($this->windowStart(), Carbon::now());

        return [
            // Discriminador de vista, no el nombre del rol: el frontend solo
            // comprueba `=== 'teacher'`. Se conserva para no cambiar la forma de
            // la respuesta sin necesidad (FR-026).
            'role' => 'admin',
            'stats' => [
                'students' => Student::count(),
                'teachers' => Teacher::count(),
                'groups' => ClassGroup::count(),
                'attendance_rate' => $rate,
                'pending_payments' => $this->pendingPaymentsCount(),
            ],
            'attendance' => [
                'rate' => $rate,
                'delta' => $this->weeklyDelta(),
                'trend' => $this->weeklyTrend(),
                'breakdown' => $this->breakdown(),
            ],
            'recentPayments' => Payment::with(['student', 'guardian'])->latest()->take(5)->get(),
            'attentionItems' => $this->attentionItems(),
        ];
    }

    private function windowStart(): Carbon
    {
        return Carbon::now()->subDays(self::WINDOW_DAYS)->startOfDay();
    }

    /**
     * Reparto de estados en la ventana, en una sola consulta.
     *
     * @return Collection<string, int>
     */
    private function statusCounts(Carbon $from, Carbon $to): Collection
    {
        return Attendance::query()
            ->whereHas('classSession', fn ($sessions) => $sessions->whereBetween('session_date', [$from, $to]))
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');
    }

    /** Porcentaje de presentes, o null cuando no hay ni un registro del que hablar. */
    private function attendanceRate(Carbon $from, Carbon $to): ?float
    {
        $counts = $this->statusCounts($from, $to);
        $total = $counts->sum();

        if ($total === 0) {
            return null;
        }

        return round(($counts->get('present', 0) / $total) * 100, 1);
    }

    /**
     * Desglose completo, incluidos los estados con cero.
     *
     * Se enumeran los cuatro SIEMPRE. Omitir los que están a cero haría que el
     * desglose cambiara de forma según la semana, y una lista que cambia de
     * altura al recargar es de lo que peor se lee.
     *
     * @return list<array{status: string, share: float}>
     */
    private function breakdown(): array
    {
        $counts = $this->statusCounts($this->windowStart(), Carbon::now());
        $total = $counts->sum();

        return collect(['present', 'absent', 'late', 'excused'])
            ->map(fn (string $status) => [
                'status' => $status,
                'share' => $total === 0 ? 0.0 : round(($counts->get($status, 0) / $total) * 100, 1),
            ])
            ->all();
    }

    /**
     * Lunes a viernes de esta semana.
     *
     * Un día sin ni un registro devuelve `null` y NO cero: son cosas distintas.
     * Cero por ciento significa «vinieron y no había nadie»; nulo significa «no
     * hubo clase». Dibujarlos igual convertiría el sábado en una catástrofe.
     *
     * @return list<array{day: string, rate: float|null}>
     */
    private function weeklyTrend(): array
    {
        $monday = Carbon::now()->startOfWeek();

        return collect(range(0, 4))
            ->map(function (int $offset) use ($monday) {
                $day = $monday->copy()->addDays($offset);

                return [
                    // Clave estable, no el rótulo: quien traduce «L M X J V» es
                    // la interfaz, no la API.
                    'day' => strtolower($day->locale('en')->isoFormat('ddd')),
                    'rate' => $this->attendanceRate($day->copy()->startOfDay(), $day->copy()->endOfDay()),
                ];
            })
            ->all();
    }

    /** Diferencia en puntos con la semana anterior. Null si falta alguno de los dos. */
    private function weeklyDelta(): ?float
    {
        $thisWeek = $this->attendanceRate(Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek());
        $lastWeek = $this->attendanceRate(
            Carbon::now()->subWeek()->startOfWeek(),
            Carbon::now()->subWeek()->endOfWeek()
        );

        if ($thisWeek === null || $lastWeek === null) {
            return null;
        }

        return round($thisWeek - $lastWeek, 1);
    }

    private function pendingPaymentsCount(): int
    {
        return Payment::query()->where('status', 'pending')->count();
    }

    /**
     * Situaciones que piden una decisión, con su recuento y su destino.
     *
     * Se devuelve la CLAVE y el número, no la frase. El texto se traduce en la
     * interfaz, como todo lo demás; mandarlo escrito desde el servidor metería
     * castellano en la API y obligaría a tocar el backend para cambiar una coma.
     *
     * Solo se incluye lo que tiene algo que atender: una alerta que dice «0
     * pagos pendientes» es ruido con aspecto de aviso.
     *
     * @return list<array{key: string, count: int}>
     */
    private function attentionItems(): array
    {
        return collect([
            ['key' => 'pendingPayments', 'count' => $this->pendingPaymentsCount()],
            ['key' => 'lowAttendance', 'count' => $this->lowAttendanceCount()],
            ['key' => 'groupsWithoutTeacher', 'count' => $this->groupsWithoutTeacherCount()],
            ['key' => 'groupsSubjectMismatch', 'count' => $this->groupsSubjectMismatchCount()],
        ])
            ->filter(fn (array $item) => $item['count'] > 0)
            ->values()
            ->all();
    }

    /**
     * Alumnos por debajo del umbral en la ventana.
     *
     * Se exige un mínimo de registros: con dos faltas de dos sesiones, el
     * porcentaje es 0 % y el alumno encabezaría la lista aunque acabe de
     * matricularse. Eso no es un problema de asistencia, es falta de datos, y
     * mezclarlos vacía la alerta de sentido.
     */
    private function lowAttendanceCount(): int
    {
        $from = $this->windowStart();

        return Attendance::query()
            ->whereHas('classSession', fn ($sessions) => $sessions->whereBetween('session_date', [$from, Carbon::now()]))
            ->selectRaw('student_id')
            ->groupBy('student_id')
            ->havingRaw('COUNT(*) >= ?', [self::MIN_RECORDS_FOR_ALERT])
            ->havingRaw(
                'SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) * 100.0 / COUNT(*) < ?',
                ['present', self::LOW_ATTENDANCE]
            )
            ->get()
            ->count();
    }

    private function groupsWithoutTeacherCount(): int
    {
        return ClassGroup::query()->whereNull('teacher_id')->count();
    }

    /**
     * Grupos con profesor asignado que, aun así, nadie puede atender.
     *
     * Desde que la materia de la ficha gobierna el alcance, un grupo cuyo
     * profesor imparte OTRA materia queda tan huérfano como uno sin profesor: su
     * titular no alcanza el grupo y no puede crearle sesiones. Sin esta alerta el
     * caso es invisible —la ficha de grupo se ve perfectamente rellena— y solo
     * aparece cuando el profesor llama diciendo que no ve nada.
     */
    private function groupsSubjectMismatchCount(): int
    {
        // Una sola condición cubre los dos casos: la ficha sin materia y la ficha
        // con otra materia. Si `teachers.subject_id` es nulo, la comparación de
        // columnas no casa, y el grupo entra igual — que es lo correcto, porque
        // el efecto para el profesor es el mismo: no lo alcanza.
        return ClassGroup::query()
            ->whereNotNull('teacher_id')
            ->whereDoesntHave(
                'teacher',
                fn ($teacher) => $teacher->whereColumn('teachers.subject_id', 'class_groups.subject_id')
            )
            ->count();
    }
}
