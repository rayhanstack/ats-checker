<?php

namespace App\Http\Controllers;

use App\Models\Analysis;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AnalysisController extends Controller
{
    /**
     * Display a listing of the user's analyses with search, filters, and pagination.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = $user->analyses()->latest();

        // 1. Search term (matches job_title, resume_name, job_company)
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('job_title', 'like', "%{$search}%")
                    ->orWhere('resume_name', 'like', "%{$search}%")
                    ->orWhere('job_company', 'like', "%{$search}%");
            });
        }

        // 2. Score filter ('high' >= 80, 'medium' 60-79, 'low' < 60)
        if ($scoreFilter = $request->string('score')->toString()) {
            match ($scoreFilter) {
                'high' => $query->where('match_score', '>=', 80),
                'medium' => $query->whereBetween('match_score', [60, 79]),
                'low' => $query->where('match_score', '<', 60),
                default => null,
            };
        }

        // 3. Date range filter
        if ($dateFilter = $request->string('date')->toString()) {
            match ($dateFilter) {
                '7d' => $query->where('created_at', '>=', now()->subDays(7)),
                '30d' => $query->where('created_at', '>=', now()->subDays(30)),
                '90d' => $query->where('created_at', '>=', now()->subDays(90)),
                default => null,
            };
        }

        $analyses = $query->paginate(10)
            ->withQueryString()
            ->through(fn (Analysis $analysis) => [
                'id' => $analysis->id,
                'resume_name' => $analysis->resume_name,
                'job_title' => $analysis->job_title,
                'job_company' => $analysis->job_company,
                'match_score' => $analysis->match_score,
                'status' => $analysis->status,
                'badge_variant' => $analysis->score_badge_variant,
                'summary' => $analysis->summary,
                'created_at' => $analysis->created_at->toISOString(),
                'formatted_date' => $analysis->created_at->format('M j, Y • g:i A'),
            ]);

        return Inertia::render('Analyses/Index', [
            'analyses' => $analyses,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'score' => $request->string('score', 'all')->toString(),
                'date' => $request->string('date', 'all')->toString(),
            ],
            'stats' => [
                'total' => $user->analyses()->count(),
                'avg_score' => (int) round($user->analyses()->avg('match_score') ?? 0),
            ],
        ]);
    }

    /**
     * Delete the user's own analysis.
     */
    public function destroy(Request $request, Analysis $analysis): RedirectResponse
    {
        // Enforce ownership
        if ($analysis->user_id !== $request->user()->id && ! $request->user()->isAdmin()) {
            abort(403, 'Unauthorized action.');
        }

        // Delete associated resume file if stored
        if ($analysis->resume_path && Storage::exists($analysis->resume_path)) {
            Storage::delete($analysis->resume_path);
        }

        $analysis->delete();

        return back()->with('success', 'Analysis record has been deleted.');
    }
}
