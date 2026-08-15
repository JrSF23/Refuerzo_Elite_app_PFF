<?php

namespace App\Models\Scopes;

use App\Support\OrganizationContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\App;

/**
 * Filtro de organización a nivel de modelo, no de controlador (Principio V).
 *
 * Al vivir dentro de Eloquent cubre a la vez BaseApiController y las consultas
 * directas de DashboardController, y hace que `findOrFail` sobre un recurso ajeno
 * lance ModelNotFoundException — el 404 que exige FR-008 sale solo, sin escribir
 * nada.
 *
 * Comportamiento sin contexto (D2), elegido para que un olvido produzca CERO
 * resultados en lugar de TODOS:
 *
 *   - Hay contexto            → filtra por esa organización.
 *   - Sin contexto, en HTTP   → condición imposible: resultado vacío.
 *   - Sin contexto, en CLI    → no filtra, para que migraciones, seeders, comandos
 *                               y fixtures de test puedan trabajar.
 *
 * El caso CLI no abre ningún agujero en las peticiones: durante los tests la
 * ejecución es de consola, pero toda petición HTTP pasa por EnsureTenantContext,
 * que establece contexto antes de llegar a ninguna consulta.
 */
class OrganizationScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $context = app(OrganizationContext::class);

        if ($context->hasContext()) {
            $builder->where($model->qualifyColumn('organization_id'), $context->id());

            return;
        }

        if (App::runningInConsole()) {
            return;
        }

        $builder->whereRaw('1 = 0');
    }
}
