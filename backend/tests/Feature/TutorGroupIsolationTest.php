<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Student;
use App\Models\TutorGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * Aislamiento de los grupos tutoriales entre organizaciones.
 *
 * Puerta 5 de la constitución, NO NEGOCIABLE. Sin esto en verde la feature no se
 * puede integrar.
 *
 * **Aviso**: todo cambio de usuario va por `actingWithToken()`. Con `withToken()`
 * a secas, el guard de Sanctum cachea el usuario resuelto dentro de la misma
 * prueba y esta batería entera pasaría sin comprobar nada. Ya ocurrió en la
 * feature 001.
 */
class TutorGroupIsolationTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $orgA;

    private Organization $orgB;

    private string $tokenA;

    private TutorGroup $groupB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->orgA = $this->createOrganization(['name' => 'Centro A']);
        $this->orgB = $this->createOrganization(['name' => 'Centro B']);

        $this->tokenA = $this->tokenFor($this->createUserFor($this->orgA, 'org_admin'));

        $this->groupB = $this->createTutorGroup($this->orgB, ['name' => 'Grupo del centro B']);
    }

    public function test_listing_only_returns_groups_of_the_own_organization(): void
    {
        $this->createTutorGroup($this->orgA, ['name' => 'Grupo propio']);

        $response = $this->actingWithToken($this->tokenA)->getJson('/api/v1/tutor-groups');

        $response->assertOk();
        $this->assertSame(1, $response->json('total'));
        $this->assertSame('Grupo propio', $response->json('data.0.name'));
    }

    public function test_showing_a_foreign_group_responds_not_found(): void
    {
        // 404 y no 403: un 403 confirmaría que el grupo existe.
        $this->actingWithToken($this->tokenA)
            ->getJson("/api/v1/tutor-groups/{$this->groupB->getKey()}")
            ->assertNotFound();
    }

    public function test_updating_a_foreign_group_responds_not_found_and_leaves_it_intact(): void
    {
        $this->actingWithToken($this->tokenA)
            ->putJson("/api/v1/tutor-groups/{$this->groupB->getKey()}", [
                'name' => 'Secuestrado',
                'shift' => TutorGroup::SHIFT_MORNING,
                'academic_year' => '2025-2026',
                'status' => TutorGroup::STATUS_ACTIVE,
            ])
            ->assertNotFound();

        $this->assertSame(
            'Grupo del centro B',
            TutorGroup::withoutGlobalScopes()->find($this->groupB->getKey())->name,
        );
    }

    public function test_deleting_a_foreign_group_responds_not_found_and_it_survives(): void
    {
        $this->actingWithToken($this->tokenA)
            ->deleteJson("/api/v1/tutor-groups/{$this->groupB->getKey()}")
            ->assertNotFound();

        $this->assertNotNull(TutorGroup::withoutGlobalScopes()->find($this->groupB->getKey()));
    }

    public function test_the_same_group_name_is_accepted_in_both_organizations(): void
    {
        // La unicidad está acotada por organización. Si fuese global, sería a la
        // vez un fallo funcional y una fuga: el error de duplicado revelaría un
        // registro ajeno.
        $this->createTutorGroup($this->orgB, [
            'name' => '1º ESO',
            'shift' => TutorGroup::SHIFT_MORNING,
        ]);

        $this->actingWithToken($this->tokenA)
            ->postJson('/api/v1/tutor-groups', [
                'name' => '1º ESO',
                'shift' => TutorGroup::SHIFT_MORNING,
                'academic_year' => '2025-2026',
                'status' => TutorGroup::STATUS_ACTIVE,
            ])
            ->assertCreated();
    }

    public function test_filtering_students_by_a_foreign_group_never_returns_data(): void
    {
        // El fallo que se busca: que el filtro se ignore por ser un grupo ajeno y
        // se devuelva el listado ENTERO. El usuario creería estar viendo ese grupo.
        $this->createStudent($this->orgA);
        $this->createStudent($this->orgA);

        $response = $this->actingWithToken($this->tokenA)
            ->getJson('/api/v1/students?tutor_group_id='.$this->groupB->getKey());

        $response->assertOk();
        $this->assertSame(0, $response->json('total'));
    }

    public function test_filtering_students_by_an_own_group_returns_only_its_students(): void
    {
        $group = $this->createTutorGroup($this->orgA);

        $inGroup = $this->createStudent($this->orgA, ['tutor_group_id' => $group->getKey()]);
        $this->createStudent($this->orgA);

        $response = $this->actingWithToken($this->tokenA)
            ->getJson('/api/v1/students?tutor_group_id='.$group->getKey());

        $response->assertOk();
        $this->assertSame(1, $response->json('total'));
        $this->assertSame($inGroup->getKey(), $response->json('data.0.id'));
    }

    public function test_a_student_of_a_foreign_group_is_never_visible(): void
    {
        $studentB = $this->createStudent($this->orgB, [
            'tutor_group_id' => $this->groupB->getKey(),
        ]);

        $response = $this->actingWithToken($this->tokenA)->getJson('/api/v1/students');

        $response->assertOk();
        $this->assertNotContains(
            $studentB->getKey(),
            collect($response->json('data'))->pluck('id')->all(),
        );
    }

    public function test_deleting_a_group_never_deletes_its_students(): void
    {
        $group = $this->createTutorGroup($this->orgA);

        $this->createStudent($this->orgA, ['tutor_group_id' => $group->getKey()]);
        $this->createStudent($this->orgA, ['tutor_group_id' => $group->getKey()]);

        $before = Student::withoutGlobalScopes()->where('organization_id', $this->orgA->getKey())->count();

        $this->actingWithToken($this->tokenA)
            ->deleteJson("/api/v1/tutor-groups/{$group->getKey()}")
            ->assertOk();

        $after = Student::withoutGlobalScopes()->where('organization_id', $this->orgA->getKey())->count();

        // El recuento no cambia y los alumnos quedan sin grupo (FR-010, SC-008).
        $this->assertSame($before, $after);
        $this->assertSame(0, Student::withoutGlobalScopes()->where('tutor_group_id', $group->getKey())->count());
    }
}
