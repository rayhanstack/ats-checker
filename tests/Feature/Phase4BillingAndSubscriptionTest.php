<?php

use App\Contracts\PaymentGateway;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\AccessService;
use App\Services\PaymentGateways\ManualGateway;
use Database\Seeders\PlanSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(SettingSeeder::class);
    $this->seed(PlanSeeder::class);
});

test('three default plans are seeded with correct attributes', function () {
    $free = Plan::where('slug', 'free')->first();
    expect($free)->not->toBeNull();
    expect((float) $free->price)->toBe(0.0);
    expect($free->billing_interval)->toBe('none');
    expect($free->analyses_limit)->toBe(5);
    expect($free->limit_period)->toBe('trial');

    $monthly = Plan::where('slug', 'monthly')->first();
    expect($monthly)->not->toBeNull();
    expect((float) $monthly->price)->toBe(19.0);
    expect($monthly->billing_interval)->toBe('month');
    expect($monthly->analyses_limit)->toBe(50);
    expect($monthly->limit_period)->toBe('month');
    expect($monthly->is_featured)->toBeTrue();

    $yearly = Plan::where('slug', 'yearly')->first();
    expect($yearly)->not->toBeNull();
    expect((float) $yearly->price)->toBe(149.0);
    expect($yearly->billing_interval)->toBe('year');
    expect($yearly->analyses_limit)->toBeNull();
});

test('pricing page loads live plans from database', function () {
    $response = $this->get('/pricing');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Pricing')
        ->has('plans', 3)
        ->where('plans.0.slug', 'free')
        ->where('plans.1.slug', 'monthly')
        ->where('plans.2.slug', 'yearly')
    );
});

test('guest cannot access billing page and is redirected to login', function () {
    $response = $this->get('/billing');
    $response->assertRedirect('/login');
});

test('authenticated user can view billing page with access summary and empty invoices', function () {
    $user = User::factory()->create([
        'trial_ends_at' => now()->addDays(7),
        'email_verified_at' => now(),
    ]);

    $response = $this->actingAs($user)->get('/billing');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Billing')
        ->has('accessSummary')
        ->has('payments', 0)
        ->has('plans', 3)
    );
});

test('choosing a paid plan calls manual gateway abstraction and creates pending payment', function () {
    $user = User::factory()->create([
        'trial_ends_at' => now()->addDays(5),
        'email_verified_at' => now(),
    ]);

    $monthlyPlan = Plan::where('slug', 'monthly')->first();

    $response = $this->actingAs($user)->post('/billing/subscribe', [
        'plan_id' => $monthlyPlan->id,
    ]);

    $response->assertRedirect('/billing');
    $response->assertSessionHas('status', 'pending_manual_approval');
    $response->assertSessionHas('message', 'Payment gateway coming soon. Your request has been recorded. Please contact support or await admin activation.');

    // Assert pending payment record created in payments table
    $payment = Payment::where('user_id', $user->id)->first();
    expect($payment)->not->toBeNull();
    expect($payment->status)->toBe('pending');
    expect((float) $payment->amount)->toBe(19.0);
    expect($payment->gateway)->toBe('manual');
    expect($payment->invoice_number)->toStartWith('INV-');

    // Assert subscription record created
    $subscription = Subscription::where('user_id', $user->id)->first();
    expect($subscription)->not->toBeNull();
    expect($subscription->plan_id)->toBe($monthlyPlan->id);
    expect($payment->subscription_id)->toBe($subscription->id);
});

test('manual gateway markAsPaid activates payment and grants full access in AccessService', function () {
    $user = User::factory()->create([
        'trial_ends_at' => now()->subDay(), // Expired trial
        'email_verified_at' => now(),
    ]);

    $accessService = app(AccessService::class);
    expect($accessService->canAnalyze($user))->toBeFalse();

    $yearlyPlan = Plan::where('slug', 'yearly')->first();
    $gateway = app(PaymentGateway::class);
    expect($gateway)->toBeInstanceOf(ManualGateway::class);

    $checkout = $gateway->createCheckout($user, $yearlyPlan);
    expect($checkout['success'])->toBeTrue();

    $payment = $checkout['payment'];
    expect($payment->status)->toBe('pending');

    // Admin marks payment as paid
    $gateway->markAsPaid($payment);

    $payment->refresh();
    $subscription = $payment->subscription->fresh();

    expect($payment->status)->toBe('paid');
    expect($payment->paid_at)->not->toBeNull();
    expect($subscription->status)->toBe('active');
    expect($subscription->ends_at->isFuture())->toBeTrue();

    // Now user has unlimited scans on Yearly plan
    $user->refresh();
    expect($accessService->canAnalyze($user))->toBeTrue();
    expect($accessService->remainingAnalyses($user))->toBe('Unlimited');
    expect($accessService->currentPlan($user)->slug)->toBe('yearly');
});

test('user can cancel active subscription', function () {
    $user = User::factory()->create([
        'trial_ends_at' => now()->subDay(),
        'email_verified_at' => now(),
    ]);

    $monthlyPlan = Plan::where('slug', 'monthly')->first();

    $subscription = Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $monthlyPlan->id,
        'status' => 'active',
        'starts_at' => now()->subDays(5),
        'ends_at' => now()->addDays(25),
        'gateway' => 'manual',
    ]);

    $response = $this->actingAs($user)->post('/billing/cancel');

    $response->assertRedirect('/billing');
    $response->assertSessionHas('status', 'canceled');

    $subscription->refresh();
    expect($subscription->status)->toBe('canceled');
    expect($subscription->canceled_at)->not->toBeNull();
});

test('scheduled command expires overdue subscriptions past ends_at', function () {
    $user = User::factory()->create();
    $plan = Plan::where('slug', 'monthly')->first();

    // Active subscription that expired 2 days ago
    $overdueSub = Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'starts_at' => now()->subMonth()->subDays(2),
        'ends_at' => now()->subDays(2),
        'gateway' => 'manual',
    ]);

    // Active subscription that is valid for 20 more days
    $validSub = Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'starts_at' => now()->subDays(10),
        'ends_at' => now()->addDays(20),
        'gateway' => 'manual',
    ]);

    $this->artisan('subscriptions:expire')
        ->expectsOutputToContain('Expired 1 overdue subscriptions.')
        ->assertSuccessful();

    $overdueSub->refresh();
    $validSub->refresh();

    expect($overdueSub->status)->toBe('expired');
    expect($validSub->status)->toBe('active');
});

test('choosing free plan immediately sets or updates subscription to active', function () {
    $user = User::factory()->create([
        'trial_ends_at' => now()->addDays(7),
        'email_verified_at' => now(),
    ]);

    $freePlan = Plan::where('slug', 'free')->first();

    $response = $this->actingAs($user)->post('/billing/subscribe', [
        'plan_id' => $freePlan->id,
    ]);

    $response->assertRedirect('/billing');
    $response->assertSessionHas('status', 'active');

    $subscription = Subscription::where('user_id', $user->id)->first();
    expect($subscription)->not->toBeNull();
    expect($subscription->status)->toBe('active');
    expect($subscription->plan_id)->toBe($freePlan->id);
});
