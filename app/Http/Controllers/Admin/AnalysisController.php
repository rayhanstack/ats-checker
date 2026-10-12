<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessAnalysisJob;
use App\Models\AiModel;
use App\Models\Analysis;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AnalysisController extends Controller
{
    /**
     * Display a listing of all CV uploads and AI analyses across users.
     */
    public function index(Request $request): Response
    {
        $query = Analysis::with(['user', 'aiModel'])->latest();

        // 1. Search term (Job title, file name, user name, user email)
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('job_title', 'like', "%{$search}%")
                    ->orWhere('resume_original_name', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        // 2. User filter
        if ($userId = $request->integer('user_id')) {
            $query->where('user_id', $userId);
        }

        // 3. Status filter
        if ($status = $request->string('status')->toString()) {
            if (in_array($status, ['queued', 'processing', 'completed', 'failed'])) {
                $query->where('status', $status);
            }
        }

        // 4. Score range filter
        if ($scoreRange = $request->string('score_range')->toString()) {
            match ($scoreRange) {
                'high' => $query->where('score', '>=', 80),
                'medium' => $query->whereBetween('score', [50, 79]),
                'low' => $query->where('score', '<', 50)->whereNotNull('score'),
                default => null,
            };
        }

        // 5. Date range filter
        if ($dateRange = $request->string('date_range')->toString()) {
            match ($dateRange) {
                'today' => $query->whereDate('created_at', today()),
                '7d' => $query->where('created_at', '>=', now()->subDays(7)),
                '30d' => $query->where('created_at', '>=', now()->subDays(30)),
                '90d' => $query->where('created_at', '>=', now()->subDays(90)),
                default => null,
            };
        }

        // 6. AI Model filter
        if ($modelId = $request->integer('model_id')) {
            $query->where('ai_model_id', $modelId);
        }

        $analyses = $query->paginate(15)
            ->withQueryString()
            ->through(fn (Analysis $analysis) => [
                'id' => $analysis->id,
                'user' => $analysis->user ? [
                    'id' => $analysis->user->id,
                    'name' => $analysis->user->name,
                    'email' => $analysis->user->email,
                ] : null,
                'resume_name' => $analysis->resume_original_name,
                'job_title' => $analysis->job_title,
                'job_company' => $analysis->job_company,
                'status' => $analysis->status,
                'score' => $analysis->score,
                'ai_model_name' => $analysis->aiModel?->name ?? 'Default Engine',
                'tokens_in' => $analysis->tokens_in ?? 0,
                'tokens_out' => $analysis->tokens_out ?? 0,
                'total_tokens' => ($analysis->tokens_in ?? 0) + ($analysis->tokens_out ?? 0),
                'duration_seconds' => ($analysis->started_at && $analysis->completed_at)
                    ? $analysis->completed_at->diffInSeconds($analysis->started_at)
                    : null,
                'is_delayed' => (bool) $analysis->is_delayed,
                'is_basic_fallback' => (bool) $analysis->is_basic_fallback,
                'has_file' => (bool) ($analysis->resume_path && Storage::disk('local')->exists($analysis->resume_path)),
                'resume_text' => $analysis->resume_text,
                'jd_text' => $analysis->jd_text,
                'result' => $analysis->result,
                'error_message' => $analysis->error_message,
                'created_at' => $analysis->created_at->toISOString(),
                'formatted_date' => $analysis->created_at->format('M j, Y • g:i A'),
            ]);

        $users = User::orderBy('name')->take(100)->get(['id', 'name', 'email']);
        $models = AiModel::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Analyses/Index', [
            'analyses' => $analyses,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'user_id' => $request->string('user_id')->toString(),
                'status' => $request->string('status', 'all')->toString(),
                'score_range' => $request->string('score_range', 'all')->toString(),
                'date_range' => $request->string('date_range', 'all')->toString(),
                'model_id' => $request->string('model_id')->toString(),
            ],
            'users' => $users,
            'models' => $models,
            'stats' => [
                'total' => Analysis::count(),
                'completed' => Analysis::where('status', 'completed')->count(),
                'failed' => Analysis::where('status', 'failed')->count(),
                'avg_score' => (int) round(Analysis::whereNotNull('score')->avg('score') ?? 0),
            ],
        ]);
    }

    /**
     * Download the original resume file from private storage (Admin only).
     */
    public function downloadCv(Analysis $analysis)
    {
        if (! $analysis->resume_path || ! Storage::disk('local')->exists($analysis->resume_path)) {
            return back()->with('error', 'The requested resume file does not exist in private storage.');
        }

        AuditLogger::log('analysis.download_cv', $analysis, [
            'resume_name' => $analysis->resume_original_name,
            'candidate_id' => $analysis->user_id,
        ]);

        return Storage::disk('local')->download($analysis->resume_path, $analysis->resume_original_name);
    }

    /**
     * Re-run an analysis job.
     */
    public function rerun(Analysis $analysis): RedirectResponse
    {
        $analysis->update([
            'status' => 'queued',
            'error_message' => null,
            'is_delayed' => false,
            'is_basic_fallback' => false,
            'started_at' => null,
            'completed_at' => null,
        ]);

        ProcessAnalysisJob::dispatch($analysis);

        AuditLogger::log('analysis.rerun', $analysis, [
            'job_title' => $analysis->job_title,
            'candidate_id' => $analysis->user_id,
        ]);

        return back()->with('success', "Analysis #{$analysis->id} has been re-queued for processing.");
    }

    /**
     * Delete an analysis and remove the private resume file.
     */
    public function destroy(Analysis $analysis): RedirectResponse
    {
        if ($analysis->resume_path && Storage::disk('local')->exists($analysis->resume_path)) {
            Storage::disk('local')->delete($analysis->resume_path);
        }

        AuditLogger::log('analysis.delete', $analysis, [
            'job_title' => $analysis->job_title,
            'resume_name' => $analysis->resume_original_name,
            'candidate_id' => $analysis->user_id,
        ]);

        $analysis->delete();

        return back()->with('success', "Analysis #{$analysis->id} and associated files have been deleted.");
    }

    /**
     * Export analyses as a CSV file.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        AuditLogger::log('analysis.export_csv', null, [
            'query_filters' => $request->all(),
        ]);

        $query = Analysis::with(['user', 'aiModel'])->latest();

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('job_title', 'like', "%{$search}%")
                    ->orWhere('resume_original_name', 'like', "%{$search}%");
            });
        }
        if ($status = $request->string('status')->toString()) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="ats_analyses_' . date('Y-m-d_His') . '.csv"',
        ];

        return response()->stream(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'ID',
                'Candidate Name',
                'Candidate Email',
                'Job Title',
                'File Name',
                'Status',
                'Score',
                'AI Model',
                'Tokens In',
                'Tokens Out',
                'Date',
            ]);

            $query->chunk(100, function ($analyses) use ($handle) {
                foreach ($analyses as $a) {
                    fputcsv($handle, [
                        $a->id,
                        $a->user?->name ?? 'Deleted User',
                        $a->user?->email ?? '',
                        $a->job_title,
                        $a->resume_original_name,
                        $a->status,
                        $a->score ?? 'N/A',
                        $a->aiModel?->name ?? 'Default',
                        $a->tokens_in ?? 0,
                        $a->tokens_out ?? 0,
                        $a->created_at->toDateTimeString(),
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }
}
