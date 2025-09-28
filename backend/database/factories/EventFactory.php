<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $eventTypes = ['live', 'session', 'course', 'formation'];
        
        return [
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraph(2),
            'slider_image' => 'events/sliders/default.jpg',
            'alt_text' => $this->faker->sentence(3),
            'event_type' => $this->faker->randomElement($eventTypes),
            'teacher_id' => \App\Models\Teacher::factory(),
            'target_id' => $this->faker->numberBetween(1, 100),
            'redirect_url' => null,
            'requires_subscription' => $this->faker->boolean(80), // 80% chance de nécessiter un abonnement
            'start_date' => $this->faker->dateTimeBetween('now', '+1 month'),
            'end_date' => $this->faker->dateTimeBetween('+1 month', '+2 months'),
            'is_active' => $this->faker->boolean(90), // 90% d'events actifs
            'order_index' => $this->faker->numberBetween(0, 10),
            'access_message' => $this->faker->optional()->sentence(),
        ];
    }

    /**
     * Create active event
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    /**
     * Create inactive event
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Create free event (no subscription required)
     */
    public function free(): static
    {
        return $this->state(fn (array $attributes) => [
            'requires_subscription' => false,
        ]);
    }

    /**
     * Create paid event (subscription required)
     */
    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'requires_subscription' => true,
        ]);
    }

    /**
     * Create current event (happening now)
     */
    public function current(): static
    {
        return $this->state(fn (array $attributes) => [
            'start_date' => now()->subDays(1),
            'end_date' => now()->addDays(7),
        ]);
    }
}
