<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\User;

/**
 * La gestión de organizaciones es competencia exclusiva de la plataforma.
 *
 * El administrador de un centro NO puede acceder aquí (FR-014), ni siquiera para
 * consultar la suya: su ámbito es el dominio de su organización.
 */
class OrganizationPolicy
{
    /**
     * Puerta única: todas las capacidades exigen ser super administrador. Se
     * concentra aquí para que añadir una capacidad nueva no pueda olvidarla.
     */
    private function isPlatformAdmin(User $user): bool
    {
        return $user->hasRole('super_admin');
    }

    public function viewAny(User $user): bool
    {
        return $this->isPlatformAdmin($user);
    }

    public function view(User $user, Organization $organization): bool
    {
        return $this->isPlatformAdmin($user);
    }

    public function create(User $user): bool
    {
        return $this->isPlatformAdmin($user);
    }

    public function update(User $user, Organization $organization): bool
    {
        return $this->isPlatformAdmin($user);
    }

    public function delete(User $user, Organization $organization): bool
    {
        return $this->isPlatformAdmin($user);
    }

    public function suspend(User $user, Organization $organization): bool
    {
        return $this->isPlatformAdmin($user);
    }

    public function activate(User $user, Organization $organization): bool
    {
        return $this->isPlatformAdmin($user);
    }
}
