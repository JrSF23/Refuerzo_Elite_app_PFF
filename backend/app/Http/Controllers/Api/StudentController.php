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
     * ── Por qué está aquí y no en `query()` ─────────────────────────────────
     *
     * `query()` lo usan TAMBIÉN `show`, `update` y `destroy`. Y `tutor_group_id`
     * no es solo un parámetro de búsqueda: es un campo editable del alumno, así
     * que viaja en el cuerpo de cada edición. Puesto en `query()`, al mover a un
     * alumno de aula se le buscaba filtrando por el aula de DESTINO —donde
     * todavía no está— y no se encontraba: `PUT /students/{id}` devolvía 404 y
     * el alumno se quedaba donde estaba.
     *
     * El efecto era peor que un error visible: editar un alumno funcionaba
     * mientras no le cambiaras el aula. Justo el cambio que se quería hacer era
     * el único que fallaba.
     *
     * Es el mismo patrón que ya se corrigió en `ClassSessionController` y en
     * `AttendanceController`, y la razón de que `applyIndexFilters()` exista: se
     * invoca SOLO desde `index`, de modo que un filtro no puede alcanzar a la
     * búsqueda de un registro concreto.
     *
     * ── Lo que ya hacía bien y se conserva ──────────────────────────────────
     *
     * El identificador se valida contra Eloquent, de modo que el global scope
     * aplique. Un grupo de otra organización NO puede devolver el listado
     * completo por haberse ignorado el parámetro: eso mostraría datos que el
     * usuario pidió acotar y creería estar viendo un grupo ajeno.
     */
    protected function applyIndexFilters(Builder $query): void
    {
        if (! request()->filled('tutor_group_id')) {
            return;
        }

        /*
         * `none` acota a los alumnos SIN grupo. Hace falta un valor explícito
         * porque el ausente ya significa «no filtrar», y sin él no habría forma
         * de listar ni de contar los pendientes de asignar, que tras la
         * migración son todos.
         */
        if (request('tutor_group_id') === 'none') {
            $query->whereNull('tutor_group_id');

            return;
        }

        $groupId = request()->integer('tutor_group_id');

        $belongsToOrganization = TutorGroup::query()->whereKey($groupId)->exists();

        if ($belongsToOrganization) {
            $query->where('tutor_group_id', $groupId);

            return;
        }

        // Grupo inexistente o ajeno: conjunto vacío, nunca el listado entero.
        $query->whereRaw('1 = 0');
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
