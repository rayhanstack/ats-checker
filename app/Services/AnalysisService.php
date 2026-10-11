<?php

namespace App\Services;

use App\Contracts\AiProvider;
use App\DTOs\AnalysisResult;
use App\Enums\AiFailureType;
use App\Exceptions\AiProviderException;
use App\Models\AiModel;
use App\Models\Analysis;
use App\Models\AnalysisAttempt;
use App\Services\AiProviders\AnthropicProvider;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

class AnalysisService
{
    public function __construct(
        protected AnthropicProvider $anthropicProvider,
        protected KeywordOverlapService $keywordOverlapService,
        protected CircuitBreakerService $circuitBreaker,
        protected AdminAlertService $adminAlertService,
    ) {
    }

    /**
     * Resolve the appropriate AI Provider for a given model.
     */
    public function resolveProvider(AiModel $model): AiProvider
    {
        return match ($model->provider) {
            'anthropic' => $this->anthropicProvider,
            default => $this->anthropicProvider, // Future: 'openai' => $this->openAiProvider, 'gemini' => $this->geminiProvider
        };
    }

    /**
     * Execute full resilient analysis pipeline for an Analysis record.
     *
     * @param Analysis $analysis
     * @return AnalysisResult
     *
     * @throws Throwable If all models in the fallback chain fail
     */
    public function analyze(Analysis $analysis): AnalysisResult
    {
        $resumeText = (string) $analysis->resume_text;
        $jdText = (string) $analysis->jd_text;

        // Idempotency / Deduplication Cache (24 hours)
        $cacheKey = 'ats_analysis_cache:' . hash('sha256', $resumeText . '|' . $jdText);
        $cachedResult = Cache::get($cacheKey);
        if ($cachedResult && is_array($cachedResult)) {
            Log::info("Serving cached ATS analysis for Analysis ID {$analysis->id}");
            $result = AnalysisResult::fromArray($cachedResult);
            // Ensure secondary keyword overlap is present
            if (! $result->keywordOverlap) {
                $result->keywordOverlap = $this->keywordOverlapService->compute($resumeText, $jdText);
            }
            return $result;
        }

        // Compute deterministic keyword overlap (secondary signal)
        $keywordOverlap = $this->keywordOverlapService->compute($resumeText, $jdText);

        // Build fallback chain of models
        $modelsChain = $this->getModelsChain();
        if ($modelsChain->isEmpty()) {
            throw new \RuntimeException('No active AI models configured for ATS analysis.');
        }

        $attemptNo = (int) $analysis->attempts()->count() + 1;
        $lastException = null;

        foreach ($modelsChain as $model) {
            // Layer 5: Circuit Breaker Check
            if (! $this->circuitBreaker->isAvailable($model)) {
                Log::warning("Circuit breaker OPEN for model [{$model->model_id}], skipping in fallback chain.");
                continue;
            }

            $provider = $this->resolveProvider($model);

            // Layer 2: Retry the same model for RETRYABLE errors (up to 2 retries)
            $modelRetries = 2;
            for ($retry = 0; $retry <= $modelRetries; $retry++) {
                $startTime = hrtime(true);
                try {
                    $result = $provider->analyze($resumeText, $jdText, $model);

                    // Success! Record attempt, circuit breaker success, and update model
                    $latencyMs = (int) round((hrtime(true) - $startTime) / 1e6);
                    $this->recordAttempt(
                        analysis: $analysis,
                        model: $model,
                        attemptNo: $attemptNo++,
                        status: 'success',
                        latencyMs: $latencyMs,
                        tokensIn: $result->tokensIn,
                        tokensOut: $result->tokensOut
                    );

                    $this->circuitBreaker->recordSuccess($model);

                    // Attach deterministic keyword overlap
                    $result->keywordOverlap = $keywordOverlap;

                    // Cache for 24h
                    Cache::put($cacheKey, $result->toArray(), now()->addDay());

                    return $result;
                } catch (Throwable $e) {
                    $latencyMs = (int) round((hrtime(true) - $startTime) / 1e6);
                    $failureType = $this->classifyError($e);
                    $httpStatus = $e instanceof AiProviderException ? $e->httpStatus : 500;

                    $this->recordAttempt(
                        analysis: $analysis,
                        model: $model,
                        attemptNo: $attemptNo++,
                        status: 'failed',
                        failureType: $failureType,
                        httpStatus: $httpStatus,
                        errorMessage: $e->getMessage(),
                        latencyMs: $latencyMs
                    );

                    // Layer 3: Repair once for INVALID_OUTPUT
                    if ($failureType === AiFailureType::INVALID_OUTPUT && $retry === 0) {
                        try {
                            $repaired = $provider->analyze($resumeText, $jdText, $model, [
                                'repair_error' => $e->getMessage(),
                            ]);

                            $this->circuitBreaker->recordSuccess($model);
                            $repaired->keywordOverlap = $keywordOverlap;
                            Cache::put($cacheKey, $repaired->toArray(), now()->addDay());
                            return $repaired;
                        } catch (Throwable $repairException) {
                            Log::warning("Repair attempt failed for model [{$model->model_id}]: " . $repairException->getMessage());
                        }
                    }

                    // Layer 6: Alert on AUTH_OR_BILLING immediately and trip circuit
                    if ($failureType === AiFailureType::AUTH_OR_BILLING) {
                        $this->adminAlertService->alert(
                            "auth_billing_{$model->provider}",
                            "AI Authentication / Billing Failure",
                            "Model [{$model->model_id}] failed with status [{$httpStatus}]: {$e->getMessage()}"
                        );
                        // Do not retry same model on auth/billing error
                        break;
                    }

                    // Check if error is RETRYABLE
                    if ($failureType === AiFailureType::RETRYABLE && $retry < $modelRetries) {
                        $sleepSeconds = 1;
                        if ($e instanceof AiProviderException && $e->retryAfterSeconds) {
                            $sleepSeconds = min(5, $e->retryAfterSeconds);
                        }
                        if (app()->environment() !== 'testing') {
                            sleep($sleepSeconds);
                        }
                        continue;
                    }

                    // Model failure: record in circuit breaker
                    $tripped = $this->circuitBreaker->recordFailure($model, $e->getMessage());
                    if ($tripped) {
                        $this->adminAlertService->alert(
                            "circuit_open_{$model->model_id}",
                            "Circuit Breaker Tripped for {$model->name}",
                            "Model [{$model->model_id}] exceeded 5 failures in 5 minutes and is now set to OPEN."
                        );
                    }

                    $lastException = $e;
                    break; // Move to next fallback model
                }
            }
        }

        // Layer 6: Check general failure rate
        $this->adminAlertService->checkFailureRate();

        // Layer 8: Honest Degraded Result (if enabled by admin)
        $allowBasicFallback = (bool) SettingsService::get('allow_basic_fallback', true);
        if ($allowBasicFallback) {
            $analysis->update([
                'is_delayed' => true,
                'is_basic_fallback' => true,
                'score' => $keywordOverlap['score'],
                'result' => [
                    'score' => $keywordOverlap['score'],
                    'breakdown' => [
                        'keywords' => [
                            'score' => $keywordOverlap['score'],
                            'note' => 'Deterministic keyword match score.',
                        ],
                    ],
                    'matched_keywords' => $keywordOverlap['matched_keywords'],
                    'missing_keywords' => $keywordOverlap['missing_keywords'],
                    'strengths' => ['Strong keyword alignment with core posting terms.'],
                    'suggestions' => [],
                    'summary' => 'Basic keyword analysis (AI review pending). Full semantic analysis will be automatically applied when AI queue normalizes.',
                    'keyword_overlap' => $keywordOverlap,
                ],
            ]);
        }

        throw $lastException ?: new \RuntimeException('All models in the AI fallback chain failed.');
    }

