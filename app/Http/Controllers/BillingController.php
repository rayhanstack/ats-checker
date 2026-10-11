<?php

namespace App\Http\Controllers;

use App\Contracts\PaymentGateway;
use App\Models\Payment;
use App\Models\Plan;
use App\Services\AccessService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    /**
     * Display billing overview, current subscription, and invoice history.
     */
    public function index(Request $request, AccessService $accessService): Response
    {
        $user = $request->user();

        $subscription = $user->activeSubscription()->with('plan')->first();
        $accessSummary = $accessService->getAccessSummary($user);

        $payments = $user->payments()
            ->with('subscription.plan')
            ->latest()
            ->get()
            ->map(function (Payment $payment) {
                return [
                    'id' => $payment->id,
                    'invoice_number' => $payment->invoice_number,
                    'amount' => $payment->formatted_amount,
                    'currency' => $payment->currency,
                    'status' => $payment->status,
                    'gateway' => ucfirst($payment->gateway),
                    'paid_at' => $payment->paid_at?->format('M d, Y h:i A'),
                    'created_at' => $payment->created_at->format('M d, Y'),
                    'plan_name' => $payment->meta['plan_name'] ?? $payment->subscription?->plan?->name ?? 'Subscription',
                ];
            });

        $plans = Plan::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(function (Plan $plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'price' => (float) $plan->price,
                    'formatted_price' => $plan->formatted_price,
                    'currency' => $plan->currency,
                    'billing_interval' => $plan->billing_interval,
                    'analyses_limit' => $plan->analyses_limit,
                    'limit_period' => $plan->limit_period,
                    'features' => $plan->features ?? [],
                    'is_featured' => (bool) $plan->is_featured,
                ];
            });

        return Inertia::render('Billing', [
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'starts_at' => $subscription->starts_at?->format('M d, Y'),
                'ends_at' => $subscription->ends_at?->format('M d, Y'),
                'gateway' => ucfirst($subscription->gateway),
                'plan' => [
                    'id' => $subscription->plan->id,
                    'name' => $subscription->plan->name,
                    'slug' => $subscription->plan->slug,
                    'price' => $subscription->plan->formatted_price,
                    'billing_interval' => $subscription->plan->billing_interval,
                ],
            ] : null,
            'accessSummary' => $accessSummary,
            'payments' => $payments,
            'plans' => $plans,
            'status' => session('status'),
            'message' => session('message'),
        ]);
    }

    /**
     * Subscribe to a plan or initiate checkout.
     */
    public function subscribe(Request $request, PaymentGateway $gateway): RedirectResponse
    {
        $validated = $request->validate([
            'plan_id' => ['required', 'exists:plans,id'],
        ]);

        $plan = Plan::query()->where('is_active', true)->findOrFail($validated['plan_id']);
        $user = $request->user();

        $result = $gateway->createCheckout($user, $plan);

        if (! empty($result['checkout_url'])) {
            return redirect()->away($result['checkout_url']);
        }

        return redirect()->route('billing')->with([
            'status' => $result['status'] ?? 'pending_manual_approval',
            'message' => $result['message'] ?? 'Payment request created successfully.',
        ]);
    }

    /**
     * Cancel current active subscription.
     */
    public function cancel(Request $request, PaymentGateway $gateway): RedirectResponse
    {
        $user = $request->user();
        $subscription = $user->activeSubscription;

        if (! $subscription) {
            return redirect()->route('billing')->withErrors([
                'error' => 'You do not have an active subscription to cancel.',
            ]);
        }

        $gateway->cancel($subscription);

        return redirect()->route('billing')->with([
            'status' => 'canceled',
            'message' => 'Your subscription has been canceled successfully.',
        ]);
    }
}
