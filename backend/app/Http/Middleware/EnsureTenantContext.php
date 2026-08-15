<?php

namespace App\Http\Middleware;

use App\Models\Organization;
use App\Support\OrganizationContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resuelve la organización activa a partir del usuario autenticado y la deposita
 * en OrganizationContext. Se sitúa tras auth:sanctum.
 *
 * La organización se deriva SIEMPRE del usuario, nunca de un valor enviado por el
 * cliente (FR-005, FR-006). Como se resuelve en cada petición, un cambio de
 * situación de la organización corta el acceso en la siguiente sin necesidad de
 * revocar tokens (FR-011).
 *
 * `deleted_at` y `status` son condiciones INDEPENDIENTES: el contexto solo se
 * establece cuando se cumplen las tres a la vez —la organización existe,
 * deleted_at IS NULL y status = active—. Ninguna suple a la otra: una
 * organización borrada lógicamente con status = active no da acceso, y una
 * suspendida sin borrar tampoco.
 */
class EnsureTenantContext
{
    public function __construct(private readonly OrganizationContext $context)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        // Condición 1 — el usuario pertenece a una organización.
        // Un super_admin no llega hasta aquí: sus rutas viven fuera de este
        // middleware. Si llegara, se le deniega igual (FR-010).
        $organizationId = $user->organization_id;

        if ($organizationId === null) {
            abort(403, __('tenancy.access.no_organization'));
        }

        // Condición 2 — la organización existe y no está borrada lógicamente.
        // Deliberadamente SIN withTrashed(): una organización borrada no puede
        // reaparecer como contexto válido. El whereNull es redundante con el
        // global scope de SoftDeletes y está puesto a propósito, para que la
        // condición siga siendo explícita aunque alguien retire el trait.
        $organization = Organization::query()
            ->whereNull('deleted_at')
            ->find($organizationId);

        if (! $organization instanceof Organization) {
            abort(403, __('tenancy.access.organization_unavailable'));
        }

        // Condición 3 — la organización está activa.
        if (! $organization->isActive()) {
            abort(403, __('tenancy.access.organization_suspended'));
        }

        $this->context->set($organization);

        return $next($request);
    }
}
