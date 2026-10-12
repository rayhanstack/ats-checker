<?php

namespace App\Console\Commands;

use App\Models\Analysis;
use App\Services\SettingsService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PurgeExpiredResumesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'resumes:purge-expired {--days= : Override retention days}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Purge expired resumes and extracted text per privacy retention settings';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $retentionDays = (int) ($this->option('days') ?: SettingsService::get('resume_retention_days', 30));
        $keepResults = (bool) SettingsService::get('keep_results_after_resume_deleted', true);

        if ($retentionDays <= 0) {
            $this->info("Retention days is configured as {$retentionDays} (disabled). Skipping purge.");
            return self::SUCCESS;
        }

        $cutoffDate = now()->subDays($retentionDays);

        $this->info("Scanning for analyses older than {$retentionDays} days (before {$cutoffDate->toDateTimeString()})...");

        // Find analyses older than cutoff date that still have a resume file or extracted text
        $analyses = Analysis::where('created_at', '<', $cutoffDate)
            ->where(function ($query) {
                $query->whereNotNull('resume_path')
                    ->orWhereNotNull('resume_text');
            })
            ->get();

        $purgedCount = 0;

        foreach ($analyses as $analysis) {
            // 1. Delete physical resume file from storage disk if present
            if ($analysis->resume_path && Storage::disk('local')->exists($analysis->resume_path)) {
                Storage::disk('local')->delete($analysis->resume_path);
            }

            $analysis->resume_path = null;
            $analysis->resume_text = null; // Privacy: clear raw extracted text

            // 2. If not configured to keep results, purge full result JSON as well
            if (! $keepResults) {
                $analysis->result = null;
            }

            $analysis->save();
            $purgedCount++;
        }

        $message = "Purged {$purgedCount} expired resume(s) older than {$retentionDays} days. (Keep results mode: " . ($keepResults ? 'ON' : 'OFF') . ')';
        $this->info($message);
        Log::info($message);

        return self::SUCCESS;
    }
}
