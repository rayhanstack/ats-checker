<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a paginated listing of users with search, filters, and sorting.
     */
    public function index(Request $request): Response
    {
        $query = User::with('activeSubscription.plan');

        // 1. Search (name, email)
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // 2. Role filter
        if ($role = $request->string('role')->toString()) {
            if (in_array($role, ['admin', 'user'])) {
                $query->where('role', $role);
            }
        }

        // 3. Status filter
        if ($status = $request->string('status')->toString()) {
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // 4. Plan state filter
        if ($planState = $request->string('plan_state')->toString()) {
            if ($planState === 'trial') {
                $query->where('trial_ends_at', '>', now());
            } elseif ($planState === 'active') {
                $query->whereHas('subscriptions', function ($q) {
                    $q->where('status', 'active');
                });
            } elseif ($planState === 'expired') {
                $query->where(function ($q) {
                    $q->where(function ($sq) {
                        $sq->whereNull('trial_ends_at')->orWhere('trial_ends_at', '<=', now());
                    })->whereDoesntHave('subscriptions', function ($sq) {
                        $sq->where('status', 'active');
                    });
                });
            }
        }

        // Sorting
        $sortField = $request->string('sort', 'created_at')->toString();
        $sortDir = $request->string('direction', 'desc')->toString() === 'asc' ? 'asc' : 'desc';

        if (in_array($sortField, ['name', 'email', 'created_at', 'role'])) {
            $query->orderBy($sortField, $sortDir);
        } else {
            $query->latest();
        }

        $users = $query->paginate(12)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'is_active' => (bool) $user->is_active,
                'has_password' => $user->hasPassword(),
                'trial_ends_at' => $user->trial_ends_at?->toISOString(),
                'has_active_trial' => $user->hasActiveTrial(),
                'plan_name' => $user->activeSubscription?->plan?->name ?? ($user->hasActiveTrial() ? 'Trial' : 'None'),
                'created_at' => $user->created_at->toISOString(),
                'formatted_date' => $user->created_at->format('M j, Y'),
            ]);

        $availablePlans = Plan::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'price', 'billing_interval']);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'role' => $request->string('role', 'all')->toString(),
                'status' => $request->string('status', 'all')->toString(),
                'plan_state' => $request->string('plan_state', 'all')->toString(),
                'sort' => $sortField,
                'direction' => $sortDir,
            ],
            'available_plans' => $availablePlans,
            'stats' => [
                'total' => User::count(),
                'admins' => User::where('role', Role::Admin)->count(),
                'trials' => User::where('trial_ends_at', '>', now())->count(),
            ],
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['admin', 'user'])],
            'is_active' => ['boolean'],
            'trial_days' => ['nullable', 'integer', 'min:0', 'max:365'],
        ]);

        $trialDays = $validated['trial_days'] ?? 7;
        $trialEndsAt = $trialDays > 0 ? now()->addDays($trialDays) : null;

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => Role::from($validated['role']),
            'is_active' => $request->boolean('is_active', true),
            'trial_ends_at' => $trialEndsAt,
            'email_verified_at' => now(),
        ]);

        AuditLogger::log('user.create', $user, [
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
            'trial_days' => $trialDays,
        ]);

        return back()->with('success', "User {$user->name} has been successfully created.");
    }

    /**
     * Display detailed profile, subscription history, and analyses for a user.
     */
    public function show(User $user): Response
    {
        $user->load([
            'subscriptions.plan',
            'payments.subscription.plan',
            'analyses' => fn ($q) => $q->latest()->take(10),
        ]);

        $availablePlans = Plan::where('is_active', true)->orderBy('sort_order')->get();

        return Inertia::render('Admin/Users/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'is_active' => (bool) $user->is_active,
                'trial_ends_at' => $user->trial_ends_at?->toISOString(),
                'has_active_trial' => $user->hasActiveTrial(),
                'email_verified_at' => $user->email_verified_at?->toISOString(),
                'last_login_at' => $user->last_login_at?->toISOString(),
                'created_at' => $user->created_at->toISOString(),
                'formatted_date' => $user->created_at->format('F j, Y • g:i A'),
                'active_plan' => $user->activeSubscription?->plan?->name ?? ($user->hasActiveTrial() ? 'Free Trial' : 'No Active Plan'),
            ],
            'subscriptions' => $user->subscriptions->map(fn ($sub) => [
                'id' => $sub->id,
                'plan_name' => $sub->plan?->name ?? 'Custom Plan',
                'status' => $sub->status,
                'gateway' => $sub->gateway,
                'starts_at' => $sub->starts_at?->format('M j, Y'),
                'ends_at' => $sub->ends_at?->format('M j, Y') ?? 'Never (Lifetime)',
                'created_at' => $sub->created_at->format('M j, Y'),
            ]),
            'payments' => $user->payments->map(fn ($pay) => [
                'id' => $pay->id,
                'amount' => $pay->amount,
                'currency' => $pay->currency,
                'status' => $pay->status,
                'gateway' => $pay->gateway,
                'invoice_number' => $pay->invoice_number,
                'paid_at' => $pay->paid_at?->format('M j, Y • g:i A'),
            ]),
            'analyses' => $user->analyses->map(fn ($an) => [
                'id' => $an->id,
                'resume_name' => $an->resume_original_name,
                'job_title' => $an->job_title,
                'score' => $an->score,
                'status' => $an->status,
                'tokens_in' => $an->tokens_in,
                'tokens_out' => $an->tokens_out,
                'formatted_date' => $an->created_at->format('M j, Y • g:i A'),
            ]),
            'usage' => [
                'total_analyses' => $user->analyses()->count(),
                'completed_analyses' => $user->analyses()->where('status', 'completed')->count(),
                'total_tokens_used' => (int) $user->analyses()->sum('tokens_in') + (int) $user->analyses()->sum('tokens_out'),
            ],
            'available_plans' => $availablePlans,
        ]);
    }

    /**
     * Update user details (name, email, role) with safety protections.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', Rule::in(['admin', 'user'])],
        ]);

        $admin = $request->user();

        // Safety 1: Cannot demote self
        if ($user->id === $admin->id && $validated['role'] !== 'admin') {
            throw ValidationException::withMessages([
                'role' => 'You cannot demote yourself from the admin role.',
            ]);
        }

        // Safety 2: Last admin protection
        if ($user->role === Role::Admin && $validated['role'] !== 'admin') {
            $activeAdminCount = User::where('role', Role::Admin)->where('is_active', true)->count();
            if ($activeAdminCount <= 1) {
                throw ValidationException::withMessages([
                    'role' => 'Cannot demote the last remaining active admin in the system.',
                ]);
            }
        }

        $oldRole = $user->role->value;
        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => Role::from($validated['role']),
        ]);

        AuditLogger::log('user.update', $user, [
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
            'role_changed' => $oldRole !== $user->role->value,
        ]);

        return back()->with('success', "User details for {$user->name} have been updated.");
    }

    /**
     * Toggle active/inactive status with safety protections.
     */
    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        $admin = $request->user();

        // Safety 1: Cannot deactivate self
        if ($user->id === $admin->id) {
            return back()->with('error', 'You cannot deactivate your own admin account.');
        }

        // Safety 2: Cannot deactivate the last remaining admin
        if ($user->role === Role::Admin && $user->is_active) {
            $activeAdminCount = User::where('role', Role::Admin)->where('is_active', true)->count();
            if ($activeAdminCount <= 1) {
                return back()->with('error', 'Cannot deactivate the last remaining active admin in the system.');
            }
        }

        $user->update([
            'is_active' => ! $user->is_active,
        ]);

        AuditLogger::log('user.toggle_status', $user, [
            'is_active' => $user->is_active,
        ]);

        $statusStr = $user->is_active ? 'activated' : 'deactivated';
        return back()->with('success', "User {$user->name} has been {$statusStr}.");
    }

    /**
     * Extend user trial by +N days.
     */
    public function extendTrial(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'days' => ['required', 'integer', 'min:1', 'max:365'],
        ]);

        $days = (int) $validated['days'];
        $baseDate = ($user->trial_ends_at && $user->trial_ends_at->isFuture())
            ? $user->trial_ends_at
            : now();

        $newTrialEnd = $baseDate->copy()->addDays($days);
        $user->update(['trial_ends_at' => $newTrialEnd]);

        AuditLogger::log('user.extend_trial', $user, [
            'days_added' => $days,
            'new_trial_ends_at' => $newTrialEnd->toISOString(),
        ]);

        return back()->with('success', "Added {$days} days to {$user->name}'s trial (now ends {$newTrialEnd->format('M j, Y')}).");
    }

    /**
     * Assign a plan manually to the user (creates an active subscription).
     */
    public function assignPlan(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'plan_id' => ['required', 'exists:plans,id'],
            'duration_days' => ['nullable', 'integer', 'min:1', 'max:3650'],
        ]);

        $plan = Plan::findOrFail($validated['plan_id']);

        // Cancel previous active subscriptions
        $user->subscriptions()->where('status', 'active')->update(['status' => 'canceled', 'canceled_at' => now()]);

        $durationDays = $validated['duration_days'] ?? null;
        $endsAt = $durationDays
            ? now()->addDays($durationDays)
            : ($plan->billing_interval === 'month' ? now()->addMonth() : ($plan->billing_interval === 'year' ? now()->addYear() : null));

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => $endsAt,
            'gateway' => 'manual',
            'meta' => ['assigned_by_admin' => $request->user()->id],
        ]);

        AuditLogger::log('user.assign_plan', $user, [
            'plan_id' => $plan->id,
            'plan_name' => $plan->name,
            'subscription_id' => $subscription->id,
            'ends_at' => $endsAt?->toISOString(),
        ]);

        return back()->with('success', "Assigned {$plan->name} plan to {$user->name}.");
    }

    /**
     * Reset user password (manual new password or send reset link).
     */
    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'mode' => ['required', Rule::in(['link', 'manual'])],
            'password' => ['nullable', 'string', 'min:8', 'required_if:mode,manual'],
        ]);

        if ($validated['mode'] === 'manual') {
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);

            AuditLogger::log('user.password_reset', $user, ['mode' => 'manual']);

            return back()->with('success', "Password for {$user->name} has been manually updated.");
        }

        // Send reset link
        Password::broker()->sendResetLink(['email' => $user->email]);

        AuditLogger::log('user.password_reset', $user, ['mode' => 'link']);

        return back()->with('success', "Password reset link sent to {$user->email}.");
    }

    /**
     * Delete user account with last-admin and self-deletion protections.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        $admin = $request->user();

        // Safety 1: Cannot delete self
        if ($user->id === $admin->id) {
            return back()->with('error', 'You cannot delete your own admin account.');
        }

        // Safety 2: Cannot delete the last remaining admin
        if ($user->role === Role::Admin) {
            $adminCount = User::where('role', Role::Admin)->count();
            if ($adminCount <= 1) {
                return back()->with('error', 'Cannot delete the last remaining admin in the system.');
            }
        }

        AuditLogger::log('user.delete', $user, [
            'deleted_user_name' => $user->name,
            'deleted_user_email' => $user->email,
        ]);

        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', "User {$user->name} has been deleted.");
    }
}
