<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'user_id',
    'resume_original_name',
    'resume_path',
    'resume_text',
    'job_title',
    'job_company',
    'jd_text',
    'status',
    'score',
    'result',
    'ai_model_id',
    'tokens_in',
    'tokens_out',
    'error_message',
    'started_at',
    'completed_at',
    'is_delayed',
    'is_basic_fallback',
    // Aliases for compatibility
    'resume_name',
    'job_description',
    'match_score',
])]
class Analysis extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'result' => 'array',
            'is_delayed' => 'boolean',
            'is_basic_fallback' => 'boolean',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function aiModel(): BelongsTo
    {
        return $this->belongsTo(AiModel::class, 'ai_model_id');
    }

    public function attempts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AnalysisAttempt::class);
    }

    // --- Backward Compatibility Accessors & Mutators ---

    public function getResumeNameAttribute(): string
    {
        return $this->resume_original_name ?? '';
    }

    public function setResumeNameAttribute(?string $value): void
    {
        $this->attributes['resume_original_name'] = $value;
    }

    public function getMatchScoreAttribute(): int
    {
        return $this->score ?? 0;
    }

    public function setMatchScoreAttribute(?int $value): void
    {
        $this->attributes['score'] = $value;
    }

    public function getJobDescriptionAttribute(): ?string
    {
        return $this->jd_text;
    }

    public function setJobDescriptionAttribute(?string $value): void
    {
        $this->attributes['jd_text'] = $value;
    }

    public function getSummaryAttribute(): ?string
    {
        return $this->result['summary'] ?? null;
    }

    public function getMatchedKeywordsAttribute(): array
    {
        return $this->result['matched_keywords'] ?? [];
    }

    public function getMissingKeywordsAttribute(): array
    {
        return $this->result['missing_keywords'] ?? [];
    }

    public function getSuggestionsAttribute(): array
    {
        return $this->result['suggestions'] ?? [];
    }

    public function getScoreBadgeVariantAttribute(): string
    {
        $s = $this->score ?? 0;
        if ($s >= 80) {
            return 'success';
        }

        if ($s >= 60) {
            return 'warning';
        }

        return 'danger';
    }
}
