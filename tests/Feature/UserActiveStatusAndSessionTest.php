<?php

use App\Enums\Role;
use App\Models\User;
use App\Services\SettingsService;
use Database\Seeders\SettingSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed(SettingSeeder::class);
});

test('active user can log in and updates last_login_at', function () {
    $user = User::factory()->create([
        'email' => 'active@example.com',
        'password' => Hash::make('secret-password'),
        'is_active' => true,
        'last_login_at' => null,
    ]);

    $response = $this->post(route('login'), [
        'email' => 'active@example.com',
        'password' => 'secret-password',
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect(route('dashboard', absolute: false));

    $user->refresh();
    expect($user->last_login_at)->not->toBeNull();
});

test('deactivated user cannot log in and receives clear message', function () {
    $user = User::factory()->create([
        'email' => 'inactive@example.com',
        'password' => Hash::make('secret-password'),
        'is_active' => false,
    ]);

    $response = $this->post(route('login'), [
        'email' => 'inactive@example.com',
        'password' => 'secret-password',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors([
        'email' => 'Your account has been deactivated. Please contact support.',
    ]);
});

test('user deactivated mid-session is logged out on next request', function () {
    $user = User::factory()->create([
        'is_active' => true,
    ]);

    $this->actingAs($user);

    // Mid-session deactivation occurs
    $user->update(['is_active' => false]);

    $response = $this->get(route('dashboard'));

    $this->assertGuest();
    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors([
        'email' => 'Your account has been deactivated. Please contact support.',
    ]);
});

test('new user registration automatically receives trial and user role', function () {
    $response = $this->post(route('register'), [
        'name' => 'New Candidate',
        'email' => 'candidate@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);

    $response->assertRedirect(route('dashboard', absolute: false));

    $user = User::where('email', 'candidate@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->role)->toBe(Role::User)
        ->and($user->is_active)->toBeTrue()
        ->and($user->trial_ends_at)->not->toBeNull()
        ->and($user->hasActiveTrial())->toBeTrue();
});

test('registration is prohibited when registration_enabled is false', function () {
    SettingsService::set('registration_enabled', false, 'auth');

    $response = $this->post(route('register'), [
        'name' => 'Forbidden User',
        'email' => 'forbidden@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);

    $this->assertGuest();
    $response->assertRedirect(route('login'));
});
