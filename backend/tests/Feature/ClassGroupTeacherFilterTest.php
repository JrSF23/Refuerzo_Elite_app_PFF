<?php

namespace Tests\Feature;

use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * Filtro de grupos por profesor titular.
 *
 * Existe para que el aviso de «grupos sin profesor» del panel de administración
 * lleve A ESOS GRUPOS y no al listado completo. El panel cuenta un problema y el
 * enlace tiene que dejar al usuario delante de él, no delante de todo.
 */
class ClassGroupTeacherFilterTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $organization;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();
        $this->organization = $this->createOrganization();
    }

    private function actingAsAdmin(): static
    {
        return $this->withToken($this->tokenFor($this->createUserFor($this->organization, 'org_admin')));
    }

    public function test_none_narrows_to_the_groups_without_a_teacher(): void
    {
        $teacher = $this->createTeacherProfile($this->organization);

        $orphan = $this->createClassGroup($this->organization, ['teacher_id' => null]);
        $this->createClassGroup($this->organization, ['teacher_id' => $teacher->id]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/class-groups?teacher_id=none')
            ->assertOk();

        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $orphan->id);
    }

    public function test_without_the_parameter_the_list_is_not_narrowed(): void
    {
        $teacher = $this->createTeacherProfile($this->organization);

        $this->createClassGroup($this->organization, ['teacher_id' => null]);
        $this->createClassGroup($this->organization, ['teacher_id' => $teacher->id]);

        $this->actingAsAdmin()
            ->getJson('/api/v1/class-groups')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_a_specific_teacher_narrows_to_their_groups(): void
    {
        $teacher = $this->createTeacherProfile($this->organization);

        $mine = $this->createClassGroup($this->organization, ['teacher_id' => $teacher->id]);
        $this->createClassGroup($this->organization, ['teacher_id' => null]);

        $response = $this->actingAsAdmin()
            ->getJson("/api/v1/class-groups?teacher_id={$teacher->id}")
            ->assertOk();

        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $mine->id);
    }

    /**
     * Un profesor de OTRO centro devuelve conjunto vacío, nunca el listado
     * entero. Devolverlo completo enseñaría todos los grupos del centro propio a
     * quien creía estar viendo los de un profesor concreto.
     */
    public function test_a_teacher_from_another_organization_returns_no_rows(): void
    {
        $otherOrganization = $this->createOrganization();
        $foreignTeacher = $this->createTeacherProfile($otherOrganization);

        $this->createClassGroup($this->organization, ['teacher_id' => null]);
        $this->createClassGroup($this->organization, ['teacher_id' => null]);

        $this->actingAsAdmin()
            ->getJson("/api/v1/class-groups?teacher_id={$foreignTeacher->id}")
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    // ── Descuadre de materia ───────────────────────────────────────────────

    /**
     * Grupos con titular al que, aun así, nadie puede atender: su ficha imparte
     * otra materia, así que no alcanza el grupo y no puede crearle sesiones. La
     * ficha se ve perfectamente rellena, y por eso el caso es invisible sin este
     * aviso.
     */
    public function test_mismatch_narrows_to_groups_whose_teacher_teaches_another_subject(): void
    {
        $matematicas = $this->createSubject($this->organization);
        $lengua = $this->createSubject($this->organization);

        $profesorDeLengua = $this->createTeacherProfile($this->organization, null, [
            'subject_id' => $lengua->id,
        ]);
        $profesorDeMates = $this->createTeacherProfile($this->organization, null, [
            'subject_id' => $matematicas->id,
        ]);

        $descuadrado = $this->createClassGroup($this->organization, [
            'subject_id' => $matematicas->id,
            'teacher_id' => $profesorDeLengua->id,
        ]);
        $this->createClassGroup($this->organization, [
            'subject_id' => $matematicas->id,
            'teacher_id' => $profesorDeMates->id,
        ]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/class-groups?teacher_id=mismatch')
            ->assertOk();

        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $descuadrado->id);
    }

    /**
     * Una ficha SIN materia produce el mismo efecto: tampoco alcanza el grupo.
     *
     * La materia se retira DESPUÉS de crear el grupo a propósito.
     * `createClassGroup()` asigna al profesor la materia del grupo cuando no
     * tiene ninguna —existe para que los fixtures anteriores a
     * `teachers.subject_id` sigan alcanzando sus grupos—, así que crear aquí un
     * profesor «sin materia» no lo dejaría sin ella.
     */
    public function test_mismatch_also_catches_a_teacher_without_a_subject(): void
    {
        $matematicas = $this->createSubject($this->organization);
        $sinMateria = $this->createTeacherProfile($this->organization);

        $descuadrado = $this->createClassGroup($this->organization, [
            'subject_id' => $matematicas->id,
            'teacher_id' => $sinMateria->id,
        ]);

        $sinMateria->forceFill(['subject_id' => null])->save();

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/class-groups?teacher_id=mismatch')
            ->assertOk();

        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $descuadrado->id);
    }

    /**
     * Un grupo SIN profesor no es un descuadre: es el otro aviso. Mezclarlos
     * haría que los dos enlaces del panel enseñaran lo mismo.
     */
    public function test_a_group_without_a_teacher_is_not_a_mismatch(): void
    {
        $this->createClassGroup($this->organization, ['teacher_id' => null]);

        $this->actingAsAdmin()
            ->getJson('/api/v1/class-groups?teacher_id=mismatch')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
