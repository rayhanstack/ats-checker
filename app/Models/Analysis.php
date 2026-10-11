<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'resume_name',
    'resume_path',
    'job_title',
    'job_company',
    'job_description',
    'match_score',
    'status',
    'summary',
    'matched_keywords',
    'missing_keywords',
    'suggestions',
])]
class Analysis extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'match_score' => 'integer',
            'matched_keywords' => 'array',
            'missing_keywords' => 'array',
            'suggestions' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getScoreBadgeVariantAttribute(): string
    {
        if ($this->match_score >= 80) {
            return 'success';
        }

        if ($this->match_score >= 60) {
            return 'warning';
        }

        return 'danger';
    }
}
