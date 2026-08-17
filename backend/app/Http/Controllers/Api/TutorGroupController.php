<?php

namespace App\Http\Controllers\Api;

use App\Models\Teacher;
use App\Models\TutorGroup;
use App\Rules\BelongsToCurrentOrganization;
use App\Rules\RepresentativeBelongsToGroup;
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
