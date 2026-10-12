<?php

use App\Enums\Role;
use App\Models\Analysis;
use App\Models\Faq;
use App\Models\Plan;
use App\Models\Testimonial;
use App\Models\User;
use Database\Seeders\AiModelSeeder;
use Database\Seeders\FaqSeeder;
use Database\Seeders\PageSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\TestimonialSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(SettingSeeder::class);
    $this->seed(PlanSeeder::class);
    $this->seed(AiModelSeeder::class);
    $this->seed(FaqSeeder::class);
    $this->seed(PageSeeder::class);
    $this->seed(TestimonialSeeder::class);
    Storage::fake('local');
    Storage::fake('public');
    Cache::flush();
});

test('enterprise security headers are attached to responses', function () {
    $response = $this->get('/');

    $response->assertOk();
    $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    $response->assertHeader('X-Content-Type-Options', 'nosniff');
    $response->assertHeader('X-XSS-Protection', '1; mode=block');
    $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    expect($response->headers->get('Content-Security-Policy'))->toContain("default-src 'self'");
});

test('contact form endpoint enforces rate limiting after 5 submissions per minute', function () {
    $payload = [
        'name' => 'Jane Tester',
        'email' => 'jane@example.com',
        'subject' => 'Rate Limit Test',
        'message' => 'Testing rate limiting on public contact submissions.',
    ];

    // First 5 submissions succeed
    for ($i = 0; $i < 5; $i++) {
        $res = $this->post(route('contact.store'), $payload);
        $res->assertSessionHasNoErrors();
    }

    // 6th submission hits throttle:5,1 and receives HTTP 429
    $sixth = $this->post(route('contact.store'), $payload);
    $sixth->assertStatus(429);
});

test('unauthenticated candidate is redirected away from protected analysis routes', function () {
    $this->get(route('analyses.index'))->assertRedirect(route('login'));
    $this->get(route('dashboard'))->assertRedirect(route('login'));
    $this->get(route('analyze'))->assertRedirect(route('login'));
});

test('candidate cannot access or modify another candidates private analysis', function () {
    $userA = User::factory()->create(['role' => Role::User]);
    $userB = User::factory()->create(['role' => Role::User]);

    $analysisA = Analysis::factory()->create([
        'user_id' => $userA->id,
        'resume_original_name' => 'secret_resume.pdf',
        'status' => 'completed',
        'score' => 85,
    ]);

    // User B tries to view User A's analysis -> 403 Forbidden
    $this->actingAs($userB)
        ->get(route('analyses.show', $analysisA))
        ->assertForbidden();

    // User B tries to print User A's analysis -> 403 Forbidden
    $this->actingAs($userB)
        ->get(route('analyses.print', $analysisA))
        ->assertForbidden();

    // User B tries to re-run User A's analysis -> 403 Forbidden
    $this->actingAs($userB)
        ->post(route('analyses.rerun', $analysisA), [
            'jd_text' => 'Software Engineer requirement with more than fifty characters here.',
        ])
        ->assertForbidden();

    // User B tries to delete User A's analysis -> 403 Forbidden
    $this->actingAs($userB)
        ->delete(route('analyses.destroy', $analysisA))
        ->assertForbidden();

    // Analysis is still intact
    expect(Analysis::query()->where('id', $analysisA->id)->exists())->toBeTrue();
});

test('admin can access analysis and download candidate resume file from private disk', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $candidate = User::factory()->create(['role' => Role::User]);

    Storage::disk('local')->put('resumes/candidate_cv.pdf', 'Confidential resume contents');

    $analysis = Analysis::factory()->create([
        'user_id' => $candidate->id,
        'resume_original_name' => 'candidate_cv.pdf',
        'resume_path' => 'resumes/candidate_cv.pdf',
        'status' => 'completed',
        'score' => 92,
    ]);

    // Regular candidate cannot hit admin download route
    $this->actingAs($candidate)
        ->get(route('admin.analyses.download-cv', $analysis))
        ->assertForbidden();

    // Admin can download the file securely
    $response = $this->actingAs($admin)
        ->get(route('admin.analyses.download-cv', $analysis));

    $response->assertOk();
    $response->assertDownload('candidate_cv.pdf');
});

test('faqs are cached and cache is automatically invalidated when admin alters faqs', function () {
    // Initial visit populates cache
    $this->get(route('home'))->assertOk();
    expect(Cache::has('home:faqs'))->toBeTrue();

    $admin = User::factory()->create(['role' => Role::Admin]);

    // Create a new FAQ via admin
    $this->actingAs($admin)->post(route('admin.faqs.store'), [
        'question' => 'Is ATS Checker secure?',
        'answer' => 'Yes, all resumes are stored privately and never leaked.',
        'category' => 'Security',
        'is_published' => true,
    ]);

    // Cache was invalidated
    expect(Cache::has('home:faqs'))->toBeFalse();
});

test('pricing plans are cached and invalidated when admin alters plans', function () {
    // Visiting pricing populates cache
    $this->get(route('pricing'))->assertOk();
    expect(Cache::has('pricing:plans'))->toBeTrue();

    $admin = User::factory()->create(['role' => Role::Admin]);
    $plan = Plan::where('slug', 'monthly')->first();

    // Update plan via admin
    $response = $this->actingAs($admin)->put(route('admin.plans.update', $plan), [
        'name' => 'Monthly Pro Updated',
        'slug' => 'monthly',
        'description' => 'Updated monthly subscription plan.',
        'price' => 24.99,
        'currency' => 'USD',
        'billing_interval' => 'month',
        'analyses_limit' => 25,
        'limit_period' => 'month',
        'features' => ['25 ATS Scans', 'Priority Processing'],
        'is_active' => true,
        'is_featured' => true,
        'sort_order' => 2,
    ]);
    $response->assertSessionHasNoErrors();

    // Cache was invalidated
    expect(Cache::has('pricing:plans'))->toBeFalse();
});

test('testimonials are cached and invalidated when admin alters testimonials', function () {
    // Visiting homepage populates testimonials cache
    $this->get(route('home'))->assertOk();
    expect(Cache::has('home:testimonials'))->toBeTrue();

    $admin = User::factory()->create(['role' => Role::Admin]);

    // Admin adds a testimonial
    $response = $this->actingAs($admin)->post(route('admin.settings.testimonials.store'), [
        'name' => 'Alex Rivera',
        'role' => 'Software Engineer',
        'company' => 'Tech Corp',
        'content' => 'ATS Checker helped me pass the resume screen on my dream job!',
        'rating' => 5,
        'is_active' => true,
        'sort_order' => 1,
    ]);
    $response->assertSessionHasNoErrors();

    // Cache was cleared
    expect(Cache::has('home:testimonials'))->toBeFalse();
});

test('no sensitive server secrets are leaked in frontend inertia props', function () {
    $user = User::factory()->create(['role' => Role::User]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $pageProps = $response->viewData('page')['props'] ?? [];

    $json = json_encode($pageProps);

    // Assert absence of common secret tokens
    expect($json)->not->toContain('ANTHROPIC_API_KEY')
        ->not->toContain('sk-ant-')
        ->not->toContain('secret')
        ->not->toContain('password_hash');
});
