<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Stage;
use App\Models\TutorGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * Etapas educativas: la unidad de cobro del centro.
 *
 * La cuota va por nivel —Pre-escolar, Primaria, ESBA, Bachillerato— y no por
 * asignatura. Todos los cursos de una etapa cuestan lo mismo.
 *
 * Lo que se defiende aquí es sobre todo QUIÉN llega al importe. Una etapa es un
 * campo monetario, y el invariante FR-016 dice que el profesor no ve ninguno; y
 * el precio de un centro no puede asomar en otro bajo ningún concepto.
 */
class StageTest extends TestCase
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

    private function createStage(Organization $organization, array $overrides = []): Stage
    {
        return Stage::forceCreate(array_merge([
            'organization_id' => $organization->getKey(),
            'name' => 'Bachillerato',
            'fee' => 120000,
            'sort_order' => 3,
        ], $overrides));
    }

    public function test_the_administration_creates_a_stage_with_its_fee(): void
    {
        $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/stages', [
                'name' => 'Primaria (PEP)',
                'fee' => 105000,
                'sort_order' => 1,
            ])
            ->assertCreated()
            ->assertJsonPath('name', 'Primaria (PEP)');

        $this->assertSame('105000.00', Stage::query()->where('name', 'Primaria (PEP)')->value('fee'));
    }

    /**
     * FR-016: el profesor no accede a ninguna información económica, y la cuota
     * lo es. Se comprueba sobre la ruta, que es lo que de verdad protege.
     */
    public function test_a_teacher_never_reaches_the_fees(): void
    {
        $teacherUser = $this->createUserFor($this->orgA, 'teacher');
        $this->createTeacherProfile($this->orgA, $teacherUser);
        $stage = $this->createStage($this->orgA);

        $token = $this->tokenFor($teacherUser);

        $this->actingWithToken($token)->getJson('/api/v1/stages')->assertForbidden();
        $this->actingWithToken($token)->getJson("/api/v1/stages/{$stage->getKey()}")->assertForbidden();
        $this->actingWithToken($token)
            ->postJson('/api/v1/stages', ['name' => 'Suya', 'fee' => 1])
            ->assertForbidden();
    }

    /**
     * Dos centros tienen cada uno su «Bachillerato», y son etapas distintas con
     * precios distintos. La unicidad es POR ORGANIZACIÓN.
     */
    public function test_two_centres_may_each_have_their_own_bachillerato(): void
    {
        $orgB = $this->createOrganization(['name' => 'Centro B']);
        $this->createStage($orgB, ['fee' => 200000]);

        $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/stages', ['name' => 'Bachillerato', 'fee' => 120000])
            ->assertCreated();

        $this->assertSame(2, Stage::withoutGlobalScopes()->where('name', 'Bachillerato')->count());
    }

    public function test_the_same_name_twice_in_one_centre_is_refused(): void
    {
        $this->createStage($this->orgA);

        $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/stages', ['name' => 'Bachillerato', 'fee' => 999])
            ->assertStatus(422);
    }

    /**
     * EL punto que importa: el precio de otro centro no se ve ni conociendo su
     * identificador. Responde 404 y no 403 — indistinguible de uno inexistente,
     * para no delatar que existe (FR-020).
     */
    public function test_the_fee_of_another_centre_is_unreachable(): void
    {
        $orgB = $this->createOrganization(['name' => 'Centro B']);
        $ajena = $this->createStage($orgB, ['name' => 'Bachillerato B', 'fee' => 999999]);

        $this->actingWithToken($this->adminToken)
            ->getJson("/api/v1/stages/{$ajena->getKey()}")
            ->assertNotFound();

        $nombres = collect(
            $this->actingWithToken($this->adminToken)->getJson('/api/v1/stages')->json('data')
        )->pluck('name');

        $this->assertNotContains('Bachillerato B', $nombres);
    }

    /**
     * El aula declara su etapa, y de ahí sale la cuota del alumno. Ponerla en el
     * alumno permitiría un alumno de Bachillerato en un aula de Primaria.
     */
    public function test_a_classroom_declares_its_stage(): void
    {
        $stage = $this->createStage($this->orgA);

        $response = $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/tutor-groups', [
                'name' => '1º Bach CC',
                'stage_id' => $stage->getKey(),
                'shift' => TutorGroup::SHIFT_MORNING,
                'academic_year' => '2026-2027',
                'status' => TutorGroup::STATUS_ACTIVE,
            ])
            ->assertCreated();

        $this->assertSame($stage->getKey(), $response->json('stage_id'));
    }

    /**
     * La etapa de otro centro no se puede colar en un aula propia. `exists:` no
     * habría bastado: ignora los global scopes y la habría aceptado (FR-009).
     */
    public function test_a_classroom_cannot_take_the_stage_of_another_centre(): void
    {
        $orgB = $this->createOrganization(['name' => 'Centro B']);
        $ajena = $this->createStage($orgB, ['name' => 'Bachillerato B']);

        $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/tutor-groups', [
                'name' => 'Aula tramposa',
                'stage_id' => $ajena->getKey(),
                'shift' => TutorGroup::SHIFT_MORNING,
                'academic_year' => '2026-2027',
                'status' => TutorGroup::STATUS_ACTIVE,
            ])
            ->assertStatus(422);
    }

    /**
     * Un aula sin etapa es un estado legítimo: existe antes de que el centro
     * configure sus precios. Lo que provoca es que sus alumnos no tengan cuota,
     * no un error al guardar.
     */
    public function test_a_classroom_without_a_stage_is_valid(): void
    {
        $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/tutor-groups', [
                'name' => 'Aula sin clasificar',
                'shift' => TutorGroup::SHIFT_MORNING,
                'academic_year' => '2026-2027',
                'status' => TutorGroup::STATUS_ACTIVE,
            ])
            ->assertCreated()
            ->assertJsonPath('stage_id', null);
    }

    /**
     * El listado dice cuántas aulas cuelgan de cada etapa: antes de cambiar una
     * cuota hay que ver a cuántas afecta.
     */
    public function test_the_listing_counts_the_classrooms_of_each_stage(): void
    {
        $stage = $this->createStage($this->orgA);

        $this->createTutorGroup($this->orgA, ['name' => '1º Bach CC', 'stage_id' => $stage->getKey()]);
        $this->createTutorGroup($this->orgA, ['name' => '2º Bach CC', 'stage_id' => $stage->getKey()]);
        $this->createTutorGroup($this->orgA, ['name' => 'Sin etapa']);

        $fila = collect(
            $this->actingWithToken($this->adminToken)->getJson('/api/v1/stages')->json('data')
        )->firstWhere('id', $stage->getKey());

        $this->assertSame(2, $fila['tutor_groups_count']);
    }
}
