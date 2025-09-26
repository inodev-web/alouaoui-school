<?php

namespace Database\Factories;

use App\Models\Chapter;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Course>
 */
class CourseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'chapter_id' => Chapter::factory(),
            'title' => fake()->sentence(4),
            'video_ref' => fake()->optional()->uuid(),
            'pdf_summary' => fake()->optional()->word() . '.pdf',
            'exercises_pdf' => fake()->optional()->word() . '.pdf',
            'year_target' => fake()->randomElement(['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS']),
        ];
    }


}
