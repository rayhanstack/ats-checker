<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    /**
     * Display a listing of subscription and trial plans.
     */
    public function index(): Response
    {
        $plans = Plan::withCount([
            'subscriptions as active_subscribers_count' => fn ($q) => $q->where('status', 'active'),
            'subscriptions as total_subscriptions_count',
        ])
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Plan $plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'description' => $plan->description,
                'price' => (float) $plan->price,
                'formatted_price' => $plan->formatted_price,
                'currency' => $plan->currency,
                'billing_interval' => $plan->billing_interval,
                'analyses_limit' => $plan->analyses_limit,
                'limit_period' => $plan->limit_period,
                'features' => $plan->features ?? [],
                'is_active' => (bool) $plan->is_active,
                'is_featured' => (bool) $plan->is_featured,
                'sort_order' => $plan->sort_order,
                'active_subscribers_count' => $plan->active_subscribers_count,
                'total_subscriptions_count' => $plan->total_subscriptions_count,
            ]);

        return Inertia::render('Admin/Plans/Index', [
            'plans' => $plans,
        ]);
    }

    /**
     * Store a newly created plan.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:plans,slug'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'billing_interval' => ['required', Rule::in(['none', 'month', 'year'])],
            'analyses_limit' => ['nullable', 'integer'],
            'limit_period' => ['required', Rule::in(['trial', 'month', 'year'])],
            'features' => ['required', 'array'],
            'features.*' => ['string'],
            'is_active' => ['boolean'],
            'is_featured' => ['boolean'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['is_featured'] = $request->boolean('is_featured', false);
        $validated['sort_order'] = $validated['sort_order'] ?? 0;

        $plan = Plan::create($validated);
        \Illuminate\Support\Facades\Cache::forget('pricing:plans');

        AuditLogger::log('plan.create', $plan, [
            'name' => $plan->name,
            'slug' => $plan->slug,
            'price' => $plan->price,
        ]);

        return back()->with('success', "Plan '{$plan->name}' has been created successfully.");
    }

    /**
     * Update the specified plan.
     */
    public function update(Request $request, Plan $plan): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('plans')->ignore($plan->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'billing_interval' => ['required', Rule::in(['none', 'month', 'year'])],
            'analyses_limit' => ['nullable', 'integer'],
            'limit_period' => ['required', Rule::in(['trial', 'month', 'year'])],
            'features' => ['required', 'array'],
            'features.*' => ['string'],
            'is_active' => ['boolean'],
            'is_featured' => ['boolean'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['is_featured'] = $request->boolean('is_featured', false);

        $plan->update($validated);
        \Illuminate\Support\Facades\Cache::forget('pricing:plans');

        AuditLogger::log('plan.update', $plan, [
            'name' => $plan->name,
            'slug' => $plan->slug,
            'price' => $plan->price,
        ]);

        return back()->with('success', "Plan '{$plan->name}' has been updated.");
    }

    /**
     * Remove the specified plan (blocked if active subscribers exist).
     */
    public function destroy(Plan $plan): RedirectResponse
    {
        $activeSubscribersCount = $plan->subscriptions()->where('status', 'active')->count();

        if ($activeSubscribersCount > 0) {
            return back()->with('error', "Cannot delete plan '{$plan->name}' because it has {$activeSubscribersCount} active subscribers. Deactivate it instead.");
        }

        AuditLogger::log('plan.delete', $plan, [
            'name' => $plan->name,
            'slug' => $plan->slug,
        ]);

        $plan->delete();
        \Illuminate\Support\Facades\Cache::forget('pricing:plans');

        return back()->with('success', "Plan '{$plan->name}' has been deleted.");
    }
}
