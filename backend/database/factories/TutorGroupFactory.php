<?php

namespace Database\Factories;

use App\Models\TutorGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TutorGroup>
 */
class TutorGroupFactory extends Factory
{
    protected $model = TutorGroup::class;

    public function definition(): array
    {
        return [
            // Sin `organization_id`: lo rellena el trait desde el contexto. Las
            // pruebas que necesitan una organización concreta la fijan con
            // `forceFill`, igual que hacen las demás factories del proyecto.
            'name' => $this->faker->unique()->bothify('#º ESO - ?'),
            'shift' => $this->faker->randomElement(TutorGroup::SHIFTS),
            'academic_year' => '2025-2026',
            'tutor_teacher_id' => null,
            'representative_student_id' => null,
            'sort_order' => $this->faker->numberBetween(0, 100),
            'status' => TutorGroup::STATUS_ACTIVE,
        ];
    }

    public function morning(): static
    {
        return $this->state(fn (): array => ['shift' => TutorGroup::SHIFT_MORNING]);
    }

    public function afternoon(): static
    {
        return $this->state(fn (): array => ['shift' => TutorGroup::SHIFT_AFTERNOON]);
    }

    /** Grupo sin tutor: el caso que hace visible «sin asignar». */
    public function withoutTutor(): static
    {
        return $this->state(fn (): array => ['tutor_teacher_id' => null]);
    }
}
