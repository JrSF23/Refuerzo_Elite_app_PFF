<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * Búsqueda por relaciones en matrículas, sesiones, asistencia y pagos.
 *
 * Las cuatro secciones que no tenían caja de búsqueda. El motivo no era un
 * olvido: lo que la gente teclea —el nombre del alumno, el del grupo— no está en
 * su fila, así que declarar solo columnas propias habría dado una caja que casi
 * nunca encuentra nada, que es peor que no tenerla.
 *
 * Lo que este fichero vigila no es tanto que encuentre, sino que **NO encuentre
 * de más**: una búsqueda no puede convertirse en la rendija por la que se lee lo
 * de otro centro, ni en la que enseña a un profesor lo que no imparte.
 */
class RelationSearchTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $orgA;

    private Organization $orgB;

    private string $tokenA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->orgA = $this->createOrganization(['name' => 'Centro A']);
        $this->orgB = $this->createOrganization(['name' => 'Centro B']);

        // La MISMA alumna, con el mismo nombre, en los dos centros. Es lo que
        // hace concluyentes las pruebas de aislamiento: si la búsqueda se saltara
        // el global scope, encontraría dos.
        $this->seedFor($this->orgA);
        $this->seedFor($this->orgB);

        $this->tokenA = $this->tokenFor($this->createUserFor($this->orgA, 'org_admin'));
    }

    /**
     * @return array<string, mixed>
     */
    private function seedFor(Organization $organization): array
    {
        $student = $this->createStudent($organization, [
            'first_name' => 'Genoveva',
            'last_name' => 'Ondo',
        ]);

        $subject = $this->createSubject($organization);
        $teacher = $this->createTeacherProfile($organization);

        $group = $this->createClassGroup($organization, [
            'subject_id' => $subject->getKey(),
            'teacher_id' => $teacher->getKey(),
            'name' => 'Refuerzo de Tarde',
            'code' => 'TAR-'.$organization->getKey(),
        ]);

        $session = $this->createClassSession($organization, $group, ['title' => 'Repaso de ecuaciones']);
        $enrollment = $this->createEnrollment($organization, $student, $group);
        $attendance = $this->createAttendance($organization, $session, $student);
        $payment = $this->createPayment($organization, $student, [
            'enrollment_id' => $enrollment->getKey(),
            'reference' => 'REC-'.$organization->getKey(),
        ]);

        return compact('student', 'group', 'session', 'enrollment', 'attendance', 'payment', 'teacher');
    }

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function searchCases(): array
    {
        return [
            'matriculas por alumno' => ['enrollments', 'Genoveva'],
            'matriculas por grupo' => ['enrollments', 'Refuerzo de Tarde'],
            'sesiones por titulo' => ['class-sessions', 'ecuaciones'],
            'sesiones por grupo' => ['class-sessions', 'Refuerzo de Tarde'],
            'asistencia por alumno' => ['attendances', 'Ondo'],
            'asistencia por sesion' => ['attendances', 'ecuaciones'],
            'pagos por alumno' => ['payments', 'Genoveva'],
        ];
    }

    #[DataProvider('searchCases')]
    public function test_search_finds_the_record_through_its_relations(string $resource, string $term): void
    {
        $response = $this->actingWithToken($this->tokenA)
            ->getJson("/api/v1/{$resource}?search=".urlencode($term))
            ->assertOk();

        $this->assertSame(
            1,
            $response->json('total'),
            "El termino «{$term}» no encontro el registro de su centro en {$resource}."
        );
    }

    /**
     * El corazón del asunto: el EXISTS que genera `whereHas` pasa por Eloquent,
     * así que el global scope de organización se aplica también DENTRO de la
     * subconsulta. Con un `join` a pelo esto estaría en rojo y la búsqueda sería
     * una fuga entre centros.
     */
    #[DataProvider('searchCases')]
    public function test_search_never_crosses_into_another_organization(string $resource, string $term): void
    {
        $this->assertSame(
            2,
            Student::withoutGlobalScopes()->where('first_name', 'Genoveva')->count(),
            'El fixture debe tener la misma alumna en los dos centros para que esto pruebe algo.'
        );

        $response = $this->actingWithToken($this->tokenA)
            ->getJson("/api/v1/{$resource}?search=".urlencode($term))
            ->assertOk();

        foreach ($response->json('data') as $row) {
            $this->assertSame(
                $this->orgA->getKey(),
                $row['organization_id'],
                "La busqueda en {$resource} devolvio una fila del otro centro."
            );
        }
    }

    public function test_a_term_that_matches_nothing_returns_empty(): void
    {
        $this->actingWithToken($this->tokenA)
            ->getJson('/api/v1/attendances?search='.urlencode('Nombre Que No Existe'))
            ->assertOk()
            ->assertJsonPath('total', 0);
    }

    /**
     * La búsqueda se SUMA al recorte del profesor, no lo sustituye.
     *
     * Los OR de la búsqueda van agrupados en un paréntesis justamente por esto:
     * sin él, el primer OR se sumaría a la condición del recorte y una búsqueda
     * sacaría a flote las sesiones de otros profesores.
     */
    public function test_search_does_not_lift_the_teacher_scope(): void
    {
        $teacherUser = $this->createUserFor($this->orgA, 'teacher');
        $profile = $this->createTeacherProfile($this->orgA, $teacherUser);

        $ownSubject = $this->createSubject($this->orgA, ['name' => 'Matematicas']);
        $ownGroup = $this->createClassGroup($this->orgA, [
            'subject_id' => $ownSubject->getKey(),
            'teacher_id' => $profile->getKey(),
            'name' => 'Grupo propio',
            'code' => 'TAR-MIO',
        ]);
        $this->createClassSession($this->orgA, $ownGroup, ['title' => 'Repaso de ecuaciones']);

        // El mismo término: el administrador ve las dos sesiones de su centro.
        $this->actingWithToken($this->tokenA)
            ->getJson('/api/v1/class-sessions?search=ecuaciones')
            ->assertOk()
            ->assertJsonPath('total', 2);

        // El profesor, solo la suya.
        $response = $this->actingWithToken($this->tokenFor($teacherUser))
            ->getJson('/api/v1/class-sessions?search=ecuaciones')
            ->assertOk();

        $this->assertSame(1, $response->json('total'));
        $this->assertSame($ownGroup->getKey(), $response->json('data.0.class_group_id'));
    }
}
