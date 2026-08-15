<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * FR-021: un registro eliminado lógicamente sigue perteneciendo a su organización
 * y no se vuelve visible para otra. Ni siquiera con withTrashed().
 */
class SoftDeleteIsolationTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $orgA;

    private Organization $orgB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->orgA = $this->createOrganization(['name' => 'Centro A']);
        $this->orgB = $this->createOrganization(['name' => 'Centro B']);
    }

    public function test_soft_deleted_record_keeps_its_organization(): void
    {
        $student = $this->createStudent($this->orgB);
        $student->delete();

        $this->assertSoftDeleted('students', [
            'id' => $student->getKey(),
            'organization_id' => $this->orgB->getKey(),
        ]);
    }

    public function test_soft_deleted_foreign_record_is_not_visible_from_another_organization(): void
    {
        $foreign = $this->createStudent($this->orgB);
        $foreign->delete();

        $tokenA = $this->tokenFor($this->createUserFor($this->orgA, 'org_admin'));

        $this->actingWithToken($tokenA)
            ->getJson("/api/v1/students/{$foreign->getKey()}")
            ->assertNotFound();
    }

    public function test_with_trashed_does_not_bypass_the_organization_scope(): void
    {
        $own = $this->createStudent($this->orgA);
        $foreign = $this->createStudent($this->orgB);

        $own->delete();
        $foreign->delete();

        $this->withOrganizationContext($this->orgA, function () use ($own, $foreign): void {
            $ids = Student::withTrashed()->pluck('id')->all();

            $this->assertContains($own->getKey(), $ids);
            $this->assertNotContains($foreign->getKey(), $ids, 'withTrashed() saltó el filtro de organización.');
        });
    }

    public function test_restoring_does_not_move_a_record_between_organizations(): void
    {
        $student = $this->createStudent($this->orgB);
        $student->delete();
        $student->restore();

        $this->assertSame($this->orgB->getKey(), $student->fresh()->organization_id);
    }
}
