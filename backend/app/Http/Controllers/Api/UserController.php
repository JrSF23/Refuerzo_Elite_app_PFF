<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Scopes\OrganizationScope;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Gestión de cuentas. Ruta de plataforma, fuera del middleware `tenant`.
 *
 * En esta fase implementa el alcance del **super administrador**: cuentas de
 * cualquier organización, y `organization_id` indicable en el alta. El alcance
 * del `org_admin` —restringido a su organización y con el `organization_id` del
 * cliente ignorado— llega en US4.
 */
class UserController extends Controller
{
    /** Roles que puede asignar cada perfil. El org_admin no puede escalar. */
    private const PLATFORM_ASSIGNABLE_ROLES = ['super_admin', 'org_admin', 'teacher'];

    private const ORGANIZATION_ASSIGNABLE_ROLES = ['org_admin', 'teacher'];

    /**
     * ¿Opera quien llama sobre toda la plataforma?
     *
     * Se decide por el **rol**, nunca por la ausencia de organización. Derivarlo de
     * `organization_id === null` era una escalada de privilegios: un `org_admin`
     * que se quedara sin organización pasaba a tener alcance de plataforma, y con
     * él la capacidad de crear cuentas `super_admin`.
     */
    private function isPlatformAdmin(): bool
    {
        return request()->user()->hasRole('super_admin');
    }

    /**
     * Organización a la que queda acotada la petición.
     *
     * `null` solo para el administrador de plataforma. Para el resto se toma **del
     * usuario autenticado**, nunca de la petición (FR-005). Esta ruta no pasa por
     * el middleware `tenant` —la comparte el super administrador, que no tiene
     * organización—, así que el contexto se resuelve aquí.
     */
    private function scopeOrganizationId(): ?int
    {
        if ($this->isPlatformAdmin()) {
            return null;
        }

        $organizationId = request()->user()->organization_id;

        // Quien no es de plataforma y no tiene organización no opera sobre ninguna
        // cuenta. Es la misma puerta que EnsureTenantContext aplica a las rutas de
        // negocio (FR-010) y que esta ruta de plataforma no atraviesa.
        if ($organizationId === null) {
            abort(403, __('tenancy.access.no_organization'));
        }

        return $organizationId;
    }

    /**
     * Consulta de cuentas acotada al alcance de quien pregunta.
     */
    private function scopedQuery()
    {
        $query = User::query()->with('roles');
        $organizationId = $this->scopeOrganizationId();

        if ($organizationId !== null) {
            $query->where('organization_id', $organizationId);
        }

        return $query;
    }

