<?php

namespace Database\Factories;

use App\Models\Organization;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    public function definition(): array
    {
        return [
            // Por defecto crea su propia organización, para que la factory nunca
            // viole el NOT NULL. Los tests que comparan alumnos entre sí deben
            // pasar la organización explícitamente o usar forOrganization().
            'organization_id' => Organization::factory(),
            'guardian_id'  => null,
            'first_name'   => fake()->firstName(),
            'last_name'    => fake()->lastName().' '.fake()->lastName(),
            'email'        => fake()->unique()->safeEmail(),
            'phone'        => fake()->numerify('6########'),
            'date_of_birth'=> fake()->dateTimeBetween('-18 years', '-8 years')->format('Y-m-d'),
            'school_name'  => fake()->randomElement(['IES Ramón y Cajal', 'Colegio San Pedro', 'CEIP Mediterráneo', 'IES Victoria Kent']),
            'school_level' => fake()->randomElement(['4º Primaria', '5º Primaria', '6º Primaria', '1º ESO', '2º ESO', '3º ESO', '4º ESO', '1º Bachiller']),
            'status'       => 'active',
            'address'      => null,
            'notes'        => null,
        ];
    }

    public function forOrganization(Organization $organization): static
    {
        return $this->state(fn (array $attributes): array => [
            'organization_id' => $organization->getKey(),
        ]);
    }
}
