<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use App\Models\Testimonial;
use App\Services\SettingsService;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Display the public homepage.
     */
    public function index(): Response
    {
        $faqs = \Illuminate\Support\Facades\Cache::remember('home:faqs', 3600, function () {
            return Faq::query()
                ->where('is_published', true)
                ->orderBy('sort_order')
                ->get(['id', 'question', 'answer']);
        });

        $testimonials = \Illuminate\Support\Facades\Cache::remember('home:testimonials', 3600, function () {
            return Testimonial::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'role', 'company', 'content', 'rating', 'avatar_url']);
        });

        // Database-driven plans will be introduced in Phase 8; providing structured pricing models here
        $plans = [
            [
                'id' => 'trial',
                'name' => '7-Day Free Trial',
                'price' => '$0',
                'period' => 'for 7 days',
                'description' => 'Test all AI matching features with zero financial commitment.',
                'features' => [
                    'Full ATS semantic matching score (0-100)',
                    'Identified and missing keyword breakdown',
                    'Specific line-by-line recommendations',
                    'Upload PDF & DOCX resumes up to 5MB',
                    '7 full days of access',
                ],
                'popular' => false,
                'cta_text' => 'Start Free Trial',
                'cta_link' => route('register'),
            ],
            [
                'id' => 'monthly',
                'name' => 'Professional Monthly',
                'price' => '$19',
                'period' => '/ month',
                'description' => 'Perfect for active job seekers sending weekly applications.',
                'features' => [
                    'Everything in Free Trial',
                    'Unlimited resume and job scans',
                    'Priority Claude AI processing queue',
                    'Detailed bullet-point rewriting suggestions',
                    'Scan history & score progression tracking',
                    'Cancel anytime with 1 click',
                ],
                'popular' => true,
                'cta_text' => 'Get Started with Monthly',
                'cta_link' => route('register'),
            ],
            [
                'id' => 'yearly',
                'name' => 'Annual Unlimited',
                'price' => '$149',
                'period' => '/ year',
                'description' => 'Maximum value for comprehensive career transition & consulting.',
                'features' => [
                    'Everything in Professional Monthly',
                    'Save 35% compared to monthly billing',
                    'Unlimited scans across the entire year',
                    'Target job description analysis archive',
                    'Premium email & priority support',
                ],
                'popular' => false,
                'cta_text' => 'Get Started with Annual',
                'cta_link' => route('register'),
            ],
        ];

        return Inertia::render('Welcome', [
            'faqs' => $faqs,
            'testimonials' => $testimonials,
            'plans' => $plans,
            'stats' => [
                'resumes_analyzed' => '25,000+',
                'average_score_lift' => '+34%',
                'callback_rate_increase' => '3.2x',
                'active_candidates' => '8,500+',
            ],
        ]);
    }
}
