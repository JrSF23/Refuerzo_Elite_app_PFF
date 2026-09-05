<?php

namespace App\Policies\Concerns;

use App\Models\Enrollment;
use App\Models\User;
use App\Support\TeacherScope;

/**
 * Resolución del alcance del profesor, compartida por las policies.
 *
 * La regla en sí vive en `App\Support\TeacherScope`, que es también de donde la
 * toma `BaseApiController` para recortar los listados. Aquí solo se envuelve,
 * para que autorizar y listar no puedan responder cosas distintas.
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
     * @return list<int>
     */
    protected function taughtClassGroupIds(User $user): array
    {
        return app(TeacherScope::class)->classGroupIdsFor($user);
    }

    /**
     * ¿Alcanza el grupo que llega en la petición?
     *
     * Se pregunta por el identificador entrante, no por el que ya tiene guardado
     * el registro. En un alta no hay registro todavía; en una edición, el grupo
     * de destino puede ser distinto del de origen, y comprobar solo el de origen
     * dejaría mover una sesión al grupo de otro profesor.
     */
    protected function reachesClassGroup(User $user, int $classGroupId): bool
    {
        return app(TeacherScope::class)->reachesClassGroup($user, $classGroupId);
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
