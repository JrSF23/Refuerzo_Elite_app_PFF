<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController
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
                'message' => "Cet espace est reserve a l'administration et aux enseignants.",
            ], 403);
        }

        return response()->json([
            'token' => $user->createToken('frontend')->plainTextToken,
            'user' => $user->load('roles'),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('roles'));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Session fermee.']);
    }
}
