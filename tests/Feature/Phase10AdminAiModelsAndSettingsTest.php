<?php

use App\Contracts\AiProvider;
use App\DTOs\AnalysisResult;
use App\Enums\Role;
use App\Mail\TestVerificationMail;
use App\Models\AiModel;
use App\Models\Analysis;
use App\Models\AnalysisAttempt;
use App\Models\AuditLog;
use App\Models\ContactMessage;
use App\Models\Faq;
use App\Models\Page;
use App\Models\Testimonial;
use App\Models\User;
use App\Services\AiProviders\AnthropicProvider;
use App\Services\AnalysisService;
use App\Services\SettingsService;
use Database\Seeders\AiModelSeeder;
use Database\Seeders\FaqSeeder;
use Database\Seeders\PageSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\TestimonialSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
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
});

test('non-admin user is forbidden from phase 10 admin routes', function () {
    $user = User::factory()->create(['role' => Role::User]);

    $this->actingAs($user)->get('/admin/ai-models')->assertForbidden();
    $this->actingAs($user)->get('/admin/settings')->assertForbidden();
    $this->actingAs($user)->get('/admin/faqs')->assertForbidden();
    $this->actingAs($user)->get('/admin/contact-messages')->assertForbidden();
});

test('admin can view AI models list with parameters and metrics', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    $this->actingAs($admin)
        ->get('/admin/ai-models')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/AiModels/Index')
            ->has('models')
            ->has('stats.default_analysis')
        );
});

test('admin can create a new AI model and action is audit logged', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    $res = $this->actingAs($admin)->post(route('admin.ai-models.store'), [
        'name' => 'Claude 3.7 Sonnet Next',
        'provider' => 'anthropic',
        'model_id' => 'claude-3-7-sonnet-20260219',
        'purpose' => 'analysis',
        'temperature' => 0.15,
        'max_tokens' => 8192,
        'is_active' => true,
        'is_default' => false,
        'fallback_priority' => 3,
        'input_cost_per_mtok' => 3.00,
        'output_cost_per_mtok' => 15.00,
        'notes' => 'Next gen evaluation engine with reasoning',
    ]);

    $res->assertSessionHasNoErrors();
    $res->assertRedirect();

    $model = AiModel::where('model_id', 'claude-3-7-sonnet-20260219')->first();
    expect($model)->not->toBeNull();
    expect($model->name)->toBe('Claude 3.7 Sonnet Next');
    expect((float) $model->temperature)->toBe(0.15);

    $log = AuditLog::where('action', 'ai_model.create')->first();
    expect($log)->not->toBeNull();
});

test('admin can set default AI model and switching default changes model used for analysis', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    // Current default model
    $oldDefault = AiModel::where('purpose', 'analysis')->where('is_default', true)->first();
    expect($oldDefault)->not->toBeNull();

    // Create a new model to become default
    $newModel = AiModel::create([
        'name' => 'Custom Flagship Claude',
        'provider' => 'anthropic',
        'model_id' => 'claude-flagship-custom',
        'purpose' => 'analysis',
        'temperature' => 0.2,
        'max_tokens' => 4096,
        'is_active' => true,
        'is_default' => false,
    ]);

    // Set as default
    $this->actingAs($admin)
        ->post(route('admin.ai-models.set-default', $newModel->id))
        ->assertRedirect();

    $newModel->refresh();
    $oldDefault->refresh();

    expect($newModel->is_default)->toBeTrue();
    expect($oldDefault->is_default)->toBeFalse();

    // Verify AnalysisService picks this new default model as the first in chain!
    $analysisService = app(AnalysisService::class);
    $reflection = new \ReflectionClass($analysisService);
    $method = $reflection->getMethod('getModelsChain');
    $method->setAccessible(true);

    $chain = $method->invoke($analysisService);
    expect($chain->first()->id)->toBe($newModel->id);
    expect($chain->first()->model_id)->toBe('claude-flagship-custom');
});

