<?php

namespace App\Notifications;

use App\Services\SettingsService;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(public string $token)
    {
    }

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
        $siteName = SettingsService::get('site_name', 'ATS Checker');
        $resetUrl = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        $hasPassword = ! empty($notifiable->password);
        $actionTitle = $hasPassword ? 'Reset Password' : 'Set Your Password';
        $subject = "{$actionTitle} - {$siteName}";

        $line = $hasPassword
            ? "You are receiving this email because we received a password reset request for your {$siteName} account."
            : "You are receiving this email to set a standard password for your {$siteName} account.";

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.auth_action', [
                'siteName' => $siteName,
                'title' => $subject,
                'greeting' => "Hello {$notifiable->name}!",
                'lines' => [
                    $line,
                    'Click the button below to proceed. This security link expires in 60 minutes.',
                ],
                'actionText' => $actionTitle,
                'actionUrl' => $resetUrl,
                'subcopy' => 'If you did not request this change, you can safely ignore this email.',
            ]);
    }
}
