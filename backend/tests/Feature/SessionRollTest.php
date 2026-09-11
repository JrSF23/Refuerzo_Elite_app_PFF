<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\ClassGroup;
use App\Models\ClassSession;
use App\Models\Organization;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * Pasar lista: la asistencia de una sesión, de una vez.
 *
 * Antes se creaba de una en una eligiendo alumno y sesión en dos desplegables.
 * Con 25 alumnos eso son 25 altas, 50 selecciones y una oportunidad de
 * equivocarse en cada una — incluida la de registrar a un alumno en la sesión de
 * un grupo en el que no está.
 *
 * Lo que estas pruebas defienden es que la lista la componga el SERVIDOR y que
 * volver sobre ella corrija en vez de duplicar.
 */
class SessionRollTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $orgA;

    private string $adminToken;

    private ClassGroup $group;

    private ClassSession $session;

    /** @var list<Student> */
    private array $students = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->orgA = $this->createOrganization(['name' => 'Centro A']);
        $this->adminToken = $this->tokenFor($this->createUserFor($this->orgA, 'org_admin'));

        $this->group = $this->createClassGroup($this->orgA, ['name' => 'Matemáticas']);
        $this->session = $this->createClassSession($this->orgA, $this->group);

        foreach (['Ondo', 'Nchama', 'Esaha'] as $apellido) {
            $alumno = $this->createStudent($this->orgA, ['last_name' => $apellido]);
            $this->createEnrollment($this->orgA, $alumno, $this->group);
            $this->students[] = $alumno;
        }
    }

    private function roll(?string $token = null): array
    {
        return $this->actingWithToken($token ?? $this->adminToken)
            ->getJson("/api/v1/class-sessions/{$this->session->getKey()}/roll")
            ->assertOk()
            ->json();
    }

    public function test_the_roll_is_the_class_and_comes_ordered(): void
    {
        $data = $this->roll();

        $this->assertSame(
            ['Esaha', 'Nchama', 'Ondo'],
            array_map(
                fn (array $fila) => explode(' ', $fila['full_name'])[1] ?? $fila['full_name'],
                $data['students']
            )
        );
    }

    /**
     * Nadie nace presente. Quien no se ha marcado llega con `null`, no con
     * «present»: poner la clase entera en presente al abrir la pantalla
     * convertiría el descuido en un dato, y bastaría abrir y guardar para dar por
     * asistida una clase que nadie miró.
     */
    public function test_nobody_starts_marked(): void
    {
        foreach ($this->roll()['students'] as $fila) {
            $this->assertNull($fila['status']);
        }
    }

    /** Solo salen los MATRICULADOS en el grupo de la sesión. */
    public function test_only_enrolled_students_appear(): void
    {
        $ajeno = $this->createStudent($this->orgA, ['last_name' => 'NoMatriculado']);

        $ids = array_column($this->roll()['students'], 'student_id');

        $this->assertCount(3, $ids);
        $this->assertNotContains($ajeno->getKey(), $ids);
    }

    public function test_the_whole_class_is_saved_at_once(): void
    {
        $entries = [
            ['student_id' => $this->students[0]->getKey(), 'status' => 'present'],
            ['student_id' => $this->students[1]->getKey(), 'status' => 'absent'],
            ['student_id' => $this->students[2]->getKey(), 'status' => 'excused'],
        ];

        $this->actingWithToken($this->adminToken)
            ->postJson("/api/v1/class-sessions/{$this->session->getKey()}/roll", compact('entries'))
            ->assertOk()
            ->assertJsonPath('saved', 3);

        $this->assertSame(3, Attendance::query()->where('class_session_id', $this->session->getKey())->count());
    }

    /**
     * Volver sobre la lista CORRIGE, no duplica. La pareja sesión + alumno es
     * única, así que la segunda pasada actualiza a la primera.
     */
    public function test_passing_the_roll_twice_corrects_instead_of_duplicating(): void
    {
        $alumno = $this->students[0]->getKey();
        $url = "/api/v1/class-sessions/{$this->session->getKey()}/roll";

        $this->actingWithToken($this->adminToken)
            ->postJson($url, ['entries' => [['student_id' => $alumno, 'status' => 'absent']]])
            ->assertOk();

        $this->actingWithToken($this->adminToken)
            ->postJson($url, ['entries' => [['student_id' => $alumno, 'status' => 'present']]])
            ->assertOk();

        $filas = Attendance::query()
            ->where('class_session_id', $this->session->getKey())
            ->where('student_id', $alumno)
            ->get();

        $this->assertCount(1, $filas, 'Pasar lista dos veces dejó dos filas.');
        $this->assertSame('present', $filas->first()->status);
    }

    /** Lo ya marcado vuelve con la lista, o corregir a uno arrasaría a los demás. */
    public function test_what_is_already_marked_travels_back(): void
    {
        $alumno = $this->students[0]->getKey();

        $this->actingWithToken($this->adminToken)
            ->postJson("/api/v1/class-sessions/{$this->session->getKey()}/roll", [
                'entries' => [['student_id' => $alumno, 'status' => 'late', 'comment' => 'Vino a y media']],
            ])
            ->assertOk();

        $fila = collect($this->roll()['students'])->firstWhere('student_id', $alumno);

        $this->assertSame('late', $fila['status']);
        $this->assertSame('Vino a y media', $fila['comment']);
    }

    /**
     * EL punto que importa: no se puede pasar lista a un alumno que no está
     * matriculado en el grupo de la sesión. Es la otra mitad del error que esta
     * pantalla viene a impedir, y no basta con que la interfaz no lo ofrezca.
     */
    public function test_a_student_outside_the_group_is_refused(): void
    {
        $ajeno = $this->createStudent($this->orgA, ['last_name' => 'DeOtroGrupo']);

        $this->actingWithToken($this->adminToken)
            ->postJson("/api/v1/class-sessions/{$this->session->getKey()}/roll", [
                'entries' => [['student_id' => $ajeno->getKey(), 'status' => 'present']],
            ])
            ->assertStatus(422);

        $this->assertSame(0, Attendance::query()->count());
    }

    public function test_an_invalid_status_is_refused(): void
    {
        $this->actingWithToken($this->adminToken)
            ->postJson("/api/v1/class-sessions/{$this->session->getKey()}/roll", [
                'entries' => [['student_id' => $this->students[0]->getKey(), 'status' => 'inventado']],
            ])
            ->assertStatus(422);
    }

    // ── Histórico de listas ────────────────────────────────────────────────

    /**
     * Solo salen las sesiones CON lista pasada. Una sesión sin asistencia no es
     * una lista, y mezclarlas convertiría el histórico en el listado de sesiones
     * que ya existe.
     */
    public function test_the_history_only_shows_sessions_with_a_roll(): void
    {
        $sinLista = $this->createClassSession($this->orgA, $this->group, ['title' => 'Sin pasar']);

        $this->actingWithToken($this->adminToken)
            ->postJson("/api/v1/class-sessions/{$this->session->getKey()}/roll", [
                'entries' => [['student_id' => $this->students[0]->getKey(), 'status' => 'present']],
            ])
            ->assertOk();

        $ids = array_column(
            $this->actingWithToken($this->adminToken)->getJson('/api/v1/attendance-rolls')->json('data'),
            'id'
        );

        $this->assertContains($this->session->getKey(), $ids);
        $this->assertNotContains($sinLista->getKey(), $ids);
    }

    /** El reparto por estado lo cuenta el servidor, para verlo sin abrir la lista. */
    public function test_the_history_carries_the_breakdown_by_status(): void
    {
        $this->actingWithToken($this->adminToken)
            ->postJson("/api/v1/class-sessions/{$this->session->getKey()}/roll", [
                'entries' => [
                    ['student_id' => $this->students[0]->getKey(), 'status' => 'present'],
                    ['student_id' => $this->students[1]->getKey(), 'status' => 'present'],
                    ['student_id' => $this->students[2]->getKey(), 'status' => 'absent'],
                ],
            ])
            ->assertOk();

        $fila = collect(
            $this->actingWithToken($this->adminToken)->getJson('/api/v1/attendance-rolls')->json('data')
        )->firstWhere('id', $this->session->getKey());

        $this->assertSame(3, $fila['attendances_count']);
        $this->assertSame(2, $fila['present_count']);
        $this->assertSame(1, $fila['absent_count']);
        $this->assertSame(0, $fila['late_count']);
        $this->assertSame(0, $fila['excused_count']);
    }

    /**
     * El histórico recorta igual que todo lo demás: un profesor no ve las listas
     * de los grupos de otro.
     */
    public function test_the_history_only_shows_what_the_teacher_teaches(): void
    {
        $teacherUser = $this->createUserFor($this->orgA, 'teacher');
        $profile = $this->createTeacherProfile($this->orgA, $teacherUser);

        $subject = $this->createSubject($this->orgA);
        $suyo = $this->createClassGroup($this->orgA, [
            'subject_id' => $subject->getKey(),
            'teacher_id' => $profile->getKey(),
        ]);
        $suSesion = $this->createClassSession($this->orgA, $suyo);
        $suAlumno = $this->createStudent($this->orgA);
        $this->createEnrollment($this->orgA, $suAlumno, $suyo);
        $this->createAttendance($this->orgA, $suSesion, $suAlumno);

        // Lista en el grupo del que NO es profesor.
        $this->createAttendance($this->orgA, $this->session, $this->students[0]);

        $ids = array_column(
            $this->actingWithToken($this->tokenFor($teacherUser))
                ->getJson('/api/v1/attendance-rolls')->json('data'),
            'id'
        );

        $this->assertSame([$suSesion->getKey()], $ids);
    }

    /**
     * La sesión de otro profesor responde 404 y no 403: indistinguible de una
     * que no existe, para no delatar lo que hay en el grupo de otro (FR-020).
     */
    public function test_a_teacher_cannot_open_the_roll_of_another_group(): void
    {
        $teacherUser = $this->createUserFor($this->orgA, 'teacher');
        $profile = $this->createTeacherProfile($this->orgA, $teacherUser);

        $subject = $this->createSubject($this->orgA);
        $suyo = $this->createClassGroup($this->orgA, [
            'subject_id' => $subject->getKey(),
            'teacher_id' => $profile->getKey(),
        ]);
        $suSesion = $this->createClassSession($this->orgA, $suyo);

        $token = $this->tokenFor($teacherUser);

        // La suya, sí.
        $this->actingWithToken($token)
            ->getJson("/api/v1/class-sessions/{$suSesion->getKey()}/roll")
            ->assertOk();

        // La del compañero, con el identificador exacto: 404.
        $this->actingWithToken($token)
            ->getJson("/api/v1/class-sessions/{$this->session->getKey()}/roll")
            ->assertNotFound();

        $this->actingWithToken($token)
            ->postJson("/api/v1/class-sessions/{$this->session->getKey()}/roll", [
                'entries' => [['student_id' => $this->students[0]->getKey(), 'status' => 'present']],
            ])
            ->assertNotFound();
    }

    /** Tampoco cruza organizaciones. */
    public function test_the_roll_never_crosses_organizations(): void
    {
        $orgB = $this->createOrganization(['name' => 'Centro B']);
        $grupoB = $this->createClassGroup($orgB);
        $sesionB = $this->createClassSession($orgB, $grupoB);

        $this->actingWithToken($this->adminToken)
            ->getJson("/api/v1/class-sessions/{$sesionB->getKey()}/roll")
            ->assertNotFound();
    }
}
