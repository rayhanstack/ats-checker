<?php

use App\Enums\Role;
use App\Models\AuditLog;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(SettingSeeder::class);
    $this->seed(PlanSeeder::class);
});

test('non-admin user gets 403 forbidden across admin routes', function () {
    $user = User::factory()->create(['role' => Role::User]);

    $this->actingAs($user)->get('/admin')->assertForbidden();
    $this->actingAs($user)->get('/admin/dashboard')->assertForbidden();
    $this->actingAs($user)->get('/admin/users')->assertForbidden();
    $this->actingAs($user)->get('/admin/audit-logs')->assertForbidden();
});

test('admin can access dashboard, users list, and audit logs', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    $this->actingAs($admin)->get('/admin/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Dashboard'));

    $this->actingAs($admin)->get('/admin/users')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Users/Index'));

    $this->actingAs($admin)->get('/admin/audit-logs')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/AuditLogs/Index'));
});

test('admin can create a user and action is audit logged', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    $res = $this->actingAs($admin)->post(route('admin.users.store'), [
        'name' => 'New Candidate',
        'email' => 'candidate@example.com',
        'password' => 'secretPassword123!',
        'role' => 'user',
        'trial_days' => 14,
        'is_active' => true,
    ]);

    $res->assertSessionHasNoErrors();
    $res->assertRedirect();

    $newUser = User::where('email', 'candidate@example.com')->first();
    expect($newUser)->not->toBeNull();
    expect($newUser->name)->toBe('New Candidate');
    expect($newUser->role)->toBe(Role::User);
    expect($newUser->hasActiveTrial())->toBeTrue();
    expect($newUser->email_verified_at)->not->toBeNull();

    // Verify Audit Log
    $log = AuditLog::where('action', 'user.create')->where('target_id', $newUser->id)->first();
    expect($log)->not->toBeNull();
    expect($log->admin_id)->toBe($admin->id);
});

test('admin can update user and cannot demote themselves', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $user = User::factory()->create(['role' => Role::User]);

    // Update regular user to admin
    $this->actingAs($admin)->put(route('admin.users.update', $user->id), [
        'name' => 'Updated Name',
        'email' => 'updated@example.com',
        'role' => 'admin',
    ])->assertSessionHasNoErrors();

    expect($user->fresh()->name)->toBe('Updated Name');
    expect($user->fresh()->role)->toBe(Role::Admin);

    // Attempt to demote self -> fails with validation error
    $res = $this->actingAs($admin)->put(route('admin.users.update', $admin->id), [
        'name' => $admin->name,
        'email' => $admin->email,
        'role' => 'user',
    ]);

    $res->assertSessionHasErrors('role');
    expect($admin->fresh()->role)->toBe(Role::Admin);
});

test('admin cannot deactivate or delete themselves', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    // Deactivate self
    $this->actingAs($admin)->post(route('admin.users.toggle-status', $admin->id))
        ->assertSessionHas('error');
    expect($admin->fresh()->is_active)->toBeTrue();

    // Delete self
    $this->actingAs($admin)->delete(route('admin.users.destroy', $admin->id))
        ->assertSessionHas('error');
    expect(User::find($admin->id))->not->toBeNull();
});

test('last remaining admin cannot be demoted, deactivated, or deleted', function () {
    // Exactly 1 active admin exists in the system
    $soleAdmin = User::factory()->create(['role' => Role::Admin, 'is_active' => true]);

    // Create a second admin who is deactivated so they cannot count as active admin
    $inactiveAdmin = User::factory()->create(['role' => Role::Admin, 'is_active' => false]);

    // Active admin count is exactly 1 ($soleAdmin)
    expect(User::where('role', Role::Admin)->where('is_active', true)->count())->toBe(1);

    // 1. Demoting the sole active admin fails
    $res = $this->actingAs($soleAdmin)->put(route('admin.users.update', $soleAdmin->id), [
        'name' => $soleAdmin->name,
        'email' => $soleAdmin->email,
        'role' => 'user',
    ]);
    $res->assertSessionHasErrors('role');
    expect($soleAdmin->fresh()->role)->toBe(Role::Admin);

    // 2. Deactivating the sole active admin fails
    $this->actingAs($soleAdmin)->post(route('admin.users.toggle-status', $soleAdmin->id))
        ->assertSessionHas('error');
    expect($soleAdmin->fresh()->is_active)->toBeTrue();

    // 3. Deleting the sole active admin fails
    $this->actingAs($soleAdmin)->delete(route('admin.users.destroy', $soleAdmin->id))
        ->assertSessionHas('error');
    expect(User::find($soleAdmin->id))->not->toBeNull();
});

