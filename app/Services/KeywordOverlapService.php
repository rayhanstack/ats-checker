<?php

namespace App\Services;

class KeywordOverlapService
{
    /**
     * Standard list of common English stopwords to exclude from keyword extraction.
     */
    protected const STOPWORDS = [
        'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any',
        'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
        'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot', 'could', 'couldn\'t',
        'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
        'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
        'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here',
        'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
        'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it',
        'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
        'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
        'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t',
        'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some',
        'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves',
        'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
        'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
        'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were',
        'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which',
        'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would',
        'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours',
        'yourself', 'yourselves', 'will', 'also', 'etc', 'e.g', 'i.e', 'including',
        'role', 'job', 'work', 'working', 'company', 'candidate', 'apply', 'responsibilities',
        'requirements', 'preferred', 'qualification', 'qualifications', 'experience', 'years',
    ];

    /**
     * Compute deterministic keyword overlap between resume and job description.
     *
     * @param string $resumeText
     * @param string $jdText
     * @return array{
     *     score: int,
     *     overlap_percentage: float,
     *     matched_keywords: array<int, string>,
     *     missing_keywords: array<int, string>,
     *     total_jd_keywords: int,
     *     matched_count: int
     * }
     */
    public function compute(string $resumeText, string $jdText): array
    {
        $resumeTokens = $this->tokenize($resumeText);
        $jdTokens = $this->tokenize($jdText);

        if (empty($jdTokens)) {
            return [
                'score' => 0,
                'overlap_percentage' => 0.0,
                'matched_keywords' => [],
                'missing_keywords' => [],
                'total_jd_keywords' => 0,
                'matched_count' => 0,
            ];
        }

        $matched = array_values(array_intersect($jdTokens, $resumeTokens));
        $missing = array_values(array_diff($jdTokens, $resumeTokens));

        $totalJd = count($jdTokens);
        $matchedCount = count($matched);

        $overlapRatio = $totalJd > 0 ? ($matchedCount / $totalJd) : 0;
        $score = (int) round($overlapRatio * 100);

        return [
            'score' => max(0, min(100, $score)),
            'overlap_percentage' => round($overlapRatio * 100, 1),
            'matched_keywords' => array_slice($matched, 0, 30),
            'missing_keywords' => array_slice($missing, 0, 30),
            'total_jd_keywords' => $totalJd,
            'matched_count' => $matchedCount,
        ];
    }

    /**
     * Tokenize string into significant unique lowercase keywords.
     *
     * @param string $text
     * @return array<int, string>
     */
    protected function tokenize(string $text): array
    {
        // Extract words, handling terms like c++, c#, .net, node.js, ci/cd
        preg_match_all('/[a-z0-9+#.-]{2,}/i', strtolower($text), $matches);

        $tokens = [];
        $stopwordsMap = array_flip(self::STOPWORDS);

        foreach ($matches[0] as $token) {
            $cleaned = trim($token, '.-');
            if (strlen($cleaned) < 2) {
                continue;
            }

            if (! isset($stopwordsMap[$cleaned]) && ! is_numeric($cleaned)) {
                $tokens[$cleaned] = true;
            }
        }

        return array_keys($tokens);
    }
}
