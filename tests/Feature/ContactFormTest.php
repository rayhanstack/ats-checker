<?php

use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use App\Services\SettingsService;
use Database\Seeders\SettingSeeder;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    $this->seed(SettingSeeder::class);
});

test('contact page renders with settings contact details', function () {
    $response = $this->get(route('contact'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Contact')
        ->has('contactInfo')
        ->where('contactInfo.email', SettingsService::get('contact_email'))
    );
});

test('valid contact form submission saves message to database and sends notification mail', function () {
    Mail::fake();

    $response = $this->post(route('contact.store'), [
        'name' => 'Jane Candidate',
        'email' => 'jane@example.com',
        'subject' => 'Resume format question',
        'message' => 'Hello, I have a question regarding standard ATS margins and fonts.',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('contact_messages', [
        'name' => 'Jane Candidate',
        'email' => 'jane@example.com',
        'subject' => 'Resume format question',
        'status' => 'new',
    ]);

    Mail::assertSent(ContactMessageReceived::class, function ($mail) {
        return $mail->hasTo(SettingsService::get('contact_email'));
    });
});

test('honeypot field triggers validation failure and prevents spam submission', function () {
    Mail::fake();

    $response = $this->post(route('contact.store'), [
        'name' => 'Bot Spammer',
        'email' => 'bot@spammer.com',
        'subject' => 'Cheap SEO Services',
        'message' => 'Buy backlinks now',
        'honeypot' => 'http://spam-link.com', // Filled honeypot
    ]);

    $response->assertSessionHasErrors(['honeypot']);

    $this->assertDatabaseMissing('contact_messages', [
        'email' => 'bot@spammer.com',
    ]);

    Mail::assertNothingSent();
});

test('contact form endpoint is throttled', function () {
    Mail::fake();

    $payload = [
        'name' => 'Repeated Submitter',
        'email' => 'repeated@example.com',
        'subject' => 'Throttling test',
        'message' => 'Testing rate limiting behavior',
    ];

    // Submit 5 requests within the limit
    for ($i = 0; $i < 5; $i++) {
        $res = $this->post(route('contact.store'), $payload);
        $res->assertSessionHas('success');
    }

    // The 6th request should be throttled (HTTP 429 Too Many Requests)
    $response = $this->post(route('contact.store'), $payload);
    $response->assertStatus(429);
});
