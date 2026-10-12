<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiModel;
use App\Services\AiProviders\AnthropicProvider;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AiModelController extends Controller
{
    /**
     * Display a listing of AI models.
     */
    public function index(): Response
    {
        $models = AiModel::withCount('attempts')
            ->orderBy('purpose')
            ->orderByDesc('is_default')
            ->orderBy('fallback_priority')
            ->get()
            ->map(fn (AiModel $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'provider' => $m->provider,
                'model_id' => $m->model_id,
                'purpose' => $m->purpose,
                'temperature' => (float) $m->temperature,
                'max_tokens' => $m->max_tokens,
                'is_active' => (bool) $m->is_active,
                'is_default' => (bool) $m->is_default,
                'fallback_priority' => $m->fallback_priority,
                'input_cost_per_mtok' => (float) $m->input_cost_per_mtok,
                'output_cost_per_mtok' => (float) $m->output_cost_per_mtok,
                'notes' => $m->notes,
                'attempts_count' => $m->attempts_count,
            ]);

        return Inertia::render('Admin/AiModels/Index', [
            'models' => $models,
            'stats' => [
                'total' => AiModel::count(),
                'active' => AiModel::where('is_active', true)->count(),
                'default_analysis' => AiModel::where('purpose', 'analysis')->where('is_default', true)->value('name'),
                'providers' => ['anthropic'],
                'supported_providers' => [
                    ['id' => 'anthropic', 'name' => 'Anthropic Claude', 'available' => true],
                    ['id' => 'openai', 'name' => 'OpenAI GPT-4o', 'available' => false, 'badge' => 'Coming Soon'],
                    ['id' => 'gemini', 'name' => 'Google Gemini 1.5/2.0', 'available' => false, 'badge' => 'Coming Soon'],
                ],
            ],
        ]);
    }

    /**
     * Store a newly created AI model.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'provider' => ['required', Rule::in(['anthropic', 'openai', 'gemini'])],
            'model_id' => ['required', 'string', 'max:255'],
            'purpose' => ['required', Rule::in(['analysis', 'parsing'])],
            'temperature' => ['required', 'numeric', 'between:0,1'],
            'max_tokens' => ['required', 'integer', 'min:128', 'max:32000'],
            'is_active' => ['boolean'],
            'is_default' => ['boolean'],
            'fallback_priority' => ['nullable', 'integer', 'min:1'],
            'input_cost_per_mtok' => ['nullable', 'numeric', 'min:0'],
            'output_cost_per_mtok' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['is_default'] = $request->boolean('is_default', false);

        if ($validated['is_default']) {
            // Unset default on other models for same purpose
            AiModel::where('purpose', $validated['purpose'])->update(['is_default' => false]);
            $validated['is_active'] = true; // default must be active
        }

        $model = AiModel::create($validated);

        AuditLogger::log('ai_model.create', $model, [
            'name' => $model->name,
            'model_id' => $model->model_id,
            'provider' => $model->provider,
            'purpose' => $model->purpose,
            'is_default' => $model->is_default,
        ]);

        return back()->with('success', "AI Model '{$model->name}' has been created successfully.");
    }

    /**
     * Update the specified AI model.
     */
    public function update(Request $request, AiModel $aiModel): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'provider' => ['required', Rule::in(['anthropic', 'openai', 'gemini'])],
            'model_id' => ['required', 'string', 'max:255'],
            'purpose' => ['required', Rule::in(['analysis', 'parsing'])],
            'temperature' => ['required', 'numeric', 'between:0,1'],
            'max_tokens' => ['required', 'integer', 'min:128', 'max:32000'],
            'is_active' => ['boolean'],
            'is_default' => ['boolean'],
            'fallback_priority' => ['nullable', 'integer', 'min:1'],
            'input_cost_per_mtok' => ['nullable', 'numeric', 'min:0'],
            'output_cost_per_mtok' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $newIsDefault = $request->boolean('is_default', false);
        $newIsActive = $request->boolean('is_active', true);

        // Guard: At least one active default must exist for analysis
        if ($aiModel->purpose === 'analysis' && $aiModel->is_default && (! $newIsDefault || ! $newIsActive)) {
            $otherDefault = AiModel::where('purpose', 'analysis')
                ->where('id', '!=', $aiModel->id)
                ->where('is_default', true)
                ->where('is_active', true)
                ->exists();

            if (! $otherDefault) {
                return back()->with('error', "Cannot unset default or deactivate '{$aiModel->name}'. System requires at least one active default model for ATS analysis.");
            }
        }

        $validated['is_active'] = $newIsActive;
        $validated['is_default'] = $newIsDefault;

        if ($validated['is_default']) {
            AiModel::where('purpose', $validated['purpose'])
                ->where('id', '!=', $aiModel->id)
                ->update(['is_default' => false]);
            $validated['is_active'] = true;
        }

        $aiModel->update($validated);

        AuditLogger::log('ai_model.update', $aiModel, [
            'name' => $aiModel->name,
            'model_id' => $aiModel->model_id,
            'is_default' => $aiModel->is_default,
            'is_active' => $aiModel->is_active,
        ]);

        return back()->with('success', "AI Model '{$aiModel->name}' has been updated.");
    }

    /**
     * Set the model as default for its purpose.
     */
    public function setDefault(AiModel $aiModel): RedirectResponse
    {
        AiModel::where('purpose', $aiModel->purpose)->update(['is_default' => false]);

        $aiModel->update([
            'is_default' => true,
            'is_active' => true,
        ]);

        AuditLogger::log('ai_model.set_default', $aiModel, [
            'name' => $aiModel->name,
            'purpose' => $aiModel->purpose,
        ]);

        return back()->with('success', "Model '{$aiModel->name}' is now the default model for {$aiModel->purpose}.");
    }

    /**
     * Toggle the active status of an AI model.
     */
    public function toggleActive(AiModel $aiModel): RedirectResponse
    {
        if ($aiModel->is_default && $aiModel->is_active && $aiModel->purpose === 'analysis') {
            return back()->with('error', "Cannot deactivate the default ATS analysis model. Set another active model as default first.");
        }

        $aiModel->update([
            'is_active' => ! $aiModel->is_active,
        ]);

        AuditLogger::log('ai_model.toggle_active', $aiModel, [
            'name' => $aiModel->name,
            'is_active' => $aiModel->is_active,
        ]);

        return back()->with('success', "Model '{$aiModel->name}' is now " . ($aiModel->is_active ? 'active' : 'inactive') . '.');
    }

    /**
     * Test a model with a sample resume and job description.
     */
    public function testModel(Request $request, AiModel $aiModel, AnthropicProvider $provider): JsonResponse
    {
        $sampleResume = "Alex Morgan\nSenior Full Stack Engineer\n5 years experience developing scalable web applications using PHP, Laravel, TypeScript, React, PostgreSQL, and AWS. Designed RESTful microservices and optimized CI/CD pipelines.";
        $sampleJd = "Senior Full Stack Developer\nRequirements: 4+ years of professional experience with PHP (Laravel framework), React, relational databases (MySQL/PostgreSQL), and cloud deployment. Strong understanding of REST APIs and software architecture.";

        $startTime = hrtime(true);

        try {
            $result = $provider->analyze($sampleResume, $sampleJd, $aiModel);
            $latencyMs = (int) round((hrtime(true) - $startTime) / 1e6);

            AuditLogger::log('ai_model.test_success', $aiModel, [
                'model_id' => $aiModel->model_id,
                'latency_ms' => $latencyMs,
                'tokens_in' => $result->tokensIn,
                'tokens_out' => $result->tokensOut,
            ]);

            return response()->json([
                'success' => true,
                'model_name' => $aiModel->name,
                'model_id' => $aiModel->model_id,
                'provider' => $aiModel->provider,
                'latency_ms' => $latencyMs,
                'tokens_in' => $result->tokensIn,
                'tokens_out' => $result->tokensOut,
                'score' => $result->score,
                'summary' => $result->summary,
                'parsed_json' => $result->toArray(),
            ]);
        } catch (Throwable $e) {
            $latencyMs = (int) round((hrtime(true) - $startTime) / 1e6);

            AuditLogger::log('ai_model.test_failure', $aiModel, [
                'model_id' => $aiModel->model_id,
                'latency_ms' => $latencyMs,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'model_name' => $aiModel->name,
                'model_id' => $aiModel->model_id,
                'latency_ms' => $latencyMs,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove the specified AI model.
     */
    public function destroy(AiModel $aiModel): RedirectResponse
    {
        if ($aiModel->is_default) {
            return back()->with('error', "Cannot delete default model '{$aiModel->name}'. Please designate another model as default first.");
        }

        $attemptsCount = $aiModel->attempts()->count();
        if ($attemptsCount > 0) {
            return back()->with('error', "Cannot delete '{$aiModel->name}' because it has {$attemptsCount} recorded analysis attempts in history. Deactivate it instead.");
        }

        AuditLogger::log('ai_model.delete', $aiModel, [
            'name' => $aiModel->name,
            'model_id' => $aiModel->model_id,
        ]);

        $aiModel->delete();

        return back()->with('success', "AI Model '{$aiModel->name}' has been deleted.");
    }
}
