<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    /**
     * Display a listing of payments and invoices.
     */
    public function index(Request $request): Response
    {
        $query = Payment::with(['user', 'subscription.plan'])->latest();

        // 1. Search (Candidate name, email, invoice number)
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        // 2. Status filter
        if ($status = $request->string('status')->toString()) {
            if (in_array($status, ['pending', 'paid', 'failed', 'refunded'])) {
                $query->where('status', $status);
            }
        }

        // 3. Gateway filter
        if ($gateway = $request->string('gateway')->toString()) {
            if ($gateway !== 'all') {
                $query->where('gateway', $gateway);
            }
        }

        $payments = $query->paginate(15)
            ->withQueryString()
            ->through(fn (Payment $pay) => [
                'id' => $pay->id,
                'user' => $pay->user ? [
                    'id' => $pay->user->id,
                    'name' => $pay->user->name,
                    'email' => $pay->user->email,
                ] : null,
                'plan_name' => $pay->subscription?->plan?->name ?? 'Custom Service',
                'amount' => (float) $pay->amount,
                'formatted_amount' => $pay->formatted_amount,
                'currency' => $pay->currency,
                'status' => $pay->status,
                'gateway' => $pay->gateway,
                'invoice_number' => $pay->invoice_number,
                'paid_at' => $pay->paid_at?->format('M j, Y • g:i A'),
                'created_at' => $pay->created_at->toISOString(),
                'formatted_date' => $pay->created_at->format('M j, Y'),
            ]);

        $totalRevenue = Payment::where('status', 'paid')->sum('amount');

        return Inertia::render('Admin/Payments/Index', [
            'payments' => $payments,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status', 'all')->toString(),
                'gateway' => $request->string('gateway', 'all')->toString(),
            ],
            'stats' => [
                'total_count' => Payment::count(),
                'paid_count' => Payment::where('status', 'paid')->count(),
                'pending_count' => Payment::where('status', 'pending')->count(),
                'refunded_count' => Payment::where('status', 'refunded')->count(),
                'total_revenue' => (float) $totalRevenue,
            ],
        ]);
    }

    /**
     * Mark a pending payment as paid (Manual gateway flow) and activate subscription.
     */
    public function markPaid(Payment $payment): RedirectResponse
    {
        $invoiceNumber = $payment->invoice_number ?: ('INV-' . date('Ymd') . '-' . strtoupper(Str::random(6)));

        $payment->update([
            'status' => 'paid',
            'paid_at' => now(),
            'invoice_number' => $invoiceNumber,
        ]);

        // Activate associated subscription if present
        if ($payment->subscription && $payment->subscription->status !== 'active') {
            $payment->subscription->update([
                'status' => 'active',
                'starts_at' => $payment->subscription->starts_at ?: now(),
            ]);
        }

        AuditLogger::log('payment.mark_paid', $payment, [
            'invoice_number' => $invoiceNumber,
            'amount' => $payment->amount,
            'user_id' => $payment->user_id,
        ]);

        return back()->with('success', "Payment #{$payment->id} marked as paid (Invoice: {$invoiceNumber}).");
    }

    /**
     * Record a refund for a payment.
     */
    public function refund(Payment $payment): RedirectResponse
    {
        $payment->update([
            'status' => 'refunded',
        ]);

        AuditLogger::log('payment.refund', $payment, [
            'amount' => $payment->amount,
            'invoice_number' => $payment->invoice_number,
            'user_id' => $payment->user_id,
        ]);

        return back()->with('success', "Payment #{$payment->id} has been marked as refunded.");
    }
}
