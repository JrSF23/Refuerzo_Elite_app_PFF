<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->where('email', $credentials['login'])
            ->orWhere('username', $credentials['login'])
            ->first();

        if (!$user || !$user->is_active || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Identifiants invalides.'], 422);
        }

        // Roles con acceso a la aplicación. `admin` pasó a llamarse `org_admin`
        // en M3; `super_admin` entra para poder gestionar organizaciones.
        if (!$user->hasAnyRole(['super_admin', 'org_admin', 'teacher'])) {
            return response()->json([
                'message' => "Cet espace est réservé à l'administration et aux enseignants.",
            ], 403);
        }

        $token = $user->createToken('frontend')->plainTextToken;

        // El login ocurre fuera de EnsureTenantContext, así que no hay contexto de
        // organización y el trait no puede rellenarla: se toma del propio usuario.
        //
        // El super administrador no pertenece a ninguna organización, y
        // `audit_events.organization_id` es obligatorio, así que su acceso no deja
        // traza aquí. La auditoría de plataforma corresponde a US3.
        if ($user->organization_id !== null) {
            AuditEvent::forceCreate([
                'organization_id' => $user->organization_id,
                'user_id' => $user->id,
                'action' => 'login',
                'entity_type' => 'user',
                'entity_id' => $user->id,
                'payload' => ['ip' => $request->ip(), 'user_agent' => $request->userAgent()],
            ]);
        }

        return response()->json([
            'token' => $token,
            'user' => $user->load('roles'),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles');

        return response()->json(
            $user->toArray() + ['organization' => $this->organizationBlock($user)]
        );
    }

    /**
     * Bloque `organization` de /me: null para el super administrador de plataforma,
     * que no pertenece a ninguna (contrato de organizations-api.md).
     *
     * @return array{id: int, name: string, slug: string, status: string}|null
     */
    private function organizationBlock(\App\Models\User $user): ?array
    {
        $organization = $user->organization;

        if ($organization === null) {
            return null;
        }

        return [
            'id' => $organization->id,
            'name' => $organization->name,
            'slug' => $organization->slug,
            'status' => $organization->status,
        ];
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        // Igual que en login: fuera de EnsureTenantContext no hay contexto, así que
        // la organización se toma del usuario. El super administrador no tiene, y
        // su traza corresponde a la auditoría de plataforma de US3.
        if ($user->organization_id !== null) {
            AuditEvent::forceCreate([
                'organization_id' => $user->organization_id,
                'user_id' => $user->id,
                'action' => 'logout',
                'entity_type' => 'user',
                'entity_id' => $user->id,
                'payload' => ['ip' => $request->ip()],
            ]);
        }

        $user->currentAccessToken()?->delete();

        return response()->json(['message' => 'Session fermée.']);
    }
}
