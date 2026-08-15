<?php

namespace Tests\Feature;

use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * FR-014 y escenario 3 de la historia P4: el administrador de organización
 * gestiona todo su centro y nada de la plataforma.
 */
class OrgAdminScopeTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $organization;

    private string $token;

    /** @var array<string, \Illuminate\Database\Eloquent\Model> */
    private array $data;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->organization = $this->createOrganization(['name' => 'Mi Centro']);
        $this->data = $this->seedBusinessData($this->organization);
        $this->token = $this->tokenFor($this->createUserFor($this->organization, 'org_admin'));
    }

    /**
     * Las nueve entidades con endpoint.
     *
     * @return array<string, array{0: string}>
     */
    public static function businessResources(): array
    {
        return [
            'guardians' => ['guardians'],
            'teachers' => ['teachers'],
            'subjects' => ['subjects'],
            'students' => ['students'],
            'class groups' => ['class-groups'],
            'class sessions' => ['class-sessions'],
            'enrollments' => ['enrollments'],
            'attendances' => ['attendances'],
            'payments' => ['payments'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('businessResources')]
    public function test_org_admin_can_list_every_business_entity(string $resource): void
    {
        $this->actingWithToken($this->token)
            ->getJson("/api/v1/{$resource}")
            ->assertOk()
            ->assertJsonPath('total', 1);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('businessResources')]
    public function test_org_admin_can_read_the_detail_of_every_business_entity(string $resource): void
    {
        $this->actingWithToken($this->token)
            ->getJson("/api/v1/{$resource}/{$this->data[$resource]->getKey()}")
            ->assertOk();
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('businessResources')]
    public function test_org_admin_can_delete_every_business_entity(string $resource): void
    {
        $this->actingWithToken($this->token)
            ->deleteJson("/api/v1/{$resource}/{$this->data[$resource]->getKey()}")
            ->assertOk();
    }

    public function test_org_admin_can_create_within_its_own_organization(): void
    {
        $response = $this->actingWithToken($this->token)
            ->postJson('/api/v1/students', ['first_name' => 'Ana', 'last_name' => 'Pérez', 'status' => 'active'])
            ->assertCreated();

        $this->assertSame($this->organization->id, $response->json('organization_id'));
    }

    public function test_org_admin_can_update_within_its_own_organization(): void
    {
        $student = $this->data['students'];

        $this->actingWithToken($this->token)
            ->putJson("/api/v1/students/{$student->getKey()}", [
                'first_name' => 'Renombrada', 'last_name' => 'Alumna', 'status' => 'inactive',
            ])
            ->assertOk()
            ->assertJsonPath('status', 'inactive');
    }

    public function test_org_admin_reaches_its_dashboard(): void
    {
        $this->actingWithToken($this->token)
            ->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonStructure(['role', 'stats']);
    }

    // ── Nada de plataforma ─────────────────────────────────────────────────

    public function test_org_admin_cannot_reach_organization_management(): void
    {
        $this->actingWithToken($this->token)->getJson('/api/v1/organizations')->assertForbidden();
        $this->actingWithToken($this->token)->postJson('/api/v1/organizations', ['name' => 'Mía'])->assertForbidden();
        $this->actingWithToken($this->token)
            ->getJson("/api/v1/organizations/{$this->organization->id}")
            ->assertForbidden();
    }

    public function test_org_admin_cannot_suspend_its_own_organization(): void
    {
        $this->actingWithToken($this->token)
            ->postJson("/api/v1/organizations/{$this->organization->id}/suspend")
            ->assertForbidden();
    }

    // ── Cuentas: solo las suyas ────────────────────────────────────────────

    public function test_org_admin_only_sees_accounts_of_its_own_organization(): void
    {
        $other = $this->createOrganization(['name' => 'Otro Centro']);
        $foreignUser = $this->createUserFor($other, 'org_admin');

        $response = $this->actingWithToken($this->token)->getJson('/api/v1/users')->assertOk();

        $ids = array_column($response->json('data'), 'id');

        $this->assertNotContains($foreignUser->id, $ids);
        $this->assertNotContains(
            $other->id,
            array_column($response->json('data'), 'organization_id')
        );
    }

    public function test_org_admin_cannot_read_an_account_from_another_organization(): void
    {
        $other = $this->createOrganization(['name' => 'Otro Centro']);
        $foreignUser = $this->createUserFor($other, 'org_admin');

        // Recurso ajeno: se responde como inexistente, no como prohibido.
        $this->actingWithToken($this->token)
            ->getJson("/api/v1/users/{$foreignUser->id}")
            ->assertNotFound();

        $this->actingWithToken($this->token)
            ->deleteJson("/api/v1/users/{$foreignUser->id}")
            ->assertNotFound();

        $this->assertDatabaseHas('users', ['id' => $foreignUser->id]);
    }

    public function test_org_admin_cannot_grant_the_platform_role(): void
    {
        $this->actingWithToken($this->token)
            ->postJson('/api/v1/users', [
                'name' => 'Escalada', 'username' => 'escalada', 'email' => 'escalada@test.local',
                'password' => 'ClaveInicial123!', 'role' => 'super_admin',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }
}
