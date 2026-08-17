<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAnyRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || $roles === [] || !$user->hasAnyRole($roles)) {
            return new JsonResponse([
                'message' => __('tenancy.access.role_denied'),
            ], 403);
        }

        return $next($request);
    }
}
