<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Analysis;
use App\Models\AnalysisAttempt;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $now = now();
        $sevenDaysAgo = $now->copy()->subDays(7);
        $thirtyDaysAgo = $now->copy()->subDays(30);

        // KPI Metrics
        $totalUsers = User::count();
        $newUsers7d = User::where('created_at', '>=', $sevenDaysAgo)->count();
        $activeTrials = User::where('trial_ends_at', '>', $now)->count();
        $activeSubscribers = Subscription::where('status', 'active')->count();

        $analysesToday = Analysis::whereDate('created_at', today())->count();
        $analyses7d = Analysis::where('created_at', '>=', $sevenDaysAgo)->count();
        $analyses30d = Analysis::where('created_at', '>=', $thirtyDaysAgo)->count();

        $attemptsCount = AnalysisAttempt::where('created_at', '>=', $sevenDaysAgo)->count();
        $failedAttempts = AnalysisAttempt::where('created_at', '>=', $sevenDaysAgo)->where('status', 'failed')->count();
        $failureRate = $attemptsCount > 0 ? round(($failedAttempts / $attemptsCount) * 100, 1) : 0.0;

        $totalTokensIn = (int) Analysis::sum('tokens_in');
        $totalTokensOut = (int) Analysis::sum('tokens_out');
        $estimatedCost = round(($totalTokensIn / 1_000_000 * 3.00) + ($totalTokensOut / 1_000_000 * 15.00), 2);

        // Daily Activity Trend (Past 14 days)
        $dates = collect(range(13, 0))->map(fn ($days) => now()->subDays($days)->format('Y-m-d'));
        $trendData = $dates->map(function ($date) {
            return [
                'date' => Carbon::parse($date)->format('M d'),
                'signups' => User::whereDate('created_at', $date)->count(),
                'analyses' => Analysis::whereDate('created_at', $date)->count(),
            ];
        });

        // Recent users
        $recentUsers = User::with('activeSubscription.plan')
            ->latest()
            ->take(6)
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'is_active' => (bool) $user->is_active,
                'trial_ends_at' => $user->trial_ends_at?->toISOString(),
                'plan_name' => $user->activeSubscription?->plan?->name ?? ($user->hasActiveTrial() ? 'Trial' : 'Expired'),
                'created_at' => $user->created_at->toISOString(),
                'formatted_date' => $user->created_at->format('M j, Y'),
            ]);

        // Recent Failures
        $recentFailures = AnalysisAttempt::with(['aiModel', 'analysis'])
            ->where('status', 'failed')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (AnalysisAttempt $attempt) => [
                'id' => $attempt->id,
                'analysis_id' => $attempt->analysis_id,
                'model_name' => $attempt->aiModel?->name ?? 'Default Model',
                'http_status' => $attempt->http_status,
                'failure_type' => $attempt->failure_type,
                'error_message' => $attempt->error_message,
                'created_at' => $attempt->created_at->toISOString(),
                'formatted_date' => $attempt->created_at->format('M j • g:i A'),
            ]);

        return Inertia::render('Admin/Dashboard', [
            'kpis' => [
                'total_users' => $totalUsers,
                'new_users_7d' => $newUsers7d,
                'active_trials' => $activeTrials,
                'active_subscribers' => $activeSubscribers,
                'analyses_today' => $analysesToday,
                'analyses_7d' => $analyses7d,
                'analyses_30d' => $analyses30d,
                'failure_rate' => $failureRate,
                'total_tokens_in' => $totalTokensIn,
                'total_tokens_out' => $totalTokensOut,
                'estimated_ai_cost' => $estimatedCost,
            ],
            'trend_data' => $trendData,
            'recent_users' => $recentUsers,
            'recent_failures' => $recentFailures,
        ]);
    }
}
