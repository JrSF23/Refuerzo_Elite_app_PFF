<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\RecordsAuditEvents;
use App\Http\Controllers\Controller;
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

    protected function query(): Builder
    {
        /** @var Model $model */
        $model = new $this->modelClass();

        return $model->newQuery()->with($this->with);
    }

    public function index(Request $request): JsonResponse
    {
        $query = $this->query();

        if ($request->filled('search') && $this->searchable !== []) {
            $search = $request->string('search')->toString();

            $query->where(function (Builder $builder) use ($search): void {
                foreach ($this->searchable as $field) {
                    $builder->orWhere($field, 'like', "%{$search}%");
                }
            });
        }

        return response()->json(
            $query->latest()->paginate(min((int) $request->integer('per_page', 10), 50))
        );
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->query()->findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $record = $this->query()->getModel()->create(
            Validator::make($request->all(), $this->rules())->validate()
        )->load($this->with);

        $this->recordAudit('created', $this->entityLabel, $record->getKey(), $record->toArray());

        return response()->json($record, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $record = $this->query()->findOrFail($id);
        $record->update(Validator::make($request->all(), $this->rules($id))->validate());
        $record->load($this->with);

        $this->recordAudit('updated', $this->entityLabel, $record->getKey(), $record->toArray());

        return response()->json($record);
    }

    public function destroy(int $id): JsonResponse
    {
        $record = $this->query()->findOrFail($id);
        $snapshot = $record->toArray();
        $record->delete();

        $this->recordAudit('deleted', $this->entityLabel, $id, $snapshot);

        return response()->json(['message' => ucfirst($this->entityLabel).' deleted successfully.']);
    }
}
