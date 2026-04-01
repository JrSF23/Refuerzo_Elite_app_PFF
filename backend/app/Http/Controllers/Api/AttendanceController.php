<?php

namespace App\Http\Controllers\Api;

use App\Models\Attendance;
use Illuminate\Validation\Rule;

class AttendanceController extends BaseApiController
{
    protected string $modelClass = Attendance::class;
    protected array $with = ['classSession.classGroup', 'student'];
    protected string $entityLabel = 'attendance';

    protected function rules(?int $id = null): array
    {
        return [
            'class_session_id' => ['required', 'exists:class_sessions,id'],
            'student_id' => [
                'required',
                'exists:students,id',
                Rule::unique('attendances')->ignore($id)->where(fn ($query) => $query->where('class_session_id', request('class_session_id'))),
            ],
            'status' => ['required', 'in:present,absent,late'],
            'comment' => ['nullable', 'string'],
        ];
    }
}
