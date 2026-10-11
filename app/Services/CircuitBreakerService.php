<?php

namespace App\Services;

use App\Models\AiModel;
use Illuminate\Support\Facades\Cache;

class CircuitBreakerService
{
    protected const FAILURE_THRESHOLD = 5;
    protected const FAILURE_WINDOW_SECONDS = 300; // 5 minutes
    protected const COOLDOWN_SECONDS = 300; // 5 minutes open duration

    /**
     * Check if a model's circuit allows requests.
     */
    public function isAvailable(AiModel|string $model): bool
    {
        $modelId = $model instanceof AiModel ? $model->model_id : $model;

        // If circuit is open during cooldown window, skip immediately
        if (Cache::has($this->getOpenKey($modelId))) {
            return false;
        }

        // If circuit was tripped and cooldown has passed, handle half-open probing
        if (Cache::has($this->getTrippedKey($modelId))) {
            if (! Cache::has($this->getProbeKey($modelId))) {
                // Allow one probe request
                Cache::put($this->getProbeKey($modelId), true, 60);
                return true;
            }

            return false;
        }

        return true; // Circuit closed
    }

    /**
     * Record a failure for this model and trip circuit if threshold reached.
     */
    public function recordFailure(AiModel|string $model, ?string $reason = null): bool
    {
        $modelId = $model instanceof AiModel ? $model->model_id : $model;

        $count = (int) Cache::get($this->getFailureKey($modelId), 0) + 1;
        Cache::put($this->getFailureKey($modelId), $count, self::FAILURE_WINDOW_SECONDS);

        // If we were half-open or threshold reached, trip circuit
        if ($count >= self::FAILURE_THRESHOLD || Cache::has($this->getTrippedKey($modelId))) {
            Cache::put($this->getOpenKey($modelId), now()->addSeconds(self::COOLDOWN_SECONDS)->timestamp, self::COOLDOWN_SECONDS);
            Cache::put($this->getTrippedKey($modelId), true, self::COOLDOWN_SECONDS + 3600);
            Cache::forget($this->getProbeKey($modelId));
            return true; // Tripped
        }

        return false;
    }

    /**
     * Record a success for this model, resetting failure count and closing circuit.
     */
    public function recordSuccess(AiModel|string $model): void
    {
        $modelId = $model instanceof AiModel ? $model->model_id : $model;

        Cache::forget($this->getFailureKey($modelId));
        Cache::forget($this->getOpenKey($modelId));
        Cache::forget($this->getTrippedKey($modelId));
        Cache::forget($this->getProbeKey($modelId));
    }

    /**
     * Get human-readable circuit state for admin dashboards.
     */
    public function getState(AiModel|string $model): string
    {
        $modelId = $model instanceof AiModel ? $model->model_id : $model;

        if (Cache::has($this->getOpenKey($modelId))) {
            return 'open';
        }

        if (Cache::has($this->getTrippedKey($modelId))) {
            return 'half-open';
        }

        return 'closed';
    }

    protected function getFailureKey(string $modelId): string
    {
        return "circuit:fail:{$modelId}";
    }

    protected function getOpenKey(string $modelId): string
    {
        return "circuit:open:{$modelId}";
    }

    protected function getTrippedKey(string $modelId): string
    {
        return "circuit:tripped:{$modelId}";
    }

    protected function getProbeKey(string $modelId): string
    {
        return "circuit:probe:{$modelId}";
    }
}
