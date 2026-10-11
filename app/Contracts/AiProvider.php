<?php

namespace App\Contracts;

use App\DTOs\AnalysisResult;
use App\Models\AiModel;

interface AiProvider
{
    /**
     * Analyze resume and job description using the specified AI Model.
     *
     * @param string $resumeText
     * @param string $jdText
     * @param AiModel $model
     * @param array<string, mixed> $options Optional settings (e.g. repair prompt)
     * @return AnalysisResult
     *
     * @throws \Throwable If provider call fails or response cannot be parsed
     */
    public function analyze(string $resumeText, string $jdText, AiModel $model, array $options = []): AnalysisResult;
}
