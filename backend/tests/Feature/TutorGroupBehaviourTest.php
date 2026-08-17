<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Student;
use App\Models\TutorGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\CreatesOrganizations;
use Tests\TestCase;

/**
 * Unicidad, borrados, permisos y recuento de consultas.
 */
class TutorGroupBehaviourTest extends TestCase
{
    use CreatesOrganizations, RefreshDatabase;

    private Organization $org;

    private string $adminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureRoles();

        $this->org = $this->createOrganization(['name' => 'Centro']);
        $this->adminToken = $this->tokenFor($this->createUserFor($this->org, 'org_admin'));
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => '1º ESO',
            'shift' => TutorGroup::SHIFT_MORNING,
            'academic_year' => '2025-2026',
            'status' => TutorGroup::STATUS_ACTIVE,
        ], $overrides);
    }

    /* ── Unicidad ─────────────────────────────────────────────────────────── */

    public function test_the_same_name_and_shift_and_year_is_rejected(): void
    {
        $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/tutor-groups', $this->payload())
            ->assertCreated();

        $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/tutor-groups', $this->payload())
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_the_same_name_in_a_different_shift_is_accepted(): void
    {
        // «1º ESO mañana» y «1º ESO tarde» son grupos distintos (SC-010).
        $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/tutor-groups', $this->payload())
            ->assertCreated();

        $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/tutor-groups', $this->payload(['shift' => TutorGroup::SHIFT_AFTERNOON]))
            ->assertCreated();
    }

    public function test_the_same_name_in_a_different_academic_year_is_accepted(): void
    {
        $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/tutor-groups', $this->payload())
            ->assertCreated();

        $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/tutor-groups', $this->payload(['academic_year' => '2026-2027']))
            ->assertCreated();
    }

    public function test_an_unknown_shift_is_rejected(): void
    {
        $this->actingWithToken($this->adminToken)
            ->postJson('/api/v1/tutor-groups', $this->payload(['shift' => 'night']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('shift');
    }

    /* ── Borrados ─────────────────────────────────────────────────────────── */

    public function test_deleting_the_tutor_teacher_leaves_the_group_without_tutor(): void
    {
        $teacher = $this->createTeacherProfile($this->org);
        $group = $this->createTutorGroup($this->org, ['tutor_teacher_id' => $teacher->getKey()]);

        $teacher->delete();

        $this->assertNull($group->fresh()->tutor_teacher_id);
    }

    public function test_soft_deleting_the_representative_leaves_the_group_without_one(): void
    {
        $group = $this->createTutorGroup($this->org);
        $student = $this->createStudent($this->org, ['tutor_group_id' => $group->getKey()]);

        $group->forceFill(['representative_student_id' => $student->getKey()])->save();

        $student->delete();

        // `SoftDeletes` NO dispara la clave foránea: el registro sigue en la tabla
        // con `deleted_at`. La limpieza la hace el modelo, y esto lo comprueba.
        $this->assertTrue($student->fresh()->trashed());
        $this->assertNull($group->fresh()->representative_student_id);
    }

    public function test_soft_deleting_the_representative_of_an_already_deleted_group_also_cleans_it(): void
    {
        // El caso que se escapó al escribir el gancho: `TutorGroup::query()`
        // aplica el filtro de borrado lógico y no veía los grupos ya borrados.
        // Ese grupo puede restaurarse y volvería apuntando a un alumno inexistente.
        $group = $this->createTutorGroup($this->org);
        $student = $this->createStudent($this->org, ['tutor_group_id' => $group->getKey()]);

        $group->forceFill(['representative_student_id' => $student->getKey()])->save();
        $group->delete();

        $student->delete();

        $reloaded = TutorGroup::withoutGlobalScopes()->withTrashed()->find($group->getKey());
        $this->assertNull($reloaded->representative_student_id);
    }

    public function test_deleting_a_group_leaves_its_students_without_group(): void
    {
        $group = $this->createTutorGroup($this->org);
        $student = $this->createStudent($this->org, ['tutor_group_id' => $group->getKey()]);

        $group->delete();

        $this->assertFalse($student->fresh()->trashed());
        $this->assertNull($student->fresh()->tutor_group_id);
    }

    /* ── Permisos ─────────────────────────────────────────────────────────── */

    public function test_the_teacher_can_read_but_not_write(): void
    {
        $teacherUser = $this->createUserFor($this->org, 'teacher');
        $this->createTeacherProfile($this->org, $teacherUser);
        $token = $this->tokenFor($teacherUser);

        $group = $this->createTutorGroup($this->org);

        $this->actingWithToken($token)->getJson('/api/v1/tutor-groups')->assertOk();
        $this->actingWithToken($token)->getJson("/api/v1/tutor-groups/{$group->getKey()}")->assertOk();

        $this->actingWithToken($token)
            ->postJson('/api/v1/tutor-groups', $this->payload())
            ->assertForbidden();

        $this->actingWithToken($token)
            ->deleteJson("/api/v1/tutor-groups/{$group->getKey()}")
            ->assertForbidden();
    }

    public function test_the_platform_admin_has_no_access(): void
    {
        // Está fuera del middleware de tenant: no puede establecer contexto.
        $token = $this->tokenFor($this->createSuperAdmin());

        $this->actingWithToken($token)->getJson('/api/v1/tutor-groups')->assertForbidden();
    }

    /* ── Consultas ────────────────────────────────────────────────────────── */

    public function test_listing_students_does_not_grow_queries_with_the_number_of_students(): void
    {
        $group = $this->createTutorGroup($this->org, [
            'tutor_teacher_id' => $this->createTeacherProfile($this->org)->getKey(),
        ]);

        foreach (range(1, 3) as $ignored) {
            $this->createStudent($this->org, ['tutor_group_id' => $group->getKey()]);
        }

        /*
         * Calentamiento antes de medir. La PRIMERA petición del proceso carga
         * cosas que se cachean y no se repiten —la tabla de permisos de Spatie,
         * entre otras—, de modo que sin esto la segunda medición sale MÁS BAJA
         * que la primera y la comparación no dice nada sobre el N+1.
         */
        $this->actingWithToken($this->adminToken)->getJson('/api/v1/students?per_page=50')->assertOk();

        /*
         * La escucha se registra UNA sola vez. `DB::listen` no se puede
         * desregistrar, así que llamarlo antes de cada medición dejaría dos
         * escuchas activas y la segunda cuenta saldría al doble.
         */
        $queries = 0;
        DB::listen(function () use (&$queries): void {
            $queries++;
        });

        $queries = 0;
        $this->actingWithToken($this->adminToken)->getJson('/api/v1/students?per_page=50')->assertOk();
        $few = $queries;

        foreach (range(1, 30) as $ignored) {
            $this->createStudent($this->org, ['tutor_group_id' => $group->getKey()]);
        }

        $queries = 0;
        $this->actingWithToken($this->adminToken)->getJson('/api/v1/students?per_page=50')->assertOk();
        $many = $queries;

        /*
         * Lo que de verdad detecta un N+1 es que el número NO CREZCA al multiplicar
         * los alumnos por diez. Contarlas una sola vez no sirve: con pocos
         * registros, unas cuantas consultas de más pasan desapercibidas.
         */
        $this->assertSame(
            $few,
            $many,
            "El número de consultas creció de {$few} a {$many} al añadir alumnos: hay un N+1.",
        );
    }
}
