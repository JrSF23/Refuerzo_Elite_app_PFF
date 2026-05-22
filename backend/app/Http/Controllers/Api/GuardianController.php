<?php

namespace App\Http\Controllers\Api;

use App\Models\Guardian;
use Illuminate\Validation\Rule;

class GuardianController extends BaseApiController
{
    protected string $modelClass = Guardian::class;
    protected array $searchable = ['first_name', 'last_name', 'email', 'phone'];
    protected string $entityLabel = 'guardian';

    protected function rules(?int $id = null): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', Rule::unique('guardians', 'email')->ignore($id)],
            'phone' => ['required', 'string', 'max:30'],
            'relationship_label' => ['required', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
