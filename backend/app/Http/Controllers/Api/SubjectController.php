<?php

namespace App\Http\Controllers\Api;

use App\Models\Subject;
use App\Rules\BelongsToCurrentOrganization;
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
            'code' => ['required', 'string', 'max:50', Rule::unique('subjects', 'code')->ignore($id)->where('organization_id', $this->currentOrganizationId())],
            'level' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
        ];
    }
}
