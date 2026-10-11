<?php

namespace App\DTOs;

use InvalidArgumentException;

class AnalysisResult
{
    /**
     * @param int $score
     * @param array<string, array{score: int, note: string}> $breakdown
     * @param array<int, string> $matchedKeywords
     * @param array<int, string> $missingKeywords
     * @param array<int, string> $strengths
     * @param array<int, array{section: string, priority: string, issue: string, fix: string, example_rewrite: string}> $suggestions
     * @param string $summary
     * @param array<string, mixed>|null $keywordOverlap
     * @param int $tokensIn
     * @param int $tokensOut
     */
    public function __construct(
        public int $score,
        public array $breakdown,
        public array $matchedKeywords,
        public array $missingKeywords,
        public array $strengths,
        public array $suggestions,
        public string $summary,
        public ?array $keywordOverlap = null,
        public int $tokensIn = 0,
        public int $tokensOut = 0,
    ) {
        $this->validate();
    }

    /**
     * Validate structured result integrity.
     */
    public function validate(): void
    {
        if ($this->score < 0 || $this->score > 100) {
            throw new InvalidArgumentException("Analysis score must be between 0 and 100, received: {$this->score}");
        }

        $requiredBreakdownKeys = ['skills_match', 'experience_relevance', 'keywords', 'format_readability'];
        foreach ($requiredBreakdownKeys as $key) {
            if (! isset($this->breakdown[$key])) {
                throw new InvalidArgumentException("Missing breakdown category: '{$key}'");
            }
        }
    }

    /**
     * Convert to array for database storage and JSON serialization.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'score' => $this->score,
            'breakdown' => $this->breakdown,
            'matched_keywords' => array_values(array_unique($this->matchedKeywords)),
            'missing_keywords' => array_values(array_unique($this->missingKeywords)),
            'strengths' => array_values($this->strengths),
            'suggestions' => array_values($this->suggestions),
            'summary' => $this->summary,
            'keyword_overlap' => $this->keywordOverlap,
            'tokens_in' => $this->tokensIn,
            'tokens_out' => $this->tokensOut,
        ];
    }

    /**
     * Build instance from associative array (e.g., from tool response).
     *
     * @param array<string, mixed> $data
     * @param int $tokensIn
     * @param int $tokensOut
     * @return self
     */
    public static function fromArray(array $data, int $tokensIn = 0, int $tokensOut = 0): self
    {
        $score = isset($data['score']) ? (int) $data['score'] : 0;
        $breakdown = (array) ($data['breakdown'] ?? []);
        $matched = array_map('strval', (array) ($data['matched_keywords'] ?? []));
        $missing = array_map('strval', (array) ($data['missing_keywords'] ?? []));
        $strengths = array_map('strval', (array) ($data['strengths'] ?? []));
        $suggestions = (array) ($data['suggestions'] ?? []);
        $summary = (string) ($data['summary'] ?? '');
        $keywordOverlap = isset($data['keyword_overlap']) ? (array) $data['keyword_overlap'] : null;

        return new self(
            score: $score,
            breakdown: $breakdown,
            matchedKeywords: $matched,
            missingKeywords: $missing,
            strengths: $strengths,
            suggestions: $suggestions,
            summary: $summary,
            keywordOverlap: $keywordOverlap,
            tokensIn: $tokensIn,
            tokensOut: $tokensOut,
        );
    }
}
