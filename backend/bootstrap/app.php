<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Antes que nada: los mensajes de error de las peticiones que fallan en
        // el propio middleware —rol denegado, organización suspendida— también
        // tienen que salir en el idioma pedido.
        $middleware->prepend(\App\Http\Middleware\SetLocaleFromRequest::class);

        // No hay adonde redirigir a un invitado: la pantalla de acceso es del
        // frontend, no de Laravel. El valor por omisión del framework es
        // `fn () => route('login')`, y esa ruta aquí no existe.
        $middleware->redirectGuestsTo(fn () => null);

        $middleware->alias([
            'role.any' => \App\Http\Middleware\EnsureAnyRole::class,
            'tenant' => \App\Http\Middleware\EnsureTenantContext::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Y el manejador tiene su PROPIO `route('login')`, en la rama de no-JSON
        // de `unauthenticated()`. Anular la redirección de arriba no basta: sin
        // esto, el 401 se sigue convirtiendo en 500 para quien no pida JSON.
        $exceptions->shouldRenderJsonWhen(
            fn ($request) => $request->is('api/*') || $request->expectsJson()
        );
    })->create();
