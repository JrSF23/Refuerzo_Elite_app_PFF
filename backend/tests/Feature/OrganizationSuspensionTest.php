<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * FR-011 y FR-021.
 *
 * `deleted_at` y `status` son condiciones INDEPENDIENTES para conceder acceso:
 * ninguna suple a la otra. Este test las prueba por separado y comprueba que en
 * ambos casos los datos permanecen íntegros y recuperables.
 *
 * El corte es por petición, sin revocar tokens: la organización se resuelve de
 * nuevo en cada una (D11).
 */
class OrganizationSuspensionTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $organization;

    private User $orgAdmin;

    private string $orgToken;

    private string $superToken;

    /**
     * Las nueve entidades de negocio propiamente dichas.
     *
     * `audit_events` queda fuera a propósito: suspender y borrar SÍ dejan traza,
     * así que su recuento debe crecer. Que crezca se comprueba aparte.
     *
     * @var list<string>
     */
    private const BUSINESS_TABLES = [
        'guardians', 'teachers', 'subjects', 'students', 'class_groups',
        'class_sessions', 'enrollments', 'attendances', 'payments',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->organization = $this->createOrganization(['name' => 'Centro Piloto']);
        $this->seedBusinessData($this->organization);

        $this->orgAdmin = $this->createUserFor($this->organization, 'org_admin');
        $this->orgToken = $this->tokenFor($this->orgAdmin);
        $this->superToken = $this->tokenFor($this->createSuperAdmin());
    }

    /**
     * @return array<string, int>
     */
    private function businessCounts(): array
    {
        $counts = [];

        foreach (self::BUSINESS_TABLES as $table) {
            $counts[$table] = DB::table($table)->count();
        }

        return $counts;
    }

    private function suspend(): void
    {
        $this->actingWithToken($this->superToken)
            ->postJson("/api/v1/organizations/{$this->organization->id}/suspend")
            ->assertOk();
    }

    // ── (a) Suspensión ─────────────────────────────────────────────────────

    public function test_suspending_cuts_access_on_the_next_request_without_revoking_tokens(): void
    {
        $this->actingWithToken($this->orgToken)->getJson('/api/v1/students')->assertOk();

        $this->suspend();

        // El mismo token de antes: no se ha revocado nada, la comprobación es por
        // petición.
        $this->actingWithToken($this->orgToken)->getJson('/api/v1/students')->assertForbidden();

        $this->assertDatabaseHas('personal_access_tokens', ['tokenable_id' => $this->orgAdmin->id]);
    }

    public function test_suspending_is_idempotent(): void
    {
        $this->suspend();

        $this->actingWithToken($this->superToken)
            ->postJson("/api/v1/organizations/{$this->organization->id}/suspend")
            ->assertOk()
            ->assertJsonPath('status', 'suspended');
    }

    public function test_activating_restores_access(): void
    {
        $this->suspend();
        $this->actingWithToken($this->orgToken)->getJson('/api/v1/students')->assertForbidden();

        $this->actingWithToken($this->superToken)
            ->postJson("/api/v1/organizations/{$this->organization->id}/activate")
            ->assertOk()
            ->assertJsonPath('status', 'active');

        $this->actingWithToken($this->orgToken)->getJson('/api/v1/students')->assertOk();
    }

    public function test_activating_is_idempotent(): void
    {
        $this->actingWithToken($this->superToken)
            ->postJson("/api/v1/organizations/{$this->organization->id}/activate")
            ->assertOk()
            ->assertJsonPath('status', 'active');
    }

    // ── (b) Borrado lógico, independiente del estado ───────────────────────

    public function test_soft_deleted_organization_cuts_access_even_while_status_is_active(): void
    {
        // Se borra por la vía del producto y después se fuerza status = active en
        // base de datos: es el caso que demuestra que las dos condiciones son
        // independientes y que ninguna suple a la otra.
        $this->suspend();
        $this->actingWithToken($this->superToken)
            ->deleteJson("/api/v1/organizations/{$this->organization->id}")
            ->assertOk();

        DB::table('organizations')->where('id', $this->organization->id)->update(['status' => 'active']);

        $this->assertSame('active', DB::table('organizations')->where('id', $this->organization->id)->value('status'));
        $this->assertNotNull(DB::table('organizations')->where('id', $this->organization->id)->value('deleted_at'));

        $this->actingWithToken($this->orgToken)->getJson('/api/v1/students')->assertForbidden();
    }

    public function test_restoring_a_soft_deleted_organization_returns_access(): void
    {
        $this->suspend();
        $this->actingWithToken($this->superToken)
            ->deleteJson("/api/v1/organizations/{$this->organization->id}")
            ->assertOk();

        DB::table('organizations')
            ->where('id', $this->organization->id)
            ->update(['deleted_at' => null, 'status' => 'active']);

        $this->actingWithToken($this->orgToken)->getJson('/api/v1/students')->assertOk();
    }

    // ── (c) Integridad de los datos ────────────────────────────────────────

    public function test_neither_suspension_nor_soft_delete_touches_the_business_data(): void
    {
        $before = $this->businessCounts();

        $this->suspend();
        $this->assertSame($before, $this->businessCounts(), 'La suspensión alteró datos de negocio.');

        $this->actingWithToken($this->superToken)
            ->deleteJson("/api/v1/organizations/{$this->organization->id}")
            ->assertOk();

        $this->assertSame($before, $this->businessCounts(), 'El borrado lógico se propagó a los datos de negocio.');
    }

    public function test_business_data_remains_recoverable_after_restoring(): void
    {
        $before = $this->businessCounts();

        $this->suspend();
        $this->actingWithToken($this->superToken)
            ->deleteJson("/api/v1/organizations/{$this->organization->id}")
            ->assertOk();

        DB::table('organizations')
            ->where('id', $this->organization->id)
            ->update(['deleted_at' => null, 'status' => 'active']);

        $this->assertSame($before, $this->businessCounts());

        // Y el administrador vuelve a ver sus alumnos.
        $this->actingWithToken($this->orgToken)
            ->getJson('/api/v1/students')
            ->assertOk()
            ->assertJsonPath('total', 1);
    }

    // ── Autorización ───────────────────────────────────────────────────────

    public function test_suspending_and_deleting_leave_an_audit_trail(): void
    {
        $before = DB::table('audit_events')->count();

        $this->suspend();

        $this->actingWithToken($this->superToken)
            ->deleteJson("/api/v1/organizations/{$this->organization->id}")
            ->assertOk();

        $this->assertGreaterThan($before, DB::table('audit_events')->count(), 'La suspensión y el borrado no dejaron traza.');

        // El evento se atribuye a la organización afectada: el super administrador
        // no pertenece a ninguna y la columna es obligatoria.
        $this->assertDatabaseHas('audit_events', [
            'organization_id' => $this->organization->id,
            'entity_type' => 'organization',
            'action' => 'suspended',
        ]);
    }

    public function test_only_the_super_admin_can_suspend_or_activate(): void
    {
        $this->actingWithToken($this->orgToken)
            ->postJson("/api/v1/organizations/{$this->organization->id}/suspend")
            ->assertForbidden();

        $this->actingWithToken($this->orgToken)
            ->postJson("/api/v1/organizations/{$this->organization->id}/activate")
            ->assertForbidden();
    }
}
