<?php

namespace Tests\Feature;

use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * Asistencia organizada por grupo.
 *
 * El motivo de fondo es el mismo que invirtió la jerarquía en alumnos: **la
 * paginación es global**. Una lista única de asistencia trae 20 registros del
 * centro entero, mezclando grupos y días, y cualquier agrupación hecha en el
 * cliente enseñaría fragmentos de cada grupo con recuentos falsos.
 *
 * Lo que se defiende aquí es que el recorte lo hace el SERVIDOR y que sumarse a
 * los recortes que ya existen no abre ninguna puerta.
 */
class AttendanceByGroupTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $orgA;

    private string $adminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->orgA = $this->createOrganization(['name' => 'Centro A']);
        $this->adminToken = $this->tokenFor($this->createUserFor($this->orgA, 'org_admin'));
    }

    /**
     * Crea un grupo con una sesión y la asistencia de sus alumnos.
     *
     * @return array{group: \App\Models\ClassGroup, session: \App\Models\ClassSession}
     */
    private function seedGroupWithAttendance(int $howMany, array $groupOverrides = []): array
    {
        $group = $this->createClassGroup($this->orgA, $groupOverrides);
        $session = $this->createClassSession($this->orgA, $group);

        for ($i = 0; $i < $howMany; $i++) {
            $this->createAttendance($this->orgA, $session, $this->createStudent($this->orgA));
        }

        return ['group' => $group, 'session' => $session];
    }

    public function test_attendance_can_be_narrowed_to_one_group(): void
    {
        $mine = $this->seedGroupWithAttendance(3, ['name' => 'Matemáticas']);
        $this->seedGroupWithAttendance(2, ['name' => 'Inglés']);

        $response = $this->actingWithToken($this->adminToken)
            ->getJson('/api/v1/attendances?class_group_id='.$mine['group']->getKey())
            ->assertOk();

        $this->assertSame(3, $response->json('total'));

        foreach ($response->json('data') as $fila) {
            $this->assertSame(
                $mine['session']->getKey(),
                $fila['class_session_id'],
                'Se coló asistencia de otro grupo.'
            );
        }
    }

    /** Sin el parámetro, el listado sigue siendo el de siempre. */
    public function test_without_the_parameter_nothing_is_narrowed(): void
    {
        $this->seedGroupWithAttendance(3);
        $this->seedGroupWithAttendance(2);

        $this->actingWithToken($this->adminToken)
            ->getJson('/api/v1/attendances')
            ->assertOk()
            ->assertJsonPath('total', 5);
    }

    /**
     * EL punto que importa: el filtro SE SUMA al recorte del profesor, no lo
     * sustituye. Pedir el grupo de un compañero no devuelve su asistencia.
     */
    public function test_asking_for_another_teachers_group_returns_nothing(): void
    {
        $teacherUser = $this->createUserFor($this->orgA, 'teacher');
        $profile = $this->createTeacherProfile($this->orgA, $teacherUser);

        $subject = $this->createSubject($this->orgA);

        $mine = $this->seedGroupWithAttendance(2, [
            'subject_id' => $subject->getKey(),
            'teacher_id' => $profile->getKey(),
        ]);

        $theirs = $this->seedGroupWithAttendance(4, [
            'teacher_id' => $this->createTeacherProfile($this->orgA)->getKey(),
        ]);

        $token = $this->tokenFor($teacherUser);

        // Lo suyo, sí.
        $this->actingWithToken($token)
            ->getJson('/api/v1/attendances?class_group_id='.$mine['group']->getKey())
            ->assertOk()
            ->assertJsonPath('total', 2);

        // Lo del compañero, conociendo el identificador exacto: vacío.
        $this->actingWithToken($token)
            ->getJson('/api/v1/attendances?class_group_id='.$theirs['group']->getKey())
            ->assertOk()
            ->assertJsonPath('total', 0);
    }

    /** El filtro tampoco cruza organizaciones. */
    public function test_the_filter_never_crosses_organizations(): void
    {
        $orgB = $this->createOrganization(['name' => 'Centro B']);
        $ajeno = $this->createClassGroup($orgB);
        $sesionAjena = $this->createClassSession($orgB, $ajeno);
        $this->createAttendance($orgB, $sesionAjena, $this->createStudent($orgB));

        $this->actingWithToken($this->adminToken)
            ->getJson('/api/v1/attendances?class_group_id='.$ajeno->getKey())
            ->assertOk()
            ->assertJsonPath('total', 0);
    }

    /**
     * El desplegable de sesión al pasar lista se acota al grupo. Ofrecer las del
     * centro entero es donde se cometía el error: los títulos se parecen y se
     * acababa registrando la asistencia de un grupo sobre la sesión de otro.
     */
    public function test_sessions_can_be_narrowed_to_one_group(): void
    {
        $mine = $this->seedGroupWithAttendance(1, ['name' => 'Matemáticas']);
        $otro = $this->createClassGroup($this->orgA, ['name' => 'Inglés']);
        $this->createClassSession($this->orgA, $otro);

        $response = $this->actingWithToken($this->adminToken)
            ->getJson('/api/v1/class-sessions?class_group_id='.$mine['group']->getKey())
            ->assertOk();

        $this->assertSame(1, $response->json('total'));
        $this->assertSame($mine['group']->getKey(), $response->json('data.0.class_group_id'));
    }

    /**
     * El índice necesita recuentos REALES, no los de la página cargada: con la
     * paginación global, un grupo con 40 sesiones aparecería con 20.
     */
    public function test_the_group_listing_carries_its_own_counts(): void
    {
        $group = $this->createClassGroup($this->orgA);
        $this->createClassSession($this->orgA, $group);
        $this->createClassSession($this->orgA, $group);
        $this->createEnrollment($this->orgA, $this->createStudent($this->orgA), $group);

        $fila = collect(
            $this->actingWithToken($this->adminToken)->getJson('/api/v1/class-groups')->json('data')
        )->firstWhere('id', $group->getKey());

        $this->assertSame(2, $fila['class_sessions_count']);
        $this->assertSame(1, $fila['enrollments_count']);
    }
}
