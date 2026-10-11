<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Contracts\User as ProviderUser;

class SocialAuthService
{
    /**
     * Handle the callback for an authenticated social user.
     *
     * @throws ValidationException
     */
    public function handleGoogleCallback(ProviderUser $googleUser): User
    {
        $googleId = (string) $googleUser->getId();
        $email = $googleUser->getEmail();
        $name = $googleUser->getName() ?: 'User';
        $avatar = $googleUser->getAvatar();

        // 4. Reject login if Google does not return an email or reports it unverified
        $rawUser = method_exists($googleUser, 'getRaw') ? $googleUser->getRaw() : ($googleUser->user ?? []);
        $isEmailVerified = $rawUser['email_verified'] ?? true;

        if (empty($email) || ! $isEmailVerified) {
            throw ValidationException::withMessages([
                'email' => 'Your Google account does not have a verified email address.',
            ]);
        }

        // 1. If a social_accounts row exists for this Google ID, log that user in.
        $existingAccount = SocialAccount::query()
            ->where('provider', 'google')
            ->where('provider_user_id', $googleId)
            ->first();

        if ($existingAccount) {
            $user = $existingAccount->user;
            $this->validateAndPrepareUserForLogin($user);

            // Update avatar if not set
            if (empty($user->avatar_url) && $avatar) {
                $user->forceFill(['avatar_url' => $avatar])->save();
            }

            return $user;
        }

        // 2. Check if local user with that email already exists
        $localUser = User::query()->where('email', $email)->first();

        if ($localUser) {
            // Link ONLY when that local account's email is also verified
            if ($localUser->email_verified_at === null) {
                throw ValidationException::withMessages([
                    'email' => 'An unverified account with this email address already exists. Please log in with your password to verify your email and connect Google from your profile.',
                ]);
            }

            $this->validateAndPrepareUserForLogin($localUser);

            // Link Google account
            $localUser->socialAccounts()->create([
                'provider' => 'google',
                'provider_user_id' => $googleId,
                'provider_email' => $email,
                'avatar_url' => $avatar,
            ]);

            if (empty($localUser->avatar_url) && $avatar) {
                $localUser->forceFill(['avatar_url' => $avatar])->save();
            }

            return $localUser;
        }

        // 3. Create a new user
        if (! SettingsService::get('registration_enabled', true)) {
            throw ValidationException::withMessages([
                'email' => 'New registrations are currently disabled.',
            ]);
        }

        $trialDays = (int) SettingsService::get('trial_days', 7);

        $newUser = User::create([
            'name' => $name,
            'email' => $email,
            'avatar_url' => $avatar,
            'password' => null, // Social-only user has null password
            'role' => Role::User,
            'is_active' => true,
            'email_verified_at' => now(), // Google already verified it
            'trial_ends_at' => now()->addDays($trialDays),
            'last_login_at' => now(),
        ]);

        $newUser->socialAccounts()->create([
            'provider' => 'google',
            'provider_user_id' => $googleId,
            'provider_email' => $email,
            'avatar_url' => $avatar,
        ]);

        return $newUser;
    }

    /**
     * Connect Google to an already authenticated user.
     *
     * @throws ValidationException
     */
    public function connectGoogleToUser(User $user, ProviderUser $googleUser): SocialAccount
    {
        $googleId = (string) $googleUser->getId();
        $email = $googleUser->getEmail();
        $avatar = $googleUser->getAvatar();

        // Check if this Google ID is already linked to another account
        $alreadyLinked = SocialAccount::query()
            ->where('provider', 'google')
            ->where('provider_user_id', $googleId)
            ->where('user_id', '!=', $user->id)
            ->exists();

        if ($alreadyLinked) {
            throw ValidationException::withMessages([
                'google' => 'This Google account is already linked to another user account.',
            ]);
        }

        $account = $user->socialAccounts()->updateOrCreate(
            ['provider' => 'google'],
            [
                'provider_user_id' => $googleId,
                'provider_email' => $email,
                'avatar_url' => $avatar,
            ]
        );

        if (empty($user->avatar_url) && $avatar) {
            $user->forceFill(['avatar_url' => $avatar])->save();
        }

        return $account;
    }

    /**
     * Disconnect Google from a user.
     *
     * @throws ValidationException
     */
    public function disconnectGoogle(User $user): void
    {
        if (! $user->hasPassword()) {
            throw ValidationException::withMessages([
                'password' => 'You must set a password before disconnecting your Google account.',
            ]);
        }

        $user->socialAccounts()->where('provider', 'google')->delete();
    }

    /**
     * Validate active status and update last login time.
     *
     * @throws ValidationException
     */
    protected function validateAndPrepareUserForLogin(User $user): void
    {
        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => 'Your account has been deactivated. Please contact support.',
            ]);
        }

        $user->forceFill([
            'last_login_at' => now(),
        ])->save();
    }
}
