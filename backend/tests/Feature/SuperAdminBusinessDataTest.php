<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * FR-013a y FR-013b: el super administrador gestiona organizaciones y cuentas,
 * pero NO alcanza los datos de negocio de ninguna organización. La denegación es
 * explícita (403), no una lista vacía que parezca un error.
 */
class SuperAdminBusinessDataTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $organization = $this->createOrganization();
        $this->seedBusinessData($organization);

        $this->token = $this->tokenFor($this->createSuperAdmin());
    }

    /**
     * @return array<string, array{0: string}>
     */
    public static function businessResources(): array
    {
        return [
            'guardians' => ['guardians'],
            'teachers' => ['teachers'],
            'subjects' => ['subjects'],
            'students' => ['students'],
            'class groups' => ['class-groups'],
            'class sessions' => ['class-sessions'],
            'enrollments' => ['enrollments'],
            'attendances' => ['attendances'],
            'payments' => ['payments'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('businessResources')]
    public function test_super_admin_cannot_list_business_data(string $resource): void
    {
        $this->actingWithToken($this->token)
            ->getJson("/api/v1/{$resource}")
            ->assertForbidden();
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('businessResources')]
    public function test_super_admin_cannot_write_business_data(string $resource): void
    {
        $this->actingWithToken($this->token)
            ->postJson("/api/v1/{$resource}", [])
            ->assertForbidden();
    }

    public function test_super_admin_cannot_reach_the_dashboard(): void
    {
        $this->actingWithToken($this->token)
            ->getJson('/api/v1/dashboard')
            ->assertForbidden();
    }

    public function test_super_admin_can_still_authenticate_and_read_its_own_profile(): void
    {
        $this->actingWithToken($this->token)
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('organization', null);
    }
}
