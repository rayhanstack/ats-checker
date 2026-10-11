<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\SettingsService;
use App\Services\SocialAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function __construct(protected SocialAuthService $socialAuthService)
    {
    }

    /**
     * Redirect the user to Google authentication page.
     */
    public function redirect(Request $request): RedirectResponse
    {
        if (! SettingsService::get('google_login_enabled', true) ||
            empty(config('services.google.client_id')) ||
            empty(config('services.google.client_secret'))
        ) {
            return redirect()->route('login')->withErrors([
                'email' => 'Google sign-in is currently unavailable.',
            ]);
        }

        // Preserve intended URL in session if present
        if ($request->session()->has('url.intended')) {
            $request->session()->put('social_intended_url', $request->session()->get('url.intended'));
        }

        if (Auth::check()) {
            $request->session()->put('connecting_google_user_id', Auth::id());
        }

        return Socialite::driver('google')->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function callback(Request $request): RedirectResponse
    {
        // Rate limit social login attempts by IP
        $throttleKey = 'social-login|' . $request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 10)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return redirect()->route('login')->withErrors([
                'email' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ]);
        }
        RateLimiter::hit($throttleKey, 60);

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            Log::warning('Google OAuth callback failed: ' . $e->getMessage());

            $isConnecting = $request->session()->has('connecting_google_user_id');
            $redirectTarget = $isConnecting ? route('profile.edit') : route('login');

            return redirect($redirectTarget)->withErrors([
                'email' => 'Google authentication was cancelled or failed. Please try again.',
            ]);
        }

        // Case A: Connecting to an already logged-in account
        if ($request->session()->has('connecting_google_user_id')) {
            $userId = $request->session()->pull('connecting_google_user_id');
            $user = Auth::user();

            if (! $user || $user->id !== $userId) {
                return redirect()->route('profile.edit')->withErrors([
                    'google' => 'Session expired. Please try connecting Google again.',
                ]);
            }

            try {
                $this->socialAuthService->connectGoogleToUser($user, $googleUser);
                return redirect()->route('profile.edit')->with('success', 'Your Google account has been connected.');
            } catch (ValidationException $e) {
                return redirect()->route('profile.edit')->withErrors($e->errors());
            }
        }

        // Case B: Guest signing in or registering via Google
        try {
            $user = $this->socialAuthService->handleGoogleCallback($googleUser);
        } catch (ValidationException $e) {
            return redirect()->route('login')->withErrors($e->errors());
        }

        Auth::login($user);
        $request->session()->regenerate();
        RateLimiter::clear($throttleKey);

        // Restore preserved intended URL
        $intendedUrl = $request->session()->pull('social_intended_url');

        if ($intendedUrl) {
            return redirect()->intended($intendedUrl);
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Disconnect Google account from current user.
     */
    public function disconnect(Request $request): RedirectResponse
    {
        $user = $request->user();

        try {
            $this->socialAuthService->disconnectGoogle($user);
            return redirect()->route('profile.edit')->with('success', 'Your Google account was disconnected.');
        } catch (ValidationException $e) {
            return redirect()->route('profile.edit')->withErrors($e->errors());
        }
    }
}
