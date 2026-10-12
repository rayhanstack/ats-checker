<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Testimonial;
use App\Services\AuditLogger;
use App\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SettingController extends Controller
{
    /**
     * Display the settings management view with all categorized tabs.
     */
    public function index(Request $request): Response
    {
        $allSettings = SettingsService::all();

        // Pages content
        $pages = Page::whereIn('slug', ['about', 'privacy', 'terms'])->get()->keyBy('slug');

        // Testimonials
        $testimonials = Testimonial::orderBy('sort_order')->get();

        return Inertia::render('Admin/Settings/Index', [
            'settings' => [
                // General
                'site_name' => $allSettings['site_name'] ?? 'ATS Checker',
                'site_tagline' => $allSettings['site_tagline'] ?? 'AI-Powered Resume Optimization & ATS Scoring',
                'logo_path' => $allSettings['logo_path'] ?? null,
                'favicon_path' => $allSettings['favicon_path'] ?? null,
                'contact_email' => $allSettings['contact_email'] ?? 'support@atschecker.local',
                'contact_phone' => $allSettings['contact_phone'] ?? '+1 (555) 019-2834',
                'contact_address' => $allSettings['contact_address'] ?? '100 Innovation Way, Suite 400, San Francisco, CA 94105',
                'social_links' => $allSettings['social_links'] ?? [
                    'twitter' => 'https://twitter.com',
                    'linkedin' => 'https://linkedin.com',
                    'github' => 'https://github.com',
                ],

                // Trial and limits
                'trial_days' => (int) ($allSettings['trial_days'] ?? 7),
                'free_plan_analyses_limit' => (int) ($allSettings['free_plan_analyses_limit'] ?? 5),
                'max_upload_mb' => (int) ($allSettings['max_upload_mb'] ?? 5),
                'allowed_file_types' => $allSettings['allowed_file_types'] ?? 'pdf,docx',
                'max_jd_chars' => (int) ($allSettings['max_jd_chars'] ?? 15000),
                'analysis_throttle_per_hour' => (int) ($allSettings['analysis_throttle_per_hour'] ?? 10),

                // Privacy
                'resume_retention_days' => (int) ($allSettings['resume_retention_days'] ?? 30),
                'keep_results_after_resume_deleted' => (bool) ($allSettings['keep_results_after_resume_deleted'] ?? true),

                // Access
                'registration_enabled' => (bool) ($allSettings['registration_enabled'] ?? true),
                'email_verification_required' => (bool) ($allSettings['email_verification_required'] ?? true),
                'google_login_enabled' => (bool) ($allSettings['google_login_enabled'] ?? true),
                'maintenance_mode' => (bool) ($allSettings['maintenance_mode'] ?? false),
                'maintenance_message' => $allSettings['maintenance_message'] ?? 'ATS Checker is currently undergoing scheduled platform upgrades. We will be right back.',

                // Mail
                'mail_from_name' => $allSettings['mail_from_name'] ?? config('mail.from.name', 'ATS Checker'),
                'mail_from_address' => $allSettings['mail_from_address'] ?? config('mail.from.address', 'noreply@atschecker.local'),
                'mail_host' => $allSettings['mail_host'] ?? config('mail.mailers.smtp.host', '127.0.0.1'),
                'mail_port' => (int) ($allSettings['mail_port'] ?? config('mail.mailers.smtp.port', 2525)),
                'mail_username' => $allSettings['mail_username'] ?? '',
                'mail_encryption' => $allSettings['mail_encryption'] ?? 'tls',
                'mail_has_password' => ! empty($allSettings['mail_password']),

                // Payments
                'payment_gateway' => $allSettings['payment_gateway'] ?? 'manual',
                'currency' => $allSettings['currency'] ?? 'USD',
                'stripe_has_keys' => ! empty($allSettings['stripe_secret']),
                'paypal_has_keys' => ! empty($allSettings['paypal_secret']),
            ],
            'pages' => [
                'about' => [
                    'title' => $pages['about']?->title ?? 'About ATS Checker',
                    'content' => $pages['about']?->content ?? '',
                ],
                'privacy' => [
                    'title' => $pages['privacy']?->title ?? 'Privacy Policy',
                    'content' => $pages['privacy']?->content ?? '',
                ],
                'terms' => [
                    'title' => $pages['terms']?->title ?? 'Terms of Service',
                    'content' => $pages['terms']?->content ?? '',
                ],
            ],
            'testimonials' => $testimonials,
        ]);
    }

    /**
     * Update settings based on submitted tab payload.
     */
    public function update(Request $request): RedirectResponse
    {
        $tab = $request->string('tab', 'general')->toString();

        switch ($tab) {
            case 'general':
                $validated = $request->validate([
                    'site_name' => ['required', 'string', 'max:255'],
                    'site_tagline' => ['required', 'string', 'max:255'],
                    'contact_email' => ['required', 'email', 'max:255'],
                    'contact_phone' => ['nullable', 'string', 'max:50'],
                    'contact_address' => ['nullable', 'string', 'max:255'],
                    'social_links' => ['nullable', 'array'],
                    'logo' => ['nullable', 'image', 'max:2048'],
                    'favicon' => ['nullable', 'file', 'mimes:ico,png,svg', 'max:512'],
                ]);

                SettingsService::set('site_name', $validated['site_name'], 'general');
                SettingsService::set('site_tagline', $validated['site_tagline'], 'general');
                SettingsService::set('contact_email', $validated['contact_email'], 'contact');
                SettingsService::set('contact_phone', $validated['contact_phone'] ?? '', 'contact');
                SettingsService::set('contact_address', $validated['contact_address'] ?? '', 'contact');
                SettingsService::set('social_links', $validated['social_links'] ?? [], 'social');

                if ($request->hasFile('logo')) {
                    $logoPath = $request->file('logo')->store('branding', 'public');
                    SettingsService::set('logo_path', '/storage/' . $logoPath, 'general');
                }

                if ($request->hasFile('favicon')) {
                    $favPath = $request->file('favicon')->store('branding', 'public');
                    SettingsService::set('favicon_path', '/storage/' . $favPath, 'general');
                }
                break;

            case 'trial_limits':
                $validated = $request->validate([
                    'trial_days' => ['required', 'integer', 'min:1', 'max:90'],
                    'free_plan_analyses_limit' => ['required', 'integer', 'min:1', 'max:100'],
                    'max_upload_mb' => ['required', 'integer', 'min:1', 'max:50'],
                    'allowed_file_types' => ['required', 'string', 'max:50'],
                    'max_jd_chars' => ['required', 'integer', 'min:500', 'max:50000'],
                    'analysis_throttle_per_hour' => ['required', 'integer', 'min:1', 'max:100'],
                ]);

                SettingsService::set('trial_days', (int) $validated['trial_days'], 'billing');
                SettingsService::set('free_plan_analyses_limit', (int) $validated['free_plan_analyses_limit'], 'billing');
                SettingsService::set('max_upload_mb', (int) $validated['max_upload_mb'], 'upload');
                SettingsService::set('allowed_file_types', $validated['allowed_file_types'], 'upload');
                SettingsService::set('max_jd_chars', (int) $validated['max_jd_chars'], 'analysis');
                SettingsService::set('analysis_throttle_per_hour', (int) $validated['analysis_throttle_per_hour'], 'analysis');
                break;

            case 'privacy':
                $validated = $request->validate([
                    'resume_retention_days' => ['required', 'integer', 'min:0', 'max:365'],
                    'keep_results_after_resume_deleted' => ['required', 'boolean'],
                ]);

                SettingsService::set('resume_retention_days', (int) $validated['resume_retention_days'], 'retention');
                SettingsService::set('keep_results_after_resume_deleted', $request->boolean('keep_results_after_resume_deleted'), 'retention');
                break;

            case 'access':
                $validated = $request->validate([
                    'registration_enabled' => ['required', 'boolean'],
                    'email_verification_required' => ['required', 'boolean'],
                    'google_login_enabled' => ['required', 'boolean'],
                    'maintenance_mode' => ['required', 'boolean'],
                    'maintenance_message' => ['nullable', 'string', 'max:1000'],
                ]);

                SettingsService::set('registration_enabled', $request->boolean('registration_enabled'), 'auth');
                SettingsService::set('email_verification_required', $request->boolean('email_verification_required'), 'auth');
                SettingsService::set('google_login_enabled', $request->boolean('google_login_enabled'), 'auth');
                SettingsService::set('maintenance_mode', $request->boolean('maintenance_mode'), 'system');
                SettingsService::set('maintenance_message', $validated['maintenance_message'] ?? '', 'system');
                break;

            case 'mail':
                $validated = $request->validate([
                    'mail_from_name' => ['required', 'string', 'max:255'],
                    'mail_from_address' => ['required', 'email', 'max:255'],
                    'mail_host' => ['required', 'string', 'max:255'],
                    'mail_port' => ['required', 'integer', 'min:1', 'max:65535'],
                    'mail_username' => ['nullable', 'string', 'max:255'],
                    'mail_password' => ['nullable', 'string', 'max:255'],
                    'mail_encryption' => ['nullable', 'string', 'max:10'],
                ]);

                SettingsService::set('mail_from_name', $validated['mail_from_name'], 'mail');
                SettingsService::set('mail_from_address', $validated['mail_from_address'], 'mail');
                SettingsService::set('mail_host', $validated['mail_host'], 'mail');
                SettingsService::set('mail_port', (int) $validated['mail_port'], 'mail');
                SettingsService::set('mail_username', $validated['mail_username'] ?? '', 'mail');
                SettingsService::set('mail_encryption', $validated['mail_encryption'] ?? 'tls', 'mail');

                if (! empty($validated['mail_password'])) {
                    SettingsService::set('mail_password', Crypt::encryptString($validated['mail_password']), 'mail');
                }
                break;

            case 'payments':
                $validated = $request->validate([
                    'payment_gateway' => ['required', 'string', 'in:manual,stripe,paypal'],
                    'currency' => ['required', 'string', 'size:3'],
                    'stripe_key' => ['nullable', 'string', 'max:255'],
                    'stripe_secret' => ['nullable', 'string', 'max:255'],
                    'paypal_client_id' => ['nullable', 'string', 'max:255'],
                    'paypal_secret' => ['nullable', 'string', 'max:255'],
                ]);

                SettingsService::set('payment_gateway', $validated['payment_gateway'], 'billing');
                SettingsService::set('currency', strtoupper($validated['currency']), 'billing');

                if (! empty($validated['stripe_secret'])) {
                    SettingsService::set('stripe_secret', Crypt::encryptString($validated['stripe_secret']), 'billing');
                }
                if (! empty($validated['stripe_key'])) {
                    SettingsService::set('stripe_key', $validated['stripe_key'], 'billing');
                }
                if (! empty($validated['paypal_secret'])) {
                    SettingsService::set('paypal_secret', Crypt::encryptString($validated['paypal_secret']), 'billing');
                }
                if (! empty($validated['paypal_client_id'])) {
                    SettingsService::set('paypal_client_id', $validated['paypal_client_id'], 'billing');
                }
                break;

            case 'content':
                $validated = $request->validate([
                    'about_title' => ['required', 'string', 'max:255'],
                    'about_content' => ['required', 'string'],
                    'privacy_title' => ['required', 'string', 'max:255'],
                    'privacy_content' => ['required', 'string'],
                    'terms_title' => ['required', 'string', 'max:255'],
                    'terms_content' => ['required', 'string'],
                ]);

                Page::updateOrCreate(['slug' => 'about'], ['title' => $validated['about_title'], 'content' => $validated['about_content'], 'is_published' => true]);
                Page::updateOrCreate(['slug' => 'privacy'], ['title' => $validated['privacy_title'], 'content' => $validated['privacy_content'], 'is_published' => true]);
                Page::updateOrCreate(['slug' => 'terms'], ['title' => $validated['terms_title'], 'content' => $validated['terms_content'], 'is_published' => true]);
                break;
        }

        SettingsService::clearCache();

        AuditLogger::log('settings.update', null, [
            'tab' => $tab,
        ]);

        return back()->with('success', 'Settings updated successfully and cache purged.');
    }

    /**
     * Send a test verification email to confirm SMTP settings.
     */
    public function sendTestEmail(Request $request): RedirectResponse
    {
        $user = $request->user();
        $targetEmail = $request->input('test_email', $user->email);

        try {
            Mail::to($targetEmail)->send(new \App\Mail\TestVerificationMail($user));

            AuditLogger::log('settings.send_test_email', null, [
                'recipient' => $targetEmail,
                'status' => 'success',
            ]);

            return back()->with('success', "Test email successfully sent to {$targetEmail}.");
        } catch (Throwable $e) {
            AuditLogger::log('settings.send_test_email', null, [
                'recipient' => $targetEmail,
                'status' => 'failure',
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', "Failed to send test email: {$e->getMessage()}");
        }
    }

    /**
     * Store a testimonial.
     */
    public function storeTestimonial(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', 'max:255'],
            'company' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string', 'max:1000'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        $testimonial = Testimonial::create($validated);
        \Illuminate\Support\Facades\Cache::forget('home:testimonials');

        AuditLogger::log('testimonial.create', $testimonial, [
            'name' => $testimonial->name,
        ]);

        return back()->with('success', "Testimonial from '{$testimonial->name}' added.");
    }

    /**
     * Update a testimonial.
     */
    public function updateTestimonial(Request $request, Testimonial $testimonial): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', 'max:255'],
            'company' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string', 'max:1000'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        $testimonial->update($validated);
        \Illuminate\Support\Facades\Cache::forget('home:testimonials');

        AuditLogger::log('testimonial.update', $testimonial, [
            'name' => $testimonial->name,
        ]);

        return back()->with('success', "Testimonial updated.");
    }

    /**
     * Delete a testimonial.
     */
    public function destroyTestimonial(Testimonial $testimonial): RedirectResponse
    {
        AuditLogger::log('testimonial.delete', $testimonial, [
            'name' => $testimonial->name,
        ]);

        $testimonial->delete();
        \Illuminate\Support\Facades\Cache::forget('home:testimonials');

        return back()->with('success', "Testimonial deleted.");
    }
}