test('admin can toggle status, extend trial, and assign plan manually', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $user = User::factory()->create(['role' => Role::User, 'is_active' => true]);

    // 1. Toggle status to deactivated
    $this->actingAs($admin)->post(route('admin.users.toggle-status', $user->id))
        ->assertRedirect();
    expect($user->fresh()->is_active)->toBeFalse();

    // Toggle back to active
    $this->actingAs($admin)->post(route('admin.users.toggle-status', $user->id))
        ->assertRedirect();
    expect($user->fresh()->is_active)->toBeTrue();

    // 2. Extend trial (+10 days)
    $this->actingAs($admin)->post(route('admin.users.extend-trial', $user->id), [
        'days' => 10,
    ])->assertRedirect();

    expect($user->fresh()->hasActiveTrial())->toBeTrue();
    expect($user->fresh()->trial_ends_at->isFuture())->toBeTrue();

    // 3. Assign plan manually
    $plan = Plan::where('slug', 'monthly')->first() ?: Plan::first();

    $this->actingAs($admin)->post(route('admin.users.assign-plan', $user->id), [
        'plan_id' => $plan->id,
        'duration_days' => 60,
    ])->assertRedirect();

    $activeSub = $user->fresh()->activeSubscription;
    expect($activeSub)->not->toBeNull();
    expect($activeSub->plan_id)->toBe($plan->id);
    expect($activeSub->status)->toBe('active');

    // Verify audit logs recorded for each step
    expect(AuditLog::where('action', 'user.toggle_status')->where('target_id', $user->id)->count())->toBe(2);
    expect(AuditLog::where('action', 'user.extend_trial')->where('target_id', $user->id)->count())->toBe(1);
    expect(AuditLog::where('action', 'user.assign_plan')->where('target_id', $user->id)->count())->toBe(1);
});

test('admin can reset user password manually or send link', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $user = User::factory()->create(['role' => Role::User]);

    // Manual password reset
    $this->actingAs($admin)->post(route('admin.users.reset-password', $user->id), [
        'mode' => 'manual',
        'password' => 'newSecretPass2026!',
    ])->assertRedirect();

    expect(Hash::check('newSecretPass2026!', $user->fresh()->password))->toBeTrue();

    // Send reset link
    $this->actingAs($admin)->post(route('admin.users.reset-password', $user->id), [
        'mode' => 'link',
    ])->assertRedirect();

    expect(AuditLog::where('action', 'user.password_reset')->where('target_id', $user->id)->count())->toBe(2);
});

test('admin can view user detail page and delete user (soft delete)', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $user = User::factory()->create(['role' => Role::User]);

    // View detail page
    $this->actingAs($admin)->get(route('admin.users.show', $user->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Show')
            ->where('user.id', $user->id)
        );

    // Delete user
    $this->actingAs($admin)->delete(route('admin.users.destroy', $user->id))
        ->assertRedirect(route('admin.users.index'));

    // Soft deleted: not in regular query, but exists in withTrashed()
    expect(User::find($user->id))->toBeNull();
    expect(User::withTrashed()->find($user->id))->not->toBeNull();

    expect(AuditLog::where('action', 'user.delete')->where('target_id', $user->id)->count())->toBe(1);
});
