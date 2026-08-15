<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * M5 — `organization_id` pasa a obligatorio en las diez tablas de negocio.
 *
 * Va aquí y no en M4 por una razón de orden: quien rellena la columna en las
 * escrituras por API es el trait BelongsToOrganization, que llega con esta misma
 * fase. Imponer el NOT NULL antes dejaba el sistema no desplegable —toda escritura
 * fallaba con violación de integridad— en contra del Principio X.
 *
 * `users` queda deliberadamente fuera: el super administrador de plataforma no
 * pertenece a ninguna organización (FR-004).
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
        // Verificación previa: imponer NOT NULL sobre una tabla con filas huérfanas
        // fallaría a mitad de camino y dejaría el esquema desparejado.
        $orphans = [];

        foreach (self::BUSINESS_TABLES as $table) {
            $count = DB::table($table)->whereNull('organization_id')->count();

            if ($count > 0) {
                $orphans[$table] = $count;
            }
        }

        if ($orphans !== []) {
            throw new RuntimeException(
                'M5 abortada: hay filas sin organización. Ejecute el backfill antes — '.json_encode($orphans)
            );
        }

        foreach (self::BUSINESS_TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->unsignedBigInteger('organization_id')->nullable(false)->change();
            });
        }
    }

    public function down(): void
    {
        foreach (self::BUSINESS_TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->unsignedBigInteger('organization_id')->nullable()->change();
            });
        }
    }
};
