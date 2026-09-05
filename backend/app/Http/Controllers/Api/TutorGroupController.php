<?php

namespace App\Http\Controllers\Api;

use App\Models\Stage;
use App\Models\Teacher;
use App\Models\TutorGroup;
use App\Rules\BelongsToCurrentOrganization;
use App\Rules\RepresentativeBelongsToGroup;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\Rule;

class TutorGroupController extends BaseApiController
{
    protected string $modelClass = TutorGroup::class;

    protected array $searchable = ['name'];

    /**
     * Cargados de antemano: la cabecera de cada bloque necesita tutor y delegado,
     * y sin esto habría una consulta por grupo (FR-015).
     */
    protected array $with = ['tutor', 'representative', 'stage'];

    protected string $entityLabel = 'tutor_group';

    /**
     * Recuento REAL de alumnos por grupo.
     *
     * Es lo que permite que el índice de grupos diga la verdad. Sin esto, la
     * cifra tendría que salir de la página de alumnos cargada, y con 500 alumnos
     * paginados de 20 en 20 un grupo de 30 aparecería como «2 alumnos».
     *
     * `withCount` resuelve con una subconsulta agregada, así que no añade una
     * consulta por grupo.
     */
    protected function query(): Builder
    {
        return parent::query()
            ->withCount('students')
            /*
             * Orden académico del centro. `BaseApiController::index` añade
             * después su `latest()`, que queda como desempate por fecha; el
             * criterio principal es este porque se declara primero.
             *
             * Sin esto los grupos salen por fecha de creación, que no significa
             * nada para quien busca «1º ESO» en una lista de veinte aulas
             * (FR-031). El nombre y el turno desempatan para que la lista no
             * parezca moverse sola cuando dos comparten `sort_order`.
             */
            ->orderBy('sort_order')
            ->orderBy('name')
            ->orderBy('shift');
    }

    /**
     * El profesor solo ve las aulas donde imparte.
     *
     * Faltaba, y era la única sección legible por el profesor que no recortaba
     * nada: veía las aulas del centro entero, incluidas aquellas en las que no
     * da clase. No era una fuga de datos sensibles —el aula no lleva ningún campo
     * monetario, por eso puede leerla— pero sí ruido que no le pertenece, y una
     * incoherencia con el resto de la aplicación, donde todo lo suyo está
     * recortado por lo que imparte.
     *
     * «Donde imparte» se resuelve por sus grupos de asignatura, no por
     * `tutor_teacher_id`: ser tutor de un aula y dar clase en ella son cosas
     * distintas, y lo que gobierna el alcance en todo el proyecto es lo segundo.
     */
    protected function applyTeacherScope(Builder $query): void
    {
        $query->whereHas(
            'classGroups',
            fn (Builder $groups) => $groups->whereIn('id', $this->taughtClassGroupIds())
        );
    }

    protected function rules(?int $id = null): array
    {
        return [
            /*
             * La unicidad se acota AQUÍ, en el servidor, y no se deja al índice
             * de la base de datos. Si se dejara, el error de clave duplicada
             * delataría la existencia de un grupo de otro centro (FR-004).
             *
             * Incluye `shift` porque «1º ESO mañana» y «1º ESO tarde» son grupos
             * distintos y sin él chocarían.
             */
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('tutor_groups', 'name')
                    ->ignore($id)
                    ->where('organization_id', $this->currentOrganizationId())
                    ->where('shift', request('shift'))
                    ->where('academic_year', request('academic_year'))
                    ->whereNull('deleted_at'),
            ],

            /*
             * Etapa del aula, de la que sale la cuota de sus alumnos.
             *
             * Nullable: un aula existe antes de que el centro haya configurado
             * sus etapas, y exigirla dejaría sin poder guardar los grupos que ya
             * están creados. Lo que provoca un aula sin etapa es que sus alumnos
             * no tengan cuota, no un error al guardar.
             *
             * Vía Eloquent y no con `exists:`, que ignora los global scopes y
             * aceptaría la etapa —y el precio— de otro centro (FR-009).
             */
            'stage_id' => ['nullable', new BelongsToCurrentOrganization(Stage::class)],

            'shift' => ['required', Rule::in(TutorGroup::SHIFTS)],

            'academic_year' => ['required', 'string', 'max:20'],

            // Vía Eloquent para que el global scope aplique: con `exists:` de
            // Laravel, que usa el query builder, un profesor ajeno pasaría.
            'tutor_teacher_id' => ['nullable', new BelongsToCurrentOrganization(Teacher::class)],

            'representative_student_id' => ['nullable', new RepresentativeBelongsToGroup($id)],

            'sort_order' => ['nullable', 'integer', 'min:0'],

            'status' => ['required', Rule::in(TutorGroup::STATUSES)],
        ];
    }
}
