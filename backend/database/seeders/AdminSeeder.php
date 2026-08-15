<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // El rol `student` no se crea todavía: el alumno como usuario con acceso
        // propio está fuera del alcance del piloto.
        foreach (['super_admin', 'org_admin', 'teacher'] as $roleName) {
            Role::findOrCreate($roleName, 'web');
        }

        // Organización del centro actual, creada por M1.
        $organization = Organization::query()->orderBy('id')->firstOrFail();

        // ── Super administrador de plataforma ────────────────────────────────
        // Sin organización: gestiona organizaciones y cuentas, nunca datos de
        // negocio (FR-004, FR-013a).
        $superAdmin = User::query()->updateOrCreate(
            ['email' => 'superadmin@refuerzoelite.test'],
            [
                'name' => 'Super administrador de plataforma',
                'username' => 'superadmin',
                'password' => env('SUPER_ADMIN_PASSWORD', 'ChangeMe_Super123!'),
                'is_active' => true,
            ]
        );

        $superAdmin->forceFill(['organization_id' => null])->save();
        $superAdmin->syncRoles(['super_admin']);

        // ── Administrador de la organización del centro actual ───────────────
        $orgAdmin = User::query()->updateOrCreate(
            ['email' => 'admin@refuerzoelite.test'],
            [
                'name' => 'Administrador Refuerzo Elite',
                'username' => 'admin',
                'password' => env('ADMIN_PASSWORD', 'ChangeMe_Admin123!'),
                'is_active' => true,
            ]
        );

        $orgAdmin->forceFill(['organization_id' => $organization->getKey()])->save();
        $orgAdmin->syncRoles(['org_admin']);
    }
}
