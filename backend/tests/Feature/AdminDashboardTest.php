<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * El panel de administración.
 *
 * Lo que estas pruebas defienden no es la maquetación, es la ARITMÉTICA: un
 * panel que enseña porcentajes es más peligroso que uno que enseña listas,
 * porque un número redondo y bien tipografiado se cree sin comprobarlo.
 *
 * Dos cosas concretas:
 *
 * 1. Que los agregados salgan de la base y no de una página de resultados. Un
 *    porcentaje calculado sobre los diez primeros registros se parece lo
 *    bastante a la verdad como para que nadie note que no lo es.
 * 2. Que NO crucen organizaciones. Es el punto donde el aislamiento es más fácil
 *    de perder sin enterarse: nadie ve una fila ajena, solo un porcentaje algo
 *    distinto del que debería.
 */
class AdminDashboardTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $orgA;

    private string $tokenA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->orgA = $this->createOrganization(['name' => 'Centro A']);
        $this->tokenA = $this->tokenFor($this->createUserFor($this->orgA, 'org_admin'));
    }

    /**
     * Siembra asistencia con un reparto conocido en una sesión de HOY.
     *
     * @param  array<string, int>  $byStatus
     */
    private function seedAttendance(Organization $organization, array $byStatus): void
    {
        $subject = $this->createSubject($organization);
        $teacher = $this->createTeacherProfile($organization);
        $group = $this->createClassGroup($organization, [
            'subject_id' => $subject->getKey(),
            'teacher_id' => $teacher->getKey(),
        ]);

        $session = $this->createClassSession($organization, $group, [
            'session_date' => now()->toDateString(),
        ]);

        foreach ($byStatus as $status => $count) {
            for ($i = 0; $i < $count; $i++) {
                $this->createAttendance(
                    $organization,
                    $session,
                    $this->createStudent($organization),
                    ['status' => $status]
                );
            }
        }
    }

    /**
     * Compara porcentajes sin atarse al tipo que sobrevive al JSON.
     *
     * `round(90.0, 1)` es un float en PHP, pero se serializa como `90` y vuelve
     * como entero: `assertSame(90.0, ...)` fallaría por el tipo aunque el número
     * sea exacto. Lo que se comprueba aquí es la aritmética, no si el
     * codificador conservó el punto decimal.
     */
    private function assertRate(float $expected, mixed $actual, string $message = ''): void
    {
        $this->assertIsNumeric($actual, $message);
        $this->assertSame($expected, (float) $actual, $message);
    }

    private function dashboard(): array
    {
        return $this->actingWithToken($this->tokenA)
            ->getJson('/api/v1/dashboard')
            ->assertOk()
            ->json();
    }

    public function test_attendance_rate_is_the_share_of_present_records(): void
    {
        // 18 de 20 presentes = 90,0 %.
        $this->seedAttendance($this->orgA, ['present' => 18, 'absent' => 1, 'late' => 1]);

        $data = $this->dashboard();

        $this->assertSame('admin', $data['role']);
        $this->assertRate(90.0, $data['attendance']['rate']);
        $this->assertRate(90.0, $data['stats']['attendance_rate']);
    }

    /**
     * El desglose enumera SIEMPRE los cuatro estados, incluidos los que están a
     * cero: una lista que cambia de altura entre recargas es de lo que peor se
     * lee, y `excused` es un estado de pleno derecho aunque esa semana no haya
     * ninguno.
     */
    public function test_the_breakdown_always_lists_the_four_states(): void
    {
        $this->seedAttendance($this->orgA, ['present' => 8, 'absent' => 2]);

        $breakdown = collect($this->dashboard()['attendance']['breakdown'])
            ->pluck('share', 'status');

        $this->assertSame(
            ['present', 'absent', 'late', 'excused'],
            $breakdown->keys()->all()
        );
        $this->assertRate(80.0, $breakdown['present']);
        $this->assertRate(20.0, $breakdown['absent']);
        $this->assertRate(0.0, $breakdown['late']);
        $this->assertRate(0.0, $breakdown['excused']);
    }

    /**
     * EL punto que importa: la asistencia de otro centro no entra en el
     * porcentaje de este.
     *
     * El Centro B se siembra ENTERO de faltas. Si el agregado se escapara del
     * global scope, el 100 % del Centro A se hundiría hasta la mitad, y nadie
     * vería una sola fila ajena para sospecharlo.
     */
    public function test_aggregates_never_mix_another_organization(): void
    {
        $orgB = $this->createOrganization(['name' => 'Centro B']);

        $this->seedAttendance($this->orgA, ['present' => 10]);
        $this->seedAttendance($orgB, ['absent' => 10]);

        $data = $this->dashboard();

        $this->assertRate(100.0, $data['attendance']['rate'], 'La asistencia del otro centro se coló en el porcentaje.');
        $this->assertSame(10, $data['stats']['students'], 'Los alumnos del otro centro se contaron aquí.');
    }

    /**
     * Un día sin registros vale null y NO cero. Cero significa «no vino nadie»;
     * nulo, «no hubo clase». Confundirlos convierte un puente en un desplome en
     * el dato que se mira primero.
     */
    public function test_days_without_records_are_null_not_zero(): void
    {
        $this->seedAttendance($this->orgA, ['present' => 4]);

        $trend = collect($this->dashboard()['attendance']['trend']);

        $this->assertSame(['mon', 'tue', 'wed', 'thu', 'fri'], $trend->pluck('day')->all());

        $today = strtolower(now()->locale('en')->isoFormat('ddd'));

        foreach ($trend as $point) {
            if ($point['day'] === $today) {
                $this->assertRate(100.0, $point['rate']);
            } else {
                $this->assertNull($point['rate'], "El día {$point['day']} no tenía registros y no debe valer cero.");
            }
        }
    }

    /**
     * Un centro recién creado no debe enseñar «0 % de asistencia», que es una
     * afirmación sobre el centro. Sin registros no hay porcentaje: null.
     */
    public function test_a_centre_without_records_reports_no_rate(): void
    {
        $data = $this->dashboard();

        $this->assertNull($data['attendance']['rate']);
        $this->assertNull($data['attendance']['delta']);
    }

    /**
     * «Requiere atención» solo trae lo que tiene algo que atender. Un aviso que
     * dice «0 pagos pendientes» es ruido con aspecto de alerta.
     */
    public function test_attention_items_omit_everything_at_zero(): void
    {
        $this->assertSame([], $this->dashboard()['attentionItems']);
    }

    public function test_pending_payments_are_counted_and_raised_as_an_item(): void
    {
        $student = $this->createStudent($this->orgA);

        $this->createPayment($this->orgA, $student, ['status' => 'pending']);
        $this->createPayment($this->orgA, $student, ['status' => 'pending']);
        $this->createPayment($this->orgA, $student, ['status' => 'paid']);

        $data = $this->dashboard();

        $this->assertSame(2, $data['stats']['pending_payments']);

        $items = collect($data['attentionItems'])->pluck('count', 'key');
        $this->assertSame(2, $items['pendingPayments']);
    }

    /**
     * El caso que trae la regla de la materia y que sin esta alerta es
     * invisible: la ficha del grupo se ve perfectamente rellena, tiene profesor
     * asignado, y sin embargo ese profesor no lo alcanza porque imparte otra
     * materia. Solo se descubre cuando el profesor llama diciendo que no ve nada.
     */
    public function test_a_group_whose_teacher_teaches_another_subject_is_raised(): void
    {
        $maths = $this->createSubject($this->orgA, ['name' => 'Matematicas']);
        $philosophy = $this->createSubject($this->orgA, ['name' => 'Filosofia']);

        $teacher = $this->createTeacherProfile($this->orgA, null, [
            'subject_id' => $philosophy->getKey(),
        ]);

        // Grupo de Matemáticas a cargo de quien imparte Filosofía.
        $this->createClassGroup($this->orgA, [
            'subject_id' => $maths->getKey(),
            'teacher_id' => $teacher->getKey(),
        ]);

        $items = collect($this->dashboard()['attentionItems'])->pluck('count', 'key');

        $this->assertSame(1, $items['groupsSubjectMismatch']);
    }

    public function test_a_group_without_teacher_is_raised(): void
    {
        $this->createClassGroup($this->orgA, ['teacher_id' => null]);

        $items = collect($this->dashboard()['attentionItems'])->pluck('count', 'key');

        $this->assertSame(1, $items['groupsWithoutTeacher']);
        $this->assertArrayNotHasKey('groupsSubjectMismatch', $items->all());
    }

    /**
     * El panel ya no devuelve las últimas sesiones: consultarlas es trabajo del
     * módulo de Sesiones, y en el panel ocupaban el sitio de lo que sí hay que
     * mirar a diario.
     */
    public function test_the_payload_no_longer_carries_recent_sessions(): void
    {
        $data = $this->dashboard();

        $this->assertArrayNotHasKey('recentSessions', $data);
        $this->assertArrayHasKey('recentPayments', $data);
        $this->assertArrayHasKey('attendance', $data);
        $this->assertArrayHasKey('attentionItems', $data);
    }

    /**
     * El panel del profesor conserva su forma y sus próximas sesiones, que para
     * él sí son su trabajo del día.
     */
    public function test_the_teacher_dashboard_keeps_its_own_shape(): void
    {
        $teacherUser = $this->createUserFor($this->orgA, 'teacher');
        $this->createTeacherProfile($this->orgA, $teacherUser);

        $data = $this->actingWithToken($this->tokenFor($teacherUser))
            ->getJson('/api/v1/dashboard')
            ->assertOk()
            ->json();

        $this->assertSame('teacher', $data['role']);
        $this->assertArrayHasKey('upcomingSessions', $data);
        $this->assertArrayNotHasKey('attentionItems', $data);
    }

    /**
     * Sus grupos SON su panel, y por eso vienen con recuentos reales.
     *
     * Antes traía una lista plana de «asistencia reciente»: los últimos ocho
     * registros, mezclando grupos y días. No respondía a nada de lo que un
     * profesor hace al abrir la aplicación —no dice de qué grupo toca hoy, ni
     * cuántos alumnos tiene, ni lleva a ninguna parte— y crecía sin
     * organizarse. Se retiró, y estas comprobaciones lo fijan.
     */
    public function test_the_teacher_dashboard_carries_group_counts_and_no_flat_list(): void
    {
        $teacherUser = $this->createUserFor($this->orgA, 'teacher');
        $profile = $this->createTeacherProfile($this->orgA, $teacherUser);

        $subject = $this->createSubject($this->orgA);
        $group = $this->createClassGroup($this->orgA, [
            'subject_id' => $subject->getKey(),
            'teacher_id' => $profile->getKey(),
        ]);

        $this->createClassSession($this->orgA, $group);
        $this->createClassSession($this->orgA, $group);
        $this->createEnrollment($this->orgA, $this->createStudent($this->orgA), $group);

        $data = $this->actingWithToken($this->tokenFor($teacherUser))
            ->getJson('/api/v1/dashboard')
            ->assertOk()
            ->json();

        $this->assertArrayNotHasKey('recentAttendances', $data, 'La lista plana de asistencia sigue ahí.');

        $suyo = collect($data['myGroups'])->firstWhere('id', $group->getKey());

        $this->assertSame(2, $suyo['class_sessions_count']);
        $this->assertSame(1, $suyo['enrollments_count']);
    }

    public function test_recent_payments_only_shows_this_centre(): void
    {
        $orgB = $this->createOrganization(['name' => 'Centro B']);

        $this->createPayment($orgB, $this->createStudent($orgB), ['reference' => 'AJENO']);
        $this->createPayment($this->orgA, $this->createStudent($this->orgA), ['reference' => 'PROPIO']);

        $references = collect($this->dashboard()['recentPayments'])->pluck('reference');

        $this->assertContains('PROPIO', $references);
        $this->assertNotContains('AJENO', $references);
        $this->assertSame(1, Student::query()->count());
    }
}
