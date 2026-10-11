<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\AnalysisAttempt;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AdminAlertService
{
    protected const THROTTLE_MINUTES = 30;

    /**
     * Send an admin alert with 30-minute deduplication throttle per issue key.
     *
     * @param string $issueKey e.g. "circuit_open_claude-sonnet-5-5" or "auth_billing_anthropic"
     * @param string $title
     * @param string $message
     * @param array<string, mixed> $context
     */
    public function alert(string $issueKey, string $title, string $message, array $context = []): bool
    {
        $cacheKey = "admin_alert_throttle:{$issueKey}";

        if (Cache::has($cacheKey)) {
            Log::info("Admin alert suppressed by throttle [{$issueKey}]: {$title}");
            return false;
        }

        Cache::put($cacheKey, true, now()->addMinutes(self::THROTTLE_MINUTES));

        Log::critical("AI PIPELINE ALERT [{$issueKey}]: {$title} - {$message}", $context);

        // Notify all system administrators
        try {
            $admins = User::where('role', Role::Admin)->get();
            $adminEmail = SettingsService::get('contact_email', config('mail.from.address'));

            // If admins exist, we can send notification or mail
            foreach ($admins as $admin) {
                // In production, send Mailable or Database Notification
            }
        } catch (\Throwable $e) {
            Log::error("Failed sending admin alert email: " . $e->getMessage());
        }

        return true;
    }

    /**
     * Check if failure rate across all attempts in the last 15 minutes exceeds 20%.
     */
    public function checkFailureRate(): void
    {
        $since = now()->subMinutes(15);

        $total = AnalysisAttempt::where('created_at', '>=', $since)->count();
        if ($total < 5) {
            return;
        }

        $failed = AnalysisAttempt::where('created_at', '>=', $since)
            ->where('status', 'failed')
            ->count();

        $rate = $failed / $total;
        if ($rate > 0.20) {
            $pct = round($rate * 100);
            $this->alert(
                'high_failure_rate',
                "AI Failure Rate Exceeded Threshold ({$pct}%)",
                "During the last 15 minutes, {$failed} out of {$total} AI analysis requests failed ({$pct}% failure rate)."
            );
        }
    }
}
