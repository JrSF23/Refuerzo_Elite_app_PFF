<?php

namespace App\Models\Concerns;

use App\Models\Organization;
use App\Models\Scopes\OrganizationScope;
use App\Support\OrganizationContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Convierte un modelo en tenant-aware: filtrado automático por organización y
 * relleno de `organization_id` al crear.
 *
 * `organization_id` NO está en el $fillable de ningún modelo, a propósito: el
 * valor lo pone este trait a partir del contexto de la petición, nunca la
 * petición misma (FR-006, FR-018).
 */
trait BelongsToOrganization
{
    public static function bootBelongsToOrganization(): void
    {
        static::addGlobalScope(new OrganizationScope());

        static::creating(function (Model $model): void {
            // Si ya viene puesto —seeders, factories, migraciones de datos— se
            // respeta: son ejecuciones de consola con organización explícita.
            if ($model->getAttribute('organization_id') !== null) {
                return;
            }

            $organizationId = app(OrganizationContext::class)->id();

            if ($organizationId !== null) {
                $model->setAttribute('organization_id', $organizationId);
            }
        });
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
