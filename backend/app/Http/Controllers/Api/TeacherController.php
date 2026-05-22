<?php

namespace App\Http\Controllers\Api;

use App\Models\Teacher;
use Illuminate\Validation\Rule;

class TeacherController extends BaseApiController
{
    protected string $modelClass = Teacher::class;
    protected array $searchable = ['first_name', 'last_name', 'email', 'specialty'];
    protected string $entityLabel = 'teacher';

    protected function rules(?int $id = null): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', Rule::unique('teachers', 'email')->ignore($id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string'],
        ];
    }
}
