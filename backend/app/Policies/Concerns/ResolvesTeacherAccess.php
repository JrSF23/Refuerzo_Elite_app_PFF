<?php

namespace App\Policies\Concerns;

use App\Models\ClassGroup;
use App\Models\Enrollment;
use App\Models\User;

/**
 * Resolución del alcance del profesor, compartida por las policies.
 *
 * Los grupos que un usuario "imparte" son los asignados a la ficha vinculada a su
 * cuenta por `teachers.user_id` (FR-015a). Nunca se emparejan por correo: eso era
 * frágil y convertirlo en regla de acceso sería un fallo de seguridad (D6).
 *
 * Deliberadamente sin caché: el vínculo debe poder reasignarse y surtir efecto en
 * la petición siguiente, sin cerrar sesión.
 */
trait ResolvesTeacherAccess
{
    protected function isOrganizationAdmin(User $user): bool
    {
        return $user->hasRole('org_admin');
    }

    protected function isTeacher(User $user): bool
    {
        return $user->hasRole('teacher') && ! $user->hasRole('org_admin');
    }

    /**
     * Identificadores de los grupos que imparte.
     *
     * Un profesor sin ficha vinculada devuelve un array vacío, y por tanto no
     * alcanza nada: el fallo cierra el acceso, nunca lo abre (FR-015c).
     *
     * @return list<int>
     */
    protected function taughtClassGroupIds(User $user): array
    {
        $teacherId = $user->teacher()->value('id');

        if ($teacherId === null) {
            return [];
        }

        return ClassGroup::query()
            ->where('teacher_id', $teacherId)
            ->pluck('id')
            ->all();
    }

    /**
     * ¿Está el alumno matriculado en alguno de los grupos que imparte?
     */
    protected function teachesStudent(User $user, int $studentId): bool
    {
        $groupIds = $this->taughtClassGroupIds($user);

        if ($groupIds === []) {
            return false;
        }

        return Enrollment::query()
            ->where('student_id', $studentId)
            ->whereIn('class_group_id', $groupIds)
            ->exists();
    }
}
