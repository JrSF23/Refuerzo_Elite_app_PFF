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
    /**
     * Se busca por el alumno y por la sesión, que es como se pregunta: «la falta
     * de Ana» o «la asistencia del repaso del martes». `comment` es la única
     * columna propia con texto y no se incluye: nadie recuerda una asistencia por
     * lo que se anotó en ella.
     */
    protected array $searchable = [
        'student.first_name',
        'student.last_name',
        'classSession.title',
        'classSession.classGroup.name',
    ];
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
            // `excused` es la falta JUSTIFICADA, y es un estado por derecho propio: no
            // es una ausencia sin más —el centro sabe por qué— ni cuenta como haber
            // asistido. La columna es un `string` sin restricción en base, así que
            // admitirlo no necesitó migración; la lista de aquí es la única puerta.
            'status' => ['required', Rule::in(['present', 'absent', 'late', 'excused'])],
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
