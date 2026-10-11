<?php

namespace App\Notifications;

use App\Services\SettingsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends Notification
{
    use Queueable;

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);
        $siteName = SettingsService::get('site_name', 'ATS Checker');

        return (new MailMessage)
            ->subject("Verify Your Email Address - {$siteName}")
            ->view('emails.auth_action', [
                'siteName' => $siteName,
                'title' => "Verify Your Email Address - {$siteName}",
                'greeting' => "Hello {$notifiable->name}!",
                'lines' => [
                    "Thank you for registering with {$siteName}. Your 7-day free trial is active!",
                    'Please click the button below to verify your email address and unlock resume uploads and AI analysis.',
                ],
                'actionText' => 'Verify Email Address',
                'actionUrl' => $verificationUrl,
                'subcopy' => 'If you did not create an account with us, no further action is required.',
            ]);
    }

    /**
     * Get the verification URL for the given notifiable.
     */
    protected function verificationUrl(object $notifiable): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
    }
}
