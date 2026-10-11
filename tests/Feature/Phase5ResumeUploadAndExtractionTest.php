<?php

use App\Exceptions\ResumeExtractionException;
use App\Jobs\ProcessAnalysisJob;
use App\Models\Analysis;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\ResumeTextExtractor;
use App\Services\SettingsService;
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

/**
 * Generate a syntactically valid PDF with exact byte offsets.
 */
function generateValidPdf(string $text): string
{
    $eol = "\n";

    $objects = [];
    $objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    $objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
    $objects[3] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>";
    $objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

    $stream = "BT /F1 12 Tf 100 700 Td (" . addcslashes($text, "()\\") . ") Tj ET";
    $streamLen = strlen($stream);
    $objects[5] = "<< /Length {$streamLen} >>{$eol}stream{$eol}{$stream}{$eol}endstream";

    $pdf = "%PDF-1.4" . $eol;
    $offsets = [];

    foreach ($objects as $id => $content) {
        $offsets[$id] = strlen($pdf);
        $pdf .= "{$id} 0 obj{$eol}{$content}{$eol}endobj{$eol}";
    }

    $xrefOffset = strlen($pdf);
    $pdf .= "xref" . $eol;
    $pdf .= "0 " . (count($objects) + 1) . $eol;
    $pdf .= "0000000000 65535 f " . $eol;
    for ($i = 1; $i <= count($objects); $i++) {
        $pdf .= sprintf("%010d 00000 n ", $offsets[$i]) . $eol;
    }

    $pdf .= "trailer{$eol}<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>{$eol}";
    $pdf .= "startxref{$eol}{$xrefOffset}{$eol}%%EOF{$eol}";

    return $pdf;
}

/**
 * Helper to build a minimal valid DOCX file.
 */
function createValidDocxPath(string $tempPath): void
{
    $zip = new ZipArchive();
    $zip->open($tempPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' .
        '<w:body><w:p><w:r><w:t>Jane Doe Lead Architect specializing in scalable cloud systems, PHP microservices, and React frontend workflows.</w:t></w:r></w:p></w:body>' .
        '</w:document>';
    $zip->addFromString('word/document.xml', $xml);
    $zip->close();
}

test('ResumeTextExtractor extracts and normalizes text from a valid PDF', function () {
    $sampleText = 'John Doe Senior Full Stack Engineer with 8 years of production Laravel PHP React TypeScript experience.';
    $tempFile = tempnam(sys_get_temp_dir(), 'test_pdf_') . '.pdf';
    file_put_contents($tempFile, generateValidPdf($sampleText));

    $extractor = app(ResumeTextExtractor::class);
    $extracted = $extractor->extract($tempFile, 'pdf');

    unlink($tempFile);

    expect($extracted)->toContain('John Doe Senior Full Stack Engineer');
    expect($extracted)->toContain('Laravel PHP React');
});

test('ResumeTextExtractor extracts text from a valid DOCX', function () {
    $tempFile = tempnam(sys_get_temp_dir(), 'test_docx_') . '.docx';
    createValidDocxPath($tempFile);

    $extractor = app(ResumeTextExtractor::class);
    $extracted = $extractor->extract($tempFile, 'docx');

    unlink($tempFile);

    expect($extracted)->toContain('Jane Doe Lead Architect');
    expect($extracted)->toContain('PHP microservices');
});

test('ResumeTextExtractor throws exception when text is too short (image-only or scanned PDF)', function () {
    $tempFile = tempnam(sys_get_temp_dir(), 'test_short_') . '.pdf';
    file_put_contents($tempFile, generateValidPdf('Hi'));

    $extractor = app(ResumeTextExtractor::class);

    expect(fn () => $extractor->extract($tempFile, 'pdf'))
        ->toThrow(ResumeExtractionException::class, 'too little selectable text');

    unlink($tempFile);
});

test('ResumeTextExtractor throws exception for corrupted or encrypted PDF', function () {
    $tempFile = tempnam(sys_get_temp_dir(), 'test_corrupt_') . '.pdf';
    file_put_contents($tempFile, 'Corrupted not a valid pdf header content');

    $extractor = app(ResumeTextExtractor::class);

    expect(fn () => $extractor->extract($tempFile, 'pdf'))
        ->toThrow(ResumeExtractionException::class);

    unlink($tempFile);
});

test('user can view analyze page with settings config', function () {
    $user = User::factory()->create([
        'trial_ends_at' => now()->addDays(5),
        'email_verified_at' => now(),
    ]);

    $response = $this->actingAs($user)->get('/analyze');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Analyze')
        ->has('uploadConfig.maxUploadMb')
        ->has('uploadConfig.allowedFileTypes')
        ->has('uploadConfig.maxJdChars')
    );
});

