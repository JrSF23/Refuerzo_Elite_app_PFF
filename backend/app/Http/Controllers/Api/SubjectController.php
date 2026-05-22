<?php

namespace App\Http\Controllers\Api;

use App\Models\Subject;
use Illuminate\Validation\Rule;

class SubjectController extends BaseApiController
{
    protected string $modelClass = Subject::class;
    protected array $searchable = ['name', 'code', 'level'];
    protected string $entityLabel = 'subject';

    protected function rules(?int $id = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('subjects', 'code')->ignore($id)],
            'level' => ['nullable', 'string', 'max:100'],
            'monthly_fee' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
        ];
    }
}
