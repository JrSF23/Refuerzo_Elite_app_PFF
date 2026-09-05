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

    /**
     * Lo que pidió el centro: cada profesor da de alta sus propias sesiones, con
     * su cuenta. El alta se autoriza contra el `class_group_id` que llega en la
     * petición, porque todavía no hay sesión sobre la que decidir.
     */
    public function test_teacher_creates_sessions_in_its_own_group(): void
    {
        $this->actingWithToken($this->token)
            ->postJson('/api/v1/class-sessions', [
                'class_group_id' => $this->fixture['mine']->getKey(),
                'title' => 'Repaso de ecuaciones',
                'session_date' => '2026-02-10',
            ])
            ->assertCreated()
            ->assertJsonPath('class_group_id', $this->fixture['mine']->getKey());
    }

    public function test_teacher_cannot_create_sessions_in_another_teachers_group(): void
    {
        $this->actingWithToken($this->token)
            ->postJson('/api/v1/class-sessions', [
                'class_group_id' => $this->fixture['theirs']->getKey(),
                'title' => 'Sesión intrusa',
                'session_date' => '2026-02-10',
            ])
            ->assertForbidden();
    }

    /**
     * El alta comprobaba el grupo de destino, pero la edición solo miraba el de
     * origen: bastaba un PUT sobre una sesión propia cambiándole el grupo para
     * colarla en el de un compañero, porque en ese instante la sesión todavía
     * era suya. Origen y destino, las dos puntas.
     */
    public function test_teacher_cannot_move_its_session_into_another_teachers_group(): void
    {
        $session = $this->fixture['mySession'];

        $this->actingWithToken($this->token)
            ->putJson("/api/v1/class-sessions/{$session->getKey()}", [
                'class_group_id' => $this->fixture['theirs']->getKey(),
                'title' => 'Sesión movida',
                'session_date' => '2026-02-11',
            ])
            ->assertForbidden();

        $this->assertSame(
            $this->fixture['mine']->getKey(),
            (int) $session->fresh()->class_group_id,
            'La sesión no debe haberse movido al grupo ajeno.'
        );
    }

    // ── Sesión impartida ───────────────────────────────────────────────────

    public function test_teacher_marks_its_own_session_as_taught(): void
    {
        $session = $this->fixture['mySession'];

        $this->actingWithToken($this->token)
            ->postJson("/api/v1/class-sessions/{$session->getKey()}/taught")
            ->assertOk()
            ->assertJsonPath('taught_by', $this->teacherUser->getKey());

        $this->assertNotNull($session->fresh()->taught_at);
    }

    /**
     * Una sesión de otro grupo responde 404 y no 403: el recorte de consulta
     * actúa antes que la policy, así que para él no existe. Mismo criterio que el
     * resto de la sección.
     */
    public function test_teacher_cannot_mark_a_session_of_another_group(): void
    {
        $this->actingWithToken($this->token)
            ->postJson("/api/v1/class-sessions/{$this->fixture['theirSession']->getKey()}/taught")
            ->assertNotFound();

        $this->assertNull($this->fixture['theirSession']->fresh()->taught_at);
    }

    /**
     * El marcado es definitivo por decisión del centro: no hay endpoint que lo
     * deshaga, y volver a marcar responde 409 —el recurso ya está en ese estado—
     * en lugar de refrescar la fecha en silencio.
     */
    public function test_marking_twice_is_refused_and_keeps_the_first_timestamp(): void
    {
        $session = $this->fixture['mySession'];

        $this->actingWithToken($this->token)
            ->postJson("/api/v1/class-sessions/{$session->getKey()}/taught")
            ->assertOk();

        $first = $session->fresh()->taught_at;

        $this->actingWithToken($this->token)
            ->postJson("/api/v1/class-sessions/{$session->getKey()}/taught")
            ->assertStatus(409);

        $this->assertEquals($first, $session->fresh()->taught_at);
    }

    /**
     * La vía de escape que cerraría todo lo anterior: si `taught_at` fuese
     * declarable, una edición corriente devolvería la sesión a pendiente sin
     * pasar por el endpoint. Está fuera de `$fillable`, y esto lo fija.
     */
    public function test_the_edit_form_cannot_unmark_a_taught_session(): void
    {
        $session = $this->fixture['mySession'];

        $this->actingWithToken($this->token)
            ->postJson("/api/v1/class-sessions/{$session->getKey()}/taught")
            ->assertOk();

        $marked = $session->fresh()->taught_at;

        $this->actingWithToken($this->token)
            ->putJson("/api/v1/class-sessions/{$session->getKey()}", [
                'class_group_id' => $this->fixture['mine']->getKey(),
                'title' => 'Título corregido',
                'session_date' => '2026-01-13',
                'taught_at' => null,
                'taught_by' => null,
            ])
            ->assertOk();

        $fresh = $session->fresh();

        $this->assertEquals($marked, $fresh->taught_at, 'La edición devolvió la sesión a pendiente.');
        $this->assertSame($this->teacherUser->getKey(), (int) $fresh->taught_by);
        $this->assertSame('Título corregido', $fresh->title);
    }

    /**
     * Lo que pidió el centro: la administración lo ve. No marca por él, lo ve
     * marcado, y con quién y cuándo.
     */
    public function test_the_administration_sees_the_session_as_taught(): void
    {
        $session = $this->fixture['mySession'];

        $this->actingWithToken($this->token)
            ->postJson("/api/v1/class-sessions/{$session->getKey()}/taught")
            ->assertOk();

        $admin = $this->createUserFor($this->organization, 'org_admin');

        $this->actingWithToken($this->tokenFor($admin))
            ->getJson("/api/v1/class-sessions/{$session->getKey()}")
            ->assertOk()
            ->assertJsonPath('taught_by', $this->teacherUser->getKey());
    }

    // ── La materia habilita, el grupo delimita ─────────────────────────────

    /**
     * El grupo sigue asignado a su ficha, pero pasa a ser de otra materia: deja
     * de alcanzarlo. Es la mitad «la materia habilita» de la regla, y es la que
     * no existía antes de que la materia fuera un dato de la ficha.
     */
    public function test_teacher_loses_the_group_when_its_subject_is_not_its_own(): void
    {
        $otherSubject = $this->createSubject($this->organization, ['name' => 'Filosofía']);

        $this->fixture['mine']->forceFill(['subject_id' => $otherSubject->getKey()])->save();

        $this->actingWithToken($this->token)
            ->getJson('/api/v1/class-sessions')
            ->assertOk()
            ->assertJsonPath('total', 0);

        $this->actingWithToken($this->token)
            ->postJson('/api/v1/class-sessions', [
                'class_group_id' => $this->fixture['mine']->getKey(),
                'title' => 'Ya no es mía',
                'session_date' => '2026-02-12',
            ])
            ->assertForbidden();
    }

    /**
     * La otra mitad: comparten materia, pero cada uno solo llega a SUS grupos.
     * Dos profesores de Matemáticas no se alcanzan entre sí.
     */
    public function test_two_teachers_of_the_same_subject_do_not_reach_each_other(): void
    {
        $colleagueUser = $this->createUserFor($this->organization, 'teacher');
        $colleague = $this->createTeacherProfile($this->organization, $colleagueUser, [
            'subject_id' => $this->fixture['mine']->subject_id,
        ]);

        $colleagueGroup = $this->createClassGroup($this->organization, [
            'subject_id' => $this->fixture['mine']->subject_id,
            'teacher_id' => $colleague->getKey(),
            'name' => 'Mismo temario, otro profesor',
        ]);

        // Misma materia que yo, y aun así no puedo crear nada en su grupo.
        $this->actingWithToken($this->token)
            ->postJson('/api/v1/class-sessions', [
                'class_group_id' => $colleagueGroup->getKey(),
                'title' => 'En el grupo del compañero',
                'session_date' => '2026-02-13',
            ])
            ->assertForbidden();

        // Y él tampoco en el mío.
        $this->actingWithToken($this->tokenFor($colleagueUser))
            ->postJson('/api/v1/class-sessions', [
                'class_group_id' => $this->fixture['mine']->getKey(),
                'title' => 'En el grupo del otro',
                'session_date' => '2026-02-13',
            ])
            ->assertForbidden();
    }

    /**
     * Una ficha sin materia no alcanza nada, aunque conserve sus grupos: el fallo
     * cierra el acceso, no lo abre (FR-015c).
     */
    public function test_teacher_without_subject_reaches_nothing(): void
    {
        $this->ownProfile->forceFill(['subject_id' => null])->save();

        $this->actingWithToken($this->token)
            ->getJson('/api/v1/class-sessions')
            ->assertOk()
            ->assertJsonPath('total', 0);

        $this->actingWithToken($this->token)
            ->postJson('/api/v1/class-sessions', [
                'class_group_id' => $this->fixture['mine']->getKey(),
                'title' => 'Sin materia',
                'session_date' => '2026-02-14',
            ])
            ->assertForbidden();
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
