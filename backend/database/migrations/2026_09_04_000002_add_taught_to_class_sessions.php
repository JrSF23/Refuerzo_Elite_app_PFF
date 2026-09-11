<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * «Impartida»: el profesor responsable marca que la sesión se dio, y la
 * administración lo ve.
 *
 * Dos columnas y no una bandera, porque «sí» sin «cuándo» ni «quién» no sirve
 * para responder lo que de verdad se pregunta en un centro —«¿esta clase se dio,
 * y quién dice que se dio?»—. `taught_at` nulo significa pendiente; con valor,
 * impartida. No hace falta un tercer estado: lo que no se ha marcado está
 * pendiente, y eso es cierto sin necesidad de escribirlo en ninguna fila.
 *
 * Sigue los mismos criterios que `created_by` (rama `sesiones-autoria`), que es
 * la otra columna informativa de esta tabla:
 *
 * - NULLABLE y SIN relleno. Las sesiones que ya existen no se marcan como
 *   impartidas: nadie ha dicho que lo estén. Darlas por dadas porque su fecha ya
 *   pasó sería escribir una suposición como si fuera un hecho.
 *
 * - SET NULL y no CASCADE en `taught_by`. `users` no tiene borrado lógico, así
 *   que la baja de una cuenta dispara la clave de verdad. Con CASCADE, dar de
 *   baja a un profesor borraría sus sesiones y, en cadena, la asistencia
 *   —`attendances.class_session_id` es cascadeOnDelete—: una baja administrativa
 *   destruiría el registro académico. Al perder la cuenta queda `taught_at` con
 *   `taught_by` nulo, que se lee como «impartida, autor dado de baja»: la clase
 *   se dio igual, y eso no deja de ser cierto porque el profesor se marche.
 *
 * - FUERA de `$fillable`. Las pone el endpoint propio, nunca el PUT del
 *   formulario. Si fueran declarables, cualquiera podría marcar una sesión como
 *   impartida —o DESmarcarla— enviando el campo en una edición corriente, y el
 *   marcado es definitivo por decisión del centro.
 *
 * ── Irreversibilidad ────────────────────────────────────────────────────────
 *
 * El marcado no se deshace: no hay endpoint que vuelva `taught_at` a nulo. El
 * esquema NO lo impone —una columna nullable acepta nulos— porque hacerlo con un
 * disparador ataría la corrección de un error a una migración. Quien tenga que
 * enmendarlo de verdad, borra la sesión, y eso sí exige ser administrador.
 *
 * ── Reversible ──────────────────────────────────────────────────────────────
 *
 * `down()` retira la foránea antes que las columnas: en MySQL 8 su índice impide
 * soltarlas al revés (error 1553).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('class_sessions', function (Blueprint $table): void {
            $table->timestamp('taught_at')->nullable();
            $table->unsignedBigInteger('taught_by')->nullable();

            $table->foreign('taught_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('class_sessions', function (Blueprint $table): void {
            $table->dropForeign(['taught_by']);
            $table->dropColumn(['taught_at', 'taught_by']);
        });
    }
};
