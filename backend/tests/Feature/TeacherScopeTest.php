<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * FR-015 y SC-007: el profesor ve exclusivamente sus grupos y los alumnos
 * matriculados en ellos. El número de alumnos visibles coincide con la suma de
 * matriculados en sus grupos.
 *
 * Los grupos que "imparte" son los de la ficha vinculada a su cuenta por
 * `teachers.user_id` (FR-015a), nunca por coincidencia de correo.
 */
class TeacherScopeTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $organization;

    private Teacher $ownProfile;

    private User $teacherUser;

    private string $token;

    /** @var array<string, mixed> */
    private array $fixture;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->organization = $this->createOrganization(['name' => 'Centro']);

        // Profesor con ficha vinculada.
        $this->teacherUser = $this->createUserFor($this->organization, 'teacher');
        $this->ownProfile = $this->createTeacherProfile($this->organization, $this->teacherUser);
        $this->token = $this->tokenFor($this->teacherUser);

        // Otro profesor del mismo centro, con sus propios grupos.
        $otherProfile = $this->createTeacherProfile($this->organization);

        $subject = $this->createSubject($this->organization);

        $mine = $this->createClassGroup($this->organization, [
            'subject_id' => $subject->getKey(),
            'teacher_id' => $this->ownProfile->getKey(),
            'name' => 'Mi grupo',
        ]);

        $theirs = $this->createClassGroup($this->organization, [
            'subject_id' => $subject->getKey(),
            'teacher_id' => $otherProfile->getKey(),
            'name' => 'Grupo ajeno',
        ]);

        // Dos alumnos en mi grupo, uno en el ajeno.
        $mineStudentA = $this->createStudent($this->organization);
        $mineStudentB = $this->createStudent($this->organization);
        $theirStudent = $this->createStudent($this->organization);

        $this->createEnrollment($this->organization, $mineStudentA, $mine);
        $this->createEnrollment($this->organization, $mineStudentB, $mine);
        $this->createEnrollment($this->organization, $theirStudent, $theirs);

        $mySession = $this->createClassSession($this->organization, $mine);
        $theirSession = $this->createClassSession($this->organization, $theirs);

        $this->fixture = compact('mine', 'theirs', 'mineStudentA', 'mineStudentB', 'theirStudent', 'mySession', 'theirSession', 'otherProfile');
    }

    // ── Grupos ─────────────────────────────────────────────────────────────

    public function test_teacher_only_lists_its_own_groups(): void
    {
        $response = $this->actingWithToken($this->token)
            ->getJson('/api/v1/class-groups')
            ->assertOk();

        $ids = array_column($response->json('data'), 'id');

        $this->assertSame([$this->fixture['mine']->getKey()], $ids);
    }

    /**
     * Dentro del centro, lo que queda fuera del alcance del profesor responde
     * **404**: el recorte de consulta actúa antes que la policy, así que el
     * registro sencillamente no existe para él. Lo que está fuera de su rol por
     * completo —tutores, pagos— responde 403, que es otra cosa.
     */
    public function test_teacher_cannot_read_a_group_it_does_not_teach(): void
    {
        $this->actingWithToken($this->token)
            ->getJson("/api/v1/class-groups/{$this->fixture['theirs']->getKey()}")
            ->assertNotFound();
    }

    // ── Alumnos ────────────────────────────────────────────────────────────

    public function test_teacher_only_sees_students_enrolled_in_its_groups(): void
    {
        $response = $this->actingWithToken($this->token)
            ->getJson('/api/v1/students')
            ->assertOk();

        $ids = array_column($response->json('data'), 'id');

        sort($ids);
        $expected = [$this->fixture['mineStudentA']->getKey(), $this->fixture['mineStudentB']->getKey()];
        sort($expected);

        $this->assertSame($expected, $ids);
        $this->assertNotContains($this->fixture['theirStudent']->getKey(), $ids);
    }

    /**
     * SC-007: el número de alumnos visibles coincide con la suma de matriculados
     * en sus grupos.
     */
    public function test_visible_student_count_matches_the_enrolments_in_its_groups(): void
    {
        $response = $this->actingWithToken($this->token)
            ->getJson('/api/v1/students')
            ->assertOk();

        $enrolled = \App\Models\Enrollment::query()
            ->where('class_group_id', $this->fixture['mine']->getKey())
            ->distinct()
            ->count('student_id');

        $this->assertSame($enrolled, $response->json('total'));
    }

    public function test_teacher_cannot_read_a_student_of_another_group(): void
    {
        $this->actingWithToken($this->token)
            ->getJson("/api/v1/students/{$this->fixture['theirStudent']->getKey()}")
            ->assertNotFound();
    }

    public function test_teacher_cannot_create_or_delete_students(): void
    {
        $this->actingWithToken($this->token)
            ->postJson('/api/v1/students', ['first_name' => 'Ana', 'last_name' => 'Pérez', 'status' => 'active'])
            ->assertForbidden();

        $this->actingWithToken($this->token)
            ->deleteJson("/api/v1/students/{$this->fixture['mineStudentA']->getKey()}")
            ->assertForbidden();
    }

    // ── Sesiones ───────────────────────────────────────────────────────────

    public function test_teacher_only_sees_sessions_of_its_groups(): void
    {
        $response = $this->actingWithToken($this->token)
            ->getJson('/api/v1/class-sessions')
            ->assertOk();

        $this->assertSame([$this->fixture['mySession']->getKey()], array_column($response->json('data'), 'id'));
    }

    // ── Fuera de su alcance ────────────────────────────────────────────────

    public function test_teacher_cannot_reach_administrative_modules(): void
    {
        foreach (['guardians', 'subjects', 'teachers', 'enrollments'] as $resource) {
            $this->actingWithToken($this->token)
                ->getJson("/api/v1/{$resource}")
                ->assertForbidden();
        }
    }

    // ── T087: ficha reasignada ─────────────────────────────────────────────

    public function test_reassigning_the_profile_removes_access_immediately(): void
    {
        // Con la ficha vinculada, ve su grupo.
        $this->actingWithToken($this->token)
            ->getJson('/api/v1/class-groups')
            ->assertOk()
            ->assertJsonPath('total', 1);

        // La ficha pasa a otra cuenta.
        $another = $this->createUserFor($this->organization, 'teacher');
        $this->ownProfile->forceFill(['user_id' => $another->getKey()])->save();

        // El usuario anterior pierde el acceso en la siguiente petición, sin
        // necesidad de cerrar sesión ni revocar el token.
        $this->actingWithToken($this->token)
            ->getJson('/api/v1/class-groups')
            ->assertOk()
            ->assertJsonPath('total', 0);

        // Y la cuenta nueva lo gana.
        $this->actingWithToken($this->tokenFor($another))
            ->getJson('/api/v1/class-groups')
            ->assertOk()
            ->assertJsonPath('total', 1);
    }
}
