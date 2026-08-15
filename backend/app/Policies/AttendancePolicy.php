<?php

namespace App\Policies;

use App\Models\Attendance;
use App\Models\ClassSession;
use App\Models\User;
use App\Policies\Concerns\ResolvesTeacherAccess;

/**
 * Registrar la asistencia de sus sesiones es la tarea principal del profesor en el
 * sistema. La puede hacer sobre las sesiones de sus grupos, y solo sobre esas
 * (escenarios 3 y 4 de P5).
 */
class AttendancePolicy
{
    use ResolvesTeacherAccess;

    public function viewAny(User $user): bool
    {
        return $this->isOrganizationAdmin($user) || $this->isTeacher($user);
    }

    public function view(User $user, Attendance $attendance): bool
    {
        return $this->canManage($user, (int) $attendance->class_session_id);
    }

    public function create(User $user): bool
    {
        if ($this->isOrganizationAdmin($user)) {
            return true;
        }

        if (! $this->isTeacher($user)) {
            return false;
        }

        return $this->canManage($user, request()->integer('class_session_id'));
    }

    public function update(User $user, Attendance $attendance): bool
    {
        return $this->canManage($user, (int) $attendance->class_session_id);
    }

    public function delete(User $user, Attendance $attendance): bool
    {
        return $this->canManage($user, (int) $attendance->class_session_id);
    }

    /**
     * La sesión debe pertenecer a un grupo que el usuario imparte.
     *
     * La consulta pasa por Eloquent, así que el global scope garantiza además que
     * la sesión sea de la organización activa.
     */
    private function canManage(User $user, int $classSessionId): bool
    {
        if ($this->isOrganizationAdmin($user)) {
            return true;
        }

        if (! $this->isTeacher($user) || $classSessionId === 0) {
            return false;
        }

        $classGroupId = ClassSession::query()->whereKey($classSessionId)->value('class_group_id');

        return $classGroupId !== null
            && in_array((int) $classGroupId, $this->taughtClassGroupIds($user), true);
    }
}
