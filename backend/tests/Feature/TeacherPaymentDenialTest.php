<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * FR-016: el profesor no accede a información de pagos en ninguna forma. Ni
 * siquiera a los de los alumnos de sus propios grupos.
 */
class TeacherPaymentDenialTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private string $token;

    private Payment $payment;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $organization = $this->createOrganization();

        $teacherUser = $this->createUserFor($organization, 'teacher');
        $profile = $this->createTeacherProfile($organization, $teacherUser);
        $this->token = $this->tokenFor($teacherUser);

        // El pago es de un alumno de SU propio grupo: ni así debe verlo.
        $group = $this->createClassGroup($organization, ['teacher_id' => $profile->getKey()]);
        $student = $this->createStudent($organization);
        $this->createEnrollment($organization, $student, $group);
        $this->payment = $this->createPayment($organization, $student);
    }

    public function test_teacher_cannot_list_payments(): void
    {
        $this->actingWithToken($this->token)->getJson('/api/v1/payments')->assertForbidden();
    }

    public function test_teacher_cannot_read_a_payment(): void
    {
        $this->actingWithToken($this->token)
            ->getJson("/api/v1/payments/{$this->payment->getKey()}")
            ->assertForbidden();
    }

    public function test_teacher_cannot_create_a_payment(): void
    {
        $this->actingWithToken($this->token)
            ->postJson('/api/v1/payments', [])
            ->assertForbidden();
    }

    public function test_teacher_cannot_update_a_payment(): void
    {
        $this->actingWithToken($this->token)
            ->putJson("/api/v1/payments/{$this->payment->getKey()}", ['amount' => 1])
            ->assertForbidden();

        $this->assertSame('80.00', $this->payment->fresh()->amount);
    }

    public function test_teacher_cannot_delete_a_payment(): void
    {
        $this->actingWithToken($this->token)
            ->deleteJson("/api/v1/payments/{$this->payment->getKey()}")
            ->assertForbidden();

        $this->assertNotNull($this->payment->fresh());
    }

    public function test_the_teacher_dashboard_carries_no_financial_figure(): void
    {
        $response = $this->actingWithToken($this->token)
            ->getJson('/api/v1/dashboard')
            ->assertOk();

        $body = json_encode($response->json());

        $this->assertStringNotContainsString('payment', strtolower($body));
        $this->assertArrayNotHasKey('payments', $response->json('stats'));
    }
}
