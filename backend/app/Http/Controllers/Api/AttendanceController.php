<?php

namespace App\Http\Controllers\Api;

use App\Models\Attendance;
use App\Rules\BelongsToCurrentOrganization;
use App\Models\ClassSession;
use App\Models\Student;
use Illuminate\Validation\Rule;

use Illuminate\Database\Eloquent\Builder;

class AttendanceController extends BaseApiController
{
    protected string $modelClass = Attendance::class;
    protected array $with = ['classSession.classGroup', 'student'];
    protected string $entityLabel = 'attendance';

    protected function rules(?int $id = null): array
    {
        return [
            'class_session_id' => ['required', new BelongsToCurrentOrganization(ClassSession::class)],
            'student_id' => [
                'required',
                new BelongsToCurrentOrganization(Student::class),
                Rule::unique('attendances')->ignore($id)->where(fn ($query) => $query->where('class_session_id', request('class_session_id'))),
            ],
            'status' => ['required', Rule::in(['present', 'absent', 'late'])],
            'comment' => ['nullable', 'string'],
        ];
    }

    /**
     * El profesor solo ve la asistencia de sus propias sesiones.
     */
    protected function applyTeacherScope(Builder $query): void
    {
        $groupIds = $this->taughtClassGroupIds();

        $query->whereHas(
            'classSession',
            fn (Builder $sessions) => $sessions->whereIn('class_group_id', $groupIds)
        );
    }
}