test('admin cannot deactivate or delete the default analysis model or model with attempt history', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $defaultModel = AiModel::where('purpose', 'analysis')->where('is_default', true)->first();

    // 1. Cannot deactivate default analysis model
    $res = $this->actingAs($admin)
        ->post(route('admin.ai-models.toggle-active', $defaultModel->id));
    $res->assertSessionHas('error');
    $defaultModel->refresh();
    expect($defaultModel->is_active)->toBeTrue();

    // 2. Cannot delete default model
    $delRes = $this->actingAs($admin)
        ->delete(route('admin.ai-models.destroy', $defaultModel->id));
    $delRes->assertSessionHas('error');
    expect(AiModel::where('id', $defaultModel->id)->exists())->toBeTrue();

    // 3. Create non-default model with attempts history
    $histModel = AiModel::create([
        'name' => 'Legacy Model With History',
        'provider' => 'anthropic',
        'model_id' => 'claude-legacy-1',
        'purpose' => 'analysis',
        'temperature' => 0.2,
        'max_tokens' => 4096,
        'is_active' => false,
        'is_default' => false,
    ]);

    $analysis = Analysis::create([
        'user_id' => $admin->id,
        'resume_original_name' => 'legacy.pdf',
        'job_title' => 'Engineer',
        'status' => 'failed',
    ]);

    AnalysisAttempt::create([
        'analysis_id' => $analysis->id,
        'ai_model_id' => $histModel->id,
        'attempt_no' => 1,
        'status' => 'failed',
        'latency_ms' => 1200,
    ]);

    $histDelRes = $this->actingAs($admin)
        ->delete(route('admin.ai-models.destroy', $histModel->id));
    $histDelRes->assertSessionHas('error');
    expect(AiModel::where('id', $histModel->id)->exists())->toBeTrue();
});

test('test-model button probe executes diagnostic test and returns latency and structured json', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $model = AiModel::where('purpose', 'analysis')->first();

    // Mock AnthropicProvider
    $mockProvider = Mockery::mock(AnthropicProvider::class);
    $mockResult = new AnalysisResult(
        score: 87,
        breakdown: [
            'skills_match' => ['score' => 38, 'max_score' => 40, 'note' => 'Strong skills'],
            'experience_relevance' => ['score' => 28, 'max_score' => 30, 'note' => 'Relevant experience'],
            'keywords' => ['score' => 18, 'max_score' => 20, 'note' => 'Keywords matched'],
            'format_readability' => ['score' => 9, 'max_score' => 10, 'note' => 'Clear format'],
        ],
        matchedKeywords: ['PHP', 'Laravel', 'React'],
        missingKeywords: ['Docker'],
        strengths: ['Solid full stack experience'],
        suggestions: [],
        summary: 'Excellent alignment with job requirements.',
        tokensIn: 210,
        tokensOut: 95
    );

    $mockProvider->shouldReceive('analyze')
        ->once()
        ->andReturn($mockResult);

    $this->instance(AnthropicProvider::class, $mockProvider);

    $response = $this->actingAs($admin)
        ->postJson(route('admin.ai-models.test', $model->id));

    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'model_id' => $model->model_id,
        'score' => 87,
        'tokens_in' => 210,
        'tokens_out' => 95,
        'summary' => 'Excellent alignment with job requirements.',
    ]);
});

