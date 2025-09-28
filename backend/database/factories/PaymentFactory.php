<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory()->create(['role' => 'student'])->id,
            'amount' => fake()->randomFloat(2, 500, 5000),
            'currency' => 'DZD',
            'payment_method' => fake()->randomElement(['cash', 'online', 'card', 'transfer']),
            'status' => fake()->randomElement(['pending', 'completed', 'failed', 'cancelled']),
            'reference' => fake()->unique()->lexify('PAY-????????'),
            'transaction_id' => fake()->optional()->uuid(),
            'description' => fake()->optional()->sentence(),
            'metadata' => fake()->optional()->randomElement([
                ['type' => 'subscription'],
                ['type' => 'session'],
                ['type' => 'school_entry']
            ]),
            'processed_by' => null,
            'processed_at' => null,
        ];
    }

    /**
     * Indicate that the payment is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'transaction_id' => fake()->uuid(),
            'processed_at' => now(),
        ]);
    }

    /**
     * Indicate that the payment is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    /**
     * Indicate that the payment is failed.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'description' => 'Payment failed',
        ]);
    }
}
