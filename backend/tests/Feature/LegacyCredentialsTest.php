<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * FR-023 y SC-005: tras la migración, el personal del centro sigue entrando con
 * las credenciales de siempre y ve el mismo conjunto de datos. La transformación
 * no debe notarse en su forma de trabajar.
 *
 * Igual que MigrationBackfillTest, usa DatabaseMigrations para ejecutar la cadena
 * de migraciones fuera de una transacción envolvente.
 */
class LegacyCredentialsTest extends TestCase
{
    use DatabaseMigrations;

    private function seedLegacyAdminWithData(): void
    {
        $now = now();

        DB::table('roles')->insert([
            ['name' => 'admin', 'guard_name' => 'web', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'teacher', 'guard_name' => 'web', 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('users')->insert([
            'name' => 'Administración del centro',
            'username' => 'admin',
            'email' => 'admin@legacy.test',
            'password' => Hash::make('MiClaveDeSiempre123'),
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('model_has_roles')->insert([
            'role_id' => DB::table('roles')->where('name', 'admin')->value('id'),
            'model_type' => 'App\Models\User',
            'model_id' => DB::table('users')->where('username', 'admin')->value('id'),
        ]);

        DB::table('guardians')->insert(['first_name' => 'Rosa', 'last_name' => 'Fernández', 'phone' => '600111222', 'relationship_label' => 'Madre', 'created_at' => $now, 'updated_at' => $now]);
        $guardianId = DB::table('guardians')->value('id');

        foreach (['Lucía', 'Alejandro', 'Sofía'] as $name) {
            DB::table('students')->insert([
                'guardian_id' => $guardianId,
                'first_name' => $name,
                'last_name' => 'Fernández',
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    private function migrateToMultiTenant(): void
    {
        $this->artisan('migrate:rollback', ['--step' => 5, '--force' => true])->assertSuccessful();
        $this->seedLegacyAdminWithData();
        $this->artisan('migrate', ['--force' => true])->assertSuccessful();
    }

    public function test_existing_user_logs_in_with_the_same_credentials(): void
    {
        $this->migrateToMultiTenant();

        $this->postJson('/api/v1/login', ['login' => 'admin', 'password' => 'MiClaveDeSiempre123'])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'email', 'roles']]);
    }

    public function test_existing_user_can_also_log_in_with_email(): void
    {
        $this->migrateToMultiTenant();

        $this->postJson('/api/v1/login', ['login' => 'admin@legacy.test', 'password' => 'MiClaveDeSiempre123'])
            ->assertOk();
    }

    public function test_the_renamed_role_still_grants_access(): void
    {
        $this->migrateToMultiTenant();

        $response = $this->postJson('/api/v1/login', ['login' => 'admin', 'password' => 'MiClaveDeSiempre123'])
            ->assertOk();

        $this->assertSame('org_admin', $response->json('user.roles.0.name'));
    }

    public function test_existing_user_sees_the_same_data_as_before(): void
    {
        $this->migrateToMultiTenant();

        $studentsBefore = DB::table('students')->count();

        $token = $this->postJson('/api/v1/login', ['login' => 'admin', 'password' => 'MiClaveDeSiempre123'])
            ->json('token');

        $response = $this->withToken($token)->getJson('/api/v1/students')->assertOk();

        $this->assertSame($studentsBefore, $response->json('total'), 'El usuario migrado dejó de ver parte de sus alumnos.');
    }

    public function test_migrated_user_belongs_to_the_organization_of_the_school(): void
    {
        $this->migrateToMultiTenant();

        $token = $this->postJson('/api/v1/login', ['login' => 'admin', 'password' => 'MiClaveDeSiempre123'])
            ->json('token');

        $organizationId = DB::table('organizations')->value('id');

        $this->withToken($token)
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('organization.id', $organizationId)
            ->assertJsonPath('organization.status', 'active');
    }
}
