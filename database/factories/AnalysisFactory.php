<?php

namespace Database\Factories;

use App\Models\Analysis;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Analysis>
 */
class AnalysisFactory extends Factory
{
    protected $model = Analysis::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'resume_name' => 'Resume_' . fake()->lexify('????') . '.pdf',
            'resume_path' => null,
            'job_title' => fake()->jobTitle(),
            'job_company' => fake()->company(),
            'job_description' => fake()->paragraphs(2, true),
            'match_score' => fake()->numberBetween(45, 95),
            'status' => 'completed',
            'summary' => fake()->sentence(),
            'matched_keywords' => ['PHP', 'Laravel', 'React'],
            'missing_keywords' => ['AWS', 'Docker'],
            'suggestions' => ['Highlight your experience with cloud deployments.'],
        ];
    }
}
