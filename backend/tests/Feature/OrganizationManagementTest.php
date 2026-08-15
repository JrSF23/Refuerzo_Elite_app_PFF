<?php

namespace Tests\Feature;

use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * FR-013 y escenario 4 de la historia P3: el super administrador da de alta,
 * consulta y modifica organizaciones; nadie más puede hacerlo.
 */
class OrganizationManagementTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private string $superToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();
        $this->superToken = $this->tokenFor($this->createSuperAdmin());
    }

    // ── Alta ───────────────────────────────────────────────────────────────

    public function test_super_admin_creates_an_organization(): void
    {
        $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/organizations', [
                'name' => 'Centro Piloto Bata',
                'contact_email' => 'contacto@bata.test',
            ])
            ->assertCreated()
            ->assertJsonPath('name', 'Centro Piloto Bata')
            ->assertJsonPath('status', 'active');

        $this->assertDatabaseHas('organizations', ['name' => 'Centro Piloto Bata', 'status' => 'active']);
    }

    public function test_slug_is_derived_from_the_name_when_omitted(): void
    {
        $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/organizations', ['name' => 'Centro Piloto Bata'])
            ->assertCreated()
            ->assertJsonPath('slug', 'centro-piloto-bata');
    }

    public function test_status_cannot_be_forced_on_creation(): void
    {
        // Toda organización nace activa: suspender es un acto deliberado con
        // endpoint propio, no un campo del alta.
        $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/organizations', ['name' => 'Nace Suspendida', 'status' => 'suspended'])
            ->assertCreated()
            ->assertJsonPath('status', 'active');
    }

    public function test_creation_requires_a_name_and_a_unique_slug(): void
    {
        $existing = $this->createOrganization(['slug' => 'ya-existe']);

        $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/organizations', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);

        $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/organizations', ['name' => 'Otro', 'slug' => $existing->slug])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);
    }

    // ── Listado y detalle ──────────────────────────────────────────────────

    public function test_index_paginates_and_exposes_only_the_user_count(): void
    {
        $organization = $this->createOrganization();
        $this->createUserFor($organization, 'org_admin');
        $this->seedBusinessData($organization);

        $response = $this->actingWithToken($this->superToken)
            ->getJson('/api/v1/organizations')
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'name', 'slug', 'status', 'users_count']], 'current_page', 'per_page', 'total']);

        // FR-013a: nada que permita conocer el contenido de la organización.
        $row = collect($response->json('data'))->firstWhere('id', $organization->id);

        $this->assertSame(1, $row['users_count']);
        $this->assertArrayNotHasKey('students_count', $row);
        $this->assertArrayNotHasKey('payments_count', $row);
    }

    public function test_index_supports_search_by_name_and_slug(): void
    {
        $this->createOrganization(['name' => 'Academia Malabo', 'slug' => 'academia-malabo']);
        $this->createOrganization(['name' => 'Centro Bata', 'slug' => 'centro-bata']);

        $byName = $this->actingWithToken($this->superToken)
            ->getJson('/api/v1/organizations?search=Malabo')->assertOk();
        $this->assertCount(1, $byName->json('data'));

        $bySlug = $this->actingWithToken($this->superToken)
            ->getJson('/api/v1/organizations?search=centro-bata')->assertOk();
        $this->assertCount(1, $bySlug->json('data'));
    }

    public function test_super_admin_reads_and_updates_an_organization(): void
    {
        $organization = $this->createOrganization(['name' => 'Nombre Viejo']);

        $this->actingWithToken($this->superToken)
            ->getJson("/api/v1/organizations/{$organization->id}")
            ->assertOk()
            ->assertJsonPath('id', $organization->id);

        $this->actingWithToken($this->superToken)
            ->putJson("/api/v1/organizations/{$organization->id}", ['name' => 'Nombre Nuevo'])
            ->assertOk()
            ->assertJsonPath('name', 'Nombre Nuevo');
    }

    public function test_update_cannot_change_the_status(): void
    {
        $organization = $this->createOrganization();

        $this->actingWithToken($this->superToken)
            ->putJson("/api/v1/organizations/{$organization->id}", ['name' => 'Otro', 'status' => 'suspended'])
            ->assertOk();

        $this->assertSame('active', $organization->fresh()->status);
    }

    // ── Borrado ────────────────────────────────────────────────────────────

    public function test_delete_is_rejected_while_the_organization_has_active_users(): void
    {
        $organization = $this->createOrganization();
        $this->createUserFor($organization, 'org_admin');

        $this->actingWithToken($this->superToken)
            ->deleteJson("/api/v1/organizations/{$organization->id}")
            ->assertStatus(409);

        $this->assertNull($organization->fresh()->deleted_at);
    }

    public function test_delete_succeeds_once_the_organization_is_suspended(): void
    {
        $organization = $this->createOrganization();
        $this->createUserFor($organization, 'org_admin');

        $this->actingWithToken($this->superToken)
            ->postJson("/api/v1/organizations/{$organization->id}/suspend")
            ->assertOk();

        $this->actingWithToken($this->superToken)
            ->deleteJson("/api/v1/organizations/{$organization->id}")
            ->assertOk();

        $this->assertSoftDeleted('organizations', ['id' => $organization->id]);
    }

    public function test_delete_of_an_empty_organization_is_allowed_directly(): void
    {
        $organization = $this->createOrganization();

        $this->actingWithToken($this->superToken)
            ->deleteJson("/api/v1/organizations/{$organization->id}")
            ->assertOk();

        $this->assertSoftDeleted('organizations', ['id' => $organization->id]);
    }

    // ── Autorización ───────────────────────────────────────────────────────

    /**
     * @return array<string, array{0: string}>
     */
    public static function nonPlatformRoles(): array
    {
        return ['org_admin' => ['org_admin'], 'teacher' => ['teacher']];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('nonPlatformRoles')]
    public function test_other_roles_cannot_reach_organization_management(string $role): void
    {
        $organization = $this->createOrganization();
        $token = $this->tokenFor($this->createUserFor($organization, $role));

        $this->actingWithToken($token)->getJson('/api/v1/organizations')->assertForbidden();
        $this->actingWithToken($token)->postJson('/api/v1/organizations', ['name' => 'Mía'])->assertForbidden();
        $this->actingWithToken($token)->getJson("/api/v1/organizations/{$organization->id}")->assertForbidden();
        $this->actingWithToken($token)->putJson("/api/v1/organizations/{$organization->id}", ['name' => 'X'])->assertForbidden();
        $this->actingWithToken($token)->deleteJson("/api/v1/organizations/{$organization->id}")->assertForbidden();
    }

    public function test_unauthenticated_cannot_reach_organization_management(): void
    {
        $this->getJson('/api/v1/organizations')->assertUnauthorized();
    }
}
