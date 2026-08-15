<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * FR-018 y la regla no negociable del contrato: cuando un administrador de
 * organización da de alta a un usuario, la organización se toma de la suya y el
 * `organization_id` que venga en la petición **se ignora**.
 *
 * No es un error de permisos: devolver 403 informaría al cliente de que el valor
 * fue tenido en cuenta. Sencillamente no se usa (FR-006).
 */
class OrgAdminUserCreationTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $own;

    private Organization $foreign;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->own = $this->createOrganization(['name' => 'Mi Centro']);
        $this->foreign = $this->createOrganization(['name' => 'Centro Ajeno']);

        $this->token = $this->tokenFor($this->createUserFor($this->own, 'org_admin'));
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Nuevo Usuario',
            'username' => 'nuevo.usuario',
            'email' => 'nuevo@micentro.test',
            'password' => 'ClaveInicial123!',
            'role' => 'teacher',
        ], $overrides);
    }

    public function test_a_foreign_organization_id_is_ignored_and_the_account_lands_in_the_own_one(): void
    {
        $response = $this->actingWithToken($this->token)
            ->postJson('/api/v1/users', $this->payload(['organization_id' => $this->foreign->id]))
            ->assertCreated();

        $this->assertSame($this->own->id, $response->json('organization_id'), 'El organization_id del cliente se tuvo en cuenta.');

        $this->assertDatabaseHas('users', [
            'username' => 'nuevo.usuario',
            'organization_id' => $this->own->id,
        ]);
    }

    public function test_creation_without_organization_id_also_lands_in_the_own_one(): void
    {
        $this->actingWithToken($this->token)
            ->postJson('/api/v1/users', $this->payload())
            ->assertCreated()
            ->assertJsonPath('organization_id', $this->own->id);
    }

    public function test_the_new_account_can_log_in_and_sees_the_own_organization(): void
    {
        $this->actingWithToken($this->token)
            ->postJson('/api/v1/users', $this->payload(['role' => 'org_admin']))
            ->assertCreated();

        $token = $this->postJson('/api/v1/login', ['login' => 'nuevo.usuario', 'password' => 'ClaveInicial123!'])
            ->assertOk()
            ->json('token');

        $this->actingWithToken($token)
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('organization.id', $this->own->id);
    }

    public function test_an_update_cannot_move_an_account_to_another_organization(): void
    {
        $user = $this->createUserFor($this->own, 'teacher');

        $this->actingWithToken($this->token)
            ->putJson("/api/v1/users/{$user->id}", ['organization_id' => $this->foreign->id])
            ->assertOk();

        $this->assertSame($this->own->id, $user->fresh()->organization_id);
    }

    public function test_org_admin_can_assign_only_the_roles_of_its_own_centre(): void
    {
        foreach (['org_admin', 'teacher'] as $role) {
            $this->actingWithToken($this->token)
                ->postJson('/api/v1/users', $this->payload([
                    'role' => $role,
                    'username' => 'usuario.'.$role,
                    'email' => $role.'@micentro.test',
                ]))
                ->assertCreated();
        }

        $this->assertSame(3, User::query()->where('organization_id', $this->own->id)->count());
    }

    public function test_a_teacher_profile_of_another_organization_cannot_be_linked(): void
    {
        $foreignProfile = $this->createTeacherProfile($this->foreign);

        $this->actingWithToken($this->token)
            ->postJson('/api/v1/users', $this->payload(['teacher_id' => $foreignProfile->id]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['teacher_id']);
    }

    /**
     * Regresión de una escalada de privilegios real.
     *
     * El alcance de plataforma se decidía por la **ausencia de organización** en
     * lugar de por el rol, así que un `org_admin` sin organización pasaba a operar
     * sobre toda la plataforma: veía las cuentas de todos los centros y podía
     * crear administradores `super_admin`.
     */
    public function test_an_org_admin_without_organization_gets_no_platform_scope(): void
    {
        $foreignUser = $this->createUserFor($this->foreign, 'org_admin');

        $orphan = $this->createUserFor($this->own, 'org_admin');
        $orphan->forceFill(['organization_id' => null])->save();
        $token = $this->tokenFor($orphan);

        // No se le trata como plataforma: se le cierra el paso (FR-010).
        $this->actingWithToken($token)->getJson('/api/v1/users')->assertForbidden();
        $this->actingWithToken($token)->getJson("/api/v1/users/{$foreignUser->id}")->assertForbidden();
        $this->actingWithToken($token)->deleteJson("/api/v1/users/{$foreignUser->id}")->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $foreignUser->id]);
    }

    public function test_an_org_admin_without_organization_cannot_mint_a_super_admin(): void
    {
        $orphan = $this->createUserFor($this->own, 'org_admin');
        $orphan->forceFill(['organization_id' => null])->save();

        $this->actingWithToken($this->tokenFor($orphan))
            ->postJson('/api/v1/users', $this->payload(['role' => 'super_admin', 'username' => 'escalada']))
            ->assertForbidden();

        $this->assertDatabaseMissing('users', ['username' => 'escalada']);
    }

    public function test_a_teacher_profile_of_the_own_organization_can_be_linked(): void
    {
        $profile = $this->createTeacherProfile($this->own);

        $userId = $this->actingWithToken($this->token)
            ->postJson('/api/v1/users', $this->payload(['teacher_id' => $profile->id]))
            ->assertCreated()
            ->json('id');

        $this->assertDatabaseHas('teachers', ['id' => $profile->id, 'user_id' => $userId]);
    }
}
