<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Autoría de la sesión: qué cuenta la dio de alta.
 *
 * Hasta ahora la pertenencia de una sesión se DERIVABA del aula
 * (`class_sessions.class_group_id` → `class_groups.teacher_id`). Eso responde
 * «de quién es el aula», que es lo que debe gobernar el acceso, pero no responde
 * «quién registró esto», que es una pregunta distinta:
 *
 *   - Al reasignar un grupo, el profesor nuevo hereda todo el histórico y no hay
 *     forma de distinguir lo que registró él de lo que venía de antes.
 *   - Si el aula se queda sin profesor, la autoría se pierde del todo.
 *
 * El dato existía, pero solo en `audit_events`, que es un registro transversal y
 * no algo que se pueda unir a una consulta de sesiones.
 *
 * ── Por qué nullable ────────────────────────────────────────────────────────
 *
 * Las sesiones que ya existen no tienen autor y NO se inventa uno. Nulo significa
 * «se registró antes de que esto se guardara», que es cierto y comprobable;
 * rellenarlo con el profesor actual del grupo sería una suposición escrita en la
 * base de datos como si fuera un hecho.
 *
 * Se puede rellenar el histórico después a partir de `audit_events`, que sí sabe
 * quién creó cada sesión. Es una migración de datos aparte y una decisión aparte.
 *
 * ── Por qué SET NULL y no CASCADE ───────────────────────────────────────────
 *
 * `users` NO tiene borrado lógico: un borrado es real y dispara esta clave. Con
 * CASCADE, dar de baja a una cuenta borraría sus sesiones y, en cadena, la
 * asistencia asociada —`attendances.class_session_id` es `cascadeOnDelete`—. Una
 * baja administrativa acabaría destruyendo el registro académico del centro.
 *
 * Con SET NULL se pierde el nombre y se conserva el hecho, que es el orden
 * correcto de prioridades cuando hay datos de menores de por medio.
 *
 * ── Desplegable por sí sola ─────────────────────────────────────────────────
 *
 * Columna nullable y sin valor por defecto: todo lo anterior sigue funcionando
 * sin conocerla, y no hace falta parar la aplicación para aplicarla.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('class_sessions', function (Blueprint $table): void {
            $table->foreignId('created_by')
                ->nullable()
                ->after('class_group_id')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('class_sessions', function (Blueprint $table): void {
            // La clave foránea PRIMERO y la columna después. En MySQL el índice
            // que respalda la clave no se puede soltar mientras la clave viva
            // (error 1553); `dropConstrainedForeignId` hace las dos cosas en el
            // orden correcto. SQLite lo toleraría, pero producción es MySQL.
            $table->dropConstrainedForeignId('created_by');
        });
    }
};
