<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Gestión de organizaciones. Ruta de plataforma: vive fuera del middleware
 * `tenant`, porque el super administrador no pertenece a ninguna organización.
 *
 * No hereda de BaseApiController a propósito: aquel está pensado para entidades
 * tenant-scoped, y aquí el alcance lo determina el rol, no el contexto.
 */
class OrganizationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Organization::class);

        $query = Organization::query()->withCount('users');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Solo `users_count`. No se exponen recuentos de alumnos, pagos ni ninguna
        // otra entidad: FR-013a impide al super administrador conocer el contenido
        // de una organización.
        return response()->json(
            $query->latest()->paginate(min((int) $request->integer('per_page', 10), 50))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Organization::class);

        $data = Validator::make($request->all(), $this->rules())->validate();

        // `status` no es aceptado: toda organización nace activa y suspenderla es
        // un acto deliberado con endpoint propio.
        $organization = Organization::create([
            'name' => $data['name'],
            'slug' => $data['slug'] ?? $this->deriveSlug($data['name']),
            'contact_email' => $data['contact_email'] ?? null,
            'contact_phone' => $data['contact_phone'] ?? null,
        ]);

        // `status` lo fija el DEFAULT de la tabla, no el modelo: hay que releer para
        // que la respuesta refleje el estado real con el que nació.
        $organization->refresh();

        $this->recordPlatformAudit('created', $organization);

        return response()->json($organization->loadCount('users'), 201);
    }

    public function show(int $id): JsonResponse
    {
        $this->authorize('viewAny', Organization::class);

        return response()->json(Organization::query()->withCount('users')->findOrFail($id));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $organization = Organization::query()->findOrFail($id);

        $this->authorize('update', $organization);

        $data = Validator::make($request->all(), $this->rules($id))->validate();

        // `status` no se toca aquí: tiene endpoints propios para que la suspensión
        // sea deliberada y auditable.
        $organization->update([
            'name' => $data['name'],
            'slug' => $data['slug'] ?? $organization->slug,
            'contact_email' => $data['contact_email'] ?? null,
            'contact_phone' => $data['contact_phone'] ?? null,
        ]);

        $this->recordPlatformAudit('updated', $organization);

        return response()->json($organization->loadCount('users'));
    }

    public function destroy(int $id): JsonResponse
    {
        $organization = Organization::query()->findOrFail($id);

        $this->authorize('delete', $organization);

        // Una organización en uso no se borra de un tirón: primero se suspende, que
        // es el acto que corta el acceso de su gente. Así el borrado nunca es una
        // sorpresa para quien está trabajando.
        if ($organization->isActive() && $organization->users()->where('is_active', true)->exists()) {
            return response()->json([
                'message' => __('tenancy.organizations.has_active_users'),
            ], 409);
        }

        $this->recordPlatformAudit('deleted', $organization);

        $organization->delete();

        return response()->json(['message' => __('tenancy.organizations.deleted')]);
    }

    public function suspend(int $id): JsonResponse
    {
        return $this->changeStatus($id, Organization::STATUS_SUSPENDED, 'suspended');
    }

    public function activate(int $id): JsonResponse
    {
        return $this->changeStatus($id, Organization::STATUS_ACTIVE, 'activated');
    }

    /**
     * Idempotente: repetir la operación devuelve 200 sin efecto y sin auditar dos
     * veces. Los usuarios de la organización pierden o recuperan el acceso en su
     * siguiente petición, sin revocar tokens (D11).
     */
    private function changeStatus(int $id, string $status, string $action): JsonResponse
    {
        $organization = Organization::query()->findOrFail($id);

        $this->authorize($status === Organization::STATUS_SUSPENDED ? 'suspend' : 'activate', $organization);

        if ($organization->status !== $status) {
            $organization->forceFill(['status' => $status])->save();
            $this->recordPlatformAudit($action, $organization);
        }

        return response()->json([
            'id' => $organization->id,
            'slug' => $organization->slug,
            'status' => $organization->status,
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function rules(?int $id = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:120', 'regex:/^[a-z0-9-]+$/', Rule::unique('organizations', 'slug')->ignore($id)],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
        ];
    }

    private function deriveSlug(string $name): string
    {
        $base = Str::slug(Str::limit($name, 110, ''));
        $slug = $base;
        $suffix = 2;

        while (Organization::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    /**
     * Auditoría de plataforma.
     *
     * El evento se atribuye a la organización afectada, no a la del actor: el super
     * administrador no tiene ninguna, y `audit_events.organization_id` es
     * obligatorio. Se usa forceCreate porque fuera del middleware `tenant` no hay
     * contexto y el trait no puede rellenarla.
     */
    private function recordPlatformAudit(string $action, Organization $organization): void
    {
        AuditEvent::forceCreate([
            'organization_id' => $organization->getKey(),
            'user_id' => auth()->id(),
            'action' => $action,
            'entity_type' => 'organization',
            'entity_id' => $organization->getKey(),
            'payload' => $organization->only(['name', 'slug', 'status']),
        ]);
    }
}
