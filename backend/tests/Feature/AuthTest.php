<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'teacher', 'student'] as $role) {
            Role::findOrCreate($role, 'web');
        }
    }

    private function makeAdmin(array $overrides = []): User
    {
        $user = User::factory()->create(array_merge(['is_active' => true], $overrides));
        $user->assignRole('admin');

        return $user;
    }

    private function makeTeacher(array $overrides = []): User
    {
        $user = User::factory()->create(array_merge(['is_active' => true], $overrides));
        $user->assignRole('teacher');

        return $user;
    }

    // ── Login ──────────────────────────────────────────────────────────────

    public function test_admin_can_login_with_email(): void
    {
        $admin = $this->makeAdmin(['password' => 'secret123']);

        $this->postJson('/api/v1/login', ['login' => $admin->email, 'password' => 'secret123'])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'email', 'roles']]);
    }

    public function test_admin_can_login_with_username(): void
    {
        $admin = $this->makeAdmin(['password' => 'secret123']);

        $this->postJson('/api/v1/login', ['login' => $admin->username, 'password' => 'secret123'])
            ->assertOk()
            ->assertJsonStructure(['token']);
    }

    public function test_teacher_can_login(): void
    {
        $teacher = $this->makeTeacher(['password' => 'secret123']);

        $this->postJson('/api/v1/login', ['login' => $teacher->email, 'password' => 'secret123'])
            ->assertOk()
            ->assertJsonPath('user.roles.0.name', 'teacher');
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $admin = $this->makeAdmin();

        $this->postJson('/api/v1/login', ['login' => $admin->email, 'password' => 'wrong'])
            ->assertStatus(422);
    }

    public function test_login_fails_for_inactive_user(): void
    {
        $user = User::factory()->create(['is_active' => false, 'password' => 'secret123']);
        $user->assignRole('admin');

        $this->postJson('/api/v1/login', ['login' => $user->email, 'password' => 'secret123'])
            ->assertStatus(422);
    }

    public function test_login_forbidden_for_student_role(): void
    {
        $user = User::factory()->create(['is_active' => true, 'password' => 'secret123']);
        $user->assignRole('student');

        $this->postJson('/api/v1/login', ['login' => $user->email, 'password' => 'secret123'])
            ->assertStatus(403);
    }

    public function test_login_requires_login_and_password_fields(): void
    {
        $this->postJson('/api/v1/login', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['login', 'password']);
    }

    // ── /me ────────────────────────────────────────────────────────────────

    public function test_me_returns_authenticated_user(): void
    {
        $admin = $this->makeAdmin();
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('id', $admin->id);
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }

    // ── Logout ─────────────────────────────────────────────────────────────

    public function test_logout_invalidates_token(): void
    {
        $admin = $this->makeAdmin();
        $result = $admin->createToken('test');
        $tokenId = $result->accessToken->id;

        $this->withToken($result->plainTextToken)->postJson('/api/v1/logout')->assertOk();

        // The token record must be removed from the database
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);
    }
}
