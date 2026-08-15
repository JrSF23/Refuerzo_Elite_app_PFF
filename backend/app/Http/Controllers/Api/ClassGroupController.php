<?php

namespace App\Http\Controllers\Api;

use App\Models\ClassGroup;
use App\Rules\BelongsToCurrentOrganization;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Validation\Rule;

use Illuminate\Database\Eloquent\Builder;

class ClassGroupController extends BaseApiController
{
    protected string $modelClass = ClassGroup::class;
    protected array $searchable = ['name', 'code', 'academic_year', 'status'];
    protected array $with = ['subject', 'teacher'];
    protected string $entityLabel = 'class_group';

    protected function rules(?int $id = null): array
    {
        return [
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
