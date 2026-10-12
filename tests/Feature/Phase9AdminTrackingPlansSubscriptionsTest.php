<?php

use App\Enums\Role;
use App\Jobs\ProcessAnalysisJob;
use App\Models\AiModel;
use App\Models\Analysis;
use App\Models\AuditLog;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\AccessService;
use Database\Seeders\PlanSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(SettingSeeder::class);
    $this->seed(PlanSeeder::class);
    Storage::fake('local');
});

test('non-admin user is forbidden from phase 9 admin tracking, plans, and billing routes', function () {
    $user = User::factory()->create(['role' => Role::User]);

    $this->actingAs($user)->get('/admin/analyses')->assertForbidden();
    $this->actingAs($user)->get('/admin/plans')->assertForbidden();
    $this->actingAs($user)->get('/admin/subscriptions')->assertForbidden();
    $this->actingAs($user)->get('/admin/payments')->assertForbidden();
});

test('admin can view analyses list with candidate metrics and filters', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $candidate = User::factory()->create(['role' => Role::User, 'name' => 'John Candidate']);

    $analysis = Analysis::create([
        'user_id' => $candidate->id,
        'resume_original_name' => 'john_cv.pdf',
        'resume_path' => 'resumes/john_cv.pdf',
        'resume_text' => 'Experienced Full Stack Engineer with PHP and React skills.',
        'job_title' => 'Senior Laravel Developer',
        'jd_text' => 'Looking for senior developer with 5+ years experience.',
        'status' => 'completed',
        'score' => 88,
        'tokens_in' => 1200,
        'tokens_out' => 450,
        'started_at' => now()->subSeconds(10),
        'completed_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get('/admin/analyses')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Analyses/Index')
            ->has('analyses.data', 1)
            ->where('analyses.data.0.job_title', 'Senior Laravel Developer')
            ->where('analyses.data.0.score', 88)
        );
});

test('admin can export analyses to CSV stream', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $candidate = User::factory()->create(['role' => Role::User]);

    Analysis::create([
        'user_id' => $candidate->id,
        'resume_original_name' => 'candidate_cv.pdf',
        'resume_path' => 'resumes/candidate_cv.pdf',
        'resume_text' => 'Software Engineer',
        'job_title' => 'Software Engineer',
        'jd_text' => 'Job requirements',
        'status' => 'completed',
        'score' => 79,
    ]);

    $response = $this->actingAs($admin)
        ->get(route('admin.analyses.export-csv'));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('text/csv');
});

test('admin can download private CV file and non-admin cannot', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $user = User::factory()->create(['role' => Role::User]);

    $fakeFile = UploadedFile::fake()->create('secret_resume.pdf', 100);
    $path = Storage::disk('local')->putFile('resumes', $fakeFile);

    $analysis = Analysis::create([
        'user_id' => $user->id,
        'resume_original_name' => 'secret_resume.pdf',
        'resume_path' => $path,
        'resume_text' => 'Confidential resume content',
        'job_title' => 'DevOps Engineer',
        'jd_text' => 'AWS Kubernetes Docker',
        'status' => 'completed',
        'score' => 82,
    ]);

    // Regular user cannot download via admin endpoint
    $this->actingAs($user)
        ->get(route('admin.analyses.download-cv', $analysis->id))
        ->assertForbidden();

    // Admin can download private file
    $res = $this->actingAs($admin)
        ->get(route('admin.analyses.download-cv', $analysis->id));

    $res->assertOk();
    expect($res->headers->get('content-disposition'))->toContain('secret_resume.pdf');
});

