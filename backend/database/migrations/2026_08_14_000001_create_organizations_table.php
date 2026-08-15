<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * M1 — Tabla raíz de organizaciones.
 *
 * Crea la tabla e inserta la organización del centro actual, a la que M3 asignará
 * todos los datos existentes. Paso desplegable por sí solo: hasta que M2 añada las
 * columnas, el sistema se comporta exactamente igual que antes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug', 120)->unique();
            $table->string('status', 20)->default('active');
            $table->string('contact_email')->nullable();
            $table->string('contact_phone', 30)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
        });

        DB::table('organizations')->insert([
            'name' => 'Refuerzo Elite',
            'slug' => 'refuerzo-elite',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
