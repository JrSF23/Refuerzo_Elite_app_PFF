<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\RecordsAuditEvents;
use App\Http\Controllers\Controller;
use App\Support\OrganizationContext;
use App\Support\TeacherScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

abstract class BaseApiController extends Controller
{
    use RecordsAuditEvents;

    protected string $modelClass;
    protected array $searchable = [];
    protected array $with = [];
    protected string $entityLabel = 'resource';

    abstract protected function rules(?int $id = null): array;

    /**
     * Organización activa de la petición, para acotar las reglas `unique`.
     *
     * `unique` se construye sobre el query builder y no respeta los global scopes,
     * así que la restricción tiene que aplicarse aquí, antes de llegar a la base de
     * datos: si se dejara a la capa SQL, el error de clave duplicada revelaría la
     * existencia de un registro ajeno (FR-020).
     */
    protected function currentOrganizationId(): ?int
    {
        return app(OrganizationContext::class)->id();
    }

    protected function query(): Builder
    {
        /** @var Model $model */
        $model = new $this->modelClass();

        $query = $model->newQuery()->with($this->with);

        if ($this->currentUserIsTeacher()) {
            $this->applyTeacherScope($query);
        }

        return $query;
    }

    /**
     * Acota la consulta a lo que el profesor imparte.
     *
     * Gancho para que cada controlador exprese su propio recorte sin duplicar la
     * lógica de resolución. Por defecto no recorta nada: las entidades a las que el
     * profesor no llega las corta antes su policy.
     */
    protected function applyTeacherScope(Builder $query): void
    {
    }

    protected function currentUserIsTeacher(): bool
    {
        $user = request()->user();

        return $user !== null && $user->hasRole('teacher') && ! $user->hasRole('org_admin');
    }

    /**
     * Identificadores de los grupos que imparte el usuario actual.
     *
     * Delega en `TeacherScope`, la misma definición que usan las policies para
     * autorizar. Antes había aquí una segunda copia de la regla, y una copia que
     * decide lo mismo en dos sitios acaba divergiendo: el día que lo hiciera, el
     * listado enseñaría grupos que la policy no deja tocar, o al revés.
     *
     * Una ficha sin vincular, sin materia o sin grupos devuelve un array vacío, de
     * modo que todo `whereIn` sobre él da cero resultados: el fallo cierra el
     * acceso en lugar de abrirlo (FR-015c).
     *
     * @return list<int>
     */
    protected function taughtClassGroupIds(): array
    {
        return app(TeacherScope::class)->classGroupIdsFor(request()->user());
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', $this->modelClass);

        $query = $this->query();

        if ($request->filled('search') && $this->searchable !== []) {
            $search = $request->string('search')->toString();

            // Los OR van AGRUPADOS. Sin el paréntesis que impone este `where`
            // anidado, el primer OR se sumaría a las condiciones anteriores
            // —el recorte del profesor, entre ellas— y una búsqueda sacaría a
            // flote registros que ese rol no alcanza.
            $query->where(function (Builder $builder) use ($search): void {
                foreach ($this->searchable as $field) {
                    $this->applySearchTerm($builder, $field, $search);
                }
            });
        }

        return response()->json(
            $query->latest()->paginate(min((int) $request->integer('per_page', 10), 50))
        );
    }

    /**
     * Añade un campo a la búsqueda, sea propio o de una tabla vecina.
     *
     * En matrículas, sesiones, asistencia y pagos lo que la gente teclea NO está
     * en la fila: se busca «Ana Pérez» o «Matemáticas — Tarde A», y esos textos
     * viven en `students` y en `class_groups`. Por eso estas cuatro secciones no
     * tenían búsqueda: declarar sus columnas propias habría dado una caja que casi
     * nunca encuentra nada, que es peor que no tenerla.
     *
     * Un campo con punto es una relación: `student.last_name`, o anidada,
     * `classSession.classGroup.name`. Se parte por el ÚLTIMO punto, de modo que
     * todo lo anterior es el camino de relaciones que `whereHas` ya sabe recorrer.
     *
     * La consulta de la relación pasa por Eloquent, así que **el global scope de
     * organización se aplica también dentro del EXISTS**: buscar por el nombre de
     * un alumno de otro centro no devuelve nada. Con un `join` a pelo no sería
     * así, y la búsqueda se habría convertido en la vía para leer lo ajeno.
     */
    protected function applySearchTerm(Builder $builder, string $field, string $search): void
    {
        $lastDot = strrpos($field, '.');

        if ($lastDot === false) {
            $builder->orWhere($field, 'like', "%{$search}%");

            return;
        }

        $relation = substr($field, 0, $lastDot);
        $column = substr($field, $lastDot + 1);

        $builder->orWhereHas(
            $relation,
            fn (Builder $related) => $related->where($column, 'like', "%{$search}%")
        );
    }

    public function show(int $id): JsonResponse
    {
        // findOrFail primero: un recurso de otra organización debe responder 404,
        // no 403. La policy decide despues quien, dentro del centro, puede verlo.
        $record = $this->query()->findOrFail($id);

        $this->authorize('view', $record);

        return response()->json($record);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', $this->modelClass);

        $record = $this->query()->getModel()->create(
            Validator::make($request->all(), $this->rules())->validate()
        )->load($this->with);

        $this->recordAudit('created', $this->entityLabel, $record->getKey(), $record->toArray());

        return response()->json($record, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $record = $this->query()->findOrFail($id);

        $this->authorize('update', $record);

        $record->update(Validator::make($request->all(), $this->rules($id))->validate());
        $record->load($this->with);

        $this->recordAudit('updated', $this->entityLabel, $record->getKey(), $record->toArray());

        return response()->json($record);
    }

    public function destroy(int $id): JsonResponse
    {
        $record = $this->query()->findOrFail($id);

        $this->authorize('delete', $record);

        $snapshot = $record->toArray();
        $record->delete();

        $this->recordAudit('deleted', $this->entityLabel, $id, $snapshot);

        return response()->json(['message' => __('tenancy.records.deleted')]);
    }
}
