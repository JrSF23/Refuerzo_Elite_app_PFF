<?php

namespace App\Policies;

use App\Models\ClassSession;
use App\Models\User;
use App\Policies\Concerns\ResolvesTeacherAccess;

/**
 * El profesor gestiona las sesiones de los grupos que imparte: es su trabajo
 * diario. Fuera de ellos, nada.
 */
class ClassSessionPolicy
{
    use ResolvesTeacherAccess;

    public function viewAny(User $user): bool
    {
        return $this->isOrganizationAdmin($user) || $this->isTeacher($user);
    }

    public function view(User $user, ClassSession $classSession): bool
    {
        return $this->canManage($user, $classSession);
    }

    /**
     * En el alta, el grupo llega en la petición: hay que comprobarlo ahí, porque
     * todavía no existe el modelo sobre el que decidir.
     */
    public function create(User $user): bool
    {
        if ($this->isOrganizationAdmin($user)) {
            return true;
        }

        if (! $this->isTeacher($user)) {
            return false;
        }

        $classGroupId = request()->integer('class_group_id');

        return $classGroupId !== 0
            && in_array($classGroupId, $this->taughtClassGroupIds($user), true);
    }

    public function update(User $user, ClassSession $classSession): bool
    {
        return $this->canManage($user, $classSession);
    }

    public function delete(User $user, ClassSession $classSession): bool
    {
        return $this->canManage($user, $classSession);
    }

    private function canManage(User $user, ClassSession $classSession): bool
    {
        if ($this->isOrganizationAdmin($user)) {
            return true;
        }

        return $this->isTeacher($user)
            && in_array((int) $classSession->class_group_id, $this->taughtClassGroupIds($user), true);
    }
}
