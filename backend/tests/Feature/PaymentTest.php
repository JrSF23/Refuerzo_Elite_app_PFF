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

    // ── Filtro por estado ──────────────────────────────────────────────────

    private function createPaymentWithStatus(string $status): Payment
    {
        ['student' => $student, 'enrollment' => $enrollment] = $this->createEnrolledStudent();

        return Payment::forceCreate([
            'organization_id' => $this->organization->id,
            'student_id'      => $student->id,
            'enrollment_id'   => $enrollment->id,
            'amount'          => 80,
            'period_label'    => 'Enero 2026',
            'paid_at'         => '2026-01-05',
            'payment_method'  => 'cash',
            'status'          => $status,
        ]);
    }

    public function test_index_can_be_narrowed_to_pending_payments(): void
    {
        $pending = $this->createPaymentWithStatus('pending');
        $this->createPaymentWithStatus('paid');

        $response = $this->actingAsAdmin()
            ->getJson('/api/v1/payments?status=pending')
            ->assertOk();

        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $pending->id);
        $response->assertJsonPath('data.0.status', 'pending');
    }

    /**
     * Un estado inexistente NO puede devolver el listado entero.
     *
     * Es el fallo silencioso que importa: quien pidió acotar creería estar
     * viendo todos los pendientes y estaría mirando también los cobrados.
     */
    public function test_an_unknown_status_returns_no_rows_instead_of_the_whole_list(): void
    {
        $this->createPaymentWithStatus('pending');
        $this->createPaymentWithStatus('paid');

        $this->actingAsAdmin()
            ->getJson('/api/v1/payments?status=inventado')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_without_the_parameter_the_list_is_not_narrowed(): void
    {
        $this->createPaymentWithStatus('pending');
        $this->createPaymentWithStatus('paid');

        $this->actingAsAdmin()
            ->getJson('/api/v1/payments')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    /**
     * La trampa que este proyecto ya ha pisado tres veces.
     *
     * `status` es un campo EDITABLE, así que viaja en el cuerpo de cada edición.
     * Si el filtro viviera en `query()`, marcar como pagado un pago pendiente lo
     * buscaría entre los pagados —donde todavía no está— y devolvería 404.
     */
    public function test_a_pending_payment_can_be_marked_as_paid(): void
    {
        $payment = $this->createPaymentWithStatus('pending');

        $this->actingAsAdmin()
            ->putJson("/api/v1/payments/{$payment->id}", $this->basePayload([
                'student_id'    => $payment->student_id,
                'enrollment_id' => $payment->enrollment_id,
                'status'        => 'paid',
            ]))
            ->assertOk()
            ->assertJsonPath('status', 'paid');

        $this->assertDatabaseHas('payments', ['id' => $payment->id, 'status' => 'paid']);
    }
}
