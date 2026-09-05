<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * El grupo de asignatura pasa a colgar del AULA.
 *
 * Hasta ahora `class_groups` y `tutor_groups` no se conocían: no había ni una
 * columna que los uniera. Eran dos ideas de «grupo» viviendo en paralelo, y de
 * ahí venía la confusión — al registrar una sesión había que elegir entre unos
 * grupos que no eran los que el centro ve en su lista de aulas.
 *
 * Con `tutor_group_id`, un grupo de asignatura es lo que de verdad es en un
 * centro: **el aula × la materia**. «1º ESBA» da Matemáticas con Luis y Lengua
 * con Marta; eso son dos filas de `class_groups`, ambas del aula «1º ESBA».
 *
 * ── Por qué no se borra la tabla ────────────────────────────────────────────
 *
 * Era la petición original, y no se puede: de `class_groups` cuelgan las
 * sesiones y las matrículas en CASCADE, y de ellas la asistencia y los pagos.
 * Borrarla se llevaría el registro académico y el de cobro por delante. Lo que
 * sobraba no era la tabla sino tener que crearla a mano como si fuera una
 * entidad aparte, y eso es lo que desaparece: se gestiona desde el aula.
 *
 * ── Nullable, y por qué ─────────────────────────────────────────────────────
 *
 * Los grupos que ya existen no tienen aula y no hay forma honesta de
 * adivinársela: en la demo, los alumnos de un mismo grupo de asignatura vienen
 * de once aulas distintas, porque el modelo anterior no los relacionaba. Se
 * queda nulo, que significa «creado con el modelo antiguo», y es cierto y
 * comprobable. Repartirlos por aula sería escribir una suposición en la base
 * como si fuera un hecho.
 *
 * ── SET NULL y no CASCADE ───────────────────────────────────────────────────
 *
 * `tutor_groups` tiene borrado lógico, así que en la práctica la clave rara vez
 * se dispara. Pero si un aula llegara a borrarse de verdad, con CASCADE se
 * llevaría sus grupos de asignatura y, en cadena, sus sesiones y su asistencia:
 * cerrar un aula destruiría el historial académico de ese curso. Con SET NULL
 * el grupo sobrevive huérfano, que es recuperable.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('class_groups', function (Blueprint $table): void {
            $table->foreignId('tutor_group_id')
                ->nullable()
                ->after('organization_id')
                ->constrained('tutor_groups')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('class_groups', function (Blueprint $table): void {
            $table->dropForeign(['tutor_group_id']);
            $table->dropColumn('tutor_group_id');
        });
    }
};
