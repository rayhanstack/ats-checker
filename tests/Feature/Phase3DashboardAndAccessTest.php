<?php

use App\Models\Analysis;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\AccessService;
use App\Services\SettingsService;

beforeEach(function () {
    SettingsService::set('email_verification_required', true);
    SettingsService::set('trial_days', 7);
    SettingsService::set('trial_analyses_limit', 5);

    // Ensure standard plans exist
    Plan::query()->updateOrCreate(
        ['slug' => 'free-trial'],
        [
            'name' => 'Free Trial',
            'price' => 0.00,
            'currency' => 'USD',
            'billing_interval' => 'none',
            'analyses_limit' => 5,
            'limit_period' => 'trial',
            'features' => ['5 scans'],
            'is_active' => true,
        ]
    );

    Plan::query()->updateOrCreate(
        ['slug' => 'pro-monthly'],
        [
            'name' => 'Professional Monthly',
            'price' => 19.00,
            'currency' => 'USD',
            'billing_interval' => 'month',
            'analyses_limit' => 50,
            'limit_period' => 'month',
            'features' => ['50 scans'],
            'is_active' => true,
        ]
    );

    Plan::query()->updateOrCreate(
        ['slug' => 'annual-unlimited'],
        [
            'name' => 'Annual Unlimited',
            'price' => 149.00,
            'currency' => 'USD',
            'billing_interval' => 'year',
            'analyses_limit' => null,
            'limit_period' => 'year',
            'features' => ['Unlimited scans'],
            'is_active' => true,
        ]
    );
});

