<?php

namespace App\Http\Controllers\Api;

use App\Models\Enrollment;
use App\Rules\BelongsToCurrentOrganization;
use App\Models\Student;
use App\Models\ClassGroup;
use Illuminate\Validation\Rule;

class EnrollmentController extends BaseApiController
{
    protected string $modelClass = Enrollment::class;
    protected array $with = ['student', 'classGroup.subject', 'classGroup.teacher'];
    protected string $entityLabel = 'enrollment';

    protected function rules(?int $id = null): array
    {
        return [
            'student_id' => ['required', new BelongsToCurrentOrganization(Student::class)],
            'class_group_id' => [
                'required',
                new BelongsToCurrentOrganization(ClassGroup::class),
                Rule::unique('enrollments')->ignore($id)->where(fn ($query) => $query->where('student_id', request('student_id'))),
            ],
            'enrolled_at' => ['required', 'date'],
            'monthly_fee' => ['required', 'numeric', 'min:0'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'notes' => ['nullable', 'string'],
        ];
    }
}