test('guest cannot submit resume analysis', function () {
    $response = $this->post('/analyze', [
        'jd_text' => 'We are seeking an experienced PHP engineer with 5+ years of experience.',
    ]);

    $response->assertRedirect('/login');
});

test('user with expired trial cannot submit resume and is redirected to pricing', function () {
    $user = User::factory()->create([
        'trial_ends_at' => now()->subDay(),
        'email_verified_at' => now(),
    ]);

    $pdf = generateValidPdf('John Doe Senior Full Stack Engineer with 8 years of production Laravel PHP React TypeScript experience.');
    $file = UploadedFile::fake()->createWithContent('resume.pdf', $pdf);

    $response = $this->actingAs($user)->post('/analyze', [
        'resume' => $file,
        'jd_text' => 'We are seeking an experienced PHP engineer with 5+ years of experience.',
    ]);

    $response->assertRedirect('/pricing');
    $response->assertSessionHas('error');
});

test('submission rejects invalid file types (e.g. txt, png, exe)', function () {
    $user = User::factory()->create([
        'trial_ends_at' => now()->addDays(5),
        'email_verified_at' => now(),
    ]);

    $file = UploadedFile::fake()->create('resume.txt', 100);

    $response = $this->actingAs($user)->post('/analyze', [
        'resume' => $file,
        'jd_text' => 'We are seeking an experienced PHP engineer with 5+ years of experience in modern web frameworks.',
    ]);

    $response->assertSessionHasErrors(['resume']);
});

test('submission rejects job description shorter than 30 characters', function () {
    $user = User::factory()->create([
        'trial_ends_at' => now()->addDays(5),
        'email_verified_at' => now(),
    ]);

    $pdf = generateValidPdf('John Doe Senior Full Stack Engineer with 8 years of production Laravel PHP React TypeScript experience.');
    $file = UploadedFile::fake()->createWithContent('resume.pdf', $pdf);

    $response = $this->actingAs($user)->post('/analyze', [
        'resume' => $file,
        'jd_text' => 'Too short.',
    ]);

    $response->assertSessionHasErrors(['jd_text']);
});

test('valid PDF resume submission creates queued analysis and dispatches job', function () {
    Queue::fake();

    $user = User::factory()->create([
        'trial_ends_at' => now()->addDays(5),
        'email_verified_at' => now(),
    ]);

    $pdf = generateValidPdf('John Doe Senior Full Stack Engineer with 8 years of production Laravel PHP React TypeScript experience.');
    $file = UploadedFile::fake()->createWithContent('My_Resume.pdf', $pdf);

    $response = $this->actingAs($user)->post('/analyze', [
        'resume' => $file,
        'job_title' => 'Senior Laravel Engineer',
        'job_company' => 'Acme Corporation',
        'jd_text' => 'We are looking for a Senior Laravel Engineer to lead backend architecture and build performant APIs.',
    ]);

    $analysis = Analysis::where('user_id', $user->id)->first();
    expect($analysis)->not->toBeNull();
    expect($analysis->resume_original_name)->toBe('My_Resume.pdf');
    expect($analysis->status)->toBe('queued');
    expect($analysis->job_title)->toBe('Senior Laravel Engineer');
    expect($analysis->job_company)->toBe('Acme Corporation');
    expect($analysis->resume_text)->toContain('John Doe Senior Full Stack Engineer');

    // Stored on private local disk with randomized name
    expect($analysis->resume_path)->not->toBe('My_Resume.pdf');
    Storage::disk('local')->assertExists($analysis->resume_path);

    $response->assertRedirect(route('analyses.show', $analysis));

    Queue::assertPushed(ProcessAnalysisJob::class, function ($job) use ($analysis) {
        return $job->analysis->id === $analysis->id;
    });
});

