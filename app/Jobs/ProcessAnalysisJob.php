<?php

namespace App\Jobs;

use App\Models\Analysis;
use App\Services\ResumeTextExtractor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProcessAnalysisJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(public Analysis $analysis)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(ResumeTextExtractor $extractor): void
    {
        Log::info("ProcessAnalysisJob started for Analysis ID {$this->analysis->id}");

        $this->analysis->update([
            'status' => 'processing',
            'started_at' => now(),
        ]);

        try {
            // If resume_text has not been extracted yet, extract it now
            if (empty($this->analysis->resume_text) && ! empty($this->analysis->resume_path)) {
                $fullPath = Storage::disk('local')->path($this->analysis->resume_path);
                $ext = pathinfo($this->analysis->resume_original_name, PATHINFO_EXTENSION);
                $text = $extractor->extract($fullPath, $ext);
                $this->analysis->update(['resume_text' => $text]);
            }

            // Phase 6 will attach Claude AI analysis here.
            // For Phase 5 testing and baseline job execution:
            $this->analysis->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            Log::info("ProcessAnalysisJob completed for Analysis ID {$this->analysis->id}");
        } catch (Throwable $e) {
            Log::error("ProcessAnalysisJob failed for Analysis ID {$this->analysis->id}: " . $e->getMessage());

            $this->analysis->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);
        }
    }
}
