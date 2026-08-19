<?php

namespace App\Policies;

use App\Models\TutorGroup;
use App\Models\User;
use App\Policies\Concerns\ResolvesTeacherAccess;

/**
 * Grupos tutoriales: los mantiene la administración, los consulta el profesorado.
 *
 * **Es la primera entidad del proyecto con lectura para el profesor y escritura
 * solo para la administración.** Por eso NO puede extender
 * `OrganizationAdminOnlyPolicy` en vacío como hacen `SubjectPolicy` y las demás:
 * esa base deniega también la lectura.
 *
 * Que el profesor pueda leerlos no rompe ninguna garantía: el grupo tutorial
 * **no contiene ningún campo monetario**, así que queda fuera del invariante que
 * le veda asignaturas, matrículas y pagos —las tres entidades con importes—.
 *
 * El aislamiento entre organizaciones ya lo garantiza el global scope: cuando
 * esta policy se evalúa, el grupo pertenece necesariamente a la organización
 * activa. Lo que se decide aquí es **quién** dentro del centro puede tocarlo.
 */
class TutorGroupPolicy
{
    use ResolvesTeacherAccess;

    public function viewAny(User $user): bool
    {
        return $this->isOrganizationAdmin($user) || $this->isTeacher($user);
    }

    public function view(User $user, TutorGroup $tutorGroup): bool
    {
        return $this->isOrganizationAdmin($user) || $this->isTeacher($user);
    }

    public function create(User $user): bool
    {
        return $this->isOrganizationAdmin($user);
    }

    public function update(User $user, TutorGroup $tutorGroup): bool
    {
        return $this->isOrganizationAdmin($user);
    }

    public function delete(User $user, TutorGroup $tutorGroup): bool
    {
        return $this->isOrganizationAdmin($user);
    }
}
