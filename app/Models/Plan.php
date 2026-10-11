<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'slug',
    'description',
    'price_cents',
    'currency',
    'interval',
    'analysis_limit',
    'features',
    'is_active',
    'is_popular',
    'sort_order',
])]
class Plan extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'price_cents' => 'integer',
            'analysis_limit' => 'integer',
            'features' => 'array',
            'is_active' => 'boolean',
            'is_popular' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function isUnlimited(): bool
    {
        return $this->analysis_limit === -1;
    }

    public function getFormattedPriceAttribute(): string
    {
        if ($this->price_cents === 0) {
            return '$0';
        }

        return '$' . number_format($this->price_cents / 100, 2);
    }
}
