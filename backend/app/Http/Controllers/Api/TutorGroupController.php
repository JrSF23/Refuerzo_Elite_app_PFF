<?php

namespace App\Http\Controllers\Api;

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
    protected array $with = ['tutor', 'representative'];

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
