<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['admin', 'teacher', 'student'] as $roleName) {
            Role::findOrCreate($roleName, 'web');
        }

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@refuerzoelite.test'],
            [
                'name' => 'Administrador Refuerzo Elite',
                'username' => 'admin',
                'password' => env('ADMIN_PASSWORD', 'ChangeMe_Admin123!'),
                'is_active' => true,
            ]
        );

        $admin->syncRoles(['admin']);
    }
}
