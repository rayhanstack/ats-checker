<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    /**
     * Display a paginated listing of candidate subscriptions.
     */
    public function index(Request $request): Response
    {
        $query = Subscription::with(['user', 'plan'])->latest();

        // 1. Search (Candidate name, email, plan name)
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhereHas('plan', function ($pq) use ($search) {
                    $pq->where('name', 'like', "%{$search}%");
                });
            });
        }

        // 2. Status filter
        if ($status = $request->string('status')->toString()) {
            if (in_array($status, ['active', 'trialing', 'past_due', 'canceled', 'expired'])) {
                $query->where('status', $status);
            }
        }

        // 3. Plan filter
        if ($planId = $request->integer('plan_id')) {
            $query->where('plan_id', $planId);
        }

        $subscriptions = $query->paginate(15)
            ->withQueryString()
            ->through(fn (Subscription $sub) => [
                'id' => $sub->id,
                'user' => $sub->user ? [
                    'id' => $sub->user->id,
                    'name' => $sub->user->name,
                    'email' => $sub->user->email,
                ] : null,
                'plan' => $sub->plan ? [
                    'id' => $sub->plan->id,
                    'name' => $sub->plan->name,
                    'formatted_price' => $sub->plan->formatted_price,
                    'billing_interval' => $sub->plan->billing_interval,
                ] : null,
                'status' => $sub->status,
                'gateway' => $sub->gateway,
                'gateway_subscription_id' => $sub->gateway_subscription_id,
                'starts_at' => $sub->starts_at?->format('M j, Y'),
                'ends_at' => $sub->ends_at?->format('M j, Y') ?? 'Ongoing',
                'canceled_at' => $sub->canceled_at?->format('M j, Y • g:i A'),
                'created_at' => $sub->created_at->toISOString(),
                'formatted_date' => $sub->created_at->format('M j, Y'),
            ]);

        $plans = Plan::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Subscriptions/Index', [
            'subscriptions' => $subscriptions,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status', 'all')->toString(),
                'plan_id' => $request->string('plan_id')->toString(),
            ],
            'plans' => $plans,
            'stats' => [
                'total' => Subscription::count(),
                'active' => Subscription::where('status', 'active')->count(),
                'trialing' => Subscription::where('status', 'trialing')->count(),
                'canceled' => Subscription::where('status', 'canceled')->count(),
            ],
        ]);
    }

    /**
     * Update the status of a subscription manually.
     */
    public function updateStatus(Request $request, Subscription $subscription): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'trialing', 'past_due', 'canceled', 'expired'])],
        ]);

        $newStatus = $validated['status'];
        $oldStatus = $subscription->status;

        $updates = ['status' => $newStatus];

        if ($newStatus === 'canceled' && ! $subscription->canceled_at) {
            $updates['canceled_at'] = now();
        } elseif ($newStatus === 'active') {
            $updates['canceled_at'] = null;
            if (! $subscription->starts_at) {
                $updates['starts_at'] = now();
            }
        }

        $subscription->update($updates);

        AuditLogger::log('subscription.update_status', $subscription, [
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'user_id' => $subscription->user_id,
            'plan_id' => $subscription->plan_id,
        ]);

        return back()->with('success', "Subscription #{$subscription->id} status updated to {$newStatus}.");
    }

    /**
     * Cancel a subscription manually.
     */
    public function cancel(Subscription $subscription): RedirectResponse
    {
        $subscription->update([
            'status' => 'canceled',
            'canceled_at' => now(),
        ]);

        AuditLogger::log('subscription.cancel', $subscription, [
            'user_id' => $subscription->user_id,
            'plan_id' => $subscription->plan_id,
        ]);

        return back()->with('success', "Subscription #{$subscription->id} has been canceled.");
    }
}