test('admin can trigger re-run of an analysis', function () {
    Queue::fake();

    $admin = User::factory()->create(['role' => Role::Admin]);
    $user = User::factory()->create(['role' => Role::User]);

    $analysis = Analysis::create([
        'user_id' => $user->id,
        'resume_original_name' => 'cv.pdf',
        'resume_path' => 'resumes/cv.pdf',
        'resume_text' => 'Resume content',
        'job_title' => 'Data Analyst',
        'jd_text' => 'SQL Python Tableau',
        'status' => 'failed',
        'error_message' => 'API Timeout',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.analyses.rerun', $analysis->id))
        ->assertRedirect();

    $analysis->refresh();
    expect($analysis->status)->toBe('queued');
    expect($analysis->error_message)->toBeNull();

    Queue::assertPushed(ProcessAnalysisJob::class);
});

test('admin can delete an analysis which deletes record and file from private storage', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $user = User::factory()->create(['role' => Role::User]);

    $fakeFile = UploadedFile::fake()->create('to_delete.pdf', 50);
    $path = Storage::disk('local')->putFile('resumes', $fakeFile);

    $analysis = Analysis::create([
        'user_id' => $user->id,
        'resume_original_name' => 'to_delete.pdf',
        'resume_path' => $path,
        'resume_text' => 'Delete me',
        'job_title' => 'QA Tester',
        'jd_text' => 'Testing skills',
        'status' => 'completed',
    ]);

    expect(Storage::disk('local')->exists($path))->toBeTrue();

    $this->actingAs($admin)
        ->delete(route('admin.analyses.destroy', $analysis->id))
        ->assertRedirect();

    expect(Storage::disk('local')->exists($path))->toBeFalse();
    expect(Analysis::where('id', $analysis->id)->exists())->toBeFalse();

    $log = AuditLog::where('action', 'analysis.delete')->first();
    expect($log)->not->toBeNull();
});

test('admin can create and update plans with limits and features', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    // Create
    $res = $this->actingAs($admin)->post(route('admin.plans.store'), [
        'name' => 'Executive Premium',
        'slug' => 'executive-premium',
        'description' => 'Unlimited analyses with AI coaching',
        'price' => 49.99,
        'currency' => 'USD',
        'billing_interval' => 'month',
        'analyses_limit' => 100,
        'limit_period' => 'month',
        'features' => ['Executive ATS scoring', 'AI Cover letter draft', 'Priority queue'],
        'is_active' => true,
        'is_featured' => true,
        'sort_order' => 5,
    ]);

    $res->assertSessionHasNoErrors();
    $res->assertRedirect();

    $plan = Plan::where('slug', 'executive-premium')->first();
    expect($plan)->not->toBeNull();
    expect((float) $plan->price)->toBe(49.99);
    expect($plan->is_featured)->toBeTrue();
    expect($plan->features)->toHaveCount(3);

    // Update
    $updateRes = $this->actingAs($admin)->put(route('admin.plans.update', $plan->id), [
        'name' => 'Executive Ultra',
        'slug' => 'executive-premium',
        'description' => 'Updated description',
        'price' => 59.99,
        'currency' => 'USD',
        'billing_interval' => 'month',
        'analyses_limit' => null, // unlimited
        'limit_period' => 'month',
        'features' => ['Executive ATS scoring', 'AI Cover letter draft'],
        'is_active' => true,
        'is_featured' => false,
        'sort_order' => 6,
    ]);

    $updateRes->assertSessionHasNoErrors();
    $plan->refresh();
    expect($plan->name)->toBe('Executive Ultra');
    expect((float) $plan->price)->toBe(59.99);
    expect($plan->analyses_limit)->toBeNull();

    $log = AuditLog::where('action', 'plan.update')->first();
    expect($log)->not->toBeNull();
});

test('admin cannot delete a plan with active subscribers, must deactivate instead', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $subscriber = User::factory()->create(['role' => Role::User]);
    $plan = Plan::where('slug', 'monthly')->first();

    Subscription::create([
        'user_id' => $subscriber->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'starts_at' => now(),
        'ends_at' => now()->addMonth(),
        'gateway' => 'manual',
    ]);

    $res = $this->actingAs($admin)
        ->delete(route('admin.plans.destroy', $plan->id));

    $res->assertSessionHas('error');
    expect(Plan::where('id', $plan->id)->exists())->toBeTrue();
});

