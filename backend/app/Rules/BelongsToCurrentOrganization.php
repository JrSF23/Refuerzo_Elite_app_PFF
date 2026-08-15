<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Eloquent\Model;

/**
 * Sustituto de `exists:` consciente de la organización.
 *
 * Este es el agujero menos evidente de todo el diseño: `Rule::exists()` y
 * `Rule::unique()` no usan Eloquent, sino el DatabasePresenceVerifier sobre el
 * query builder, así que **ignoran los global scopes**. Con el aislamiento
 * aparentemente funcionando, `exists:class_groups,id` aceptaría un grupo de otra
 * organización y permitiría matricular en él a un alumno propio (FR-009).
 *
 * Esta regla consulta vía Eloquent, de modo que OrganizationScope sí se aplica.
 *
 * El mensaje de error es el de `validation.exists` de Laravel, deliberadamente:
 * un identificador ajeno debe ser indistinguible de uno inexistente, para no
 * revelar la existencia de datos de otra organización (FR-020).
 */
class BelongsToCurrentOrganization implements ValidationRule
{
    /**
     * @param  class-string<Model>  $modelClass
     */
    public function __construct(private readonly string $modelClass)
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $exists = $this->modelClass::query()->whereKey($value)->exists();

        if (! $exists) {
            $fail('validation.exists')->translate(['attribute' => str_replace('_', ' ', $attribute)]);
        }
    }
}
