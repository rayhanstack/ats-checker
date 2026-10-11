<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactRequest;
use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use App\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    /**
     * Show the contact page.
     */
    public function create(): Response
    {
        return Inertia::render('Contact', [
            'contactInfo' => [
                'email' => SettingsService::get('contact_email', 'support@atschecker.local'),
                'phone' => SettingsService::get('contact_phone', '+1 (555) 019-2834'),
                'address' => SettingsService::get('contact_address', '100 Innovation Way, Suite 400, San Francisco, CA'),
                'socialLinks' => SettingsService::get('social_links', []),
            ],
        ]);
    }

    /**
     * Handle incoming contact inquiry submission.
     */
    public function store(ContactRequest $request): RedirectResponse
    {
        $contactMessage = ContactMessage::create([
            'name' => $request->name,
            'email' => $request->email,
            'subject' => $request->subject,
            'message' => $request->message,
            'status' => 'new',
            'ip' => $request->ip(),
        ]);

        $recipient = SettingsService::get('contact_email', 'support@atschecker.local');

        try {
            Mail::to($recipient)->send(new ContactMessageReceived($contactMessage));
        } catch (\Throwable $e) {
            Log::error('Failed to dispatch contact message email: ' . $e->getMessage(), [
                'contact_message_id' => $contactMessage->id,
            ]);
        }

        return redirect()->back()->with('success', 'Thank you for contacting us! Your inquiry has been received, and our team will respond shortly.');
    }
}