    /**
     * Layer 1: Classify any error into AiFailureType.
     */
    public function classifyError(Throwable $e): AiFailureType
    {
        if ($e instanceof AiProviderException) {
            if ($e->isInvalidOutput) {
                return AiFailureType::INVALID_OUTPUT;
            }

            $status = $e->httpStatus;
            if (in_array($status, [401, 403])) {
                return AiFailureType::AUTH_OR_BILLING;
            }
            if ($status === 404) {
                return AiFailureType::MODEL_UNAVAILABLE;
            }
            if ($status === 400) {
                return AiFailureType::BAD_REQUEST;
            }
            if (in_array($status, [429, 500, 502, 503, 529]) || $status === 0) {
                return AiFailureType::RETRYABLE;
            }
        }

        $msg = strtolower($e->getMessage());
        if (str_contains($msg, 'rate limit') || str_contains($msg, 'overloaded') || str_contains($msg, 'timeout') || str_contains($msg, 'connection')) {
            return AiFailureType::RETRYABLE;
        }

        if (str_contains($msg, 'unauthorized') || str_contains($msg, 'credit') || str_contains($msg, 'balance') || str_contains($msg, 'api key')) {
            return AiFailureType::AUTH_OR_BILLING;
        }

        return AiFailureType::RETRYABLE;
    }

    /**
     * Retrieve ordered models chain from database (primary first, then fallback_priority ASC).
     *
     * @return Collection<int, AiModel>
     */
    public function getModelsChain(): Collection
    {
        $primary = AiModel::query()
            ->where('purpose', 'analysis')
            ->where('is_active', true)
            ->where('is_default', true)
            ->first();

        $fallbacks = AiModel::query()
            ->where('purpose', 'analysis')
            ->where('is_active', true)
            ->where('is_default', false)
            ->whereNotNull('fallback_priority')
            ->orderBy('fallback_priority')
            ->get();

        $chain = collect();
        if ($primary) {
            $chain->push($primary);
        }

        return $chain->merge($fallbacks);
    }

    /**
     * Record an attempt in analysis_attempts table.
     */
    protected function recordAttempt(
        Analysis $analysis,
        AiModel $model,
        int $attemptNo,
        string $status,
        ?AiFailureType $failureType = null,
        ?int $httpStatus = null,
        ?string $errorMessage = null,
        int $latencyMs = 0,
        ?int $tokensIn = null,
        ?int $tokensOut = null
    ): AnalysisAttempt {
        return AnalysisAttempt::create([
            'analysis_id' => $analysis->id,
            'ai_model_id' => $model->id,
            'attempt_no' => $attemptNo,
            'status' => $status,
            'failure_type' => $failureType?->value,
            'http_status' => $httpStatus,
            'error_message' => $errorMessage,
            'latency_ms' => $latencyMs,
            'tokens_in' => $tokensIn,
            'tokens_out' => $tokensOut,
            'created_at' => now(),
        ]);
    }
}
