<?php

namespace App\Http\Controllers\Api;

use App\Models\Student;
use App\Rules\BelongsToCurrentOrganization;
use App\Models\Guardian;
use App\Models\TutorGroup;
use Illuminate\Validation\Rule;

use Illuminate\Database\Eloquent\Builder;

class StudentController extends BaseApiController
{
    protected string $modelClass = Student::class;
    protected array $searchable = ['first_name', 'last_name', 'email', 'phone', 'school_name'];
    /**
     * `tutorGroup.tutor` es la diferencia entre una consulta y varios cientos:
     * la cabecera de cada bloque muestra el tutor, y sin carga ansiosa habría una
     * consulta por alumno (FR-016, SC-002).
     */
    protected array $with = ['guardian', 'tutorGroup.tutor'];
    protected string $entityLabel = 'student';

    protected function rules(?int $id = null): array
    {
        return [
            'guardian_id' => ['nullable', new BelongsToCurrentOrganization(Guardian::class)],
            'tutor_group_id' => ['nullable', new BelongsToCurrentOrganization(TutorGroup::class)],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', Rule::unique('students', 'email')->ignore($id)->where('organization_id', $this->currentOrganizationId())],
            'phone' => ['nullable', 'string', 'max:30'],
            'date_of_birth' => ['nullable', 'date'],
            'school_name' => ['nullable', 'string', 'max:255'],
            'school_level' => ['nullable', 'string', 'max:100'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * Filtro por grupo tutorial.
     *
     * Se implementa AQUÍ y no de forma genérica en `BaseApiController`: un
     * mecanismo de filtros sin más consumidor que este sería una capa sin
     * justificar (Principio IV). Cuando aparezca el segundo caso, se generaliza.
     *
     * El identificador se valida contra Eloquent, de modo que el global scope
     * aplique. Un grupo de otra organización NO puede devolver el listado
     * completo por haberse ignorado el parámetro: eso mostraría datos que el
     * usuario pidió acotar y creería estar viendo un grupo ajeno.
     */
    protected function query(): Builder
    {
        $query = parent::query();

        if (! request()->filled('tutor_group_id')) {
            return $query;
        }

        $groupId = request()->integer('tutor_group_id');

        $belongsToOrganization = TutorGroup::query()->whereKey($groupId)->exists();

        return $belongsToOrganization
            ? $query->where('tutor_group_id', $groupId)
            // Grupo inexistente o ajeno: conjunto vacío, nunca el listado entero.
            : $query->whereRaw('1 = 0');
    }

    /**
     * El profesor solo ve los alumnos matriculados en los grupos que imparte.
     */
    protected function applyTeacherScope(Builder $query): void
    {
        $groupIds = $this->taughtClassGroupIds();

        $query->whereHas(
            'enrollments',
            fn (Builder $enrollments) => $enrollments->whereIn('class_group_id', $groupIds)
        );
    }
}
