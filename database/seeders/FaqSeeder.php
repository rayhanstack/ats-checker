<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faqs = [
            [
                'question' => 'What is an Applicant Tracking System (ATS)?',
                'answer' => 'An Applicant Tracking System (ATS) is enterprise software used by employers and recruiters to collect, sort, scan, and rank job applications. Before a hiring manager sees your resume, an ATS parses the document to extract keywords, skills, titles, and work history to calculate candidate relevancy.',
                'sort_order' => 1,
                'is_published' => true,
            ],
            [
                'question' => 'How is the match score calculated?',
                'answer' => 'Our system utilizes state-of-the-art Claude AI models to semantically cross-reference your resume text with the job description. Rather than simple exact string matching, we analyze core competencies, hard skills, soft skills, seniority indicators, and required tools to produce an objective 0–100 match percentage.',
                'sort_order' => 2,
                'is_published' => true,
            ],
            [
                'question' => 'Which resume file formats are supported?',
                'answer' => 'We support PDF (.pdf) and Microsoft Word (.docx) files up to 5MB. Standard text layouts with clear headings parse most effectively. We recommend avoiding non-standard graphic elements or multi-column text boxes.',
                'sort_order' => 3,
                'is_published' => true,
            ],
            [
                'question' => 'How is my personal data and resume content protected?',
                'answer' => 'Privacy is fundamental to our architecture. We never sell, share, or use your resume data to train public models. All text extractions are encrypted in transit and at rest, and stored documents automatically purge according to strict data retention policies (30 days by default).',
                'sort_order' => 4,
                'is_published' => true,
            ],
            [
                'question' => 'How does the 7-day free trial work?',
                'answer' => 'Every new account automatically receives a full 7-day free trial starting immediately upon registration. You can upload resumes, analyze real job descriptions, and view complete keyword fixes without entering any credit card or payment details.',
                'sort_order' => 5,
                'is_published' => true,
            ],
            [
                'question' => 'What happens after the free trial ends?',
                'answer' => 'After 7 days, your account transitions to read-only access where you can always review previous analyses and history. To run new CV scans, you can choose between flexible Monthly or Yearly plans.',
                'sort_order' => 6,
                'is_published' => true,
            ],
            [
                'question' => 'Why do ATS systems reject qualified candidates?',
                'answer' => 'Often, qualified candidates are filtered out due to minor terminology mismatches (e.g., writing "K8s" instead of "Kubernetes"), missing core action verbs, or complex formatting that parsers cannot read. ATS Checker highlights these blind spots so your qualifications shine through.',
                'sort_order' => 7,
                'is_published' => true,
            ],
            [
                'question' => 'Does a high ATS score guarantee an interview?',
                'answer' => 'While a high score (80+) ensures your application passes automated filtration algorithms into human recruiter hands, actual interview invitations depend on overall hiring decisions, portfolio relevance, and company fit. Our goal is to ensure you never get rejected by a robot.',
                'sort_order' => 8,
                'is_published' => true,
            ],
            [
                'question' => 'Can I cancel or change my subscription at any time?',
                'answer' => 'Yes, absolutely. There are no lock-in contracts or cancellation fees. You can adjust or cancel your billing plan directly in your candidate workspace whenever you choose.',
                'sort_order' => 9,
                'is_published' => true,
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::query()->updateOrCreate(
                ['question' => $faq['question']],
                $faq
            );
        }
    }
}
