<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TestVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public User $user
    ) {
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'ATS Checker - Test Verification Email',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: "<div style='font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333;'>
                <h2>ATS Checker SMTP Verification</h2>
                <p>Hello <strong>{$this->user->name}</strong>,</p>
                <p>This automated notification confirms that your platform mail delivery settings and SMTP credentials are correctly configured and operational.</p>
                <p style='color: #666; font-size: 12px; margin-top: 20px;'>Timestamp: " . now()->toDateTimeString() . "</p>
            </div>",
        );
    }
}
