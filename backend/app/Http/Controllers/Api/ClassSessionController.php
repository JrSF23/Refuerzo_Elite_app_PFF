<?php

namespace App\Http\Controllers\Api;

use App\Models\ClassSession;

use App\Rules\BelongsToCurrentOrganization;

use App\Models\ClassGroup;

use Illuminate\Database\Eloquent\Builder;

class ClassSessionController extends BaseApiController
{
    protected string $modelClass = ClassSession::class;
    protected array $with = ['classGroup.subject', 'classGroup.teacher'];
    protected string $entityLabel = 'class_session';

    protected function rules(?int $id = null): array
    {
        return [
            'class_group_id' => ['required', new BelongsToCurrentOrganization(ClassGroup::class)],
            'title' => ['required', 'string', 'max:255'],
            'session_date' => ['required', 'date'],
            'starts_at' => ['nullable', 'date_format:H:i'],
            'ends_at' => ['nullable', 'date_format:H:i'],
            'room' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * El profesor solo ve las sesiones de los grupos que imparte.
     */
    protected function applyTeacherScope(Builder $query): void
    {
        $query->whereIn('class_group_id', $this->taughtClassGroupIds());
    }
}
