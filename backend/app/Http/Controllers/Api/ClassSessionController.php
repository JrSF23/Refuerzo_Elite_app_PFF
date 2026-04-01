<?php

namespace App\Http\Controllers\Api;

use App\Models\ClassSession;

class ClassSessionController extends BaseApiController
{
    protected string $modelClass = ClassSession::class;
    protected array $with = ['classGroup.subject', 'classGroup.teacher'];
    protected string $entityLabel = 'class_session';

    protected function rules(?int $id = null): array
    {
        return [
            'class_group_id' => ['required', 'exists:class_groups,id'],
            'title' => ['required', 'string', 'max:255'],
            'session_date' => ['required', 'date'],
            'starts_at' => ['nullable', 'date_format:H:i'],
            'ends_at' => ['nullable', 'date_format:H:i'],
            'room' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
