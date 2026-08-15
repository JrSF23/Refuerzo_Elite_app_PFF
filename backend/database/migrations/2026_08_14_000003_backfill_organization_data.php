<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * M3 — Backfill del centro actual.
 *
 * Todo ocurre dentro de una transacción: si la verificación final encuentra una
 * sola fila de negocio sin organización, se lanza una excepción y no se aplica
 * nada (Principio VIII).
 *
 * No ejecutar en producción sin copia de seguridad verificada y restaurable.
 * Procedimiento completo en docs/migration-multi-org.md.
 */
return new class extends Migration
{
    /** @var list<string> */
    private const BUSINESS_TABLES = [
        'guardians',
        'teachers',
        'subjects',
        'students',
        'class_groups',
        'class_sessions',
        'enrollments',
        'attendances',
        'payments',
        'audit_events',
    ];

    public function up(): void
    {
        DB::transaction(function (): void {
            $organizationId = DB::table('organizations')->orderBy('id')->value('id');

            if ($organizationId === null) {
                throw new RuntimeException(
                    'M3: no existe ninguna organización. M1 debe haberse aplicado antes.'
                );
            }

            // 1. Asignar la organización del centro actual a todo lo existente.
            $affected = [];

            foreach ([...self::BUSINESS_TABLES, 'users'] as $table) {
                $affected[$table] = DB::table($table)
                    ->whereNull('organization_id')
                    ->update(['organization_id' => $organizationId]);
            }

            // 2. Renombrar el rol admin → org_admin conservando sus asignaciones.
            //    Se actúa sobre la fila existente, de modo que model_has_roles no
            //    necesita tocarse y ningún usuario pierde su rol.
            $roleRenamed = 0;

            if (DB::table('roles')->where('name', 'org_admin')->doesntExist()) {
                $roleRenamed = DB::table('roles')->where('name', 'admin')->update(['name' => 'org_admin']);
            }

            // 3. Vincular fichas de profesor con cuentas de usuario emparejando por
            //    email. Migración de datos puntual y revisable a mano: NUNCA una
            //    regla de acceso (D6). A partir de aquí el vínculo es teachers.user_id.
            $linked = 0;

            $teachers = DB::table('teachers')
                ->whereNotNull('email')
                ->whereNull('user_id')
                ->get(['id', 'email']);

            foreach ($teachers as $teacher) {
                $userId = DB::table('users')->where('email', $teacher->email)->value('id');

                if ($userId === null) {
                    continue;
                }

                // El vínculo es uno a uno: si la cuenta ya está tomada, se deja la
                // ficha sin vincular para revisión manual en lugar de romper.
                if (DB::table('teachers')->where('user_id', $userId)->exists()) {
                    continue;
                }

                DB::table('teachers')->where('id', $teacher->id)->update(['user_id' => $userId]);
                $linked++;
            }

            // 4. Verificación: ninguna fila de negocio puede quedar sin organización.
            $orphans = [];

            foreach (self::BUSINESS_TABLES as $table) {
                $count = DB::table($table)->whereNull('organization_id')->count();

                if ($count > 0) {
                    $orphans[$table] = $count;
                }
            }

            if ($orphans !== []) {
                // La excepción propaga fuera de DB::transaction(), que revierte la
                // transacción entera: ni el backfill, ni el renombrado del rol, ni la
                // vinculación de fichas quedan aplicados a medias.
                throw new RuntimeException(
                    'M3 abortada y revertida por completo: quedaron filas sin organización — '
                    .json_encode($orphans, JSON_THROW_ON_ERROR)
                );
            }

            $this->report($affected, $linked, $roleRenamed);
        });
    }

    /**
     * Deja constancia de lo que hizo el backfill, por tabla.
     *
     * Los recuentos se emiten para poder compararlos con los previos a la
     * migración (SC-004) y quedan además en el log, que es lo que se revisa
     * cuando la migración se ejecuta sin consola a la vista (Principio VIII).
     *
     * @param  array<string, int>  $affected
     */
    private function report(array $affected, int $linked, int $roleRenamed): void
    {
        $summary = [
            'filas_asignadas_por_tabla' => $affected,
            'total_filas_asignadas' => array_sum($affected),
            'fichas_de_profesor_vinculadas' => $linked,
            'rol_admin_renombrado' => $roleRenamed === 1,
        ];

        Log::info('M3 backfill de organización completado', $summary);

        echo PHP_EOL.'  M3 — backfill completado:'.PHP_EOL;

        foreach ($affected as $table => $count) {
            echo sprintf('    %-16s %d filas', $table, $count).PHP_EOL;
        }

        echo sprintf('    %-16s %d', 'total', array_sum($affected)).PHP_EOL;
        echo sprintf('    %-16s %d', 'fichas vinculadas', $linked).PHP_EOL;
        echo sprintf('    %-16s %s', 'rol renombrado', $roleRenamed === 1 ? 'admin -> org_admin' : 'sin cambio').PHP_EOL.PHP_EOL;
    }

    public function down(): void
    {
        DB::transaction(function (): void {
            DB::table('roles')->where('name', 'org_admin')->update(['name' => 'admin']);

            DB::table('teachers')->update(['user_id' => null]);

            foreach ([...self::BUSINESS_TABLES, 'users'] as $table) {
                DB::table($table)->update(['organization_id' => null]);
            }
        });
    }
};