test('admin can delete a plan when it has zero active subscribers', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    $emptyPlan = Plan::create([
        'name' => 'Obsolete Plan',
        'slug' => 'obsolete-plan',
        'price' => 5,
        'currency' => 'USD',
        'billing_interval' => 'month',
        'limit_period' => 'month',
        'features' => ['Old feature'],
        'is_active' => false,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.plans.destroy', $emptyPlan->id))
        ->assertSessionHas('success');

    expect(Plan::where('id', $emptyPlan->id)->exists())->toBeFalse();
});

test('admin can view subscriptions and change status manually', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $user = User::factory()->create(['role' => Role::User]);
    $plan = Plan::where('slug', 'monthly')->first();

    $sub = Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $plan->id,
        'status' => 'trialing',
        'starts_at' => now(),
        'gateway' => 'manual',
    ]);

    // View index
    $this->actingAs($admin)
        ->get('/admin/subscriptions')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Subscriptions/Index'));

    // Update status to active
    $this->actingAs($admin)
        ->put(route('admin.subscriptions.update', $sub->id), [
            'status' => 'active',
        ])
        ->assertRedirect();

    $sub->refresh();
    expect($sub->status)->toBe('active');

    // Cancel subscription
    $this->actingAs($admin)
        ->post(route('admin.subscriptions.cancel', $sub->id))
        ->assertRedirect();

    $sub->refresh();
    expect($sub->status)->toBe('canceled');
    expect($sub->canceled_at)->not->toBeNull();
});

test('admin can mark pending payment as paid which activates user subscription and grants immediate analysis access', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    // Expired trial user
    $candidate = User::factory()->create([
        'role' => Role::User,
        'trial_ends_at' => now()->subDay(),
    ]);

    $monthlyPlan = Plan::where('slug', 'monthly')->first();
    $accessService = app(AccessService::class);

    // Initial state: candidate cannot analyze (expired trial and no active paid sub)
    expect($accessService->canAnalyze($candidate))->toBeFalse();

    // Subscription created in pending/trialing state
    $sub = Subscription::create([
        'user_id' => $candidate->id,
        'plan_id' => $monthlyPlan->id,
        'status' => 'trialing',
        'gateway' => 'manual',
    ]);

    $payment = Payment::create([
        'user_id' => $candidate->id,
        'subscription_id' => $sub->id,
        'amount' => 19.00,
        'currency' => 'USD',
        'status' => 'pending',
        'gateway' => 'manual',
    ]);

    // Admin views payments page
    $this->actingAs($admin)
        ->get('/admin/payments')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Payments/Index'));

    // Admin marks payment as paid
    $res = $this->actingAs($admin)
        ->post(route('admin.payments.mark-paid', $payment->id));

    $res->assertSessionHas('success');

    $payment->refresh();
    $sub->refresh();

    expect($payment->status)->toBe('paid');
    expect($payment->invoice_number)->toStartWith('INV-');
    expect($payment->paid_at)->not->toBeNull();

    // Associated subscription is activated
    expect($sub->status)->toBe('active');

    // Candidate immediately has analysis access!
    $candidate->refresh();
    expect($accessService->canAnalyze($candidate))->toBeTrue();

    // Audit log was recorded
    $log = AuditLog::where('action', 'payment.mark_paid')->first();
    expect($log)->not->toBeNull();
});

test('admin can record a refund on a payment', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $user = User::factory()->create(['role' => Role::User]);

    $payment = Payment::create([
        'user_id' => $user->id,
        'amount' => 29.00,
        'currency' => 'USD',
        'status' => 'paid',
        'gateway' => 'manual',
        'invoice_number' => 'INV-20261012-ABCDEF',
        'paid_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post(route('admin.payments.refund', $payment->id))
        ->assertRedirect();

    $payment->refresh();
    expect($payment->status)->toBe('refunded');

    $log = AuditLog::where('action', 'payment.refund')->first();
    expect($log)->not->toBeNull();
});
