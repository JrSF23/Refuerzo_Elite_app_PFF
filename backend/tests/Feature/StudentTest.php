<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StudentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'teacher', 'student'] as $role) {
            Role::findOrCreate($role, 'web');
        }
    }

    private function actingAsAdmin(): static
    {
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('admin');

        return $this->withToken($user->createToken('test')->plainTextToken);
    }

    private function actingAsTeacher(): static
    {
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('teacher');

        return $this->withToken($user->createToken('test')->plainTextToken);
    }

    private function studentPayload(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Ana',
            'last_name'  => 'Pérez',
            'status'     => 'active',
        ], $overrides);
    }

    // ── index ──────────────────────────────────────────────────────────────

    public function test_admin_can_list_students(): void
    {
        Student::factory()->count(3)->create();

        $this->actingAsAdmin()
            ->getJson('/api/v1/students')
            ->assertOk()
            ->assertJsonStructure(['data', 'total', 'current_page']);
    }

    public function test_teacher_can_list_students(): void
    {
        Student::factory()->count(2)->create();

        $this->actingAsTeacher()
            ->getJson('/api/v1/students')
            ->assertOk();
    }

    public function test_unauthenticated_cannot_list_students(): void
    {
        $this->getJson('/api/v1/students')->assertUnauthorized();
    }

    public function test_list_supports_search(): void
    {
        Student::factory()->create(['first_name' => 'Beatriz', 'last_name' => 'Álvarez']);
        Student::factory()->create(['first_name' => 'Carlos',  'last_name' => 'Ruiz']);

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/students?search=beatriz')
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Beatriz', $response->json('data.0.first_name'));
    }

    // ── store ──────────────────────────────────────────────────────────────

    public function test_admin_can_create_student(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/v1/students', $this->studentPayload())
            ->assertCreated()
            ->assertJsonPath('first_name', 'Ana');

        $this->assertDatabaseHas('students', ['first_name' => 'Ana', 'last_name' => 'Pérez']);
    }

    public function test_teacher_cannot_create_student(): void
    {
        $this->actingAsTeacher()
            ->postJson('/api/v1/students', $this->studentPayload())
            ->assertForbidden();
    }

    public function test_create_student_fails_without_required_fields(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/v1/students', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['first_name', 'last_name', 'status']);
    }

    public function test_create_student_rejects_invalid_status(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/v1/students', $this->studentPayload(['status' => 'unknown_value']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_create_student_rejects_duplicate_email(): void
    {
        Student::factory()->create(['email' => 'duplicado@test.com']);

        $this->actingAsAdmin()
            ->postJson('/api/v1/students', $this->studentPayload(['email' => 'duplicado@test.com']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    // ── show ───────────────────────────────────────────────────────────────

    public function test_admin_can_view_student(): void
    {
        $student = Student::factory()->create();

        $this->actingAsAdmin()
            ->getJson("/api/v1/students/{$student->id}")
            ->assertOk()
            ->assertJsonPath('id', $student->id);
    }

    public function test_show_returns_404_for_missing_student(): void
    {
        $this->actingAsAdmin()
            ->getJson('/api/v1/students/99999')
            ->assertNotFound();
    }

    // ── update ─────────────────────────────────────────────────────────────

    public function test_admin_can_update_student(): void
    {
        $student = Student::factory()->create(['status' => 'active']);

        $this->actingAsAdmin()
            ->putJson("/api/v1/students/{$student->id}", $this->studentPayload(['status' => 'inactive']))
            ->assertOk()
            ->assertJsonPath('status', 'inactive');
    }

    // ── destroy ────────────────────────────────────────────────────────────

    public function test_admin_can_delete_student(): void
    {
        $student = Student::factory()->create();

        $this->actingAsAdmin()
            ->deleteJson("/api/v1/students/{$student->id}")
            ->assertOk();

        $this->assertSoftDeleted('students', ['id' => $student->id]);
    }

    public function test_teacher_cannot_delete_student(): void
    {
        $student = Student::factory()->create();

        $this->actingAsTeacher()
            ->deleteJson("/api/v1/students/{$student->id}")
            ->assertForbidden();
    }
}
