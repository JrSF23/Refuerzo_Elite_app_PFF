<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * M4 — Imposición de las restricciones de tenancy.
 *
 * Cada operación va en su propio Schema::table() y en pasos separados y
 * numerados, tanto para poder aislar un fallo como porque SQLite reconstruye la
 * tabla en cada `change()`: mezclar cambios de columna con índices en una misma
 * llamada produce resultados distintos según el motor.
 *
 * Orden deliberado: NOT NULL → índices únicos → índices de rendimiento → claves
 * foráneas. Las FK van al final para que ninguna reconstrucción de tabla las
 * pierda por el camino.
 */
return new class extends Migration
{
    /** Las diez tablas de negocio. `users` queda fuera: nullable por FR-004. */
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

    /** Únicos globales que pasan a ser únicos por organización (FR-019). */
    private const SCOPED_UNIQUES = [
        'subjects' => 'code',
        'class_groups' => 'code',
        'students' => 'email',
        'teachers' => 'email',
        'guardians' => 'email',
    ];

    /**
     * Índices que el compuesto sustituye y pueden retirarse.
     *
     * NO se retiran los que sostienen una clave foránea, aunque el compuesto los
     * cubra por prefijo: MySQL/MariaDB rechaza el DROP con el error 1553. Se
     * verificó en MariaDB 10.4 que `students.guardian_id` y
     * `class_sessions.class_group_id` no tienen índice `_foreign` propio —el
     * índice de rendimiento es el único que respalda su FK—, así que ambos se
     * quedan. SQLite no da ninguna señal de esto: acepta el DROP sin rechistar.
     */
    private const SUPERSEDED_INDEXES = [
        'students' => [['status']],
        'enrollments' => [['status']],
        'class_groups' => [['status'], ['academic_year']],
        'payments' => [['status'], ['paid_at']],
        'audit_events' => [['entity_type', 'entity_id'], ['created_at']],
    ];

    /** Compuestos con organization_id como primera columna. */
    private const COMPOSITE_INDEXES = [
        'guardians' => [['organization_id']],
        'teachers' => [['organization_id']],
        'subjects' => [['organization_id']],
        'attendances' => [['organization_id']],
        'students' => [['organization_id', 'status'], ['organization_id', 'guardian_id']],
        'enrollments' => [['organization_id', 'status']],
        'class_groups' => [['organization_id', 'status'], ['organization_id', 'academic_year']],
        'class_sessions' => [['organization_id', 'class_group_id', 'session_date']],
        'payments' => [['organization_id', 'status'], ['organization_id', 'paid_at']],
        'audit_events' => [['organization_id', 'entity_type', 'entity_id'], ['organization_id', 'created_at']],
    ];

    public function up(): void
    {
        // NOTA DE SECUENCIACIÓN — el NOT NULL no se impone aquí.
        //
        // Imponerlo en esta fase rompería toda escritura por API: quien rellena
        // `organization_id` es el trait BelongsToOrganization, que llega con el
        // global scope en la fase siguiente. Entre una cosa y otra, cualquier POST
        // fallaría con violación de integridad, dejando el sistema no desplegable
        // y contradiciendo el Principio X.
        //
        // El NOT NULL se impone en una migración posterior, aplicada justo después
        // del trait. Hasta entonces la columna queda nullable y poblada por M3, los
        // seeders y las factories.

        // ── Paso 1: retirar los únicos globales ──────────────────────────────
        foreach (self::SCOPED_UNIQUES as $table => $column) {
            Schema::table($table, function (Blueprint $blueprint) use ($column): void {
                $blueprint->dropUnique([$column]);
            });
        }

        // ── Paso 2: únicos por organización ──────────────────────────────────
        foreach (self::SCOPED_UNIQUES as $table => $column) {
            Schema::table($table, function (Blueprint $blueprint) use ($column): void {
                $blueprint->unique(['organization_id', $column]);
            });
        }

        // ── Paso 3: retirar los índices que el compuesto sustituye ───────────
        foreach (self::SUPERSEDED_INDEXES as $table => $indexes) {
            foreach ($indexes as $columns) {
                Schema::table($table, function (Blueprint $blueprint) use ($columns): void {
                    $blueprint->dropIndex($columns);
                });
            }
        }

        // ── Paso 4: índices compuestos de rendimiento ────────────────────────
        foreach (self::COMPOSITE_INDEXES as $table => $indexes) {
            foreach ($indexes as $columns) {
                Schema::table($table, function (Blueprint $blueprint) use ($columns): void {
                    $blueprint->index($columns);
                });
            }
        }

        // ── Paso 5: claves foráneas hacia organizations ──────────────────────
        // restrictOnDelete: una organización con datos no puede borrarse en duro.
        // El borrado del producto es lógico (deleted_at), que no dispara la FK.
        foreach ([...self::BUSINESS_TABLES, 'users'] as $table) {
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->foreign('organization_id')
                    ->references('id')
                    ->on('organizations')
                    ->restrictOnDelete();
            });
        }

        // ── Paso 6: clave foránea del vínculo profesor ↔ cuenta ──────────────
        // nullOnDelete: al borrar la cuenta, la ficha y su historial sobreviven.
        Schema::table('teachers', function (Blueprint $table): void {
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table): void {
            $table->dropForeign(['user_id']);
        });

        foreach ([...self::BUSINESS_TABLES, 'users'] as $table) {
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->dropForeign(['organization_id']);
            });
        }

        foreach (self::COMPOSITE_INDEXES as $table => $indexes) {
            foreach ($indexes as $columns) {
                Schema::table($table, function (Blueprint $blueprint) use ($columns): void {
                    $blueprint->dropIndex($columns);
                });
            }
        }

        foreach (self::SUPERSEDED_INDEXES as $table => $indexes) {
            foreach ($indexes as $columns) {
                Schema::table($table, function (Blueprint $blueprint) use ($columns): void {
                    $blueprint->index($columns);
                });
            }
        }

        foreach (self::SCOPED_UNIQUES as $table => $column) {
            Schema::table($table, function (Blueprint $blueprint) use ($column): void {
                $blueprint->dropUnique(['organization_id', $column]);
                $blueprint->unique([$column]);
            });
        }
    }
};