    public function index(Request $request): JsonResponse
    {
        $query = $this->scopedQuery();

        // El filtro por organización solo tiene sentido para la plataforma: el
        // org_admin ya está acotado y el parámetro se ignora.
        if ($this->isPlatformAdmin() && $request->filled('organization_id')) {
            $query->where('organization_id', $request->integer('organization_id'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json(
            $query->latest()->paginate(min((int) $request->integer('per_page', 10), 50))
        );
    }

    public function show(int $id): JsonResponse
    {
        // findOrFail sobre la consulta acotada: una cuenta de otra organización
        // responde como inexistente, no como prohibida (FR-008).
        return response()->json($this->scopedQuery()->findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        // Guarda previa a la validación: quien no es de plataforma y no tiene
        // organización no tiene ámbito en el que crear una cuenta, así que se le
        // cierra el paso con 403 antes de mirar el cuerpo. En las demás acciones la
        // guarda ya la aplica scopedQuery().
        $this->scopeOrganizationId();

        $data = Validator::make($request->all(), $this->rules())->validate();

        $user = new User();
        $user->fill([
            'name' => $data['name'],
            'username' => $data['username'],
            'email' => $data['email'],
            'password' => $data['password'],
            'is_active' => $data['is_active'] ?? true,
        ]);

        // `organization_id` no está en $fillable a propósito. Para el org_admin se
        // toma de SU organización y el valor que venga en la petición se descarta
        // sin más: no es un error de permisos, sencillamente no se usa (FR-018).
        $user->forceFill([
            'organization_id' => $this->isPlatformAdmin()
                ? ($data['organization_id'] ?? null)
                : $this->scopeOrganizationId(),
        ])->save();

        $user->syncRoles([$data['role']]);

        if (! empty($data['teacher_id'])) {
            $this->linkTeacherProfile($user, (int) $data['teacher_id']);
        }

        return response()->json($user->load('roles'), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $this->scopedQuery()->findOrFail($id);

        $data = Validator::make($request->all(), $this->rules($id, partial: true))->validate();

        $user->fill(array_filter(
            [
                'name' => $data['name'] ?? null,
                'username' => $data['username'] ?? null,
                'email' => $data['email'] ?? null,
                'password' => $data['password'] ?? null,
            ],
            static fn ($value): bool => $value !== null
        ));

        if (array_key_exists('is_active', $data)) {
            $user->is_active = (bool) $data['is_active'];
        }

        // Solo la plataforma puede mover una cuenta de organización. Para el
        // org_admin el campo se ignora, igual que en el alta.
        if ($this->isPlatformAdmin() && array_key_exists('organization_id', $data)) {
            $user->forceFill(['organization_id' => $data['organization_id']]);
        }

        $user->save();

        if (! empty($data['role'])) {
            $user->syncRoles([$data['role']]);
        }

        if (array_key_exists('teacher_id', $data)) {
            $this->linkTeacherProfile($user, $data['teacher_id'] === null ? null : (int) $data['teacher_id']);
        }

        return response()->json($user->load('roles'));
    }

    public function destroy(int $id): JsonResponse
    {
        $user = $this->scopedQuery()->findOrFail($id);

        // La ficha de profesor sobrevive al borrado de la cuenta: su historial
        // docente no depende de que la persona tenga acceso (nullOnDelete).
        $user->delete();

        return response()->json(['message' => __('tenancy.users.deleted')]);
    }

    /**
     * Vincula —o desvincula— la ficha de profesor de una cuenta.
     *
     * La relación es uno a uno: se libera cualquier ficha que tuviera antes esta
     * cuenta antes de asignar la nueva (FR-015b).
     */
    private function linkTeacherProfile(User $user, ?int $teacherId): void
    {
        $this->teacherQuery()->where('user_id', $user->getKey())->update(['user_id' => null]);

        if ($teacherId === null) {
            return;
        }

        $this->teacherQuery()->where('id', $teacherId)->update(['user_id' => $user->getKey()]);
    }

    /**
     * Consulta de fichas sin el filtro de organización.
     *
     * Es deliberado y está acotado: esta ruta es de plataforma y no tiene contexto
     * de tenant, así que el scope devolvería cero filas en HTTP. La pertenencia a
     * la organización correcta la impone la validación de `teacher_id`, no el
     * scope.
     */
    private function teacherQuery()
    {
        return Teacher::query()->withoutGlobalScope(OrganizationScope::class);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?int $id = null, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:255'],
            'username' => [$required, 'string', 'max:100', Rule::unique('users', 'username')->ignore($id)],
            // Único global: una persona en dos centros necesita dos correos
            // distintos, porque cada cuenta pertenece a una sola organización (Q1).
            'email' => [$required, 'email', 'max:255', Rule::unique('users', 'email')->ignore($id)],
            'password' => [$partial ? 'nullable' : 'required', 'string', 'min:8'],
            'role' => [$required, Rule::in($this->isPlatformAdmin()
                ? self::PLATFORM_ASSIGNABLE_ROLES
                : self::ORGANIZATION_ASSIGNABLE_ROLES)],
            'is_active' => ['nullable', 'boolean'],
            'organization_id' => [
                // FR-004: toda cuenta pertenece exactamente a una organización,
                // salvo los super administradores de plataforma, que no pertenecen
                // a ninguna. Solo la plataforma puede indicarla; para el org_admin
                // se ignora y se toma la suya, así que no se le exige.
                Rule::requiredIf(fn (): bool => ! $partial
                    && $this->isPlatformAdmin()
                    && request('role') !== 'super_admin'),
                'nullable',
                Rule::exists('organizations', 'id')->whereNull('deleted_at'),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value !== null && request('role') === 'super_admin') {
                        $fail(__('tenancy.users.platform_admin_without_organization'));
                    }
                },
            ],
            'teacher_id' => [
                'nullable',
                'integer',
                function (string $attribute, mixed $value, \Closure $fail) use ($id): void {
                    if ($value === null) {
                        return;
                    }

                    $teacher = $this->teacherQuery()->find($value);

                    if ($teacher === null) {
                        $fail('validation.exists')->translate(['attribute' => 'teacher']);

                        return;
                    }

                    // La ficha debe pertenecer a la organización de la cuenta. Para
                    // el org_admin esa organización es la suya, no la que venga en
                    // la petición.
                    $organizationId = $this->isPlatformAdmin()
                        ? (request()->integer('organization_id') ?: User::query()->whereKey($id)->value('organization_id'))
                        : $this->scopeOrganizationId();

                    if ((int) $teacher->organization_id !== (int) $organizationId) {
                        $fail(__('tenancy.users.teacher_profile_other_organization'));

                        return;
                    }

                    // Uno a uno: la ficha no puede estar ya tomada por otra cuenta.
                    if ($teacher->user_id !== null && (int) $teacher->user_id !== (int) $id) {
                        $fail(__('tenancy.users.teacher_profile_already_linked'));
                    }
                },
            ],
        ];
    }
}