test('trial user with active trial and remaining quota can access /analyze', function () {
    $user = User::factory()->create([
        'trial_ends_at' => now()->addDays(5),
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->get('/analyze');

    $response->assertOk();
});

test('expired trial user cannot access /analyze and is sent to /pricing with clear message', function () {
    $user = User::factory()->create([
        'trial_ends_at' => now()->subDay(),
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->get('/analyze');

    $response->assertRedirect(route('pricing'));
    $response->assertSessionHas('error');
    expect(session('error'))->toContain('expired');
});

test('trial user who exhausted their analysis limit cannot access /analyze and is sent to /pricing', function () {
    $user = User::factory()->create([
        'trial_ends_at' => now()->addDays(3),
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    // Create 5 analyses to exhaust limit
    Analysis::factory()->count(5)->create([
        'user_id' => $user->id,
    ]);

    $response = $this->actingAs($user)->get('/analyze');

    $response->assertRedirect(route('pricing'));
    $response->assertSessionHas('error');
    expect(session('error'))->toContain('reached your limit of 5 analyses');
});

test('active paid subscriber can access /analyze up to plan limit', function () {
    $user = User::factory()->create([
        'trial_ends_at' => now()->subDays(10), // trial ended
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    $proPlan = Plan::where('slug', 'pro-monthly')->first();

    Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $proPlan->id,
        'status' => 'active',
        'starts_at' => now()->subDays(2),
        'renews_at' => now()->addDays(28),
    ]);

    $response = $this->actingAs($user)->get('/analyze');

    $response->assertOk();
});

test('active subscriber with unlimited plan can access /analyze without limits', function () {
    $user = User::factory()->create([
        'trial_ends_at' => now()->subDays(20),
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    $unlimitedPlan = Plan::where('slug', 'annual-unlimited')->first();

    Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $unlimitedPlan->id,
        'status' => 'active',
        'starts_at' => now()->subDays(5),
    ]);

    // Create 100 analyses
    Analysis::factory()->count(10)->create([
        'user_id' => $user->id,
    ]);

    $accessService = app(AccessService::class);
    expect($accessService->canAnalyze($user))->toBeTrue();
    expect($accessService->remainingAnalyses($user))->toBe('Unlimited');

    $response = $this->actingAs($user)->get('/analyze');
    $response->assertOk();
});

test('active subscriber who reaches monthly quota is blocked and redirected to /pricing', function () {
    $user = User::factory()->create([
        'trial_ends_at' => now()->subDays(20),
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    $smallPlan = Plan::factory()->create([
        'name' => 'Small Plan',
        'analyses_limit' => 2,
        'billing_interval' => 'month',
    ]);

    Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $smallPlan->id,
        'status' => 'active',
        'starts_at' => now()->subDay(),
    ]);

    Analysis::factory()->count(2)->create([
        'user_id' => $user->id,
        'created_at' => now(),
    ]);

    $accessService = app(AccessService::class);
    expect($accessService->canAnalyze($user))->toBeFalse();
    expect($accessService->remainingAnalyses($user))->toBe(0);

    $response = $this->actingAs($user)->get('/analyze');
    $response->assertRedirect(route('pricing'));
    $response->assertSessionHas('error');
});

test('AccessService methods return accurate values across user states', function () {
    $accessService = app(AccessService::class);

    // 1. Fresh trial user
    $trialUser = User::factory()->create([
        'trial_ends_at' => now()->addDays(7),
    ]);
    expect($accessService->isTrialActive($trialUser))->toBeTrue();
    expect($accessService->canAnalyze($trialUser))->toBeTrue();
    expect($accessService->remainingAnalyses($trialUser))->toBe(5);
    expect($accessService->reasonDenied($trialUser))->toBeNull();

    // 2. Expired user
    $expiredUser = User::factory()->create([
        'trial_ends_at' => now()->subDays(2),
    ]);
    expect($accessService->isTrialActive($expiredUser))->toBeFalse();
    expect($accessService->canAnalyze($expiredUser))->toBeFalse();
    expect($accessService->remainingAnalyses($expiredUser))->toBe(0);
    expect($accessService->reasonDenied($expiredUser))->toContain('expired');
});

test('dashboard page renders with plan status, usage meter, and analyses', function () {
    $user = User::factory()->create([
        'name' => 'Taylor Swift',
        'trial_ends_at' => now()->addDays(4),
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    Analysis::factory()->count(2)->create([
        'user_id' => $user->id,
        'match_score' => 85,
    ]);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard')
        ->has('greeting')
        ->has('access')
        ->has('stats')
        ->has('recentAnalyses', 2)
        ->where('access.status', 'trial')
        ->where('access.used_analyses', 2)
        ->where('access.remaining_analyses', 3)
    );
});

test('/analyses history page renders with paginated records and supports search', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    Analysis::factory()->create([
        'user_id' => $user->id,
        'job_title' => 'Senior React Developer',
        'job_company' => 'Acme Corp',
        'match_score' => 92,
    ]);

    Analysis::factory()->create([
        'user_id' => $user->id,
        'job_title' => 'Python Data Scientist',
        'job_company' => 'DataLabs',
        'match_score' => 64,
    ]);

    // Search query matches only React
    $response = $this->actingAs($user)->get('/analyses?search=React');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Analyses/Index')
        ->has('analyses.data', 1)
        ->where('analyses.data.0.job_title', 'Senior React Developer')
    );
});

test('/analyses score filter correctly isolates score tiers', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    Analysis::factory()->create([
        'user_id' => $user->id,
        'job_title' => 'High Match Job',
        'match_score' => 88,
    ]);

    Analysis::factory()->create([
        'user_id' => $user->id,
        'job_title' => 'Low Match Job',
        'match_score' => 45,
    ]);

    $response = $this->actingAs($user)->get('/analyses?score=high');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Analyses/Index')
        ->has('analyses.data', 1)
        ->where('analyses.data.0.job_title', 'High Match Job')
    );
});

test('user can delete their own analysis record', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $analysis = Analysis::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->delete("/analyses/{$analysis->id}");

    $response->assertRedirect();
    $response->assertSessionHas('success');
    expect(Analysis::where('id', $analysis->id)->exists())->toBeFalse();
});

test('user cannot delete another users analysis record', function () {
    $user1 = User::factory()->create(['email_verified_at' => now()]);
    $user2 = User::factory()->create(['email_verified_at' => now()]);
    $analysis = Analysis::factory()->create(['user_id' => $user2->id]);

    $response = $this->actingAs($user1)->delete("/analyses/{$analysis->id}");

    $response->assertForbidden();
    expect(Analysis::where('id', $analysis->id)->exists())->toBeTrue();
});
