<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * M2 — Columnas de organización, nullable y sin claves foráneas.
 *
 * Diez tablas de negocio más `users` (once en total). Nullable a propósito: el
 * backfill llega en M3 y la imposición de NOT NULL en M4, de modo que este paso
 * deja el sistema operativo sin cambio de comportamiento (Principio X).
 *
 * Añade además `teachers.user_id`, el vínculo uno a uno opcional entre ficha de
 * profesor y cuenta de usuario (FR-015a, FR-015b).
 */
return new class extends Migration
{
    /** Las diez tablas de negocio que llevan discriminador de organización. */
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
        foreach ([...self::BUSINESS_TABLES, 'users'] as $table) {
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->unsignedBigInteger('organization_id')->nullable();
            });
        }

        Schema::table('teachers', function (Blueprint $table): void {
            $table->unsignedBigInteger('user_id')->nullable()->unique();
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table): void {
            $table->dropUnique(['user_id']);
            $table->dropColumn('user_id');
        });

        foreach ([...self::BUSINESS_TABLES, 'users'] as $table) {
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->dropColumn('organization_id');
            });
        }
    }
};
