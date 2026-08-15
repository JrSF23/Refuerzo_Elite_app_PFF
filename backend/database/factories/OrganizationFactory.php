<?php

namespace Database\Factories;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Organization>
 */
class OrganizationFactory extends Factory
{
    protected $model = Organization::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = 'Centro '.fake()->unique()->lastName();

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numerify('####'),
            'status' => Organization::STATUS_ACTIVE,
            'contact_email' => fake()->unique()->safeEmail(),
            'contact_phone' => fake()->numerify('6########'),
        ];
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => Organization::STATUS_SUSPENDED,
        ]);
    }
}
