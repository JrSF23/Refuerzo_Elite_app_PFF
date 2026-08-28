<?php

namespace Tests\Feature;

use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * FR-019, FR-020 y SC-006: los identificadores que hoy son únicos en todo el
 * sistema pasan a serlo dentro de cada organización. Dos centros pueden usar
 * "MAT-1" a la vez, y el error de duplicado no revela datos ajenos.
 */
class UniquePerOrganizationTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $orgA;

    private Organization $orgB;

    private string $tokenA;

    private string $tokenB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->orgA = $this->createOrganization(['name' => 'Centro A']);
        $this->orgB = $this->createOrganization(['name' => 'Centro B']);

        $this->tokenA = $this->tokenFor($this->createUserFor($this->orgA, 'org_admin'));
        $this->tokenB = $this->tokenFor($this->createUserFor($this->orgB, 'org_admin'));
    }

    public function test_two_organizations_can_use_the_same_subject_code(): void
    {
        $payload = ['name' => 'Matemáticas', 'code' => 'MAT-1'];

        $this->actingWithToken($this->tokenA)->postJson('/api/v1/subjects', $payload)->assertCreated();
        $this->actingWithToken($this->tokenB)->postJson('/api/v1/subjects', $payload)->assertCreated();

        $this->assertDatabaseCount('subjects', 2);
    }

    public function test_two_organizations_can_use_the_same_group_code(): void
    {
        $subjectA = $this->createSubject($this->orgA);
        $subjectB = $this->createSubject($this->orgB);

        $base = [
            'name' => 'Grupo A',
            'code' => 'MAT-A',
            'academic_year' => '2025-2026',
            'capacity' => 10,
            'status' => 'active',
        ];

        $this->actingWithToken($this->tokenA)
            ->postJson('/api/v1/class-groups', $base + ['subject_id' => $subjectA->getKey()])
            ->assertCreated();

        $this->actingWithToken($this->tokenB)
            ->postJson('/api/v1/class-groups', $base + ['subject_id' => $subjectB->getKey()])
            ->assertCreated();
    }

    public function test_two_organizations_can_register_people_with_the_same_email(): void
    {
        $student = ['first_name' => 'Ana', 'last_name' => 'Pérez', 'status' => 'active', 'email' => 'ana@example.test'];
        $guardian = ['first_name' => 'Rosa', 'last_name' => 'Pérez', 'phone' => '600111222', 'relationship_label' => 'Madre', 'email' => 'rosa@example.test'];
        $teacher = ['first_name' => 'Luis', 'last_name' => 'Gómez', 'email' => 'luis@example.test'];

        foreach ([$this->tokenA, $this->tokenB] as $token) {
            $this->actingWithToken($token)->postJson('/api/v1/students', $student)->assertCreated();
            $this->actingWithToken($token)->postJson('/api/v1/guardians', $guardian)->assertCreated();
            $this->actingWithToken($token)->postJson('/api/v1/teachers', $teacher)->assertCreated();
        }

        $this->assertDatabaseCount('students', 2);
        $this->assertDatabaseCount('guardians', 2);
        $this->assertDatabaseCount('teachers', 2);
    }

    public function test_duplicate_within_the_same_organization_is_still_rejected(): void
    {
        $payload = ['name' => 'Matemáticas', 'code' => 'MAT-1'];

        $this->actingWithToken($this->tokenA)->postJson('/api/v1/subjects', $payload)->assertCreated();

        $this->actingWithToken($this->tokenA)
            ->postJson('/api/v1/subjects', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    /**
     * FR-020: el mensaje de duplicado no debe permitir deducir que el valor existe
     * en otra organización. Si el código ajeno se acepta sin más, no hay filtración.
     */
    public function test_duplicate_message_does_not_leak_other_organizations(): void
    {
        $this->actingWithToken($this->tokenB)
            ->postJson('/api/v1/subjects', ['name' => 'Secreta', 'code' => 'SECRET-B'])
            ->assertCreated();

        // Para A ese código está libre: no hay error, luego nada que filtrar.
        $this->actingWithToken($this->tokenA)
            ->postJson('/api/v1/subjects', ['name' => 'Mía', 'code' => 'SECRET-B'])
            ->assertCreated();
    }

    public function test_user_email_remains_globally_unique(): void
    {
        // Consecuencia de Q1: una persona en dos centros necesita dos correos
        // distintos, porque la cuenta pertenece a una sola organización.
        $this->assertDatabaseCount('users', 2);

        $this->expectException(\Illuminate\Database\QueryException::class);

        $this->createUserFor($this->orgB, 'org_admin', [
            'email' => \App\Models\User::query()->where('organization_id', $this->orgA->getKey())->value('email'),
        ]);
    }
}
