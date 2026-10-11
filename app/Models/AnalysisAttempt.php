<?php

namespace App\Models;

use App\Enums\AiFailureType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'analysis_id',
    'ai_model_id',
    'attempt_no',
    'status',
    'failure_type',
    'http_status',
    'error_message',
    'latency_ms',
    'tokens_in',
    'tokens_out',
    'created_at',
])]
class AnalysisAttempt extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'attempt_no' => 'integer',
            'http_status' => 'integer',
            'latency_ms' => 'integer',
            'tokens_in' => 'integer',
            'tokens_out' => 'integer',
            'failure_type' => AiFailureType::class,
            'created_at' => 'datetime',
        ];
    }

    public function analysis(): BelongsTo
    {
        return $this->belongsTo(Analysis::class);
    }

    public function aiModel(): BelongsTo
    {
        return $this->belongsTo(AiModel::class);
    }
}
