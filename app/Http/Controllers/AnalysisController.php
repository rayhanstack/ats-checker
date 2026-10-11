<?php

namespace App\Http\Controllers;

use App\Exceptions\ResumeExtractionException;
use App\Http\Requests\StoreAnalysisRequest;
use App\Jobs\ProcessAnalysisJob;
use App\Models\Analysis;
use App\Services\AccessService;
use App\Services\ResumeTextExtractor;
use App\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AnalysisController extends Controller
{
    /**
     * Display the CV upload and job description submission page.
     */
    public function create(): Response
    {
        return Inertia::render('Analyze', [
            'uploadConfig' => [
                'maxUploadMb' => (int) SettingsService::get('max_upload_mb', 5),
                'allowedFileTypes' => SettingsService::get('allowed_file_types', 'pdf,docx'),
                'maxJdChars' => (int) SettingsService::get('max_jd_chars', 15000),
            ],
        ]);
    }

    /**
     * Store and process resume upload and job description.
     */
    public function store(
        StoreAnalysisRequest $request,
        AccessService $accessService,
        ResumeTextExtractor $extractor
    ): RedirectResponse {
        $user = $request->user();

        if (! $accessService->canAnalyze($user)) {
            return redirect()->route('pricing')->with('error', $accessService->reasonDenied($user));
        }

        $file = $request->file('resume');
        $extension = strtolower($file->getClientOriginalExtension());
        $randomFileName = Str::uuid()->toString() . '.' . $extension;

        // Store on private disk
        $storedPath = $file->storeAs('resumes', $randomFileName, 'local');
        $fullPath = Storage::disk('local')->path($storedPath);

        try {
            $extractedText = $extractor->extract($fullPath, $extension);
        } catch (ResumeExtractionException $e) {
            // Delete file if extraction fails (corrupt, encrypted, or image-only)
            Storage::disk('local')->delete($storedPath);

            return back()->withErrors(['resume' => $e->getMessage()])->withInput();
        }

        $analysis = Analysis::create([
            'user_id' => $user->id,
            'resume_original_name' => $file->getClientOriginalName(),
            'resume_path' => $storedPath,
            'resume_text' => $extractedText,
            'job_title' => $request->validated('job_title') ?: 'Target Position',
            'job_company' => $request->validated('job_company'),
            'jd_text' => $request->validated('jd_text'),
            'status' => 'queued',
            'score' => null,
        ]);

        ProcessAnalysisJob::dispatch($analysis);

        return redirect()->route('analyses.show', $analysis)
            ->with('success', 'Your resume has been uploaded and queued for ATS scoring.');
    }

    /**
     * Display specific analysis results or processing progress.
     */
    public function show(Request $request, Analysis $analysis): Response
    {
        if (! $request->user()->can('view', $analysis)) {
            abort(403, 'Unauthorized action.');
        }

        // Fetch completed previous analyses for the user (for side-by-side comparison)
        $previousAnalyses = $request->user()->analyses()
            ->where('id', '!=', $analysis->id)
            ->where('status', 'completed')
            ->latest()
            ->take(10)
            ->get(['id', 'job_title', 'resume_original_name', 'score', 'created_at'])
            ->map(fn ($item) => [
                'id' => $item->id,
                'job_title' => $item->job_title,
                'resume_name' => $item->resume_original_name,
                'score' => $item->score,
                'formatted_date' => $item->created_at->format('M j, Y • g:i A'),
            ]);

        // If a comparison analysis is requested
        $comparisonAnalysis = null;
        if ($compareId = $request->integer('compare')) {
            $compareRecord = $request->user()->analyses()
                ->where('id', $compareId)
                ->where('status', 'completed')
                ->first();

            if ($compareRecord) {
                $comparisonAnalysis = [
                    'id' => $compareRecord->id,
                    'job_title' => $compareRecord->job_title,
                    'resume_name' => $compareRecord->resume_original_name,
                    'score' => $compareRecord->score,
                    'breakdown' => $compareRecord->result['breakdown'] ?? null,
                    'matched_keywords' => $compareRecord->matched_keywords ?? [],
                    'missing_keywords' => $compareRecord->missing_keywords ?? [],
                    'score_delta' => ($analysis->score !== null && $compareRecord->score !== null)
                        ? ($analysis->score - $compareRecord->score)
                        : null,
                    'formatted_date' => $compareRecord->created_at->format('M j, Y • g:i A'),
                ];
            }
        }

        return Inertia::render('Analyses/Show', [
            'analysis' => [
                'id' => $analysis->id,
                'resume_name' => $analysis->resume_original_name,
                'job_title' => $analysis->job_title,
                'job_company' => $analysis->job_company,
                'jd_text' => $analysis->jd_text,
                'resume_text' => $analysis->resume_text,
                'status' => $analysis->status,
                'score' => $analysis->score,
                'match_score' => $analysis->match_score,
                'badge_variant' => $analysis->score_badge_variant,
                'result' => $analysis->result,
                'summary' => $analysis->summary,
                'matched_keywords' => $analysis->matched_keywords,
                'missing_keywords' => $analysis->missing_keywords,
                'strengths' => $analysis->result['strengths'] ?? [],
                'suggestions' => $analysis->suggestions,
                'breakdown' => $analysis->result['breakdown'] ?? null,
                'keyword_overlap' => $analysis->result['keyword_overlap'] ?? null,
                'is_delayed' => (bool) $analysis->is_delayed,
                'is_basic_fallback' => (bool) $analysis->is_basic_fallback,
                'error_message' => $analysis->error_message,
                'created_at' => $analysis->created_at->toISOString(),
                'formatted_date' => $analysis->created_at->format('M j, Y • g:i A'),
            ],
            'previous_analyses' => $previousAnalyses,
            'comparison_analysis' => $comparisonAnalysis,
        ]);
    }

    /**
     * Re-run analysis with edited job description (creates a new analysis).
     */
    public function rerun(
        Request $request,
        Analysis $analysis,
        AccessService $accessService
    ): RedirectResponse {
        if (! $request->user()->can('rerun', $analysis)) {
            abort(403, 'Unauthorized action.');
        }

        $user = $request->user();

        if (! $accessService->canAnalyze($user)) {
            return redirect()->route('pricing')->with('error', $accessService->reasonDenied($user));
        }

        $validated = $request->validate([
            'job_title' => ['nullable', 'string', 'max:255'],
            'job_company' => ['nullable', 'string', 'max:255'],
            'jd_text' => ['required', 'string', 'min:50', 'max:' . SettingsService::get('max_jd_chars', 15000)],
        ]);

        $newAnalysis = Analysis::create([
            'user_id' => $user->id,
            'resume_original_name' => $analysis->resume_original_name,
            'resume_path' => $analysis->resume_path,
            'resume_text' => $analysis->resume_text,
            'job_title' => $validated['job_title'] ?: $analysis->job_title,
            'job_company' => $validated['job_company'] ?: $analysis->job_company,
            'jd_text' => $validated['jd_text'],
            'status' => 'queued',
            'score' => null,
        ]);

        ProcessAnalysisJob::dispatch($newAnalysis);

        return redirect()->route('analyses.show', $newAnalysis)
            ->with('success', 'New analysis queued with your updated job description.');
    }

    /**
     * Retry a failed analysis (restarts the queue job).
     */
    public function retry(Request $request, Analysis $analysis): RedirectResponse
    {
        if (! $request->user()->can('rerun', $analysis)) {
            abort(403, 'Unauthorized action.');
        }

        if ($analysis->status === 'failed') {
            $analysis->update([
                'status' => 'queued',
                'error_message' => null,
                'is_delayed' => false,
            ]);

            ProcessAnalysisJob::dispatch($analysis);

            return redirect()->route('analyses.show', $analysis)
                ->with('success', 'Analysis re-queued. Scoring will begin shortly.');
        }

        return redirect()->route('analyses.show', $analysis);
    }

    /**
     * Render a print-friendly document view for PDF export.
     */
    public function print(Request $request, Analysis $analysis): Response
    {
        if (! $request->user()->can('download', $analysis)) {
            abort(403, 'Unauthorized action.');
        }

        return Inertia::render('Analyses/Print', [
            'analysis' => [
                'id' => $analysis->id,
                'resume_name' => $analysis->resume_original_name,
                'job_title' => $analysis->job_title,
                'job_company' => $analysis->job_company,
                'jd_text' => $analysis->jd_text,
                'resume_text' => $analysis->resume_text,
                'status' => $analysis->status,
                'score' => $analysis->score,
                'match_score' => $analysis->match_score,
                'badge_variant' => $analysis->score_badge_variant,
                'result' => $analysis->result,
                'summary' => $analysis->summary,
                'matched_keywords' => $analysis->matched_keywords,
                'missing_keywords' => $analysis->missing_keywords,
                'strengths' => $analysis->result['strengths'] ?? [],
                'suggestions' => $analysis->suggestions,
                'breakdown' => $analysis->result['breakdown'] ?? null,
                'keyword_overlap' => $analysis->result['keyword_overlap'] ?? null,
                'created_at' => $analysis->created_at->toISOString(),
                'formatted_date' => $analysis->created_at->format('F j, Y'),
            ],
            'site_name' => SettingsService::get('site_name', 'ATS Checker'),
        ]);
    }

    /**
     * Display a listing of the user's analyses with search, filters, and pagination.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = $user->analyses()->latest();

        // 1. Search term
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('job_title', 'like', "%{$search}%")
                    ->orWhere('resume_original_name', 'like', "%{$search}%")
                    ->orWhere('job_company', 'like', "%{$search}%");
            });
        }

        // 2. Score filter
        if ($scoreFilter = $request->string('score')->toString()) {
            match ($scoreFilter) {
                'high' => $query->where('score', '>=', 80),
                'medium' => $query->whereBetween('score', [60, 79]),
                'low' => $query->where('score', '<', 60),
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
                'resume_name' => $analysis->resume_original_name,
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
                'avg_score' => (int) round($user->analyses()->whereNotNull('score')->avg('score') ?? 0),
            ],
        ]);
    }

    /**
     * Delete the user's own analysis.
     */
    public function destroy(Request $request, Analysis $analysis): RedirectResponse
    {
        // Enforce ownership via policy
        if (! $request->user()->can('delete', $analysis)) {
            abort(403, 'Unauthorized action.');
        }

        // Delete associated resume file on private disk
        if ($analysis->resume_path && Storage::disk('local')->exists($analysis->resume_path)) {
            Storage::disk('local')->delete($analysis->resume_path);
        }

        $analysis->delete();

        return back()->with('success', 'Analysis record has been deleted.');
    }
}
