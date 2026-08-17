<?php

namespace App\Rules;

use App\Models\Student;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * El alumno delegado tiene que ser de este grupo.
 *
 * Falla de **dos formas distintas a propósito**, y la diferencia importa:
 *
 * - Si el alumno es de OTRA ORGANIZACIÓN, el mensaje es el de `validation.exists`,
 *   indistinguible de «no existe». Decir «ese alumno está en otro grupo»
 *   confirmaría que existe, y eso es una fuga (FR-018).
 * - Si el alumno es de este centro pero está en OTRO GRUPO, el mensaje explica el
 *   motivo. Aquí no hay nada que ocultar: quien administra ve a ese alumno en la
 *   aplicación, y un «no existe» sería desconcertante.
 *
 * La consulta va por Eloquent para que `OrganizationScope` se aplique: con
 * `exists:` de Laravel, que usa el query builder, un alumno ajeno pasaría.
 */
class RepresentativeBelongsToGroup implements ValidationRule
{
    /**
     * @param  int|null  $groupId  Nulo al crear: el grupo todavía no existe.
     */
    public function __construct(private readonly ?int $groupId)
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        // Al CREAR no hay grupo todavía, luego no puede tener alumnos ni delegado.
        // Se explica en lugar de dejar un error críptico de referencia.
        if ($this->groupId === null) {
            $fail(__('tenancy.tutor_groups.representative_on_create'));

            return;
        }

        $student = Student::query()->whereKey($value)->first();

        // Inexistente o de otra organización: el scope ya lo ha filtrado, así que
        // ambos casos llegan aquí iguales y deben salir iguales.
        if ($student === null) {
            $fail('validation.exists')->translate([
                'attribute' => str_replace('_', ' ', $attribute),
            ]);

            return;
        }

        if ((int) $student->tutor_group_id !== $this->groupId) {
            $fail(__('tenancy.tutor_groups.representative_other_group'));
        }
    }
}
