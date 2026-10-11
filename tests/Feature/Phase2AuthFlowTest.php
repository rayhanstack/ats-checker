<?php

use App\Enums\Role;
use App\Models\SocialAccount;
use App\Models\User;
use App\Services\SettingsService;
use Laravel\Socialite\Contracts\User as ProviderUser;
use Laravel\Socialite\Facades\Socialite;
use Mockery\MockInterface;

beforeEach(function () {
    SettingsService::set('email_verification_required', true);
    SettingsService::set('registration_enabled', true);
    SettingsService::set('google_login_enabled', true);
    SettingsService::set('trial_days', 7);
    config()->set('services.google.client_id', 'mock-google-client-id');
    config()->set('services.google.client_secret', 'mock-google-client-secret');
});

test('guest hitting /analyze is redirected to login with flash message and intended url is preserved', function () {
    $response = $this->get('/analyze');

    $response->assertRedirect(route('login'));
    $response->assertSessionHas('info', 'Please log in to upload your resume.');
    expect(session('url.intended'))->toBe(url('/analyze'));

    // User logs in and is returned to /analyze
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    $loginResponse = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $loginResponse->assertRedirect(url('/analyze'));
});

test('registration sets trial_ends_at to now plus trial_days', function () {
    SettingsService::set('trial_days', 14);

    $response = $this->post('/register', [
        'name' => 'Trial User',
        'email' => 'trial@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $user = User::where('email', 'trial@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->trial_ends_at)->not->toBeNull();
    expect(now()->diffInDays($user->trial_ends_at))->toBeGreaterThanOrEqual(13);
});

test('registration respects registration_enabled setting', function () {
    SettingsService::set('registration_enabled', false);

    $this->get('/register')->assertRedirect(route('login'));

    $response = $this->post('/register', [
        'name' => 'Blocked User',
        'email' => 'blocked@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('login'));
    $this->assertGuest();
});

test('deactivated user is blocked from logging in', function () {
    $user = User::factory()->create([
        'is_active' => false,
        'password' => bcrypt('password'),
    ]);

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

test('unverified user hitting /analyze is redirected to verification notice when email verification is required', function () {
    $unverifiedUser = User::factory()->unverified()->create([
        'is_active' => true,
    ]);

    $response = $this->actingAs($unverifiedUser)->get('/analyze');

    $response->assertRedirect(route('verification.notice'));
});

test('unverified user hitting /analyze is allowed when email_verification_required setting is false', function () {
    SettingsService::set('email_verification_required', false);

    $unverifiedUser = User::factory()->unverified()->create([
        'is_active' => true,
    ]);

    $response = $this->actingAs($unverifiedUser)->get('/analyze');

    $response->assertOk();
});

test('new google user is created verified with trial date and null password', function () {
    $mockProviderUser = Mockery::mock(ProviderUser::class);
    $mockProviderUser->shouldReceive('getId')->andReturn('google-12345');
    $mockProviderUser->shouldReceive('getEmail')->andReturn('googleuser@example.com');
    $mockProviderUser->shouldReceive('getName')->andReturn('Google User');
    $mockProviderUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/avatar.jpg');
    $mockProviderUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);

    $mockDriver = Mockery::mock();
    $mockDriver->shouldReceive('user')->andReturn($mockProviderUser);
    Socialite::shouldReceive('driver')->with('google')->andReturn($mockDriver);

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect(route('dashboard', absolute: false));
    $this->assertAuthenticated();

    $user = User::where('email', 'googleuser@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->password)->toBeNull();
    expect($user->email_verified_at)->not->toBeNull();
    expect($user->hasActiveTrial())->toBeTrue();
    expect($user->avatar_url)->toBe('https://lh3.googleusercontent.com/avatar.jpg');
    expect($user->socialAccounts()->where('provider', 'google')->exists())->toBeTrue();
});

test('existing linked google user logs in and updates last_login_at', function () {
    $user = User::factory()->create([
        'email' => 'linked@example.com',
        'last_login_at' => null,
    ]);

    SocialAccount::create([
        'user_id' => $user->id,
        'provider' => 'google',
        'provider_user_id' => 'google-existing-999',
        'provider_email' => 'linked@example.com',
    ]);

    $mockProviderUser = Mockery::mock(ProviderUser::class);
    $mockProviderUser->shouldReceive('getId')->andReturn('google-existing-999');
    $mockProviderUser->shouldReceive('getEmail')->andReturn('linked@example.com');
    $mockProviderUser->shouldReceive('getName')->andReturn('Linked User');
    $mockProviderUser->shouldReceive('getAvatar')->andReturn(null);
    $mockProviderUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);

    $mockDriver = Mockery::mock();
    $mockDriver->shouldReceive('user')->andReturn($mockProviderUser);
    Socialite::shouldReceive('driver')->with('google')->andReturn($mockDriver);

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect(route('dashboard', absolute: false));
    $this->assertAuthenticatedAs($user);
    expect($user->fresh()->last_login_at)->not->toBeNull();
});

test('google email matching an unverified local account is NOT auto-linked (blocks takeover)', function () {
    $localUser = User::factory()->unverified()->create([
        'email' => 'unverified-local@example.com',
    ]);

    $mockProviderUser = Mockery::mock(ProviderUser::class);
    $mockProviderUser->shouldReceive('getId')->andReturn('google-takeover-id');
    $mockProviderUser->shouldReceive('getEmail')->andReturn('unverified-local@example.com');
    $mockProviderUser->shouldReceive('getName')->andReturn('Takeover Attempter');
    $mockProviderUser->shouldReceive('getAvatar')->andReturn(null);
    $mockProviderUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);

    $mockDriver = Mockery::mock();
    $mockDriver->shouldReceive('user')->andReturn($mockProviderUser);
    Socialite::shouldReceive('driver')->with('google')->andReturn($mockDriver);

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors('email');
    $this->assertGuest();
    expect($localUser->socialAccounts()->count())->toBe(0);
});

test('registration disabled blocks new google signups', function () {
    SettingsService::set('registration_enabled', false);

    $mockNewUser = Mockery::mock(ProviderUser::class);
    $mockNewUser->shouldReceive('getId')->andReturn('google-new-blocked');
    $mockNewUser->shouldReceive('getEmail')->andReturn('new-blocked@example.com');
    $mockNewUser->shouldReceive('getName')->andReturn('Blocked');
    $mockNewUser->shouldReceive('getAvatar')->andReturn(null);
    $mockNewUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);

    $mockDriver = Mockery::mock();
    $mockDriver->shouldReceive('user')->andReturn($mockNewUser);
    Socialite::shouldReceive('driver')->with('google')->andReturn($mockDriver);

    $response = $this->get('/auth/google/callback');
    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

test('registration disabled still allows existing linked google users to log in', function () {
    SettingsService::set('registration_enabled', false);

    $existingUser = User::factory()->create(['email' => 'existing@example.com']);
    SocialAccount::create([
        'user_id' => $existingUser->id,
        'provider' => 'google',
        'provider_user_id' => 'google-existing-allowed',
        'provider_email' => 'existing@example.com',
    ]);

    $mockExisting = Mockery::mock(ProviderUser::class);
    $mockExisting->shouldReceive('getId')->andReturn('google-existing-allowed');
    $mockExisting->shouldReceive('getEmail')->andReturn('existing@example.com');
    $mockExisting->shouldReceive('getName')->andReturn('Existing');
    $mockExisting->shouldReceive('getAvatar')->andReturn(null);
    $mockExisting->shouldReceive('getRaw')->andReturn(['email_verified' => true]);

    $mockDriver = Mockery::mock();
    $mockDriver->shouldReceive('user')->andReturn($mockExisting);
    Socialite::shouldReceive('driver')->with('google')->andReturn($mockDriver);

    $response = $this->get('/auth/google/callback');
    $response->assertRedirect(route('dashboard', absolute: false));
    $this->assertAuthenticatedAs($existingUser);
});

test('social-only user cannot disconnect google without setting a password', function () {
    $socialUser = User::factory()->create([
        'password' => null,
    ]);

    SocialAccount::create([
        'user_id' => $socialUser->id,
        'provider' => 'google',
        'provider_user_id' => 'google-pwdless',
        'provider_email' => $socialUser->email,
    ]);

    $response = $this->actingAs($socialUser)->post(route('auth.google.disconnect'));

    $response->assertRedirect(route('profile.edit'));
    $response->assertSessionHasErrors('password');
    expect($socialUser->socialAccounts()->count())->toBe(1);
});

test('social-only user can set a password without current_password and then disconnect google', function () {
    $socialUser = User::factory()->create([
        'password' => null,
    ]);

    SocialAccount::create([
        'user_id' => $socialUser->id,
        'provider' => 'google',
        'provider_user_id' => 'google-pwdless-2',
        'provider_email' => $socialUser->email,
    ]);

    // Set a password
    $pwdResponse = $this->actingAs($socialUser)->put(route('password.update'), [
        'password' => 'NewSecurePassword123!',
        'password_confirmation' => 'NewSecurePassword123!',
    ]);

    $pwdResponse->assertSessionHasNoErrors();
    expect($socialUser->fresh()->hasPassword())->toBeTrue();

    // Now disconnect Google
    $disconnectResponse = $this->actingAs($socialUser->fresh())->post(route('auth.google.disconnect'));
    $disconnectResponse->assertSessionHasNoErrors();
    expect($socialUser->socialAccounts()->count())->toBe(0);
});

test('intended URL is preserved and restored after google login', function () {
    $mockProviderUser = Mockery::mock(ProviderUser::class);
    $mockProviderUser->shouldReceive('getId')->andReturn('google-intended-user');
    $mockProviderUser->shouldReceive('getEmail')->andReturn('intended@example.com');
    $mockProviderUser->shouldReceive('getName')->andReturn('Intended User');
    $mockProviderUser->shouldReceive('getAvatar')->andReturn(null);
    $mockProviderUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);

    $mockDriver = Mockery::mock();
    $mockDriver->shouldReceive('user')->andReturn($mockProviderUser);
    Socialite::shouldReceive('driver')->with('google')->andReturn($mockDriver);

    // Session has intended URL preserved
    $response = $this->withSession(['social_intended_url' => url('/analyze')])
        ->get('/auth/google/callback');

    $response->assertRedirect(url('/analyze'));
});
