<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Mitigación del riesgo residual de D2.
 *
 * El scope deniega por defecto cuando no hay contexto, así que una ruta de negocio
 * a la que se le olvide el middleware `tenant` devolvería listados vacíos en vez de
 * datos ajenos. Es un fallo seguro, pero silencioso y desconcertante. Este test lo
 * convierte en ruidoso: si alguien registra una ruta de negocio sin `tenant`, falla.
 */
class RouteTenantCoverageTest extends TestCase
{
    /**
     * Rutas de plataforma y de sesión, que legítimamente no llevan `tenant`.
     * El super administrador no pertenece a ninguna organización, así que no puede
     * establecer contexto (D8).
     *
     * @var list<string>
     */
    private const PLATFORM_ROUTES = [
        'api/v1/login',
        'api/v1/logout',
        'api/v1/me',
        'api/v1/organizations',
        'api/v1/users',
    ];

    public function test_every_business_route_is_protected_by_the_tenant_middleware(): void
    {
        $unprotected = [];

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();

            if (! str_starts_with($uri, 'api/v1/')) {
                continue;
            }

            if ($this->isPlatformRoute($uri)) {
                continue;
            }

            if (! in_array('tenant', $route->gatherMiddleware(), true)) {
                $unprotected[] = implode('|', $route->methods()).' '.$uri;
            }
        }

        $this->assertSame([], $unprotected, "Rutas de negocio sin middleware 'tenant': ".implode(', ', $unprotected));
    }

    public function test_platform_routes_do_not_carry_the_tenant_middleware(): void
    {
        $wronglyScoped = [];

        foreach (Route::getRoutes() as $route) {
            if ($this->isPlatformRoute($route->uri()) && in_array('tenant', $route->gatherMiddleware(), true)) {
                $wronglyScoped[] = $route->uri();
            }
        }

        $this->assertSame([], $wronglyScoped, 'Rutas de plataforma con tenant: '.implode(', ', $wronglyScoped));
    }

    private function isPlatformRoute(string $uri): bool
    {
        foreach (self::PLATFORM_ROUTES as $platform) {
            if ($uri === $platform || str_starts_with($uri, $platform.'/')) {
                return true;
            }
        }

        return false;
    }
}