test('admin can update settings and cache is immediately cleared and values flow to application', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    // Initial value
    expect(SettingsService::get('site_name'))->toBe('ATS Checker');

    // Update General settings tab
    $res = $this->actingAs($admin)->put(route('admin.settings.update'), [
        'tab' => 'general',
        'site_name' => 'Apex ATS Analyzer',
        'site_tagline' => 'Next Generation Resume Intelligence',
        'contact_email' => 'contact@apexats.com',
        'contact_phone' => '+1 800 555 1234',
        'contact_address' => '500 Tech Blvd, New York, NY',
        'social_links' => ['twitter' => 'https://x.com/apexats'],
    ]);

    $res->assertSessionHasNoErrors();
    $res->assertRedirect();

    // Cache is cleared and new value flows through SettingsService
    expect(SettingsService::get('site_name'))->toBe('Apex ATS Analyzer');
    expect(SettingsService::get('site_tagline'))->toBe('Next Generation Resume Intelligence');

    // Update Trial & Limits tab
    $limitsRes = $this->actingAs($admin)->put(route('admin.settings.update'), [
        'tab' => 'trial_limits',
        'trial_days' => 14,
        'free_plan_analyses_limit' => 8,
        'max_upload_mb' => 10,
        'allowed_file_types' => 'pdf,docx,txt',
        'max_jd_chars' => 20000,
        'analysis_throttle_per_hour' => 15,
    ]);

    $limitsRes->assertSessionHasNoErrors();
    expect(SettingsService::get('trial_days'))->toBe(14);
    expect(SettingsService::get('free_plan_analyses_limit'))->toBe(8);

    // Audit log was recorded
    $log = AuditLog::where('action', 'settings.update')->first();
    expect($log)->not->toBeNull();
});

test('admin can send a test verification email via settings page', function () {
    Mail::fake();

    $admin = User::factory()->create([
        'role' => Role::Admin,
        'email' => 'admin@atschecker.local',
    ]);

    $res = $this->actingAs($admin)->post(route('admin.settings.test-mail'), [
        'test_email' => 'verify-smtp@example.com',
    ]);

    $res->assertSessionHas('success');

    Mail::assertSent(TestVerificationMail::class, function (TestVerificationMail $mail) {
        return $mail->hasTo('verify-smtp@example.com');
    });
});

test('admin can manage testimonials in settings', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    // Create
    $this->actingAs($admin)->post(route('admin.settings.testimonials.store'), [
        'name' => 'Sophia Taylor',
        'role' => 'Lead Data Scientist',
        'company' => 'Quant Metrics',
        'content' => 'The semantic matching gave me clear feedback on industry buzzwords vs technical depth.',
        'rating' => 5,
        'sort_order' => 4,
        'is_active' => true,
    ])->assertRedirect();

    $testimonial = Testimonial::where('name', 'Sophia Taylor')->first();
    expect($testimonial)->not->toBeNull();

    // Update
    $this->actingAs($admin)->put(route('admin.settings.testimonials.update', $testimonial->id), [
        'name' => 'Sophia Taylor',
        'role' => 'Principal Data Scientist',
        'company' => 'Quant Metrics',
        'content' => 'Updated review text.',
        'rating' => 5,
        'sort_order' => 4,
        'is_active' => true,
    ])->assertRedirect();

    $testimonial->refresh();
    expect($testimonial->role)->toBe('Principal Data Scientist');

    // Delete
    $this->actingAs($admin)->delete(route('admin.settings.testimonials.destroy', $testimonial->id))
        ->assertRedirect();

    expect(Testimonial::where('id', $testimonial->id)->exists())->toBeFalse();
});

test('admin can manage FAQs with reordering and publish toggle', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    // 1. Create FAQ
    $this->actingAs($admin)->post(route('admin.faqs.store'), [
        'question' => 'How does the ATS scoring algorithm work?',
        'answer' => 'We compare resume keywords and semantic experience against the job description.',
        'sort_order' => 10,
        'is_published' => true,
    ])->assertRedirect();

    $faq = Faq::where('question', 'How does the ATS scoring algorithm work?')->first();
    expect($faq)->not->toBeNull();

    // 2. Toggle publish
    $this->actingAs($admin)->post(route('admin.faqs.toggle-publish', $faq->id))
        ->assertRedirect();
    $faq->refresh();
    expect($faq->is_published)->toBeFalse();

    // 3. Reorder
    $faq1 = Faq::first();
    $faq2 = Faq::where('id', '!=', $faq1->id)->first();

    $this->actingAs($admin)->post(route('admin.faqs.reorder'), [
        'order' => [$faq2->id, $faq1->id],
    ])->assertRedirect();

    $faq2->refresh();
    expect($faq2->sort_order)->toBe(1);

    // 4. Delete
    $this->actingAs($admin)->delete(route('admin.faqs.destroy', $faq->id))
        ->assertRedirect();
    expect(Faq::where('id', $faq->id)->exists())->toBeFalse();
});

