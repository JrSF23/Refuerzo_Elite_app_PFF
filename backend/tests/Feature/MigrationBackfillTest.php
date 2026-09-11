<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * FR-022 y SC-004: la migración del centro actual no pierde ni duplica un solo
 * registro, y ninguna fila queda sin organización.
 *
 * El test no se conforma con el esquema ya migrado: retrocede las cinco
 * migraciones de tenancy, siembra datos como los tendría el centro que hoy usa
 * Refuerzo Elite V2, y vuelve a aplicarlas. Es la única forma de ejercitar el
 * backfill de verdad.
 *
 * Los datos heredados se insertan con el query builder, no con Eloquent: con el
 * esquema retrocedido la columna `organization_id` no existe, y los modelos ya
 * llevan el trait de tenancy.
 *
 * Usa DatabaseMigrations y NO RefreshDatabase, y no es un detalle menor: este
 * último envuelve cada test en una transacción, y dentro de una transacción
 * `PRAGMA foreign_keys` es un no-op en SQLite. Como SQLite implementa el añadido
 * de claves foráneas reconstruyendo la tabla —crear, copiar, BORRAR la antigua,
 * renombrar—, ese DROP dispararía los ON DELETE CASCADE de las tablas hijas y
 * vaciaría grupos, sesiones, matrículas, asistencias y pagos. Fuera de
 * transacción, la protección que Laravel ya pone alrededor de la reconstrucción
 * funciona y no se pierde nada.
 */
class MigrationBackfillTest extends TestCase
{
    use DatabaseMigrations;

    /** Las diez tablas de negocio, más `users`. */
    private const TABLES = [
        'guardians', 'teachers', 'subjects', 'students', 'class_groups',
        'class_sessions', 'enrollments', 'attendances', 'payments', 'audit_events',
        'users',
    ];

    /** La primera migración de tenancy: la que añade la columna a las tablas. */
    private const FIRST_TENANCY_MIGRATION = '2026_08_14_000002_add_organization_id_to_tables';

    /**
     * Deshace las migraciones de tenancy para poder sembrar el esquema anterior.
     *
     * Los pasos se CUENTAN, no se fijan. `migrate:rollback --step` deshace las N
     * últimas migraciones aplicadas, así que un número escrito a mano no depende
     * de cuántas migraciones de tenancy hay —que son fijas— sino de cuántas se
     * han añadido DESPUÉS, que crecen con el proyecto. Con el `5` original, la
     * primera migración nueva que llegó dejó el retroceso a medias: se quedaba
     * sin deshacer la que añade `organization_id`, y los siete tests de este
     * fichero fallaban con un mensaje que no señalaba a la causa.
     *
     * Los nombres llevan la fecha delante y se aplican en ese orden, así que
     * contar las que van de la primera de tenancy en adelante da el número exacto
     * y sigue dándolo cuando se añadan más.
     */
    private function rollbackTenancy(): void
    {
        $steps = DB::table('migrations')
            ->where('migration', '>=', self::FIRST_TENANCY_MIGRATION)
            ->count();

        $this->artisan('migrate:rollback', ['--step' => $steps, '--force' => true])
            ->assertSuccessful();

        $this->assertFalse(
            DB::getSchemaBuilder()->hasColumn('students', 'organization_id'),
            'El retroceso no eliminó la columna organization_id.'
        );
    }

    private function applyTenancy(): void
    {
        $this->artisan('migrate', ['--force' => true])->assertSuccessful();
    }

    /**
     * @return array<string, int>
     */
    private function countsByTable(): array
    {
        $counts = [];

        foreach (self::TABLES as $table) {
            $counts[$table] = DB::table($table)->count();
        }

        return $counts;
    }

