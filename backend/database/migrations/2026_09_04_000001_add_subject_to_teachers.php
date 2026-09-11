<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `teachers.subject_id` — la materia deja de ser un dato del grupo y pasa a ser
 * un dato del profesor.
 *
 * Hasta ahora la única forma de saber qué imparte alguien era mirar sus grupos:
 * `class_groups` lleva a la vez `teacher_id` y `subject_id`, así que la materia
 * se deducía del grupo. `teachers.specialty` existía, pero es texto libre —sirve
 * para mostrar y buscar, no para decidir nada— y se queda tal cual.
 *
 * A partir de aquí la materia habilita y el grupo delimita: un profesor puede
 * gestionar las sesiones de los grupos que tiene asignados **y** cuya materia es
 * la suya. Dos profesores de la misma materia siguen sin verse entre sí.
 *
 * ── Backfill ────────────────────────────────────────────────────────────────
 *
 * En dos pasadas, de la fuente más fiable a la menos:
 *
 *   1. Por sus grupos. Si todos los grupos de la ficha son de una misma materia,
 *      esa es. Es un hecho, no una conjetura.
 *   2. Por `specialty`, contra el nombre de las asignaturas de SU organización.
 *      Solo para las fichas que no tienen ningún grupo del que deducirla.
 *
 * Lo que no encaje queda a NULL, y una ficha sin materia no alcanza ninguna
 * sesión: el fallo cierra el acceso, no lo abre (FR-015c). Es recuperable desde
 * la interfaz asignando la materia a mano, y el resumen de abajo dice cuántas
 * quedaron así para que nadie tenga que ir a buscarlas.
 *
 * La coincidencia por nombre se acota a la organización de la ficha a propósito:
 * cruzar centros aquí metería una asignatura ajena en una ficha propia, que es
 * exactamente la fuga que el resto del diseño impide.
 *
 * ── Reversible ──────────────────────────────────────────────────────────────
 *
 * `down()` retira la clave foránea antes que la columna: en MySQL 8 el índice de
 * la foránea impide soltarla al revés. La asignación se pierde, pero es
 * reconstruible por el mismo camino, y `specialty` nunca se tocó.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $table): void {
            $table->unsignedBigInteger('subject_id')->nullable()->after('user_id');
            $table->index('subject_id');
        });

        $fromGroups = 0;
        $fromSpecialty = 0;

        DB::transaction(function () use (&$fromGroups, &$fromSpecialty): void {
            // ── 1. Deducir la materia de los grupos que ya imparte ────────────
            // Solo cuando no hay ambigüedad: una única materia distinta entre
            // todos sus grupos. Si alguna ficha llevara dos, se queda a NULL y
            // aparece en el resumen; una elección arbitraria aquí sería peor que
            // no elegir, porque nadie la revisaría después.
            $unambiguous = DB::table('class_groups')
                ->select('teacher_id', DB::raw('MIN(subject_id) as subject_id'))
                ->whereNotNull('teacher_id')
                ->groupBy('teacher_id')
                ->havingRaw('COUNT(DISTINCT subject_id) = 1')
                ->get();

            foreach ($unambiguous as $row) {
                $fromGroups += DB::table('teachers')
                    ->where('id', $row->teacher_id)
                    ->update(['subject_id' => $row->subject_id]);
            }

            // ── 2. Las que no tienen grupo: por el texto de `specialty` ───────
            $orphans = DB::table('teachers')
                ->whereNull('subject_id')
                ->whereNotNull('specialty')
                ->where('specialty', '<>', '')
                ->get(['id', 'organization_id', 'specialty']);

            foreach ($orphans as $teacher) {
                $subjectId = DB::table('subjects')
                    ->where('organization_id', $teacher->organization_id)
                    ->whereRaw('LOWER(name) = LOWER(?)', [$teacher->specialty])
                    ->value('id');

                if ($subjectId === null) {
                    continue;
                }

                $fromSpecialty += DB::table('teachers')
                    ->where('id', $teacher->id)
                    ->update(['subject_id' => $subjectId]);
            }
        });

        Schema::table('teachers', function (Blueprint $table): void {
            // nullOnDelete, igual que el vínculo con la cuenta: al retirar una
            // asignatura, la ficha del profesor y su historial sobreviven; lo que
            // pierde es el acceso, que es la dirección segura.
            $table->foreign('subject_id')
                ->references('id')
                ->on('subjects')
                ->nullOnDelete();
        });

        $this->report($fromGroups, $fromSpecialty);
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table): void {
            $table->dropForeign(['subject_id']);
            $table->dropIndex(['subject_id']);
            $table->dropColumn('subject_id');
        });
    }

    private function report(int $fromGroups, int $fromSpecialty): void
    {
        $pending = DB::table('teachers')->whereNull('subject_id')->count();

        $lines = [
            'materia asignada desde sus grupos : '.$fromGroups,
            'materia asignada desde specialty  : '.$fromSpecialty,
            'fichas SIN materia (sin acceso)   : '.$pending,
        ];

        foreach ($lines as $line) {
            if (app()->runningInConsole() && ! app()->runningUnitTests()) {
                echo '    '.$line.PHP_EOL;
            }
        }
    }
};
