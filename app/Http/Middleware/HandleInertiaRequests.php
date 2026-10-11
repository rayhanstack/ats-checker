<?php

namespace App\Http\Middleware;

use App\Services\SettingsService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->value,
                    'is_admin' => $user->isAdmin(),
                    'is_active' => $user->is_active,
                    'trial_ends_at' => $user->trial_ends_at?->toISOString(),
                    'has_active_trial' => $user->hasActiveTrial(),
                    'email_verified_at' => $user->email_verified_at?->toISOString(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'info' => fn () => $request->session()->get('info'),
            ],
            'settings' => [
                'site_name' => SettingsService::get('site_name', 'ATS Checker'),
                'site_tagline' => SettingsService::get('site_tagline', 'AI-Powered Resume Optimization & ATS Scoring'),
                'logo_path' => SettingsService::get('logo_path'),
                'contact_email' => SettingsService::get('contact_email', 'support@atschecker.local'),
                'contact_phone' => SettingsService::get('contact_phone', '+1 (555) 019-2834'),
                'contact_address' => SettingsService::get('contact_address', '100 Innovation Way, Suite 400, San Francisco, CA'),
                'social_links' => SettingsService::get('social_links', []),
                'trial_days' => (int) SettingsService::get('trial_days', 7),
            ],
        ];
    }
}