test('admin can manage contact messages inbox with status updates and deletion', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    $message = ContactMessage::create([
        'name' => 'Sarah Connor',
        'email' => 'sarah@resistance.org',
        'subject' => 'Enterprise Pricing Inquiry',
        'message' => 'Do you support team licenses for 50+ recruiters?',
        'status' => 'new',
        'ip' => '127.0.0.1',
    ]);

    // View inbox
    $this->actingAs($admin)->get('/admin/contact-messages')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/ContactMessages/Index'));

    // Mark as read
    $this->actingAs($admin)->post(route('admin.contact-messages.mark-read', $message->id))
        ->assertRedirect();
    $message->refresh();
    expect($message->status)->toBe('read');

    // Mark as replied
    $this->actingAs($admin)->post(route('admin.contact-messages.mark-replied', $message->id))
        ->assertRedirect();
    $message->refresh();
    expect($message->status)->toBe('replied');

    // Delete
    $this->actingAs($admin)->delete(route('admin.contact-messages.destroy', $message->id))
        ->assertRedirect();
    expect(ContactMessage::where('id', $message->id)->exists())->toBeFalse();
});

test('retention purge command deletes expired resume files and raw text while honoring settings', function () {
    $user = User::factory()->create();

    // Fake file in storage
    $fakeFile = UploadedFile::fake()->create('expired_cv.pdf', 80);
    $path = Storage::disk('local')->putFile('resumes', $fakeFile);

    // Analysis created 45 days ago
    $expiredAnalysis = Analysis::create([
        'user_id' => $user->id,
        'resume_original_name' => 'expired_cv.pdf',
        'resume_path' => $path,
        'resume_text' => 'Confidential CV data from past candidate',
        'job_title' => 'Software Engineer',
        'jd_text' => 'Job requirements',
        'status' => 'completed',
        'score' => 84,
        'result' => ['summary' => 'Great match'],
    ]);
    $expiredAnalysis->timestamps = false;
    $expiredAnalysis->created_at = now()->subDays(45);
    $expiredAnalysis->save();

    // Recent analysis (10 days old)
    $recentFile = UploadedFile::fake()->create('recent_cv.pdf', 80);
    $recentPath = Storage::disk('local')->putFile('resumes', $recentFile);

    $recentAnalysis = Analysis::create([
        'user_id' => $user->id,
        'resume_original_name' => 'recent_cv.pdf',
        'resume_path' => $recentPath,
        'resume_text' => 'Recent CV data',
        'job_title' => 'Product Manager',
        'jd_text' => 'Job requirements',
        'status' => 'completed',
        'score' => 90,
        'result' => ['summary' => 'High match'],
    ]);
    $recentAnalysis->timestamps = false;
    $recentAnalysis->created_at = now()->subDays(10);
    $recentAnalysis->save();

    // Configure retention to 30 days and keep results mode = true
    SettingsService::set('resume_retention_days', 30, 'retention');
    SettingsService::set('keep_results_after_resume_deleted', true, 'retention');

    expect(Storage::disk('local')->exists($path))->toBeTrue();
    expect(Storage::disk('local')->exists($recentPath))->toBeTrue();

    // Run purge command
    Artisan::call('resumes:purge-expired');

    $expiredAnalysis->refresh();
    $recentAnalysis->refresh();

    // Expired analysis: physical file and raw text purged, but score and result JSON preserved!
    expect(Storage::disk('local')->exists($path))->toBeFalse();
    expect($expiredAnalysis->resume_path)->toBeNull();
    expect($expiredAnalysis->resume_text)->toBeNull();
    expect($expiredAnalysis->score)->toBe(84);
    expect($expiredAnalysis->result)->not->toBeNull();

    // Recent analysis: file and text remain intact!
    expect(Storage::disk('local')->exists($recentPath))->toBeTrue();
    expect($recentAnalysis->resume_path)->not->toBeNull();
    expect($recentAnalysis->resume_text)->toBe('Recent CV data');
});
