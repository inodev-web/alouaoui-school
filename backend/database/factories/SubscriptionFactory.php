<?php

namespace Database\Factories;


use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Subscription>
 */
class SubscriptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startsAt = fake()->dateTimeBetween('-1 month', 'now');
        $endsAt = (clone $startsAt)->modify('+1 month');

        return [
            'user_id' => \App\Models\User::factory()->create(['role' => 'student'])->id,
            'teacher_id' => \App\Models\Teacher::factory(),
            'amount' => fake()->randomFloat(2, 1000, 5000),
            'videos_access' => true,
            'lives_access' => fake()->boolean(80), // 80% de chances d'avoir accès aux lives
            'school_entry_access' => fake()->boolean(30), // 30% de chances d'avoir accès à l'école
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'status' => fake()->randomElement(['pending', 'active', 'expired', 'cancelled']),
        ];
    }

    /**
     * Indicate that the subscription is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'starts_at' => now()->subDays(5),
            'ends_at' => now()->addDays(25),
        ]);
    }

    /**
     * Indicate that the subscription is expired.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'expired',
            'starts_at' => now()->subMonth(),
            'ends_at' => now()->subDays(5),
        ]);
    }

    /**
     * Indicate that the subscription is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }
}