test('valid DOCX resume submission succeeds and stores extracted text', function () {
    Queue::fake();

    $user = User::factory()->create([
        'trial_ends_at' => now()->addDays(5),
        'email_verified_at' => now(),
    ]);

    $tempFile = tempnam(sys_get_temp_dir(), 'test_upload_') . '.docx';
    createValidDocxPath($tempFile);
    $file = new UploadedFile($tempFile, 'Jane_Doe_CV.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', null, true);

    $response = $this->actingAs($user)->post('/analyze', [
        'resume' => $file,
        'job_title' => 'Lead Architect',
        'jd_text' => 'Seeking a lead software architect with deep microservice design and modern React/PHP background.',
    ]);

    unlink($tempFile);

    $analysis = Analysis::where('user_id', $user->id)->first();
    expect($analysis)->not->toBeNull();
    expect($analysis->resume_original_name)->toBe('Jane_Doe_CV.docx');
    expect($analysis->resume_text)->toContain('Jane Doe Lead Architect');
    expect($analysis->status)->toBe('queued');

    $response->assertRedirect(route('analyses.show', $analysis));
});

test('submissions are throttled per user after reaching limit', function () {
    Queue::fake();

    $user = User::factory()->create([
        'trial_ends_at' => now()->addDays(5),
        'email_verified_at' => now(),
    ]);

    SettingsService::set('analysis_throttle_per_hour', 2);

    $pdf = generateValidPdf('John Doe Senior Full Stack Engineer with 8 years of production Laravel PHP React TypeScript experience.');

    // 1st request succeeds
    $file1 = UploadedFile::fake()->createWithContent('resume1.pdf', $pdf);
    $res1 = $this->actingAs($user)->post('/analyze', [
        'resume' => $file1,
        'jd_text' => 'We are seeking an experienced PHP engineer with 5+ years of experience in modern web frameworks.',
    ]);
    $res1->assertSessionHasNoErrors();
    $res1->assertRedirect();

    // 2nd request succeeds
    $file2 = UploadedFile::fake()->createWithContent('resume2.pdf', $pdf);
    $res2 = $this->actingAs($user)->post('/analyze', [
        'resume' => $file2,
        'jd_text' => 'We are seeking an experienced PHP engineer with 5+ years of experience in modern web frameworks.',
    ]);
    $res2->assertSessionHasNoErrors();
    $res2->assertRedirect();

    // 3rd request should be throttled (HTTP 429)
    $file3 = UploadedFile::fake()->createWithContent('resume3.pdf', $pdf);
    $res3 = $this->actingAs($user)->post('/analyze', [
        'resume' => $file3,
        'jd_text' => 'We are seeking an experienced PHP engineer with 5+ years of experience in modern web frameworks.',
    ]);
    $res3->assertStatus(429);
});

test('ProcessAnalysisJob updates analysis status to completed', function () {
    $user = User::factory()->create();

    $analysis = Analysis::create([
        'user_id' => $user->id,
        'resume_original_name' => 'Resume.pdf',
        'resume_path' => 'resumes/fake.pdf',
        'resume_text' => 'Sample extracted resume text for analysis.',
        'job_title' => 'Engineer',
        'jd_text' => 'Sample job description text.',
        'status' => 'queued',
    ]);

    $job = new ProcessAnalysisJob($analysis);
    $job->handle(app(ResumeTextExtractor::class));

    $analysis->refresh();
    expect($analysis->status)->toBe('completed');
    expect($analysis->completed_at)->not->toBeNull();
});
