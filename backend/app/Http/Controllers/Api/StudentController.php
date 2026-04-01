<?php

namespace App\Http\Controllers\Api;

use App\Models\Student;
use Illuminate\Validation\Rule;

class StudentController extends BaseApiController
{
    protected string $modelClass = Student::class;
    protected array $searchable = ['first_name', 'last_name', 'email', 'phone', 'school_name'];
    protected array $with = ['guardian'];
    protected string $entityLabel = 'student';

    protected function rules(?int $id = null): array
    {
        return [
            'guardian_id' => ['nullable', 'exists:guardians,id'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', Rule::unique('students', 'email')->ignore($id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'date_of_birth' => ['nullable', 'date'],
            'school_name' => ['nullable', 'string', 'max:255'],
            'school_level' => ['nullable', 'string', 'max:100'],
            'status' => ['required', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
