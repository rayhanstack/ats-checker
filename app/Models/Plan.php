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
    'price',
    'currency',
    'billing_interval',
    'analyses_limit',
    'limit_period',
    'features',
    'is_active',
    'is_featured',
    'sort_order',
])]
class Plan extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'analyses_limit' => 'integer',
            'features' => 'array',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function isUnlimited(): bool
    {
        return $this->analyses_limit === null || $this->analyses_limit === -1;
    }

    public function getFormattedPriceAttribute(): string
    {
        $priceFloat = (float) $this->price;
        if ($priceFloat == 0) {
            return '$0';
        }

        return '$' . (fmod($priceFloat, 1) == 0 ? number_format($priceFloat, 0) : number_format($priceFloat, 2));
    }
}
