<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Free Trial',
                'slug' => 'free-trial',
                'description' => 'Explore all AI analysis features during your 7-day trial.',
                'price_cents' => 0,
                'currency' => 'USD',
                'interval' => 'trial',
                'analysis_limit' => 5,
                'features' => [
                    '5 AI resume match scans',
                    'Semantic score (0-100)',
                    'Missing keyword diagnosis',
                    '7 days full platform access',
                ],
                'is_active' => true,
                'is_popular' => false,
                'sort_order' => 1,
            ],
            [
                'name' => 'Professional Monthly',
                'slug' => 'pro-monthly',
                'description' => 'Ideal for active candidates applying to multiple roles weekly.',
                'price_cents' => 1900,
                'currency' => 'USD',
                'interval' => 'month',
                'analysis_limit' => 50,
                'features' => [
                    '50 resume scans per month',
                    'Priority Claude AI queue',
                    'Line-by-line bullet fixes',
                    'Full analysis history & trends',
                    'Cancel anytime',
                ],
                'is_active' => true,
                'is_popular' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Annual Unlimited',
                'slug' => 'annual-unlimited',
                'description' => 'Maximum savings and power for comprehensive career transitions.',
                'price_cents' => 14900,
                'currency' => 'USD',
                'interval' => 'year',
                'analysis_limit' => -1, // Unlimited
                'features' => [
                    'Unlimited resume scans all year',
                    'Save 35% compared to monthly',
                    'Target JD archive',
                    'Executive summary exports',
                    'Priority 24/7 support',
                ],
                'is_active' => true,
                'is_popular' => false,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $planData) {
            Plan::query()->updateOrCreate(
                ['slug' => $planData['slug']],
                $planData
            );
        }
    }
}
