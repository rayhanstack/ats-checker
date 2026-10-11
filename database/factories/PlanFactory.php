<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    protected $model = Plan::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'slug' => fake()->unique()->slug(),
            'description' => fake()->sentence(),
            'price_cents' => fake()->randomElement([0, 1900, 3900]),
            'currency' => 'USD',
            'interval' => 'month',
            'analysis_limit' => 50,
            'features' => ['Feature 1', 'Feature 2'],
            'is_active' => true,
            'is_popular' => false,
            'sort_order' => 1,
        ];
    }
}
