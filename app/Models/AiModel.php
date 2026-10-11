<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'provider',
    'model_id',
    'purpose',
    'temperature',
    'max_tokens',
    'is_active',
    'is_default',
    'fallback_priority',
    'input_cost_per_mtok',
    'output_cost_per_mtok',
    'notes',
])]
class AiModel extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'temperature' => 'float',
            'max_tokens' => 'integer',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'fallback_priority' => 'integer',
            'input_cost_per_mtok' => 'decimal:4',
            'output_cost_per_mtok' => 'decimal:4',
        ];
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(AnalysisAttempt::class);
    }
}
