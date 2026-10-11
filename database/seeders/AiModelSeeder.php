<?php

namespace Database\Seeders;

use App\Models\AiModel;
use Illuminate\Database\Seeder;

class AiModelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $models = [
            [
                'name' => 'Claude 3.5 Sonnet',
                'provider' => 'anthropic',
                'model_id' => 'claude-sonnet-5-5',
                'purpose' => 'analysis',
                'temperature' => 0.20,
                'max_tokens' => 4000,
                'is_active' => true,
                'is_default' => true,
                'fallback_priority' => null,
                'input_cost_per_mtok' => 3.00,
                'output_cost_per_mtok' => 15.00,
                'notes' => 'Default primary Claude model for deep ATS resume evaluation and suggestions.',
            ],
            [
                'name' => 'Claude 3.5 Opus',
                'provider' => 'anthropic',
                'model_id' => 'claude-opus-5-5',
                'purpose' => 'analysis',
                'temperature' => 0.20,
                'max_tokens' => 4000,
                'is_active' => true,
                'is_default' => false,
                'fallback_priority' => 1,
                'input_cost_per_mtok' => 15.00,
                'output_cost_per_mtok' => 75.00,
                'notes' => 'First fallback backup model for resilient ATS processing during primary outages.',
            ],
            [
                'name' => 'Claude 3.5 Haiku',
                'provider' => 'anthropic',
                'model_id' => 'claude-haiku-5-5',
                'purpose' => 'analysis',
                'temperature' => 0.20,
                'max_tokens' => 4000,
                'is_active' => true,
                'is_default' => false,
                'fallback_priority' => 2,
                'input_cost_per_mtok' => 0.80,
                'output_cost_per_mtok' => 4.00,
                'notes' => 'Second fallback backup high-speed model for rapid keyword extraction.',
            ],
        ];

        foreach ($models as $item) {
            AiModel::query()->updateOrCreate(
                ['model_id' => $item['model_id']],
                $item
            );
        }
    }
}
