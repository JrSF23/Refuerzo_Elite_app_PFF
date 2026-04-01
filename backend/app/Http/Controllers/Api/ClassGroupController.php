<?php

namespace App\Http\Controllers\Api;

use App\Models\ClassGroup;
use Illuminate\Validation\Rule;

class ClassGroupController extends BaseApiController
{
    protected string $modelClass = ClassGroup::class;
    protected array $searchable = ['name', 'code', 'academic_year', 'status'];
    protected array $with = ['subject', 'teacher'];
    protected string $entityLabel = 'class_group';

    protected function rules(?int $id = null): array
    {
        return [
            'subject_id' => ['required', 'exists:subjects,id'],
            'teacher_id' => ['nullable', 'exists:teachers,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('class_groups', 'code')->ignore($id)],
            'academic_year' => ['required', 'string', 'max:20'],
            'schedule' => ['nullable', 'string', 'max:255'],
            'capacity' => ['required', 'integer', 'min:1'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'status' => ['required', 'string', 'max:50'],
        ];
    }
}
