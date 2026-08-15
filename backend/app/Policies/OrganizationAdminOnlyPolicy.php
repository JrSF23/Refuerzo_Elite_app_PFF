<?php

namespace App\Policies;

use App\Policies\Concerns\ResolvesTeacherAccess;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

/**
 * Base de las entidades que solo maneja la administración del centro.
 *
 * El aislamiento entre organizaciones ya lo garantiza el global scope: cuando esta
 * policy se evalúa, el registro pertenece necesariamente a la organización activa.
 * Lo que se decide aquí es **quién** dentro del centro puede tocarlo.
 *
 * El `super_admin` queda denegado igual que el profesor: su alcance se limita a
 * organizaciones y cuentas (FR-013a). En la práctica ni siquiera llega —el
 * middleware de rol lo detiene antes—, pero la policy lo cierra por si alguna ruta
 * futura se registrase sin él.
 */
abstract class OrganizationAdminOnlyPolicy
{
    use ResolvesTeacherAccess;

    public function viewAny(User $user): bool
    {
        return $this->isOrganizationAdmin($user);
    }

    public function view(User $user, Model $model): bool
    {
        return $this->isOrganizationAdmin($user);
    }

    public function create(User $user): bool
    {
        return $this->isOrganizationAdmin($user);
    }

    public function update(User $user, Model $model): bool
    {
        return $this->isOrganizationAdmin($user);
    }

    public function delete(User $user, Model $model): bool
    {
        return $this->isOrganizationAdmin($user);
    }
}
