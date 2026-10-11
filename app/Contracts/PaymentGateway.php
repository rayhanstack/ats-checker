<?php

namespace App\Contracts;

use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;

interface PaymentGateway
{
    /**
     * Create checkout or initiate subscription payment process.
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
    public function createCheckout(User $user, Plan $plan, array $options = []): array;

    /**
     * Handle incoming webhook payloads from gateway.
     *
     * @param array<string, mixed> $payload
     * @return bool
     */
    public function handleWebhook(array $payload): bool;

    /**
     * Cancel an active or pending subscription.
     *
     * @param Subscription $subscription
     * @return bool
     */
    public function cancel(Subscription $subscription): bool;

    /**
     * Process a refund for a payment.
     *
     * @param Payment $payment
     * @return bool
     */
    public function refund(Payment $payment): bool;
}
