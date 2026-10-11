<?php

use App\Jobs\ProcessAnalysisJob;
use App\Models\Analysis;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Database\Seeders\AiModelSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(SettingSeeder::class);
    $this->seed(PlanSeeder::class);
    $this->seed(AiModelSeeder::class);
    Storage::fake('local');
});

test('owner can view their own analysis across completed, processing, and failed states', function () {
    $owner = User::factory()->create();

    // 1. Completed analysis
    $completedAnalysis = Analysis::create([
        'user_id' => $owner->id,
        'resume_original_name' => 'Resume.pdf',
        'resume_path' => 'resumes/sample.pdf',
        'resume_text' => 'Sample resume content',
        'job_title' => 'Software Architect',
        'jd_text' => 'Job description content for software architect',
        'status' => 'completed',
        'score' => 88,
        'result' => [
            'score' => 88,
            'breakdown' => [
                'skills_match' => ['score' => 36, 'note' => 'Strong skills'],
                'experience_relevance' => ['score' => 28, 'note' => 'High relevance'],
                'keywords' => ['score' => 16, 'note' => 'Good keywords'],
                'format_readability' => ['score' => 8, 'note' => 'Clean format'],
            ],
            'matched_keywords' => ['PHP', 'Laravel', 'Docker'],
            'missing_keywords' => ['Kubernetes'],
            'strengths' => ['Strong architecture background'],
            'suggestions' => [
                [
                    'section' => 'Work Experience',
                    'priority' => 'high',
                    'issue' => 'Missing cloud scaling metrics',
                    'fix' => 'Add specific scale numbers',
                    'example_rewrite' => 'Scaled microservices to 10M daily requests with 99.99% uptime',
                ],
            ],
            'summary' => 'Excellent match for the role.',
        ],
    ]);

    $res = $this->actingAs($owner)->get(route('analyses.show', $completedAnalysis));
    $res->assertOk();
    $res->assertInertia(fn ($page) => $page
        ->component('Analyses/Show')
        ->where('analysis.id', $completedAnalysis->id)
        ->where('analysis.status', 'completed')
        ->where('analysis.match_score', 88)
    );

    // 2. Processing analysis
    $processingAnalysis = Analysis::create([
        'user_id' => $owner->id,
        'resume_original_name' => 'Resume.pdf',
        'resume_path' => 'resumes/sample.pdf',
        'job_title' => 'Backend Engineer',
        'jd_text' => 'Seeking backend engineer',
        'status' => 'processing',
    ]);

    $this->actingAs($owner)->get(route('analyses.show', $processingAnalysis))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('analysis.status', 'processing'));

    // 3. Failed analysis
    $failedAnalysis = Analysis::create([
        'user_id' => $owner->id,
        'resume_original_name' => 'Resume.pdf',
        'resume_path' => 'resumes/sample.pdf',
        'job_title' => 'DevOps Specialist',
        'jd_text' => 'DevOps specialist requirements',
        'status' => 'failed',
        'error_message' => 'AI cluster temporarily overloaded.',
    ]);

    $this->actingAs($owner)->get(route('analyses.show', $failedAnalysis))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('analysis.status', 'failed')
            ->where('analysis.error_message', 'AI cluster temporarily overloaded.')
        );
});

test('non-owner cannot view someone elses analysis (403 forbidden)', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $analysis = Analysis::create([
        'user_id' => $owner->id,
        'resume_original_name' => 'PrivateResume.pdf',
        'resume_path' => 'resumes/private.pdf',
        'job_title' => 'Confidential Role',
        'jd_text' => 'Confidential requirements',
        'status' => 'completed',
        'score' => 90,
    ]);

    $res = $this->actingAs($otherUser)->get(route('analyses.show', $analysis));
    $res->assertForbidden();
});

test('admin can view any users analysis', function () {
    $owner = User::factory()->create();
    $admin = User::factory()->create(['role' => \App\Enums\Role::Admin]);

    $analysis = Analysis::create([
        'user_id' => $owner->id,
        'resume_original_name' => 'CandidateResume.pdf',
        'resume_path' => 'resumes/candidate.pdf',
        'job_title' => 'Full Stack Dev',
        'jd_text' => 'Candidate requirements',
        'status' => 'completed',
        'score' => 82,
    ]);

    $res = $this->actingAs($admin)->get(route('analyses.show', $analysis));
    $res->assertOk();
});

test('rerun with edited job description creates a new analysis and dispatches job', function () {
    Queue::fake();

    $user = User::factory()->create([
        'trial_ends_at' => now()->addDays(5),
    ]);

    $initialAnalysis = Analysis::create([
        'user_id' => $user->id,
        'resume_original_name' => 'Resume.pdf',
        'resume_path' => 'resumes/my_resume.pdf',
        'resume_text' => 'Extracted resume content with extensive PHP skills.',
        'job_title' => 'Original Role',
        'job_company' => 'Original Co',
        'jd_text' => 'Original job description text with 50+ chars of requirement details.',
        'status' => 'completed',
        'score' => 70,
    ]);

    $response = $this->actingAs($user)->post(route('analyses.rerun', $initialAnalysis), [
        'job_title' => 'Updated Lead Architect',
        'job_company' => 'New Tech Corp',
        'jd_text' => 'Updated job description with over 50 characters of specific technical competencies and expectations.',
    ]);

    $response->assertRedirect();

    // Verify a new analysis record was created
    $newAnalysis = Analysis::where('user_id', $user->id)
        ->where('id', '!=', $initialAnalysis->id)
        ->first();

    expect($newAnalysis)->not->toBeNull();
    expect($newAnalysis->job_title)->toBe('Updated Lead Architect');
    expect($newAnalysis->job_company)->toBe('New Tech Corp');
    expect($newAnalysis->resume_text)->toBe($initialAnalysis->resume_text);
    expect($newAnalysis->resume_path)->toBe($initialAnalysis->resume_path);
    expect($newAnalysis->status)->toBe('queued');

    Queue::assertPushed(ProcessAnalysisJob::class, function ($job) use ($newAnalysis) {
        return $job->analysis->id === $newAnalysis->id;
    });
});

