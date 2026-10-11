<?php

namespace App\Http\Controllers;

use App\Services\AccessService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(protected AccessService $accessService)
    {
    }

    /**
     * Display the candidate workspace dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Time-of-day contextual greeting
        $hour = (int) now()->format('H');
        $timeGreeting = match (true) {
            $hour < 12 => 'Good morning',
            $hour < 18 => 'Good afternoon',
            default => 'Good evening',
        };

        $accessSummary = $this->accessService->getAccessSummary($user);

        // Fetch recent analyses
        $recentAnalyses = $user->analyses()
            ->latest()
            ->take(5)
            ->get([
                'id',
                'resume_name',
                'job_title',
                'job_company',
                'match_score',
                'status',
                'created_at',
            ])
            ->map(fn ($item) => [
                'id' => $item->id,
                'resume_name' => $item->resume_name,
                'job_title' => $item->job_title,
                'job_company' => $item->job_company,
                'match_score' => $item->match_score,
                'status' => $item->status,
                'badge_variant' => $item->score_badge_variant,
                'created_at' => $item->created_at->toISOString(),
                'formatted_date' => $item->created_at->diffForHumans(),
            ]);

        // Aggregate analysis stats
        $totalScans = $user->analyses()->count();
        $avgScore = $totalScans > 0 ? (int) round($user->analyses()->avg('match_score')) : 0;
        $bestScore = $totalScans > 0 ? (int) $user->analyses()->max('match_score') : 0;

        return Inertia::render('Dashboard', [
            'greeting' => "{$timeGreeting}, {$user->name}!",
            'access' => $accessSummary,
            'stats' => [
                'total_scans' => $totalScans,
                'avg_score' => $avgScore,
                'best_score' => $bestScore,
            ],
            'recentAnalyses' => $recentAnalyses,
        ]);
    }
}
