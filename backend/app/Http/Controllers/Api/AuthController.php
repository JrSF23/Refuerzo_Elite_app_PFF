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

        if (!$user->hasAnyRole(['admin', 'teacher'])) {
            return response()->json([
                'message' => "Cet espace est réservé à l'administration et aux enseignants.",
            ], 403);
        }

        $token = $user->createToken('frontend')->plainTextToken;

        AuditEvent::query()->create([
            'user_id' => $user->id,
            'action' => 'login',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'payload' => ['ip' => $request->ip(), 'user_agent' => $request->userAgent()],
        ]);

        return response()->json([
            'token' => $token,
            'user' => $user->load('roles'),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('roles'));
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        AuditEvent::query()->create([
            'user_id' => $user->id,
            'action' => 'logout',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'payload' => ['ip' => $request->ip()],
        ]);

        $user->currentAccessToken()?->delete();

        return response()->json(['message' => 'Session fermée.']);
    }
}
