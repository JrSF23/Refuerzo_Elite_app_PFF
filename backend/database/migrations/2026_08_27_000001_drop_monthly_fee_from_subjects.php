<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `subjects.monthly_fee` se elimina: la asignatura no es la unidad de cobro.
 *
 * Venía del diseño original, que asumía una tarifa por asignatura. En los
 * centros de Guinea Ecuatorial no se cobra así: se cobra por curso académico, y
 * la asignatura es solo contenido. Una columna de dinero que nadie usa para
 * cobrar es peor que inútil — obliga a rellenar un importe al crear cualquier
 * asignatura y sugiere una forma de facturar que no es la real.
 *
 * ── Lo que NO se toca ───────────────────────────────────────────────────────
 *
 * `enrollments.monthly_fee` se queda. Ahí sí tiene sentido: es el importe
 * pactado para ESE alumno en ESA matrícula, que es lo que después se cobra. Su
 * rótulo en la interfaz ya era «Monto» y no «Tarifa mensual», precisamente
 * porque no todos los centros facturan igual.
 *
 * ── Efecto colateral que hay que decidir aparte ─────────────────────────────
 *
 * La sección de Asignaturas estaba cerrada al profesor POR llevar este campo
 * (FR-016, FR-037: las tres secciones cerradas eran exactamente las tres con
 * campos monetarios). Al quitarlo, ese motivo desaparece. La restricción se
 * mantiene tal cual en esta migración —abrirla exige cambiar también lo que
 * autoriza el servidor— pero ya no se sostiene sola.
 *
 * ── Reversible ──────────────────────────────────────────────────────────────
 *
 * `down()` devuelve la columna con su valor por defecto. Los importes que
 * hubiera NO se recuperan: son datos, no esquema, y no hay dónde guardarlos.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table): void {
            $table->dropColumn('monthly_fee');
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table): void {
            $table->decimal('monthly_fee', 10, 2)->default(0)->after('level');
        });
    }
};
