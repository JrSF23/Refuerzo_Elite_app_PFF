<?php

namespace Tests\Feature;

use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * FR-006 y escenario 5 de la historia P1: el sistema ignora cualquier identificador
 * de organización enviado por el cliente y opera exclusivamente sobre la del usuario
 * autenticado. No es un error de permisos: el valor sencillamente no se usa.
 */
class ClientOrganizationIdIgnoredTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $orgA;

    private Organization $orgB;

    private string $tokenA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->orgA = $this->createOrganization(['name' => 'Centro A']);
        $this->orgB = $this->createOrganization(['name' => 'Centro B']);

        $this->tokenA = $this->tokenFor($this->createUserFor($this->orgA, 'org_admin'));
    }

    public function test_creation_ignores_a_foreign_organization_id_in_the_body(): void
    {
        $response = $this->actingWithToken($this->tokenA)
            ->postJson('/api/v1/students', [
                'first_name' => 'Ana',
                'last_name' => 'Pérez',
                'status' => 'active',
                'organization_id' => $this->orgB->getKey(),
            ])
            ->assertCreated();

        $this->assertSame($this->orgA->getKey(), $response->json('organization_id'));

        $this->assertDatabaseHas('students', [
            'id' => $response->json('id'),
            'organization_id' => $this->orgA->getKey(),
        ]);
    }

    public function test_update_cannot_move_a_record_to_another_organization(): void
    {
        $student = $this->createStudent($this->orgA);

        $this->actingWithToken($this->tokenA)
            ->putJson("/api/v1/students/{$student->getKey()}", [
                'first_name' => 'Ana',
                'last_name' => 'Pérez',
                'status' => 'active',
                'organization_id' => $this->orgB->getKey(),
            ])
            ->assertOk();

        $this->assertSame($this->orgA->getKey(), $student->fresh()->organization_id);
    }

    public function test_a_query_parameter_cannot_change_the_scope(): void
    {
        $foreign = $this->createStudent($this->orgB);

        $response = $this->actingWithToken($this->tokenA)
            ->getJson('/api/v1/students?organization_id='.$this->orgB->getKey())
            ->assertOk();

        $this->assertNotContains($foreign->getKey(), array_column($response->json('data'), 'id'));
    }
}
