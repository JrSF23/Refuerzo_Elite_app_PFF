<?php

namespace App\Http\Controllers\Api;

use App\Models\ClassGroup;
use App\Rules\BelongsToCurrentOrganization;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TutorGroup;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

use Illuminate\Database\Eloquent\Builder;

class ClassGroupController extends BaseApiController
{
    protected string $modelClass = ClassGroup::class;
    protected array $searchable = ['name', 'code', 'academic_year', 'status'];
    protected array $with = ['tutorGroup', 'subject', 'teacher'];
    protected string $entityLabel = 'class_group';

    /**
     * Acota al aula cuando la petición lo pide.
     *
     * Es lo que permite gestionar las materias DESDE el aula sin traerse los
     * grupos de todo el centro: la pantalla pide `?tutor_group_id=12` y el
     * recorte lo hace el servidor, igual que ya se hacía con los alumnos de un
     * aula. Sin esto, un centro con 200 grupos cargaría los 200 para enseñar
     * cuatro.
     */
    protected function query(): Builder
    {
        $query = parent::query();

        $tutorGroupId = request()->integer('tutor_group_id');

        if ($tutorGroupId !== 0) {
            $query->where('tutor_group_id', $tutorGroupId);
        }

        return $query;
    }

    protected function rules(?int $id = null): array
    {
        return [
            /*
             * El aula de la que cuelga. Nullable por los grupos creados antes de
             * que existiera el vínculo, que no tienen ninguna y a los que no se
             * les inventa.
             *
             * Vía Eloquent y no con `exists:`, que ignora los global scopes y
             * aceptaría un aula de otro centro (FR-009).
             */
            'tutor_group_id' => ['nullable', new BelongsToCurrentOrganization(TutorGroup::class)],

            'subject_id' => ['required', new BelongsToCurrentOrganization(Subject::class)],
            'teacher_id' => ['nullable', new BelongsToCurrentOrganization(Teacher::class)],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('class_groups', 'code')->ignore($id)->where('organization_id', $this->currentOrganizationId())],
            'academic_year' => ['required', 'string', 'max:20'],
            'schedule' => ['nullable', 'string', 'max:255'],
            'capacity' => ['required', 'integer', 'min:1'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }

    /**
     * El profesor solo ve los grupos de su ficha.
     */
    protected function applyTeacherScope(Builder $query): void
    {
        $query->whereIn('id', $this->taughtClassGroupIds());
    }
}
