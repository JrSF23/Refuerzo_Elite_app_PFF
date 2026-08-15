<?php

namespace Tests\Feature;

use App\Models\AuditEvent;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * La batería A/B que exigen FR-024 y FR-025, y que el Principio V declara no
 * negociable: un usuario del Centro A no puede leer, crear, modificar ni borrar
 * nada del Centro B, ni siquiera conociendo los identificadores exactos.
 *
 * Cubre las diez entidades de negocio: las nueve con endpoint por API, y
 * `audit_events` —que no tiene controlador— sobre la capa de acceso a datos.
 */
class TenantIsolationTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $orgA;

    private Organization $orgB;

    /** @var array<string, \Illuminate\Database\Eloquent\Model> */
    private array $dataB;

    private string $tokenA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->orgA = $this->createOrganization(['name' => 'Centro A']);
        $this->orgB = $this->createOrganization(['name' => 'Centro B']);

        $this->seedBusinessData($this->orgA);
        $this->dataB = $this->seedBusinessData($this->orgB);

        $this->tokenA = $this->tokenFor($this->createUserFor($this->orgA, 'org_admin'));
    }

    /**
     * Los nueve recursos de negocio expuestos por la API.
     *
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

    // ── Operación 1: lectura de listado ────────────────────────────────────

    #[\PHPUnit\Framework\Attributes\DataProvider('businessResources')]
    public function test_index_never_returns_records_from_another_organization(string $resource): void
    {
        $foreignId = $this->dataB[$resource]->getKey();

        $response = $this->actingWithToken($this->tokenA)
            ->getJson("/api/v1/{$resource}?per_page=50")
            ->assertOk();

        $ids = array_column($response->json('data'), 'id');

        $this->assertNotContains($foreignId, $ids, "El listado de {$resource} filtró un registro ajeno.");
        $this->assertNotEmpty($ids, "El listado de {$resource} debería contener los registros propios.");
    }

    // ── Operación 2: lectura de detalle ────────────────────────────────────

    #[\PHPUnit\Framework\Attributes\DataProvider('businessResources')]
    public function test_show_of_foreign_record_responds_as_not_found(string $resource): void
    {
        $foreignId = $this->dataB[$resource]->getKey();

        $this->actingWithToken($this->tokenA)
            ->getJson("/api/v1/{$resource}/{$foreignId}")
            ->assertNotFound();
    }

    /**
     * FR-008: la respuesta ante un recurso ajeno debe ser indistinguible de la de
     * un identificador que no existe en absoluto. Un 403 revelaría su existencia.
     */
    #[\PHPUnit\Framework\Attributes\DataProvider('businessResources')]
    public function test_foreign_record_is_indistinguishable_from_nonexistent(string $resource): void
    {
        $foreignId = $this->dataB[$resource]->getKey();

        $foreign = $this->actingWithToken($this->tokenA)->getJson("/api/v1/{$resource}/{$foreignId}");
        $missing = $this->actingWithToken($this->tokenA)->getJson("/api/v1/{$resource}/999999");

        $this->assertSame($missing->getStatusCode(), $foreign->getStatusCode());

        // Los mensajes se comparan sin el identificador, que lo puso el propio
        // cliente en la URL y no aporta información nueva. Lo que importa es que la
        // forma del error sea la misma: nada distingue "ajeno" de "inexistente".
        $normalise = static fn (?string $message): string => preg_replace('/\d+/', '#', (string) $message);

        $this->assertSame(
            $normalise($missing->json('message')),
            $normalise($foreign->json('message')),
            "La respuesta ante un {$resource} ajeno se distingue de la de uno inexistente."
        );
    }

    // ── Operación 3: escritura ─────────────────────────────────────────────

    #[\PHPUnit\Framework\Attributes\DataProvider('businessResources')]
    public function test_update_of_foreign_record_is_rejected_and_changes_nothing(string $resource): void
    {
        $record = $this->dataB[$resource];

        // Se comparan los atributos crudos de la fila, no toArray(): este último
        // incluye accesores y relaciones, que tras la petición se resuelven ya con
        // el scope activo y salen nulas por pertenecer a otra organización. Eso es
        // el aislamiento funcionando, no un cambio en el registro.
        $before = $record->fresh()->getAttributes();

        $this->actingWithToken($this->tokenA)
            ->putJson("/api/v1/{$resource}/{$record->getKey()}", ['first_name' => 'Intruso', 'name' => 'Intruso'])
            ->assertNotFound();

        $this->assertEquals($before, $record->fresh()->getAttributes(), "Se alteró un registro de {$resource} ajeno.");
    }

    // ── Operación 4: borrado ───────────────────────────────────────────────

    #[\PHPUnit\Framework\Attributes\DataProvider('businessResources')]
    public function test_delete_of_foreign_record_is_rejected_and_record_survives(string $resource): void
    {
        $record = $this->dataB[$resource];

        $this->actingWithToken($this->tokenA)
            ->deleteJson("/api/v1/{$resource}/{$record->getKey()}")
            ->assertNotFound();

        $this->assertNotNull($record->fresh(), "Se borró un registro de {$resource} ajeno.");
    }

    // ── Búsqueda ───────────────────────────────────────────────────────────

    public function test_search_never_matches_records_from_another_organization(): void
    {
        $foreignStudent = $this->dataB['students'];

        $response = $this->actingWithToken($this->tokenA)
            ->getJson('/api/v1/students?search='.urlencode($foreignStudent->first_name))
            ->assertOk();

        $ids = array_column($response->json('data'), 'id');

        $this->assertNotContains($foreignStudent->getKey(), $ids);
    }

    // ── Décima entidad: auditoría, sin endpoint ────────────────────────────

    public function test_audit_events_are_isolated_at_the_data_layer(): void
    {
        AuditEvent::forceCreate([
            'organization_id' => $this->orgA->getKey(),
            'action' => 'created',
            'entity_type' => 'student',
            'entity_id' => 1,
        ]);

        $foreign = AuditEvent::forceCreate([
            'organization_id' => $this->orgB->getKey(),
            'action' => 'created',
            'entity_type' => 'payment',
            'entity_id' => 99,
        ]);

        // Con el contexto puesto en A, ninguna consulta debe alcanzar el evento de B.
        $this->withOrganizationContext($this->orgA, function () use ($foreign): void {
            $this->assertNull(AuditEvent::find($foreign->getKey()));
            $this->assertNotContains(
                $foreign->getKey(),
                AuditEvent::query()->pluck('id')->all()
            );
            $this->assertSame(1, AuditEvent::query()->count());
        });
    }
}
