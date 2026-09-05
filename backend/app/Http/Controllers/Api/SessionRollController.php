<?php

namespace App\Http\Controllers\Api;

use App\Models\Attendance;
use App\Models\ClassSession;
use App\Models\Enrollment;
use App\Models\Student;
use App\Support\TeacherScope;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Pasar lista: la asistencia de una sesión, de una vez.
 *
 * Antes la asistencia se creaba de una en una, eligiendo alumno y sesión en dos
 * desplegables. Para un profesor con 25 alumnos eso son 25 altas, 50
 * selecciones y una oportunidad de equivocarse en cada una. No es como se pasa
 * lista en ningún sitio: se pasa mirando la lista de la clase de arriba abajo.
 *
 * ── Quién sale en la lista ──────────────────────────────────────────────────
 *
 * Los alumnos MATRICULADOS en el grupo de la sesión, y solo esos. No se pide a
 * quién marcar: la lista es la clase, y que la componga el servidor evita la
 * otra mitad del error de antes —registrar a un alumno en la sesión de un grupo
 * en el que no está—.
 *
 * ── Lo ya marcado viaja de vuelta ───────────────────────────────────────────
 *
 * Cada alumno llega con su estado actual, o `null` si nadie lo ha marcado
 * todavía. Sin eso, reabrir la lista para corregir a uno pondría a los otros
 * veinticuatro en el estado por defecto, y bastaría con guardar para arrasar el
 * trabajo hecho.
 *
 * ── Guardar es reemplazar, no acumular ──────────────────────────────────────
 *
 * `attendances` tiene única la pareja sesión + alumno, así que guardar
 * ACTUALIZA lo que ya hubiera y crea lo que falte. Pasar lista dos veces deja
 * una fila por alumno, no dos, y la segunda pasada corrige a la primera — que es
 * lo que uno espera al volver sobre una lista.
 */
class SessionRollController extends Controller
{
    use AuthorizesRequests;

    public function show(int $sessionId): JsonResponse
    {
        $session = $this->reachableSession($sessionId);

        $this->authorizeFor($session);

        return response()->json([
            'session' => $session->load('classGroup.tutorGroup', 'classGroup.subject'),
            'students' => $this->roll($session),
        ]);
    }

    public function store(Request $request, int $sessionId): JsonResponse
    {
        $session = $this->reachableSession($sessionId);

        $this->authorizeFor($session);

        $enrolled = $this->enrolledIds($session);

        $data = Validator::make($request->all(), [
            'entries' => ['required', 'array', 'min:1'],
            // El alumno tiene que estar MATRICULADO en el grupo de esta sesión.
            // No basta con que sea del centro: sin esto se podría pasar lista a
            // cualquier alumno sobre cualquier sesión, que es justo el error que
            // esta pantalla viene a impedir.
            'entries.*.student_id' => ['required', Rule::in($enrolled)],
            'entries.*.status' => ['required', Rule::in(['present', 'absent', 'late', 'excused'])],
            'entries.*.comment' => ['nullable', 'string'],
        ], [], [
            'entries.*.student_id' => __('validation.attributes.student_id'),
        ])->validate();

        DB::transaction(function () use ($data, $session): void {
            foreach ($data['entries'] as $entry) {
                // `updateOrCreate` sobre la pareja única: la segunda pasada
                // corrige a la primera en lugar de chocar con el índice.
                Attendance::query()->updateOrCreate(
                    [
                        'class_session_id' => $session->getKey(),
                        'student_id' => $entry['student_id'],
                    ],
                    [
                        'status' => $entry['status'],
                        'comment' => $entry['comment'] ?? null,
                    ]
                );
            }
        });

        return response()->json([
            'session' => $session,
            'students' => $this->roll($session),
            'saved' => count($data['entries']),
        ]);
    }

    /**
     * La sesión, o 404.
     *
     * Se busca con el recorte del profesor aplicado, así que una sesión que no
     * imparte responde 404 y no 403: indistinguible de una que no existe, para
     * no delatar lo que hay en el grupo de otro (FR-020).
     */
    private function reachableSession(int $sessionId): ClassSession
    {
        $query = ClassSession::query();

        $user = request()->user();

        if ($user !== null && $user->hasRole('teacher') && ! $user->hasRole('org_admin')) {
            $query->whereIn('class_group_id', app(TeacherScope::class)->classGroupIdsFor($user));
        }

        return $query->findOrFail($sessionId);
    }

    /**
     * Autoriza con la policy de asistencia, que ya sabe decidir esto.
     *
     * Se le da el identificador de la sesión por la petición, que es de donde lo
     * lee al crear. No se duplica aquí la regla: una segunda copia de «quién
     * puede tocar la asistencia de esta sesión» acabaría divergiendo de la
     * primera, y una de las dos abriría de más.
     */
    private function authorizeFor(ClassSession $session): void
    {
        request()->merge(['class_session_id' => $session->getKey()]);

        $this->authorize('create', Attendance::class);
    }

    /** @return list<int> */
    private function enrolledIds(ClassSession $session): array
    {
        return Enrollment::query()
            ->where('class_group_id', $session->class_group_id)
            ->where('status', 'active')
            ->pluck('student_id')
            ->all();
    }

    /**
     * La clase, con lo ya marcado al lado.
     *
     * Una sola consulta para los alumnos y otra para la asistencia existente: no
     * una por alumno. Con 30 en un aula la diferencia no se nota; con la lista
     * abriéndose en cada sesión de cada grupo, sí.
     *
     * @return list<array<string, mixed>>
     */
    private function roll(ClassSession $session): array
    {
        $ids = $this->enrolledIds($session);

        $marcados = Attendance::query()
            ->where('class_session_id', $session->getKey())
            ->get()
            ->keyBy('student_id');

        return Student::query()
            ->whereIn('id', $ids)
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(fn (Student $student) => [
                'student_id' => $student->getKey(),
                'full_name' => $student->full_name,
                // Nulo y NO «present» por defecto: quien no se ha marcado
                // todavía no es un presente, es un alumno sin marcar. Decidirlo
                // aquí pondría a la clase entera como presente con solo abrir la
                // pantalla.
                'status' => $marcados[$student->getKey()]->status ?? null,
                'comment' => $marcados[$student->getKey()]->comment ?? null,
            ])
            ->all();
    }
}
