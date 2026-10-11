<?php

namespace App\Jobs;

use App\Models\Analysis;
use App\Services\AnalysisService;
use App\Services\ResumeTextExtractor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProcessAnalysisJob implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 4;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 240;

    /**
     * Create a new job instance.
     */
    public function __construct(public Analysis $analysis)
    {
        //
    }

    /**
     * Calculate the number of seconds to wait before retrying the job.
     *
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [60, 180, 600];
    }

    /**
     * Execute the job.
     */
    public function handle(AnalysisService $analysisService, ResumeTextExtractor $extractor): void
    {
        Log::info("ProcessAnalysisJob attempt #{$this->attempts()} for Analysis ID {$this->analysis->id}");

        // Idempotency: skip if already completed
        $current = Analysis::query()->find($this->analysis->id);
        if (! $current || $current->status === 'completed') {
            Log::info("Analysis ID {$this->analysis->id} is already completed. Skipping redundant execution.");
            return;
        }

        // Lock record and transition to processing
        DB::transaction(function () {
            $record = Analysis::query()->where('id', $this->analysis->id)->lockForUpdate()->first();
            if ($record && $record->status !== 'completed') {
                $record->update([
                    'status' => 'processing',
                    'started_at' => $record->started_at ?: now(),
                ]);
            }
        });

        try {
            // Extract text if not already extracted
            if (empty($this->analysis->resume_text) && ! empty($this->analysis->resume_path)) {
                $fullPath = Storage::disk('local')->path($this->analysis->resume_path);
                $ext = pathinfo($this->analysis->resume_original_name, PATHINFO_EXTENSION);
                $text = $extractor->extract($fullPath, $ext);
                $this->analysis->update(['resume_text' => $text]);
            }

            // Execute full AI analysis pipeline
            $result = $analysisService->analyze($this->analysis);

            // Save structured result and mark completed
            DB::transaction(function () use ($result) {
                $record = Analysis::query()->where('id', $this->analysis->id)->lockForUpdate()->first();
                if ($record && $record->status !== 'completed') {
                    $record->update([
                        'status' => 'completed',
                        'score' => $result->score,
                        'result' => $result->toArray(),
                        'tokens_in' => $result->tokensIn,
                        'tokens_out' => $result->tokensOut,
                        'is_delayed' => false,
                        'is_basic_fallback' => false,
                        'completed_at' => now(),
                        'error_message' => null,
                    ]);
                }
            });

            Log::info("ProcessAnalysisJob successfully completed for Analysis ID {$this->analysis->id}");
        } catch (Throwable $e) {
            Log::error("ProcessAnalysisJob error on attempt #{$this->attempts()} for Analysis ID {$this->analysis->id}: " . $e->getMessage());

            // Layer 7: Delayed recovery or Final Failure
            if ($this->attempts() >= $this->tries) {
                Analysis::query()->where('id', $this->analysis->id)->update([
                    'status' => 'failed',
                    'is_delayed' => false,
                    'error_message' => 'Our AI analysis system is temporarily experiencing heavy load. Please try submitting again.',
                    'completed_at' => now(),
                ]);
                $this->analysis->refresh();
                throw $e;
            }

            // Not final try: set to delayed and release back to queue
            Analysis::query()->where('id', $this->analysis->id)->update([
                'status' => 'queued',
                'is_delayed' => true,
            ]);
            $this->analysis->refresh();

            $delaySeconds = $this->backoff()[$this->attempts() - 1] ?? 60;
            $this->release($delaySeconds);
        }
    }
}
