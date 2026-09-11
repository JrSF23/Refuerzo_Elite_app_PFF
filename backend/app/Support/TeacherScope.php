<?php

namespace App\Support;

use App\Models\ClassGroup;
use App\Models\Teacher;
use App\Models\User;

/**
 * Qué alcanza un profesor. Única definición.
 *
 * La regla tiene DOS condiciones y hacen falta las dos:
 *
 *   1. El grupo está asignado a la ficha vinculada a su cuenta por
 *      `teachers.user_id` (FR-015a). Nunca se emparejan por correo: eso era
 *      frágil y convertirlo en regla de acceso sería un fallo de seguridad (D6).
 *   2. La materia del grupo es la materia de su ficha (`teachers.subject_id`).
 *
 * La materia habilita, el grupo delimita. Por eso dos profesores de Matemáticas
 * no se alcanzan entre sí: comparten la condición 2 y fallan la 1.
 *
 * Una ficha sin materia, sin grupos, o sin vincular no alcanza nada. Las tres
 * ausencias devuelven la lista vacía, y todo `whereIn` sobre ella da cero filas:
 * el fallo cierra el acceso, nunca lo abre (FR-015c).
 *
 * Vive aquí, y no en la policy ni en el controlador, porque los dos la necesitan
 * —uno para autorizar, otro para recortar el listado— y dos copias que decidan
 * lo mismo acaban divergiendo. Cuando lo hagan, una de ellas abrirá de más.
 *
 * Deliberadamente sin caché: el vínculo y la materia deben poder reasignarse y
 * surtir efecto en la petición siguiente, sin cerrar sesión.
 */
class TeacherScope
{
    /**
     * Identificadores de los grupos que el usuario imparte de verdad.
     *
     * @return list<int>
     */
    public function classGroupIdsFor(?User $user): array
    {
        if ($user === null) {
            return [];
        }

        /** @var Teacher|null $profile */
        $profile = $user->teacher()->first(['id', 'subject_id']);

        if ($profile === null || $profile->subject_id === null) {
            return [];
        }

        return ClassGroup::query()
            ->where('teacher_id', $profile->getKey())
            ->where('subject_id', $profile->subject_id)
            ->pluck('id')
            ->all();
    }

    /**
     * ¿Alcanza este grupo concreto?
     *
     * Se pregunta por el identificador que llega en la petición, no por el que ya
     * tiene el registro: en un alta todavía no hay registro, y en una edición el
     * grupo de destino puede ser otro.
     */
    public function reachesClassGroup(?User $user, int $classGroupId): bool
    {
        return $classGroupId !== 0
            && in_array($classGroupId, $this->classGroupIdsFor($user), true);
    }
}
