<?php

namespace App\Support;

use App\Models\Organization;

/**
 * Organización activa de la petición en curso.
 *
 * Se registra como singleton en el contenedor, que se reconstruye en cada
 * petición: por eso el contexto no puede filtrarse de una petición a otra. No se
 * usa estado estático a propósito, porque en runtimes de proceso largo (Octane,
 * colas) sobreviviría entre peticiones, que es justo la fuga que esta feature
 * debe impedir.
 *
 * Lo puebla EnsureTenantContext y solo él. Nadie más debería llamar a set().
 */
class OrganizationContext
{
    private ?Organization $organization = null;

    public function set(Organization $organization): void
    {
        $this->organization = $organization;
    }

    public function organization(): ?Organization
    {
        return $this->organization;
    }

    public function id(): ?int
    {
        return $this->organization?->getKey();
    }

    public function hasContext(): bool
    {
        return $this->organization instanceof Organization;
    }

    public function clear(): void
    {
        $this->organization = null;
    }
}
