<?php

namespace App\Http\Controllers\Api;

use App\Models\Subject;
use App\Models\Teacher;
use App\Rules\BelongsToCurrentOrganization;
use Illuminate\Validation\Rule;

class TeacherController extends BaseApiController
{
    protected string $modelClass = Teacher::class;
    protected array $searchable = ['first_name', 'last_name', 'email', 'specialty'];
    // Se carga la materia para que el listado pueda mostrar su nombre sin una
    // consulta por fila.
    protected array $with = ['subject'];
    protected string $entityLabel = 'teacher';

    protected function rules(?int $id = null): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', Rule::unique('teachers', 'email')->ignore($id)->where('organization_id', $this->currentOrganizationId())],
            'phone' => ['nullable', 'string', 'max:30'],
            'specialty' => ['nullable', 'string', 'max:255'],
            // La materia que imparte. De ella depende a qué grupos llega el
            // profesor (ver App\Support\TeacherScope), así que se valida contra
            // las asignaturas de SU organización: `exists:` no serviría, porque
            // ignora los global scopes y aceptaría una de otro centro (FR-009).
            //
            // Nullable a propósito: una ficha sin materia es un estado legítimo
            // —la ficha existe, el profesor todavía no imparte— y lo que provoca
            // es que no alcance ningún grupo, no un error al guardar.
            'subject_id' => ['nullable', new BelongsToCurrentOrganization(Subject::class)],
            'bio' => ['nullable', 'string'],
        ];
    }
}
