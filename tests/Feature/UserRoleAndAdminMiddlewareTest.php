<?php

use App\Enums\Role;
use App\Models\User;
use Database\Seeders\SettingSeeder;
use Database\Seeders\UserSeeder;

beforeEach(function () {
    $this->seed(SettingSeeder::class);
    $this->seed(UserSeeder::class);
});

test('admin user can access admin dashboard', function () {
    $admin = User::where('role', Role::Admin)->firstOrFail();

    $response = $this->actingAs($admin)->get(route('admin.dashboard'));

    $response->assertOk();
});

test('regular user is forbidden from admin dashboard', function () {
    $user = User::factory()->create([
        'role' => Role::User,
    ]);

    $response = $this->actingAs($user)->get(route('admin.dashboard'));

    $response->assertForbidden();
});

test('guest is redirected to login from admin dashboard', function () {
    $response = $this->get(route('admin.dashboard'));

    $response->assertRedirect(route('login'));
});

test('seeded admin credentials match env configuration', function () {
    $adminEmail = env('ADMIN_EMAIL', 'admin@atschecker.local');
    $admin = User::where('email', $adminEmail)->first();

    expect($admin)->not->toBeNull()
        ->and($admin->role)->toBe(Role::Admin)
        ->and($admin->is_active)->toBeTrue();
});
