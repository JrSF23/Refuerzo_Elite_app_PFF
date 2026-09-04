<?php

namespace App\Policies;

use App\Models\ClassSession;
use App\Models\User;
use App\Policies\Concerns\ResolvesTeacherAccess;

/**
 * El profesor gestiona las sesiones de los grupos que imparte: es su trabajo
 * diario. Fuera de ellos, nada.
 *
 * «Los grupos que imparte» son los que tiene asignados Y son de su materia; la
 * definición completa está en `App\Support\TeacherScope`.
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

        return $this->isTeacher($user)
            && $this->reachesClassGroup($user, request()->integer('class_group_id'));
    }

    /**
     * En la edición hacen falta LAS DOS puntas: el grupo de origen y el de
     * destino.
     *
     * Comprobar solo el de origen dejaba rodear el alta con un PUT: el profesor
     * cogía una sesión suya, le cambiaba el `class_group_id` al grupo de un
     * compañero y la sesión aterrizaba allí. La petición se aceptaba porque en
     * ese momento la sesión todavía era suya.
     *
     * Si la petición no trae `class_group_id`, no hay traslado que vigilar y
     * basta con el origen.
     */
    public function update(User $user, ClassSession $classSession): bool
    {
        if (! $this->canManage($user, $classSession)) {
            return false;
        }

        if ($this->isOrganizationAdmin($user)) {
            return true;
        }

        $target = request()->integer('class_group_id');

        return $target === 0 || $this->reachesClassGroup($user, $target);
    }

    /**
     * Marcar la sesión como impartida.
     *
     * Mismo alcance que gestionarla: el profesor responsable del grupo, y la
     * administración del centro. No es un permiso aparte porque no es un acto
     * aparte: quien puede dar la clase es quien puede decir que la dio.
     *
     * Que ya esté marcada NO se decide aquí. Una policy responde «quién puede»,
     * no «en qué estado está»: mezclarlo daría 403 —«no eres quién»— a un
     * profesor que sí es quién y solo llega tarde. Eso lo resuelve el controlador
     * con un 409.
     */
    public function markTaught(User $user, ClassSession $classSession): bool
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
            && $this->reachesClassGroup($user, (int) $classSession->class_group_id);
    }
}
