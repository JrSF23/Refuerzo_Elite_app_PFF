<?php

namespace App\Http\Controllers\Api;

use App\Models\Enrollment;
use Illuminate\Validation\Rule;

class EnrollmentController extends BaseApiController
{
    protected string $modelClass = Enrollment::class;
    protected array $with = ['student', 'classGroup.subject', 'classGroup.teacher'];
    protected string $entityLabel = 'enrollment';

    protected function rules(?int $id = null): array
    {
        return [
            'student_id' => ['required', 'exists:students,id'],
            'class_group_id' => [
                'required',
                'exists:class_groups,id',
                Rule::unique('enrollments')->ignore($id)->where(fn ($query) => $query->where('student_id', request('student_id'))),
            ],
            'enrolled_at' => ['required', 'date'],
            'monthly_fee' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
