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
        $score = fake()->numberBetween(45, 95);

        return [
            'user_id' => User::factory(),
            'resume_original_name' => 'Resume_' . fake()->lexify('????') . '.pdf',
            'resume_path' => 'resumes/fake_' . fake()->uuid() . '.pdf',
            'resume_text' => fake()->paragraphs(3, true),
            'job_title' => fake()->jobTitle(),
            'job_company' => fake()->company(),
            'jd_text' => fake()->paragraphs(2, true),
            'score' => $score,
            'status' => 'completed',
            'result' => [
                'summary' => fake()->sentence(),
                'matched_keywords' => ['PHP', 'Laravel', 'React'],
                'missing_keywords' => ['AWS', 'Docker'],
                'suggestions' => ['Highlight your experience with cloud deployments.'],
            ],
            'tokens_in' => 1200,
            'tokens_out' => 350,
            'started_at' => now()->subMinute(),
            'completed_at' => now(),
        ];
    }
}