    /**
     * Datos como los del centro que hoy usa la aplicación, sin organización.
     */
    private function seedLegacySchool(): void
    {
        $now = now();

        DB::table('roles')->insert(['name' => 'admin', 'guard_name' => 'web', 'created_at' => $now, 'updated_at' => $now]);
        DB::table('roles')->insert(['name' => 'teacher', 'guard_name' => 'web', 'created_at' => $now, 'updated_at' => $now]);

        DB::table('users')->insert([
            ['name' => 'Admin Heredado', 'username' => 'admin', 'email' => 'admin@legacy.test', 'password' => Hash::make('secret123'), 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'María García', 'username' => 'mgarcia', 'email' => 'mgarcia@legacy.test', 'password' => Hash::make('secret123'), 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        $adminId = DB::table('users')->where('username', 'admin')->value('id');
        $adminRoleId = DB::table('roles')->where('name', 'admin')->value('id');
        DB::table('model_has_roles')->insert([
            'role_id' => $adminRoleId,
            'model_type' => 'App\Models\User',
            'model_id' => $adminId,
        ]);

        DB::table('guardians')->insert(['first_name' => 'Rosa', 'last_name' => 'Fernández', 'email' => 'rosa@legacy.test', 'phone' => '600111222', 'relationship_label' => 'Madre', 'created_at' => $now, 'updated_at' => $now]);
        $guardianId = DB::table('guardians')->value('id');

        // Un profesor cuyo email coincide con una cuenta, y otro que no.
        DB::table('teachers')->insert([
            ['first_name' => 'María', 'last_name' => 'García', 'email' => 'mgarcia@legacy.test', 'created_at' => $now, 'updated_at' => $now],
            ['first_name' => 'Sin', 'last_name' => 'Cuenta', 'email' => 'sincuenta@legacy.test', 'created_at' => $now, 'updated_at' => $now],
        ]);
        $teacherId = DB::table('teachers')->where('email', 'mgarcia@legacy.test')->value('id');

        DB::table('subjects')->insert(['name' => 'Matemáticas', 'code' => 'MAT', 'monthly_fee' => 80, 'created_at' => $now, 'updated_at' => $now]);
        $subjectId = DB::table('subjects')->value('id');

        DB::table('students')->insert([
            ['guardian_id' => $guardianId, 'first_name' => 'Lucía', 'last_name' => 'Fernández', 'status' => 'active', 'created_at' => $now, 'updated_at' => $now],
            ['guardian_id' => $guardianId, 'first_name' => 'Alejandro', 'last_name' => 'Fernández', 'status' => 'active', 'created_at' => $now, 'updated_at' => $now],
        ]);
        $studentId = DB::table('students')->value('id');

        DB::table('class_groups')->insert(['subject_id' => $subjectId, 'teacher_id' => $teacherId, 'name' => 'Mates A', 'code' => 'MAT-A', 'academic_year' => '2025-2026', 'capacity' => 10, 'status' => 'active', 'created_at' => $now, 'updated_at' => $now]);
        $groupId = DB::table('class_groups')->value('id');

        DB::table('class_sessions')->insert(['class_group_id' => $groupId, 'title' => 'Sesión 1', 'session_date' => '2026-01-13', 'created_at' => $now, 'updated_at' => $now]);
        $sessionId = DB::table('class_sessions')->value('id');

        DB::table('enrollments')->insert(['student_id' => $studentId, 'class_group_id' => $groupId, 'enrolled_at' => '2025-09-16', 'monthly_fee' => 80, 'status' => 'active', 'created_at' => $now, 'updated_at' => $now]);
        $enrollmentId = DB::table('enrollments')->value('id');

        DB::table('attendances')->insert(['class_session_id' => $sessionId, 'student_id' => $studentId, 'status' => 'present', 'created_at' => $now, 'updated_at' => $now]);

        DB::table('payments')->insert(['student_id' => $studentId, 'guardian_id' => $guardianId, 'enrollment_id' => $enrollmentId, 'amount' => 80, 'period_label' => 'Enero 2026', 'paid_at' => '2026-01-05', 'payment_method' => 'cash', 'status' => 'paid', 'created_at' => $now, 'updated_at' => $now]);

        DB::table('audit_events')->insert(['user_id' => $adminId, 'action' => 'login', 'entity_type' => 'user', 'entity_id' => $adminId, 'created_at' => $now, 'updated_at' => $now]);
    }

    // ── FR-022 / SC-004 ────────────────────────────────────────────────────

    public function test_migration_preserves_every_record_and_leaves_no_row_without_organization(): void
    {
        $this->rollbackTenancy();
        $this->seedLegacySchool();

        $before = $this->countsByTable();
        $this->assertNotEmpty(array_filter($before), 'El escenario heredado quedó vacío.');

        $this->applyTenancy();

        $this->assertSame($before, $this->countsByTable(), 'La migración perdió o duplicó registros.');

        // Ninguna fila de negocio sin organización, y todas en la misma.
        $organizationIds = [];

        foreach (self::TABLES as $table) {
            if ($table === 'users') {
                continue;
            }

            $this->assertSame(
                0,
                DB::table($table)->whereNull('organization_id')->count(),
                "Quedaron filas sin organización en {$table}."
            );

            $organizationIds = array_merge($organizationIds, DB::table($table)->distinct()->pluck('organization_id')->all());
        }

        $this->assertCount(1, array_unique($organizationIds), 'Los datos heredados se repartieron entre varias organizaciones.');
    }

    public function test_migration_creates_a_single_organization_for_the_existing_school(): void
    {
        $this->rollbackTenancy();
        $this->seedLegacySchool();
        $this->applyTenancy();

        $this->assertSame(1, DB::table('organizations')->count());
        $this->assertSame('active', DB::table('organizations')->value('status'));
        $this->assertNotNull(DB::table('organizations')->value('slug'));
    }

    public function test_existing_users_are_attached_to_that_organization(): void
    {
        $this->rollbackTenancy();
        $this->seedLegacySchool();
        $this->applyTenancy();

        $organizationId = DB::table('organizations')->value('id');

        $this->assertSame(0, DB::table('users')->whereNull('organization_id')->count());
        $this->assertSame(2, DB::table('users')->where('organization_id', $organizationId)->count());
    }

    public function test_admin_role_is_renamed_preserving_its_assignments(): void
    {
        $this->rollbackTenancy();
        $this->seedLegacySchool();

        $assignmentsBefore = DB::table('model_has_roles')->count();

        $this->applyTenancy();

        $this->assertSame(0, DB::table('roles')->where('name', 'admin')->count(), 'El rol admin no se renombró.');
        $this->assertSame(1, DB::table('roles')->where('name', 'org_admin')->count());
        $this->assertSame($assignmentsBefore, DB::table('model_has_roles')->count(), 'Se perdieron asignaciones de rol.');
    }

    // ── T058: vinculación de fichas de profesor ────────────────────────────

    public function test_teacher_profiles_are_linked_to_matching_accounts_only(): void
    {
        $this->rollbackTenancy();
        $this->seedLegacySchool();
        $this->applyTenancy();

        $matchedUserId = DB::table('users')->where('email', 'mgarcia@legacy.test')->value('id');

        $this->assertSame(
            $matchedUserId,
            DB::table('teachers')->where('email', 'mgarcia@legacy.test')->value('user_id'),
            'La ficha con correo coincidente no quedó vinculada.'
        );

        $this->assertNull(
            DB::table('teachers')->where('email', 'sincuenta@legacy.test')->value('user_id'),
            'Una ficha sin cuenta coincidente quedó vinculada.'
        );
    }

    public function test_a_teacher_without_matching_account_does_not_abort_the_migration(): void
    {
        $this->rollbackTenancy();
        $this->seedLegacySchool();

        // Fichas sin email en absoluto: no deben emparejarse por null == null.
        DB::table('teachers')->insert([
            ['first_name' => 'Anónimo', 'last_name' => 'Uno', 'email' => null, 'created_at' => now(), 'updated_at' => now()],
            ['first_name' => 'Anónimo', 'last_name' => 'Dos', 'email' => null, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->applyTenancy();

        $this->assertSame(2, DB::table('teachers')->whereNull('email')->whereNull('user_id')->count());
    }

    public function test_backfill_is_idempotent_when_rerun(): void
    {
        $this->rollbackTenancy();
        $this->seedLegacySchool();
        $this->applyTenancy();

        $counts = $this->countsByTable();
        $organizations = DB::table('organizations')->count();

        // Volver a aplicar no debe duplicar la organización ni los datos.
        $this->artisan('migrate', ['--force' => true])->assertSuccessful();

        $this->assertSame($counts, $this->countsByTable());
        $this->assertSame($organizations, DB::table('organizations')->count());
    }
}
