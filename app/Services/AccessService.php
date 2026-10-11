<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\User;

class AccessService
{
    /**
     * Check if user is currently eligible to run an analysis.
     */
    public function canAnalyze(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        // Active paid subscription check
        $subscription = $user->activeSubscription;
        if ($subscription && $subscription->isActive()) {
            $plan = $subscription->plan;
            if ($plan && $plan->isUnlimited()) {
                return true;
            }

            return $this->remainingAnalyses($user) > 0;
        }

        // Trial check
        if ($this->isTrialActive($user)) {
            return $this->remainingAnalyses($user) > 0;
        }

        return false;
    }

    /**
     * Get the reason why an analysis is denied, or null if allowed.
     */
    public function reasonDenied(?User $user): ?string
    {
        if (! $user) {
            return 'Please log in to upload and analyze your resume.';
        }

        if ($this->canAnalyze($user)) {
            return null;
        }

        // Case 1: Active subscription but exhausted limits
        $subscription = $user->activeSubscription;
        if ($subscription && $subscription->isActive()) {
            $plan = $subscription->plan;
            $limit = $plan ? ($plan->analyses_limit ?? 'plan') : 'plan';

            return "You have reached your limit of {$limit} analyses for this billing cycle. Upgrade to Annual Unlimited to continue scanning.";
        }

        // Case 2: Trial expired
        if ($user->trial_ends_at && $user->trial_ends_at->isPast()) {
            $date = $user->trial_ends_at->format('M j, Y');

            return "Your free trial expired on {$date}. Please choose a plan to continue analyzing resumes.";
        }

        // Case 3: In trial, but exceeded trial analysis quota
        if ($this->isTrialActive($user)) {
            $trialLimit = $this->getTrialLimit();

            return "You have reached your limit of {$trialLimit} analyses in the free trial. Choose a plan to unlock more analyses.";
        }

        return 'An active subscription or free trial is required to analyze resumes. Please choose a plan to proceed.';
    }

    /**
     * Calculate remaining analyses count for user.
     * Returns integer or 'Unlimited'.
     */
    public function remainingAnalyses(?User $user): int|string
    {
        if (! $user) {
            return 0;
        }

        if ($user->isAdmin()) {
            return 'Unlimited';
        }

        // Check active paid subscription
        $subscription = $user->activeSubscription;
        if ($subscription && $subscription->isActive()) {
            $plan = $subscription->plan;
            if ($plan && $plan->isUnlimited()) {
                return 'Unlimited';
            }

            $limit = $plan ? ($plan->analyses_limit ?? 50) : 50;
            $used = $user->analyses()
                ->where('created_at', '>=', $subscription->starts_at)
                ->count();

            return max(0, $limit - $used);
        }

        // Check active trial
        if ($this->isTrialActive($user)) {
            $limit = $this->getTrialLimit();
            $used = $user->analyses()->count();

            return max(0, $limit - $used);
        }

        return 0;
    }

    /**
     * Check if user's trial is active.
     */
    public function isTrialActive(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->hasActiveTrial()) {
            return true;
        }

        $subscription = $user->activeSubscription;
        if ($subscription && $subscription->status === 'trialing' && $subscription->isActive()) {
            return true;
        }

        return false;
    }

    /**
     * Get user's current effective plan.
     */
    public function currentPlan(?User $user): ?Plan
    {
        if (! $user) {
            return null;
        }

        $subscription = $user->activeSubscription;
        if ($subscription && $subscription->isActive()) {
            return $subscription->plan;
        }

        if ($this->isTrialActive($user)) {
            return Plan::query()->whereIn('slug', ['free', 'free-trial'])->first() ?? (new Plan([
                'name' => 'Free Trial',
                'slug' => 'free',
                'analyses_limit' => $this->getTrialLimit(),
                'limit_period' => 'trial',
                'billing_interval' => 'none',
            ]));
        }

        return null;
    }

    /**
     * Get trial analysis limit from settings or free plan.
     */
    public function getTrialLimit(): int
    {
        $freePlan = Plan::query()->whereIn('slug', ['free', 'free-trial'])->first();
        if ($freePlan && $freePlan->analyses_limit > 0) {
            return $freePlan->analyses_limit;
        }

        return (int) SettingsService::get('trial_analyses_limit', 5);
    }

    /**
     * Get comprehensive access and usage summary for UI dashboards and Inertia props.
     */
    public function getAccessSummary(User $user): array
    {
        $canAnalyze = $this->canAnalyze($user);
        $reasonDenied = $this->reasonDenied($user);
        $remaining = $this->remainingAnalyses($user);
        $isTrial = $this->isTrialActive($user);
        $currentPlan = $this->currentPlan($user);
        $subscription = $user->activeSubscription;

        // Calculate usage meter
        $isUnlimited = $remaining === 'Unlimited';
        $totalLimit = $isUnlimited ? 'Unlimited' : ($currentPlan ? ($currentPlan->analyses_limit ?? 5) : 5);

        $usedCount = 0;
        if ($subscription && $subscription->isActive()) {
            $usedCount = $user->analyses()
                ->where('created_at', '>=', $subscription->starts_at)
                ->count();
        } else {
            $usedCount = $user->analyses()->count();
        }

        $usagePercentage = 100;
        if (is_numeric($totalLimit) && $totalLimit > 0) {
            $usagePercentage = min(100, (int) round(($usedCount / $totalLimit) * 100));
        } elseif ($isUnlimited) {
            $usagePercentage = 0;
        }

        $daysRemaining = 0;
        if ($user->trial_ends_at && $user->trial_ends_at->isFuture()) {
            $daysRemaining = max(1, (int) ceil(now()->diffInHours($user->trial_ends_at) / 24));
        } elseif ($subscription && $subscription->status === 'trialing' && $subscription->ends_at && $subscription->ends_at->isFuture()) {
            $daysRemaining = max(1, (int) ceil(now()->diffInHours($subscription->ends_at) / 24));
        }

        $status = 'expired';
        if ($subscription && $subscription->isActive()) {
            $status = $subscription->status;
        } elseif ($isTrial) {
            $status = 'trial';
        }

        return [
            'can_analyze' => $canAnalyze,
            'reason_denied' => $reasonDenied,
            'remaining_analyses' => $remaining,
            'used_analyses' => $usedCount,
            'total_limit' => $totalLimit,
            'usage_percentage' => $usagePercentage,
            'is_trial_active' => $isTrial,
            'trial_days_remaining' => $daysRemaining,
            'trial_ends_at' => $user->trial_ends_at?->toISOString(),
            'status' => $status,
            'plan_name' => $currentPlan ? $currentPlan->name : ($isTrial ? 'Free Trial' : 'No Active Plan'),
            'plan_slug' => $currentPlan?->slug,
            'renews_at' => $subscription?->ends_at?->toISOString(),
            'ends_at' => $subscription?->ends_at?->toISOString(),
        ];
    }
}
