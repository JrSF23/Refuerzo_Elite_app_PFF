<?php

namespace Tests\Feature;

use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * FR-015c y el caso límite "el fallo debe cerrar el acceso, nunca abrirlo".
 *
 * Un usuario con rol profesor cuya cuenta no está vinculada a ninguna ficha se
 * trata como profesor sin grupos asignados: no ve NADA. Lo contrario —que al no
 * poder determinar sus grupos se le muestren todos los del centro— sería el fallo
 * de seguridad clásico de este diseño.
 */
class TeacherWithoutProfileTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $organization;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->organization = $this->createOrganization();

        // El centro tiene datos: grupos, alumnos y sesiones de OTRO profesor.
        $otherProfile = $this->createTeacherProfile($this->organization);
        $group = $this->createClassGroup($this->organization, ['teacher_id' => $otherProfile->getKey()]);
        $student = $this->createStudent($this->organization);
        $this->createEnrollment($this->organization, $student, $group);
        $this->createClassSession($this->organization, $group);

        // Y una cuenta de profesor SIN ficha vinculada.
        $this->token = $this->tokenFor($this->createUserFor($this->organization, 'teacher'));
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function teacherVisibleResources(): array
    {
        return [
            'class groups' => ['class-groups'],
            'students' => ['students'],
            'class sessions' => ['class-sessions'],
            'attendances' => ['attendances'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('teacherVisibleResources')]
    public function test_a_teacher_without_profile_sees_nothing(string $resource): void
    {
        $this->actingWithToken($this->token)
            ->getJson("/api/v1/{$resource}")
            ->assertOk()
            ->assertJsonPath('total', 0);
    }

    public function test_the_centre_actually_has_data_to_hide(): void
    {
        // Guarda de cordura: si el centro estuviera vacío, el test anterior
        // pasaría sin demostrar nada.
        $this->assertDatabaseCount('class_groups', 1);
        $this->assertDatabaseCount('students', 1);
        $this->assertDatabaseCount('class_sessions', 1);
    }

    public function test_the_dashboard_answers_empty_instead_of_failing(): void
    {
        $this->actingWithToken($this->token)
            ->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('teacher', null)
            ->assertJsonPath('stats.groups', 0)
            ->assertJsonPath('stats.students', 0);
    }

    public function test_a_teacher_without_profile_cannot_record_attendance(): void
    {
        $session = \App\Models\ClassSession::query()->withoutGlobalScopes()->first();
        $student = \App\Models\Student::query()->withoutGlobalScopes()->first();

        $this->actingWithToken($this->token)
            ->postJson('/api/v1/attendances', [
                'class_session_id' => $session->getKey(),
                'student_id' => $student->getKey(),
                'status' => 'present',
            ])
            ->assertForbidden();
    }
}
