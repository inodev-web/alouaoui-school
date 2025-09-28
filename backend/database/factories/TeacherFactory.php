<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Teacher>
 */
class TeacherFactory extends Factory
{

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->unique()->phoneNumber(),
            'specialization' => fake()->randomElement(['Mathematics', 'Physics', 'Chemistry', 'Biology', 'French', 'Arabic', 'English']),
            'bio' => fake()->paragraph(),
            'is_alouaoui_teacher' => false,
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the teacher is an Alouaoui teacher.
     */
    public function alouaoui(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_alouaoui_teacher' => true,
        ]);
    }

    /**
     * Indicate that the teacher is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the teacher is an online publisher.
     */
    public function onlinePublisher(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_online_publisher' => true,
            'allows_online_payment' => true,
        ]);
    }
}
