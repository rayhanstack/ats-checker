<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pages = [
            [
                'slug' => 'about',
                'title' => 'About ATS Checker',
                'meta_description' => 'Learn about our mission to make the hiring process fair, transparent, and candidate-friendly through AI resume optimization.',
                'content' => <<<MARKDOWN
# Empowering Candidates Through Intelligent ATS Optimization

ATS Checker was founded with one clear conviction: **exceptional talent should never be filtered out by an opaque algorithm**.

In the modern job market, over 75% of resumes submitted to corporate portals are pre-screened and scored by Applicant Tracking Systems before a human hiring manager ever reads a single bullet point. Talented engineers, designers, product managers, and specialists miss opportunities simply because their resumes lack exact keyword semantics, standardized headings, or specific role phrasing.

### Our Solution
We bridge the gap between job seekers and recruiters using Claude AI. We parse job postings deeply, extract explicit and implicit qualifications, and analyze your CV with the same rigor modern hiring algorithms employ.

### What We Value
- **Radical Transparency**: We show you your exact 0–100 score, every matched keyword, every missing keyword, and precise bullet-level recommendations.
- **Privacy by Design**: Your resume data is yours alone. We do not sell your personal details, and data automatically expires under strict retention schedules.
- **Fair Pricing**: We offer every new candidate a full 7-day free trial so you can experience the value before paying a dime.
MARKDOWN,
                'is_published' => true,
            ],
            [
                'slug' => 'privacy',
                'title' => 'Privacy Policy',
                'meta_description' => 'Our strict privacy guidelines on how we store, process, and automatically purge resume and personal data.',
                'content' => <<<MARKDOWN
# Privacy Policy

*Last updated: October 2026*

Your privacy and document confidentiality are paramount to us at ATS Checker. This Privacy Policy details our data collection, processing, and retention practices.

### 1. Information We Collect
- **Account Data**: Name and email address provided upon registration.
- **Uploaded Resumes**: CV text and files uploaded for parsing.
- **Job Descriptions**: Text submitted for comparison and analysis.
- **Support Inquiries**: Messages submitted via our contact forms.

### 2. How We Use Your Data
- To extract text and execute semantic match analysis via secure AI APIs.
- To provide your match score, missing skills breakdown, and resume recommendations.
- To authenticate your account session and manage your subscription trial.

### 3. Data Protection & Automatic Retention Expiry
We never sell, rent, or monetize your resume text or personal details to third parties or recruiters. Uploaded documents and extraction artifacts automatically purge after 30 days. You may request immediate deletion of your account and documents at any time via your account settings.

### 4. Security Measures
All communication between your browser and our servers uses TLS 1.3 encryption. Data stored at rest is encrypted using AES-256 standards.
MARKDOWN,
                'is_published' => true,
            ],
            [
                'slug' => 'terms',
                'title' => 'Terms of Service',
                'meta_description' => 'Terms and conditions governing the use of ATS Checker web platform and services.',
                'content' => <<<MARKDOWN
# Terms of Service

*Last updated: October 2026*

By creating an account or accessing the ATS Checker website, you agree to comply with and be bound by the following terms.

### 1. Permitted Use
ATS Checker provides resume diagnostic tools for personal career development and job application enhancement. You agree to use the service only for lawful purposes and with resumes you own or have explicit authorization to upload.

### 2. Free Trial & Subscriptions
- Every registered user receives a complimentary 7-day free trial.
- Following trial expiration, continued resume analysis requires an active subscription plan.
- Past analysis records and score history remain accessible even if your subscription is inactive.

### 3. Service Disclaimers & Accuracy
While our system utilizes cutting-edge semantic AI to approximate ATS criteria, recruitment decisions ultimately reside with individual employers. A high ATS match score dramatically improves initial screening odds but does not guarantee employment offers or interview invitations.

### 4. Modifications to Terms
We reserve the right to modify these terms as our platform evolves. Significant updates will be communicated through our website or email.
MARKDOWN,
                'is_published' => true,
            ],
        ];

        foreach ($pages as $page) {
            Page::query()->updateOrCreate(
                ['slug' => $page['slug']],
                $page
            );
        }
    }
}
