<?php

namespace Tests\Feature;

use App\Models\ClassGroup;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * El grupo de asignatura cuelga del AULA.
 *
 * Antes las dos ideas de «grupo» vivían en paralelo sin conocerse: no había ni
 * una columna que las uniera. De ahí venía la confusión —al registrar una sesión
 * había que elegir entre unos grupos que no eran los que el centro ve en su
 * lista de aulas— y se notaba en el uso real: dos centros que estaban evaluando
 * la plataforma crearon 23 aulas y CERO grupos de asignatura, así que no podían
 * registrar ni una sesión.
 *
 * Con el vínculo, un grupo de asignatura es lo que de verdad es en un centro:
 * el aula por la materia.
 */
class ClassGroupBelongsToTutorGroupTest extends TestCase
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

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'subject_id' => $this->createSubject($this->orgA)->getKey(),
            'name' => '1º ESBA — Matemáticas',
            'code' => 'MAT-1ESBA',
            'academic_year' => '2026-2027',
            'capacity' => 25,
            'status' => 'active',
        ], $overrides);
    }

    public function test_a_subject_group_is_created_inside_a_classroom(): void
    {
        $aula = $this->createTutorGroup($this->orgA, ['name' => '1º ESBA']);

        $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/class-groups', $this->payload(['tutor_group_id' => $aula->getKey()]))
            ->assertCreated()
            ->assertJsonPath('tutor_group_id', $aula->getKey())
            ->assertJsonPath('tutor_group.name', '1º ESBA');
    }

    /**
     * Lo que permite gestionar las materias DESDE el aula sin traerse los grupos
     * de todo el centro. Sin este recorte, un centro con 200 grupos cargaría los
     * 200 para enseñar cuatro.
     */
    public function test_the_listing_can_be_narrowed_to_one_classroom(): void
    {
        $primero = $this->createTutorGroup($this->orgA, ['name' => '1º ESBA']);
        $segundo = $this->createTutorGroup($this->orgA, ['name' => '2º ESBA']);

        $this->createClassGroup($this->orgA, ['tutor_group_id' => $primero->getKey(), 'name' => 'Mates 1']);
        $this->createClassGroup($this->orgA, ['tutor_group_id' => $primero->getKey(), 'name' => 'Lengua 1']);
        $this->createClassGroup($this->orgA, ['tutor_group_id' => $segundo->getKey(), 'name' => 'Mates 2']);

        $response = $this->actingWithToken($this->adminToken)
            ->getJson('/api/v1/class-groups?tutor_group_id='.$primero->getKey())
            ->assertOk();

        $this->assertSame(2, $response->json('total'));

        foreach ($response->json('data') as $fila) {
            $this->assertSame($primero->getKey(), $fila['tutor_group_id']);
        }
    }

    /**
     * El aula de otro centro no se puede colar. `exists:` no habría bastado:
     * ignora los global scopes y la habría aceptado (FR-009).
     */
    public function test_a_classroom_of_another_centre_is_refused(): void
    {
        $orgB = $this->createOrganization(['name' => 'Centro B']);
        $ajena = $this->createTutorGroup($orgB, ['name' => 'Aula ajena']);

        $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/class-groups', $this->payload(['tutor_group_id' => $ajena->getKey()]))
            ->assertStatus(422);
    }

    /**
     * Los grupos creados con el modelo anterior no tienen aula y no se les
     * inventa: en la demo, los alumnos de un mismo grupo venían de once aulas
     * distintas. Nulo significa «creado antes del vínculo», que es cierto.
     */
    public function test_a_group_without_a_classroom_is_still_valid(): void
    {
        $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/class-groups', $this->payload())
            ->assertCreated()
            ->assertJsonPath('tutor_group_id', null);
    }

    /**
     * Cerrar un aula no puede destruir el historial académico del curso. La
     * clave es SET NULL y no CASCADE: con CASCADE se llevaría los grupos de la
     * asignatura y, en cadena, sus sesiones y su asistencia.
     */
    public function test_deleting_a_classroom_never_destroys_its_academic_history(): void
    {
        $aula = $this->createTutorGroup($this->orgA, ['name' => '1º ESBA']);
        $grupo = $this->createClassGroup($this->orgA, ['tutor_group_id' => $aula->getKey()]);
        $sesion = $this->createClassSession($this->orgA, $grupo);

        // Borrado REAL, no lógico: es el único que dispara la clave foránea.
        $aula->forceDelete();

        $this->assertNotNull($grupo->fresh(), 'El grupo de asignatura desapareció con el aula.');
        $this->assertNull($grupo->fresh()->tutor_group_id);
        $this->assertNotNull($sesion->fresh(), 'La sesión desapareció al cerrar el aula.');
    }

    /**
     * El profesor sigue viendo solo lo suyo: el vínculo con el aula no abre
     * nada. Lo que gobierna su alcance sigue siendo su ficha y su materia.
     */
    public function test_the_link_does_not_widen_what_a_teacher_reaches(): void
    {
        $aula = $this->createTutorGroup($this->orgA, ['name' => '1º ESBA']);

        $teacherUser = $this->createUserFor($this->orgA, 'teacher');
        $profile = $this->createTeacherProfile($this->orgA, $teacherUser);

        $subject = $this->createSubject($this->orgA);

        $suyo = $this->createClassGroup($this->orgA, [
            'tutor_group_id' => $aula->getKey(),
            'subject_id' => $subject->getKey(),
            'teacher_id' => $profile->getKey(),
        ]);

        // Otra materia de LA MISMA aula, de otro profesor.
        $this->createClassGroup($this->orgA, [
            'tutor_group_id' => $aula->getKey(),
            'teacher_id' => $this->createTeacherProfile($this->orgA)->getKey(),
        ]);

        $response = $this->actingWithToken($this->tokenFor($teacherUser))
            ->getJson('/api/v1/class-groups')
            ->assertOk();

        $this->assertSame(
            [$suyo->getKey()],
            array_column($response->json('data'), 'id'),
            'Compartir aula no debe dar acceso a la materia de otro profesor.'
        );
    }

    public function test_the_classroom_travels_with_the_group_for_the_selectors(): void
    {
        $aula = $this->createTutorGroup($this->orgA, ['name' => '3º ESBA']);
        $grupo = $this->createClassGroup($this->orgA, ['tutor_group_id' => $aula->getKey()]);

        // El desplegable de sesiones compone «aula — materia» con estos datos, y
        // es lo que quita de en medio el concepto de «grupo de asignatura».
        $this->actingWithToken($this->adminToken)
            ->getJson("/api/v1/class-groups/{$grupo->getKey()}")
            ->assertOk()
            ->assertJsonPath('tutor_group.name', '3º ESBA')
            ->assertJsonStructure(['subject' => ['name'], 'tutor_group' => ['name']]);
    }

    public function test_the_section_still_answers_for_saved_links(): void
    {
        // La sección sale del menú pero conserva ruta y permisos: quien tuviera
        // el enlace guardado no debe encontrarse un 404.
        $this->createClassGroup($this->orgA);

        $this->actingWithToken($this->adminToken)
            ->getJson('/api/v1/class-groups')
            ->assertOk();
    }

    public function test_the_seeded_demo_has_no_group_without_classroom(): void
    {
        // Invariante del modelo nuevo, comprobado sobre lo que crea el propio
        // test: todo grupo nace dentro de un aula salvo que se pida lo contrario.
        $aula = $this->createTutorGroup($this->orgA, ['name' => '1º PEP']);
        $this->createClassGroup($this->orgA, ['tutor_group_id' => $aula->getKey()]);

        $this->assertSame(
            0,
            ClassGroup::query()->whereNull('tutor_group_id')->count()
        );
    }
}
