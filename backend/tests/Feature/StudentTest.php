<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

class StudentTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $organization;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();
        $this->organization = $this->createOrganization();
    }

    // Los alumnos se crean siempre con forOrganization(): la factory, si no se le
    // dice nada, se crea su propia organización y los datos dejarían de ser
    // comparables entre sí.

    private function actingAsAdmin(): static
    {
        $user = $this->createUserFor($this->organization, 'org_admin');

        return $this->withToken($this->tokenFor($user));
    }

    private function actingAsTeacher(): static
    {
        $user = $this->createUserFor($this->organization, 'teacher');

        return $this->withToken($this->tokenFor($user));
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
        Student::factory()->count(3)->forOrganization($this->organization)->create();

        $this->actingAsAdmin()
            ->getJson('/api/v1/students')
            ->assertOk()
            ->assertJsonStructure(['data', 'total', 'current_page']);
    }

    public function test_teacher_can_list_students(): void
    {
        Student::factory()->count(2)->forOrganization($this->organization)->create();

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
        Student::factory()->forOrganization($this->organization)->create(['first_name' => 'Beatriz', 'last_name' => 'Álvarez']);
        Student::factory()->forOrganization($this->organization)->create(['first_name' => 'Carlos',  'last_name' => 'Ruiz']);

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
        Student::factory()->forOrganization($this->organization)->create(['email' => 'duplicado@test.com']);

        $this->actingAsAdmin()
            ->postJson('/api/v1/students', $this->studentPayload(['email' => 'duplicado@test.com']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    // ── show ───────────────────────────────────────────────────────────────

    public function test_admin_can_view_student(): void
    {
        $student = Student::factory()->forOrganization($this->organization)->create();

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
        $student = Student::factory()->forOrganization($this->organization)->create(['status' => 'active']);

        $this->actingAsAdmin()
            ->putJson("/api/v1/students/{$student->id}", $this->studentPayload(['status' => 'inactive']))
            ->assertOk()
            ->assertJsonPath('status', 'inactive');
    }

    /**
     * Mover a un alumno de aula.
     *
     * La operación más corriente del curso —un alumno cambia de clase— devolvía
     * 404 y no movía nada. El filtro por `tutor_group_id` vivía en `query()`, que
     * usan también `show`, `update` y `destroy`, así que al editar se buscaba al
     * alumno filtrando por el aula de DESTINO, donde todavía no estaba.
     *
     * Lo insidioso era que editar funcionaba mientras NO se cambiara el aula: el
     * único cambio que fallaba era justo el que se quería hacer.
     */
    public function test_admin_can_move_a_student_to_another_tutor_group(): void
    {
        $origen = $this->createTutorGroup($this->organization);
        $destino = $this->createTutorGroup($this->organization);

        $student = Student::factory()->forOrganization($this->organization)->create([
            'tutor_group_id' => $origen->getKey(),
        ]);

        $this->actingAsAdmin()
            ->putJson("/api/v1/students/{$student->id}", $this->studentPayload([
                'tutor_group_id' => $destino->getKey(),
            ]))
            ->assertOk()
            ->assertJsonPath('tutor_group_id', $destino->getKey());

        $this->assertSame($destino->getKey(), $student->fresh()->tutor_group_id);
    }

    /**
     * El mismo fallo, en su forma de solo lectura: un parámetro de listado no
     * puede decidir si un registro concreto existe. Se comprueba aparte porque
     * `show` no lleva cuerpo, y sin esto la regresión podría volver por la
     * cadena de consulta sin que nada la delate.
     */
    public function test_a_listing_filter_does_not_hide_a_single_student(): void
    {
        $suya = $this->createTutorGroup($this->organization);
        $ajena = $this->createTutorGroup($this->organization);

        $student = Student::factory()->forOrganization($this->organization)->create([
            'tutor_group_id' => $suya->getKey(),
        ]);

        $this->actingAsAdmin()
            ->getJson("/api/v1/students/{$student->id}?tutor_group_id={$ajena->getKey()}")
            ->assertOk()
            ->assertJsonPath('id', $student->id);
    }

    // ── destroy ────────────────────────────────────────────────────────────

    public function test_admin_can_delete_student(): void
    {
        $student = Student::factory()->forOrganization($this->organization)->create();

        $this->actingAsAdmin()
            ->deleteJson("/api/v1/students/{$student->id}")
            ->assertOk();

        $this->assertSoftDeleted('students', ['id' => $student->id]);
    }

    public function test_teacher_cannot_delete_student(): void
    {
        $student = Student::factory()->forOrganization($this->organization)->create();

        $this->actingAsTeacher()
            ->deleteJson("/api/v1/students/{$student->id}")
            ->assertForbidden();
    }
}
