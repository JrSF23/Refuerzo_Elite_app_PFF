<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * SC-003: un centro nuevo queda operativo —organización creada, administrador dado
 * de alta y primer acceso realizado— sin intervención manual sobre la base de
 * datos.
 *
 * El alcance del super administrador sobre cuentas es el de plataforma: puede
 * indicar la organización en el alta. El del `org_admin` llega en US4.
 */
class PlatformUserManagementTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private string $superToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();
        $this->superToken = $this->tokenFor($this->createSuperAdmin());
    }

    public function test_super_admin_onboards_a_new_school_end_to_end(): void
    {
        // 1. Alta de la organización.
        $organizationId = $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/organizations', ['name' => 'Centro Piloto Bata'])
            ->assertCreated()
            ->json('id');

        // 2. Alta de su administrador.
        $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/users', [
                'name' => 'Administración Bata',
                'username' => 'admin.bata',
                'email' => 'admin@bata.test',
                'password' => 'ClaveInicial123!',
                'role' => 'org_admin',
                'organization_id' => $organizationId,
            ])
            ->assertCreated()
            ->assertJsonPath('organization_id', $organizationId);

        // 3. Primer acceso.
        $token = $this->postJson('/api/v1/login', ['login' => 'admin.bata', 'password' => 'ClaveInicial123!'])
            ->assertOk()
            ->json('token');

        // 4. Ve su organización, y está vacía.
        $this->actingWithToken($token)
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('organization.id', $organizationId);

        $this->actingWithToken($token)
            ->getJson('/api/v1/students')
            ->assertOk()
            ->assertJsonPath('total', 0);
    }

    public function test_the_new_organization_is_empty_of_other_schools_data(): void
    {
        $other = $this->createOrganization(['name' => 'Centro Existente']);
        $this->seedBusinessData($other);

        $organizationId = $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/organizations', ['name' => 'Centro Nuevo'])
            ->assertCreated()->json('id');

        $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/users', [
                'name' => 'Admin Nuevo', 'username' => 'admin.nuevo', 'email' => 'admin@nuevo.test',
                'password' => 'ClaveInicial123!', 'role' => 'org_admin', 'organization_id' => $organizationId,
            ])->assertCreated();

        $token = $this->postJson('/api/v1/login', ['login' => 'admin.nuevo', 'password' => 'ClaveInicial123!'])
            ->json('token');

        foreach (['students', 'guardians', 'teachers', 'subjects', 'class-groups', 'payments'] as $resource) {
            $this->actingWithToken($token)
                ->getJson("/api/v1/{$resource}")
                ->assertOk()
                ->assertJsonPath('total', 0);
        }
    }

    public function test_user_creation_validates_its_input(): void
    {
        $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/users', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'username', 'email', 'password', 'role']);
    }

    /**
     * FR-004: toda cuenta pertenece a una organización salvo las de plataforma.
     * Omitir la organización creaba cuentas huérfanas con alcance de plataforma.
     */
    public function test_creating_a_non_platform_account_requires_an_organization(): void
    {
        $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/users', [
                'name' => 'Sin Centro', 'username' => 'sin.centro', 'email' => 'sin@centro.test',
                'password' => 'ClaveInicial123!', 'role' => 'org_admin',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['organization_id']);

        $this->assertDatabaseMissing('users', ['username' => 'sin.centro']);
    }

    public function test_a_platform_account_cannot_be_bound_to_an_organization(): void
    {
        $organization = $this->createOrganization();

        $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/users', [
                'name' => 'Plataforma', 'username' => 'plataforma', 'email' => 'plataforma@test.local',
                'password' => 'ClaveInicial123!', 'role' => 'super_admin',
                'organization_id' => $organization->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['organization_id']);
    }

    public function test_a_platform_account_is_created_without_organization(): void
    {
        $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/users', [
                'name' => 'Plataforma', 'username' => 'plataforma', 'email' => 'plataforma@test.local',
                'password' => 'ClaveInicial123!', 'role' => 'super_admin',
            ])
            ->assertCreated()
            ->assertJsonPath('organization_id', null);
    }

    public function test_user_email_must_be_globally_unique(): void
    {
        $organization = $this->createOrganization();
        $existing = $this->createUserFor($organization, 'org_admin');

        $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/users', [
                'name' => 'Duplicado', 'username' => 'duplicado', 'email' => $existing->email,
                'password' => 'ClaveInicial123!', 'role' => 'org_admin', 'organization_id' => $organization->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_super_admin_lists_and_filters_accounts_across_organizations(): void
    {
        $a = $this->createOrganization(['name' => 'A']);
        $b = $this->createOrganization(['name' => 'B']);
        $this->createUserFor($a, 'org_admin');
        $this->createUserFor($b, 'teacher');

        $all = $this->actingWithToken($this->superToken)->getJson('/api/v1/users')->assertOk();
        $this->assertGreaterThanOrEqual(3, $all->json('total')); // incluye al propio super admin

        $onlyA = $this->actingWithToken($this->superToken)
            ->getJson('/api/v1/users?organization_id='.$a->id)
            ->assertOk();

        $this->assertSame(1, $onlyA->json('total'));
    }

    public function test_super_admin_can_deactivate_and_delete_an_account(): void
    {
        $organization = $this->createOrganization();
        $user = $this->createUserFor($organization, 'teacher');

        $this->actingWithToken($this->superToken)
            ->putJson("/api/v1/users/{$user->id}", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('is_active', false);

        $this->actingWithToken($this->superToken)
            ->deleteJson("/api/v1/users/{$user->id}")
            ->assertOk();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_a_teacher_profile_can_be_linked_at_creation(): void
    {
        $organization = $this->createOrganization();
        $profile = $this->createTeacherProfile($organization);

        $userId = $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/users', [
                'name' => 'Profesor Nuevo', 'username' => 'prof.nuevo', 'email' => 'prof@nuevo.test',
                'password' => 'ClaveInicial123!', 'role' => 'teacher',
                'organization_id' => $organization->id, 'teacher_id' => $profile->id,
            ])
            ->assertCreated()
            ->json('id');

        $this->assertDatabaseHas('teachers', ['id' => $profile->id, 'user_id' => $userId]);
    }

    public function test_a_teacher_profile_from_another_organization_cannot_be_linked(): void
    {
        $a = $this->createOrganization(['name' => 'A']);
        $b = $this->createOrganization(['name' => 'B']);
        $foreignProfile = $this->createTeacherProfile($b);

        $this->actingWithToken($this->superToken)
            ->postJson('/api/v1/users', [
                'name' => 'Profesor Cruzado', 'username' => 'prof.cruzado', 'email' => 'prof@cruzado.test',
                'password' => 'ClaveInicial123!', 'role' => 'teacher',
                'organization_id' => $a->id, 'teacher_id' => $foreignProfile->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['teacher_id']);
    }

    // ── Autorización ───────────────────────────────────────────────────────

    public function test_a_teacher_cannot_manage_accounts(): void
    {
        $organization = $this->createOrganization();
        $token = $this->tokenFor($this->createUserFor($organization, 'teacher'));

        $this->actingWithToken($token)->getJson('/api/v1/users')->assertForbidden();
        $this->actingWithToken($token)->postJson('/api/v1/users', [])->assertForbidden();
    }
}
