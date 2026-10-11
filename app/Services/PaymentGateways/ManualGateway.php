<?php

namespace App\Services\PaymentGateways;

use App\Contracts\PaymentGateway;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Str;

class ManualGateway implements PaymentGateway
{
    /**
     * Create checkout / record manual pending payment.
     *
     * @param User $user
     * @param Plan $plan
     * @param array<string, mixed> $options
     * @return array{
     *     success: bool,
     *     payment?: Payment,
     *     subscription?: Subscription,
     *     checkout_url?: string|null,
     *     status: string,
     *     message: string,
     *     meta?: array<string, mixed>
     * }
     */
    public function createCheckout(User $user, Plan $plan, array $options = []): array
    {
        // For free plan, immediately assign or update subscription
        if ($plan->slug === 'free' || (float) $plan->price <= 0) {
            $subscription = Subscription::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'status' => 'active',
                ],
                [
                    'plan_id' => $plan->id,
                    'starts_at' => now(),
                    'ends_at' => $user->trial_ends_at ?: now()->addDays(7),
                    'gateway' => 'manual',
                    'meta' => ['auto_assigned' => true, 'slug' => 'free'],
                ]
            );

            return [
                'success' => true,
                'subscription' => $subscription,
                'checkout_url' => null,
                'status' => 'active',
                'message' => 'Free plan activated successfully.',
            ];
        }

        // Create subscription in past_due / trialing status awaiting manual confirmation
        $subscription = Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => $user->hasActiveTrial() ? 'trialing' : 'past_due',
            'starts_at' => now(),
            'ends_at' => $plan->billing_interval === 'year' ? now()->addYear() : now()->addMonth(),
            'gateway' => 'manual',
            'meta' => [
                'plan_name' => $plan->name,
                'billing_interval' => $plan->billing_interval,
                'notes' => 'Awaiting admin manual verification or online payment gateway activation.',
            ],
        ]);

        $invoiceNumber = 'INV-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));

        $payment = Payment::create([
            'user_id' => $user->id,
            'subscription_id' => $subscription->id,
            'amount' => $plan->price,
            'currency' => $plan->currency ?? 'USD',
            'status' => 'pending',
            'gateway' => 'manual',
            'gateway_payment_id' => 'MAN-' . strtoupper(Str::random(10)),
            'invoice_number' => $invoiceNumber,
            'paid_at' => null,
            'meta' => array_merge([
                'plan_id' => $plan->id,
                'plan_name' => $plan->name,
                'plan_slug' => $plan->slug,
                'billing_interval' => $plan->billing_interval,
            ], $options),
        ]);

        return [
            'success' => true,
            'payment' => $payment,
            'subscription' => $subscription,
            'checkout_url' => null,
            'status' => 'pending_manual_approval',
            'message' => 'Payment gateway coming soon. Your request has been recorded. Please contact support or await admin activation.',
            'meta' => [
                'invoice_number' => $invoiceNumber,
            ],
        ];
    }

    /**
     * Handle incoming webhooks (e.g. for Stripe, bKash, etc. in future implementations).
     *
     * @param array<string, mixed> $payload
     * @return bool
     */
    public function handleWebhook(array $payload): bool
    {
        return true;
    }

    /**
     * Cancel subscription.
     *
     * @param Subscription $subscription
     * @return bool
     */
    public function cancel(Subscription $subscription): bool
    {
        return (bool) $subscription->update([
            'status' => 'canceled',
            'canceled_at' => now(),
        ]);
    }

    /**
     * Process refund.
     *
     * @param Payment $payment
     * @return bool
     */
    public function refund(Payment $payment): bool
    {
        $updated = (bool) $payment->update([
            'status' => 'refunded',
        ]);

        if ($updated && $payment->subscription) {
            $payment->subscription->update([
                'status' => 'canceled',
                'canceled_at' => now(),
            ]);
        }

        return $updated;
    }

    /**
     * Admin action: manually mark payment as paid and activate the subscription.
     *
     * @param Payment $payment
     * @return bool
     */
    public function markAsPaid(Payment $payment): bool
    {
        $payment->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        if ($payment->subscription) {
            $plan = $payment->subscription->plan;
            $interval = $plan?->billing_interval ?? 'month';
            $endsAt = $interval === 'year' ? now()->addYear() : now()->addMonth();

            $payment->subscription->update([
                'status' => 'active',
                'starts_at' => now(),
                'ends_at' => $endsAt,
                'canceled_at' => null,
            ]);
        }

        return true;
    }
}
