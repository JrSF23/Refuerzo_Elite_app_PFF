<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;
use App\Policies\Concerns\ResolvesTeacherAccess;

/**
 * El profesor consulta únicamente los alumnos matriculados en los grupos que
 * imparte, y no puede darlos de alta, modificarlos ni borrarlos (FR-015, FR-016).
 */
class StudentPolicy
{
    use ResolvesTeacherAccess;

    public function viewAny(User $user): bool
    {
        return $this->isOrganizationAdmin($user) || $this->isTeacher($user);
    }

    public function view(User $user, Student $student): bool
    {
        if ($this->isOrganizationAdmin($user)) {
            return true;
        }

        return $this->isTeacher($user) && $this->teachesStudent($user, $student->getKey());
    }

    public function create(User $user): bool
    {
        return $this->isOrganizationAdmin($user);
    }

    public function update(User $user, Student $student): bool
    {
        return $this->isOrganizationAdmin($user);
    }

    public function delete(User $user, Student $student): bool
    {
        return $this->isOrganizationAdmin($user);
    }
}
