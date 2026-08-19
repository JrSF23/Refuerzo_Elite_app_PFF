<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\TutorGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * Las vías de fuga por referencia cruzada.
 *
 * No basta con que el listado esté filtrado: si un formulario acepta el
 * identificador de un registro ajeno, los datos de dos centros quedan enlazados.
 * Es el agujero que en la feature 001 obligó a escribir
 * `BelongsToCurrentOrganization`, porque `Rule::exists()` de Laravel usa el query
 * builder y **no aplica los global scopes**.
 *
 * Esta feature abre tres vías nuevas, y las tres se prueban aquí:
 *   alumno → grupo, grupo → tutor, grupo → delegado.
 */
class TutorGroupCrossReferenceTest extends TestCase
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

        $this->tokenA = $this->tokenFor($this->createUserFor($this->orgA, 'org_admin'));
    }

    public function test_a_student_cannot_be_assigned_to_a_group_of_another_organization(): void
    {
        $groupB = $this->createTutorGroup($this->orgB);

        $response = $this->actingWithToken($this->tokenA)->postJson('/api/v1/students', [
            'first_name' => 'Ana',
            'last_name' => 'Pérez',
            'status' => 'active',
            'tutor_group_id' => $groupB->getKey(),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('tutor_group_id');

        // Indistinguible de «no existe»: mencionar el grupo confirmaría que existe.
        $this->assertStringNotContainsStringIgnoringCase(
            'organiz',
            $response->json('errors.tutor_group_id.0'),
        );
    }

    public function test_a_group_cannot_take_a_tutor_from_another_organization(): void
    {
        $teacherB = $this->createTeacherProfile($this->orgB);

        $this->actingWithToken($this->tokenA)
            ->postJson('/api/v1/tutor-groups', [
                'name' => '2º ESO',
                'shift' => TutorGroup::SHIFT_MORNING,
                'academic_year' => '2025-2026',
                'status' => TutorGroup::STATUS_ACTIVE,
                'tutor_teacher_id' => $teacherB->getKey(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('tutor_teacher_id');
    }

    public function test_a_group_cannot_take_a_representative_from_another_organization(): void
    {
        $groupA = $this->createTutorGroup($this->orgA);
        $studentB = $this->createStudent($this->orgB);

        $this->actingWithToken($this->tokenA)
            ->putJson("/api/v1/tutor-groups/{$groupA->getKey()}", [
                'name' => $groupA->name,
                'shift' => $groupA->shift,
                'academic_year' => $groupA->academic_year,
                'status' => TutorGroup::STATUS_ACTIVE,
                'representative_student_id' => $studentB->getKey(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('representative_student_id');
    }

    public function test_the_representative_must_belong_to_this_very_group(): void
    {
        // Coherencia del dato, no aislamiento: ambos alumnos son del mismo centro.
        $groupA = $this->createTutorGroup($this->orgA, ['name' => 'Grupo destino']);
        $otherGroup = $this->createTutorGroup($this->orgA, ['name' => 'Otro grupo']);

        $studentOfOther = $this->createStudent($this->orgA, [
            'tutor_group_id' => $otherGroup->getKey(),
        ]);

        $response = $this->actingWithToken($this->tokenA)
            ->putJson("/api/v1/tutor-groups/{$groupA->getKey()}", [
                'name' => $groupA->name,
                'shift' => $groupA->shift,
                'academic_year' => $groupA->academic_year,
                'status' => TutorGroup::STATUS_ACTIVE,
                'representative_student_id' => $studentOfOther->getKey(),
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('representative_student_id');

        // Aquí SÍ se explica el motivo: el usuario ve a ese alumno en la
        // aplicación, así que un «no existe» sería desconcertante y no oculta nada.
        $this->assertStringContainsString(
            'grupo',
            mb_strtolower($response->json('errors.representative_student_id.0')),
        );
    }

    public function test_the_representative_is_accepted_when_the_student_is_in_the_group(): void
    {
        $group = $this->createTutorGroup($this->orgA);
        $student = $this->createStudent($this->orgA, ['tutor_group_id' => $group->getKey()]);

        $this->actingWithToken($this->tokenA)
            ->putJson("/api/v1/tutor-groups/{$group->getKey()}", [
                'name' => $group->name,
                'shift' => $group->shift,
                'academic_year' => $group->academic_year,
                'status' => TutorGroup::STATUS_ACTIVE,
                'representative_student_id' => $student->getKey(),
            ])
            ->assertOk();

        $this->assertSame($student->getKey(), $group->fresh()->representative_student_id);
    }

    public function test_a_representative_cannot_be_designated_while_creating_the_group(): void
    {
        // Al crear no hay alumnos todavía. Debe explicarse, no fallar de forma
        // críptica por una referencia que aún no puede existir.
        $student = $this->createStudent($this->orgA);

        $this->actingWithToken($this->tokenA)
            ->postJson('/api/v1/tutor-groups', [
                'name' => '3º ESO',
                'shift' => TutorGroup::SHIFT_MORNING,
                'academic_year' => '2025-2026',
                'status' => TutorGroup::STATUS_ACTIVE,
                'representative_student_id' => $student->getKey(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('representative_student_id');
    }

    public function test_the_client_cannot_choose_the_organization(): void
    {
        $this->actingWithToken($this->tokenA)
            ->postJson('/api/v1/tutor-groups', [
                'name' => '4º ESO',
                'shift' => TutorGroup::SHIFT_MORNING,
                'academic_year' => '2025-2026',
                'status' => TutorGroup::STATUS_ACTIVE,
                'organization_id' => $this->orgB->getKey(),
            ])
            ->assertCreated();

        // Se ignora: lo asigna el trait desde el contexto de petición.
        $created = TutorGroup::withoutGlobalScopes()->where('name', '4º ESO')->firstOrFail();
        $this->assertSame($this->orgA->getKey(), $created->organization_id);
    }
}
