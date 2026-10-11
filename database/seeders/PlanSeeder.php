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
                'slug' => 'free',
                'description' => 'Explore all AI matching features with 5 free resume scans during your trial.',
                'price' => 0.00,
                'currency' => 'USD',
                'billing_interval' => 'none',
                'analyses_limit' => 5,
                'limit_period' => 'trial',
                'features' => [
                    '5 AI resume match scans',
                    'Semantic score (0-100)',
                    'Missing keyword diagnosis',
                    '7 days full platform access',
                ],
                'is_active' => true,
                'is_featured' => false,
                'sort_order' => 1,
            ],
            [
                'name' => 'Professional Monthly',
                'slug' => 'monthly',
                'description' => 'Ideal for active candidates applying to multiple roles weekly.',
                'price' => 19.00,
                'currency' => 'USD',
                'billing_interval' => 'month',
                'analyses_limit' => 50,
                'limit_period' => 'month',
                'features' => [
                    '50 resume scans per month',
                    'Priority Claude AI queue',
                    'Line-by-line bullet fixes',
                    'Full analysis history & trends',
                    'Cancel anytime with 1 click',
                ],
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Annual Unlimited',
                'slug' => 'yearly',
                'description' => 'Maximum savings and power for comprehensive career transitions.',
                'price' => 149.00,
                'currency' => 'USD',
                'billing_interval' => 'year',
                'analyses_limit' => null, // Unlimited
                'limit_period' => 'year',
                'features' => [
                    'Unlimited resume scans all year',
                    'Save 35% compared to monthly',
                    'Target JD archive',
                    'Executive summary exports',
                    'Priority 24/7 support',
                ],
                'is_active' => true,
                'is_featured' => false,
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
