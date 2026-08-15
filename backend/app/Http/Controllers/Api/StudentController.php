<?php

namespace App\Http\Controllers\Api;

use App\Models\Student;
use App\Rules\BelongsToCurrentOrganization;
use App\Models\Guardian;
use Illuminate\Validation\Rule;

use Illuminate\Database\Eloquent\Builder;

class StudentController extends BaseApiController
{
    protected string $modelClass = Student::class;
    protected array $searchable = ['first_name', 'last_name', 'email', 'phone', 'school_name'];
    protected array $with = ['guardian'];
    protected string $entityLabel = 'student';

    protected function rules(?int $id = null): array
    {
        return [
            'guardian_id' => ['nullable', new BelongsToCurrentOrganization(Guardian::class)],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', Rule::unique('students', 'email')->ignore($id)->where('organization_id', $this->currentOrganizationId())],
            'phone' => ['nullable', 'string', 'max:30'],
            'date_of_birth' => ['nullable', 'date'],
            'school_name' => ['nullable', 'string', 'max:255'],
            'school_level' => ['nullable', 'string', 'max:100'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * El profesor solo ve los alumnos matriculados en los grupos que imparte.
     */
    protected function applyTeacherScope(Builder $query): void
    {
        $groupIds = $this->taughtClassGroupIds();

        $query->whereHas(
            'enrollments',
            fn (Builder $enrollments) => $enrollments->whereIn('class_group_id', $groupIds)
        );
    }
}
