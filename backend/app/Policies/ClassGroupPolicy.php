<?php

namespace App\Policies;

use App\Models\ClassGroup;
use App\Models\User;
use App\Policies\Concerns\ResolvesTeacherAccess;

/**
 * El administrador gestiona todos los grupos de su centro; el profesor solo
 * consulta los que imparte, y no los modifica.
 */
class ClassGroupPolicy
{
    use ResolvesTeacherAccess;

    public function viewAny(User $user): bool
    {
        return $this->isOrganizationAdmin($user) || $this->isTeacher($user);
    }

    public function view(User $user, ClassGroup $classGroup): bool
    {
        if ($this->isOrganizationAdmin($user)) {
            return true;
        }

        return $this->isTeacher($user)
            && in_array($classGroup->getKey(), $this->taughtClassGroupIds($user), true);
    }

    public function create(User $user): bool
    {
        return $this->isOrganizationAdmin($user);
    }

    public function update(User $user, ClassGroup $classGroup): bool
    {
        return $this->isOrganizationAdmin($user);
    }

    public function delete(User $user, ClassGroup $classGroup): bool
    {
        return $this->isOrganizationAdmin($user);
    }
}
