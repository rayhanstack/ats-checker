<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PricingController extends Controller
{
    /**
     * Display the pricing plans page.
     */
    public function index(Request $request): Response
    {
        $plans = Plan::query()
            ->where('is_active', true)
            ->where('interval', '!=', 'trial')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Plan $plan) => [
                'id' => (string) $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'price' => $plan->formatted_price,
                'period' => $plan->interval === 'year' ? '/ year' : '/ month',
                'description' => $plan->description ?? '',
                'features' => $plan->features ?? [],
                'popular' => (bool) $plan->is_popular,
                'cta_text' => 'Choose ' . $plan->name,
                'cta_link' => route('register'),
            ]);

        return Inertia::render('Pricing', [
            'plans' => $plans,
        ]);
    }
}
