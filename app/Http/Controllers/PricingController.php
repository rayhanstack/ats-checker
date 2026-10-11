<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Services\AccessService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PricingController extends Controller
{
    /**
     * Display the pricing plans page.
     */
    public function index(Request $request, AccessService $accessService): Response
    {
        $user = $request->user();

        $plans = Plan::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Plan $plan) => [
                'id' => (string) $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'price' => (float) $plan->price,
                'formatted_price' => $plan->formatted_price,
                'currency' => $plan->currency,
                'billing_interval' => $plan->billing_interval,
                'analyses_limit' => $plan->analyses_limit,
                'limit_period' => $plan->limit_period,
                'description' => $plan->description ?? '',
                'features' => $plan->features ?? [],
                'is_featured' => (bool) $plan->is_featured,
                'is_unlimited' => $plan->isUnlimited(),
            ]);

        $currentPlan = $user ? $accessService->currentPlan($user) : null;

        return Inertia::render('Pricing', [
            'plans' => $plans,
            'currentPlanSlug' => $currentPlan?->slug,
            'isAuthenticated' => (bool) $user,
        ]);
    }
}
