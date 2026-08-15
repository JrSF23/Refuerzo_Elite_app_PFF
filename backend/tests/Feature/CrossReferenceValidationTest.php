<?php

namespace Tests\Feature;

use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * FR-009 y escenario 4 de la historia P1.
 *
 * Este es el agujero que el global scope por sí solo NO tapa: `exists` de Laravel
 * consulta el query builder, no Eloquent, así que ignora los global scopes. Sin la
 * regla BelongsToCurrentOrganization, un alumno propio podría matricularse en un
 * grupo ajeno con el aislamiento aparentemente "funcionando".
 */
class CrossReferenceValidationTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $orgA;

    /** @var array<string, \Illuminate\Database\Eloquent\Model> */
    private array $dataA;

    /** @var array<string, \Illuminate\Database\Eloquent\Model> */
    private array $dataB;

    private string $tokenA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->orgA = $this->createOrganization(['name' => 'Centro A']);
        $orgB = $this->createOrganization(['name' => 'Centro B']);

        $this->dataA = $this->seedBusinessData($this->orgA);
        $this->dataB = $this->seedBusinessData($orgB);

        $this->tokenA = $this->tokenFor($this->createUserFor($this->orgA, 'org_admin'));
    }

    public function test_cannot_enroll_own_student_into_foreign_group(): void
    {
        $this->actingWithToken($this->tokenA)
            ->postJson('/api/v1/enrollments', [
                'student_id' => $this->dataA['students']->getKey(),
                'class_group_id' => $this->dataB['class-groups']->getKey(),
                'enrolled_at' => '2026-01-10',
                'monthly_fee' => 80,
                'status' => 'active',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['class_group_id']);

        $this->assertDatabaseMissing('enrollments', [
            'class_group_id' => $this->dataB['class-groups']->getKey(),
            'student_id' => $this->dataA['students']->getKey(),
        ]);
    }

    public function test_cannot_assign_foreign_guardian_to_own_student(): void
    {
        $this->actingWithToken($this->tokenA)
            ->postJson('/api/v1/students', [
                'first_name' => 'Ana',
                'last_name' => 'Pérez',
                'status' => 'active',
                'guardian_id' => $this->dataB['guardians']->getKey(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['guardian_id']);
    }

    public function test_cannot_record_attendance_on_foreign_session(): void
    {
        $this->actingWithToken($this->tokenA)
            ->postJson('/api/v1/attendances', [
                'class_session_id' => $this->dataB['class-sessions']->getKey(),
                'student_id' => $this->dataA['students']->getKey(),
                'status' => 'present',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['class_session_id']);
    }

    public function test_cannot_create_payment_with_foreign_enrollment(): void
    {
        $this->actingWithToken($this->tokenA)
            ->postJson('/api/v1/payments', [
                'student_id' => $this->dataA['students']->getKey(),
                'enrollment_id' => $this->dataB['enrollments']->getKey(),
                'amount' => 80,
                'period_label' => 'Enero 2026',
                'paid_at' => '2026-01-05',
                'payment_method' => 'cash',
                'status' => 'paid',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['enrollment_id']);
    }

    public function test_cannot_build_group_on_foreign_subject_or_teacher(): void
    {
        $this->actingWithToken($this->tokenA)
            ->postJson('/api/v1/class-groups', [
                'subject_id' => $this->dataB['subjects']->getKey(),
                'teacher_id' => $this->dataB['teachers']->getKey(),
                'name' => 'Grupo intruso',
                'code' => 'INT-1',
                'academic_year' => '2025-2026',
                'capacity' => 10,
                'status' => 'active',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subject_id', 'teacher_id']);
    }

    public function test_cannot_create_session_on_foreign_group(): void
    {
        $this->actingWithToken($this->tokenA)
            ->postJson('/api/v1/class-sessions', [
                'class_group_id' => $this->dataB['class-groups']->getKey(),
                'title' => 'Sesión intrusa',
                'session_date' => '2026-02-01',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['class_group_id']);
    }

    public function test_own_references_are_still_accepted(): void
    {
        $this->actingWithToken($this->tokenA)
            ->postJson('/api/v1/class-sessions', [
                'class_group_id' => $this->dataA['class-groups']->getKey(),
                'title' => 'Sesión legítima',
                'session_date' => '2026-02-01',
            ])
            ->assertCreated();
    }
}