test('rerun is denied when user quota is exhausted', function () {
    Queue::fake();

    // Expired trial user with no active subscription
    $user = User::factory()->create([
        'trial_ends_at' => now()->subDay(),
    ]);

    $analysis = Analysis::create([
        'user_id' => $user->id,
        'resume_original_name' => 'Resume.pdf',
        'resume_path' => 'resumes/sample.pdf',
        'resume_text' => 'Resume text',
        'job_title' => 'Software Engineer',
        'jd_text' => 'Job description requirements with more than 50 chars for validation.',
        'status' => 'completed',
        'score' => 75,
    ]);

    $response = $this->actingAs($user)->post(route('analyses.rerun', $analysis), [
        'job_title' => 'New Role',
        'jd_text' => 'Updated job description requirements with more than 50 chars.',
    ]);

    $response->assertRedirect(route('pricing'));
    Queue::assertNothingPushed();
});

test('retry on failed analysis resets status to queued and re-dispatches job', function () {
    Queue::fake();

    $user = User::factory()->create();

    $failedAnalysis = Analysis::create([
        'user_id' => $user->id,
        'resume_original_name' => 'Resume.pdf',
        'resume_path' => 'resumes/sample.pdf',
        'job_title' => 'Failed Job Role',
        'jd_text' => 'Requirements text',
        'status' => 'failed',
        'error_message' => 'Timeout occurred during API call.',
        'is_delayed' => true,
    ]);

    $response = $this->actingAs($user)->post(route('analyses.retry', $failedAnalysis));
    $response->assertRedirect(route('analyses.show', $failedAnalysis));

    $failedAnalysis->refresh();
    expect($failedAnalysis->status)->toBe('queued');
    expect($failedAnalysis->error_message)->toBeNull();
    expect($failedAnalysis->is_delayed)->toBeFalse();

    Queue::assertPushed(ProcessAnalysisJob::class, function ($job) use ($failedAnalysis) {
        return $job->analysis->id === $failedAnalysis->id;
    });
});

test('user can delete their own analysis and associated file is cleaned up', function () {
    $user = User::factory()->create();

    Storage::disk('local')->put('resumes/to_delete.pdf', 'dummy pdf content');

    $analysis = Analysis::create([
        'user_id' => $user->id,
        'resume_original_name' => 'Resume.pdf',
        'resume_path' => 'resumes/to_delete.pdf',
        'job_title' => 'Role to Delete',
        'jd_text' => 'JD text',
        'status' => 'completed',
        'score' => 65,
    ]);

    $response = $this->actingAs($user)->delete(route('analyses.destroy', $analysis));
    $response->assertRedirect();

    expect(Storage::disk('local')->exists('resumes/to_delete.pdf'))->toBeFalse();
    expect(Analysis::find($analysis->id))->toBeNull();
});

test('non-owner cannot delete someone elses analysis (403 forbidden)', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $analysis = Analysis::create([
        'user_id' => $owner->id,
        'resume_original_name' => 'Protected.pdf',
        'resume_path' => 'resumes/protected.pdf',
        'job_title' => 'Protected Role',
        'jd_text' => 'Protected text',
        'status' => 'completed',
    ]);

    $this->actingAs($otherUser)->delete(route('analyses.destroy', $analysis))
        ->assertForbidden();
});

test('print route renders for owner and admin, 403 for non-owner', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $admin = User::factory()->create(['role' => \App\Enums\Role::Admin]);

    $analysis = Analysis::create([
        'user_id' => $owner->id,
        'resume_original_name' => 'Resume.pdf',
        'resume_path' => 'resumes/sample.pdf',
        'job_title' => 'Printable Role',
        'jd_text' => 'Printable JD text',
        'status' => 'completed',
        'score' => 91,
    ]);

    // Owner -> 200
    $this->actingAs($owner)->get(route('analyses.print', $analysis))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Analyses/Print'));

    // Admin -> 200
    $this->actingAs($admin)->get(route('analyses.print', $analysis))
        ->assertOk();

    // Non-owner -> 403
    $this->actingAs($otherUser)->get(route('analyses.print', $analysis))
        ->assertForbidden();
});

test('show page computes score delta when comparing with a previous analysis', function () {
    $user = User::factory()->create();

    $baseline = Analysis::create([
        'user_id' => $user->id,
        'resume_original_name' => 'Resume.pdf',
        'resume_path' => 'resumes/sample.pdf',
        'job_title' => 'Junior Dev',
        'jd_text' => 'Junior dev JD',
        'status' => 'completed',
        'score' => 60,
    ]);

    $current = Analysis::create([
        'user_id' => $user->id,
        'resume_original_name' => 'Resume.pdf',
        'resume_path' => 'resumes/sample.pdf',
        'job_title' => 'Senior Dev',
        'jd_text' => 'Senior dev JD',
        'status' => 'completed',
        'score' => 78,
    ]);

    $response = $this->actingAs($user)->get(route('analyses.show', [
        'analysis' => $current->id,
        'compare' => $baseline->id,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('comparison_analysis.id', $baseline->id)
        ->where('comparison_analysis.score_delta', 18) // 78 - 60 = +18
    );
});
