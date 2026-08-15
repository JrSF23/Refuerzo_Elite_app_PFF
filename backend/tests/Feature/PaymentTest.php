<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $organization;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();
        $this->organization = $this->createOrganization();
    }

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

    private function createEnrolledStudent(): array
    {
        $guardian = $this->createGuardian($this->organization);
        $student = $this->createStudent($this->organization, [
            'guardian_id' => $guardian->id,
            'status' => 'active',
        ]);
        $group = $this->createClassGroup($this->organization);
        $enrollment = $this->createEnrollment($this->organization, $student, $group);

        return compact('guardian', 'student', 'enrollment');
    }

    private function basePayload(array $data): array
    {
        return array_merge([
            'amount'         => 80.00,
            'period_label'   => 'Enero 2026',
            'paid_at'        => '2026-01-05',
            'payment_method' => 'cash',
            'status'         => 'paid',
        ], $data);
    }

    // ── Access control ─────────────────────────────────────────────────────

    public function test_admin_can_list_payments(): void
    {
        $this->actingAsAdmin()
            ->getJson('/api/v1/payments')
            ->assertOk()
            ->assertJsonStructure(['data', 'total']);
    }

    public function test_teacher_cannot_access_payments(): void
    {
        $this->actingAsTeacher()
            ->getJson('/api/v1/payments')
            ->assertForbidden();
    }

    public function test_unauthenticated_cannot_access_payments(): void
    {
        $this->getJson('/api/v1/payments')->assertUnauthorized();
    }

    // ── store ──────────────────────────────────────────────────────────────

    public function test_admin_can_create_payment(): void
    {
        ['student' => $student, 'enrollment' => $enrollment] = $this->createEnrolledStudent();

        $this->actingAsAdmin()
            ->postJson('/api/v1/payments', $this->basePayload([
                'student_id'    => $student->id,
                'enrollment_id' => $enrollment->id,
            ]))
            ->assertCreated()
            ->assertJsonPath('amount', '80.00');

        $this->assertDatabaseHas('payments', ['student_id' => $student->id, 'period_label' => 'Enero 2026']);
    }

    public function test_create_payment_fails_if_enrollment_belongs_to_different_student(): void
    {
        ['student' => $student1, 'enrollment' => $enrollment1] = $this->createEnrolledStudent();
        ['student' => $student2] = $this->createEnrolledStudent();

        $this->actingAsAdmin()
            ->postJson('/api/v1/payments', $this->basePayload([
                'student_id'    => $student2->id,
                'enrollment_id' => $enrollment1->id, // belongs to student1
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['enrollment_id']);
    }

    public function test_create_payment_rejects_invalid_payment_method(): void
    {
        ['student' => $student] = $this->createEnrolledStudent();

        $this->actingAsAdmin()
            ->postJson('/api/v1/payments', $this->basePayload([
                'student_id'     => $student->id,
                'payment_method' => 'bitcoin',
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['payment_method']);
    }

    public function test_create_payment_rejects_invalid_status(): void
    {
        ['student' => $student] = $this->createEnrolledStudent();

        $this->actingAsAdmin()
            ->postJson('/api/v1/payments', $this->basePayload([
                'student_id' => $student->id,
                'status'     => 'refunded',
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_create_payment_requires_mandatory_fields(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/v1/payments', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['student_id', 'amount', 'period_label', 'paid_at', 'payment_method', 'status']);
    }

    public function test_create_payment_without_enrollment_is_allowed(): void
    {
        ['student' => $student] = $this->createEnrolledStudent();

        $this->actingAsAdmin()
            ->postJson('/api/v1/payments', $this->basePayload([
                'student_id' => $student->id,
            ]))
            ->assertCreated();
    }

    // ── destroy ────────────────────────────────────────────────────────────

    public function test_admin_can_delete_payment(): void
    {
        ['student' => $student, 'enrollment' => $enrollment] = $this->createEnrolledStudent();

        $payment = Payment::forceCreate([
            'organization_id' => $this->organization->id,
            'student_id'     => $student->id,
            'enrollment_id'  => $enrollment->id,
            'amount'         => 80,
            'period_label'   => 'Enero 2026',
            'paid_at'        => '2026-01-05',
            'payment_method' => 'cash',
            'status'         => 'paid',
        ]);

        $this->actingAsAdmin()
            ->deleteJson("/api/v1/payments/{$payment->id}")
            ->assertOk();

        $this->assertSoftDeleted('payments', ['id' => $payment->id]);
    }
}
