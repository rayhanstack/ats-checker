import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { Card, Button, Badge, Modal } from '@/Components/UI';
import {
    CreditCard,
    Check,
    AlertCircle,
    Calendar,
    Sparkles,
    ShieldCheck,
    Clock,
    FileText,
    ArrowUpRight,
    Loader2,
    XCircle,
    Info,
} from 'lucide-react';
import { PageProps, AccessSummary, PlanData, SubscriptionData, PaymentData } from '@/types';

interface BillingProps {
    subscription: SubscriptionData | null;
    accessSummary: AccessSummary;
    payments: PaymentData[];
    plans: PlanData[];
    status?: string | null;
    message?: string | null;
}

export default function Billing({
    subscription,
    accessSummary,
    payments = [],
    plans = [],
    status = null,
    message = null,
}: BillingProps) {
    const { auth, flash } = usePage<PageProps>().props;
    const [submittingPlanId, setSubmittingPlanId] = useState<string | number | null>(null);
    const [canceling, setCanceling] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const handleSubscribe = (planId: string | number) => {
        setSubmittingPlanId(planId);
        router.post(
            route('billing.subscribe'),
            { plan_id: planId },
            {
                onFinish: () => setSubmittingPlanId(null),
            }
        );
    };

    const handleCancelSubscription = () => {
        setCanceling(true);
        router.post(
            route('billing.cancel'),
            {},
            {
                onFinish: () => {
                    setCanceling(false);
                    setShowCancelModal(false);
                },
            }
        );
    };

    const getStatusBadgeVariant = (st: string) => {
        switch (st) {
            case 'active':
                return 'success';
            case 'trialing':
            case 'trial':
                return 'primary';
            case 'past_due':
                return 'warning';
            case 'canceled':
            case 'expired':
            case 'failed':
                return 'danger';
            case 'pending':
                return 'warning';
            case 'paid':
                return 'success';
            case 'refunded':
                return 'default';
            default:
                return 'default';
        }
    };

    return (
        <UserLayout title="Billing & Subscriptions">
            <Head title="Billing & Subscriptions" />

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Status / Flash Notice */}
                {(message || flash?.success || flash?.error) && (
                    <div
                        className={`flex items-start gap-3 rounded-2xl p-4 text-sm font-medium shadow-sm backdrop-blur-md border ${
                            flash?.error
                                ? 'border-rose-500/30 bg-rose-50/90 text-rose-900 dark:border-rose-500/40 dark:bg-rose-950/70 dark:text-rose-200'
                                : status === 'pending_manual_approval'
                                ? 'border-amber-500/30 bg-amber-50/90 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/70 dark:text-amber-200'
                                : 'border-emerald-500/30 bg-emerald-50/90 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/70 dark:text-emerald-200'
                        }`}
                    >
                        {flash?.error ? (
                            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                        ) : status === 'pending_manual_approval' ? (
                            <Info className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        ) : (
                            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                        )}
                        <div>
                            <p>{message || flash?.success || flash?.error}</p>
                            {status === 'pending_manual_approval' && (
                                <p className="mt-1 text-xs font-normal text-amber-700 dark:text-amber-300">
                                    Our billing administrator will review and activate your subscription shortly. You can also reach out to our support desk for expedited approval.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Current Subscription & Usage Meter Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card variant="glass" className="lg:col-span-2 p-6 sm:p-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60 dark:border-white/10">
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Active Membership
                                </span>
                                <div className="mt-1 flex items-center gap-3">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                        {accessSummary.plan_name}
                                    </h2>
                                    <Badge
                                        variant={getStatusBadgeVariant(
                                            subscription?.status || accessSummary.status
                                        )}
                                        size="md"
                                        className="capitalize"
                                    >
                                        {subscription?.status || accessSummary.status}
                                    </Badge>
                                </div>
                            </div>

                            {subscription && subscription.status === 'active' && (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => setShowCancelModal(true)}
                                    leftIcon={<XCircle className="h-4 w-4" />}
                                >
                                    Cancel Subscription
                                </Button>
                            )}
                        </div>

                        {/* Subscription Details & Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Billing Cycle
                                </span>
                                <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                                    {subscription?.plan?.billing_interval === 'year'
                                        ? 'Annual Billing'
                                        : subscription?.plan?.billing_interval === 'month'
                                        ? 'Monthly Billing'
                                        : accessSummary.is_trial_active
                                        ? '7-Day Trial'
                                        : 'Free Tier'}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {subscription?.status === 'active' ? 'Renews On' : 'Expires On'}
                                </span>
                                <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                    {subscription?.ends_at ||
                                        (accessSummary.trial_ends_at
                                            ? new Date(accessSummary.trial_ends_at).toLocaleDateString()
                                            : 'N/A')}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Payment Method
                                </span>
                                <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                                    {subscription?.gateway || 'Manual / Direct'}
                                </p>
                            </div>
                        </div>

                        {/* Usage Meter */}
                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-slate-600 dark:text-slate-300">
                                    Resume Scans Quota
                                </span>
                                <span className="text-indigo-600 dark:text-indigo-400">
                                    {accessSummary.used_analyses} /{' '}
                                    {accessSummary.total_limit === 'Unlimited'
                                        ? '∞ Unlimited'
                                        : accessSummary.total_limit}{' '}
                                    used
                                </span>
                            </div>

                            <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        accessSummary.usage_percentage >= 90
                                            ? 'bg-rose-500'
                                            : accessSummary.usage_percentage >= 70
                                            ? 'bg-amber-500'
                                            : 'bg-indigo-600'
                                    }`}
                                    style={{
                                        width:
                                            accessSummary.total_limit === 'Unlimited'
                                                ? '15%'
                                                : `${Math.min(100, accessSummary.usage_percentage)}%`,
                                    }}
                                />
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {accessSummary.remaining_analyses === 'Unlimited'
                                    ? 'You have unlimited resume scans available on this plan.'
                                    : `${accessSummary.remaining_analyses} analyses remaining in your current billing cycle.`}
                            </p>
                        </div>
                    </Card>

                    {/* Quick Upgrade / Plan Card */}
                    <Card
                        variant="glass"
                        className="p-6 sm:p-8 flex flex-col justify-between border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-transparent"
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Need More Scans?
                                </h3>
                            </div>
                            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                Boost your interview conversion with higher scan limits, priority AI processing, and deep keyword gap insights.
                            </p>

                            <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                <li className="flex items-center gap-2">
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>Immediate scan allocation</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>Detailed section-by-section fixes</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>Cancel anytime with zero fees</span>
                                </li>
                            </ul>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-white/10">
                            <Link href={route('pricing')}>
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    rightIcon={<ArrowUpRight className="h-4 w-4" />}
                                >
                                    Browse All Plans
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>

                {/* Available Plans Switcher / Grid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Available Subscription Plans
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Upgrade or change your tier at any time
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => {
                            const isCurrent = accessSummary.plan_slug === plan.slug;
                            const isSubmitting = submittingPlanId === plan.id;

                            return (
                                <Card
                                    key={plan.id}
                                    variant="glass"
                                    className={`p-6 flex flex-col justify-between relative ${
                                        plan.is_featured
                                            ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg'
                                            : 'border-slate-200/80 dark:border-white/10'
                                    }`}
                                >
                                    {plan.is_featured && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <Badge variant="primary" size="sm">
                                                Best Value
                                            </Badge>
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                                {plan.name}
                                            </h4>
                                            {isCurrent && (
                                                <Badge variant="success" size="sm">
                                                    Current
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="mt-3 flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-slate-900 dark:text-white">
                                                {plan.formatted_price}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {plan.billing_interval === 'year'
                                                    ? '/ yr'
                                                    : plan.billing_interval === 'month'
                                                    ? '/ mo'
                                                    : 'one-time'}
                                            </span>
                                        </div>

                                        <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                            {plan.features.slice(0, 4).map((feat, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-white/10">
                                        <Button
                                            variant={isCurrent ? 'outline' : plan.is_featured ? 'primary' : 'secondary'}
                                            size="sm"
                                            className="w-full"
                                            disabled={isCurrent || isSubmitting}
                                            onClick={() => handleSubscribe(plan.id)}
                                            rightIcon={
                                                isSubmitting ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : undefined
                                            }
                                        >
                                            {isSubmitting
                                                ? 'Requesting...'
                                                : isCurrent
                                                ? 'Active'
                                                : `Choose ${plan.name}`}
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Invoices & Payment History */}
                <Card variant="glass" className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileText className="h-5 w-5 text-indigo-500" />
                                Payment & Invoice History
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Record of receipts, invoices, and transactions
                            </p>
                        </div>
                    </div>

                    {payments.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200/80 dark:border-white/10">
                            <Clock className="h-10 w-10 mx-auto text-slate-400/80 mb-3" />
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                No Payments Recorded Yet
                            </h4>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                When you subscribe to a paid plan, your invoice details and payment confirmations will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                                        <th className="py-3 px-4">Invoice #</th>
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Description</th>
                                        <th className="py-3 px-4">Amount</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Gateway</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                                    {payments.map((p) => (
                                        <tr
                                            key={p.id}
                                            className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                                                {p.invoice_number}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                                                {p.created_at}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                                                {p.plan_name}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                                                {p.amount}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <Badge
                                                    variant={getStatusBadgeVariant(p.status)}
                                                    size="sm"
                                                    className="capitalize"
                                                >
                                                    {p.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                                                {p.gateway}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            {/* Cancel Confirmation Modal */}
            <Modal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                title="Cancel Subscription"
                maxWidth="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Are you sure you want to cancel your subscription? You will still retain access to your current scan features until your billing period ends.
                    </p>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60 dark:border-white/10">
                        <Button
                            variant="secondary"
                            onClick={() => setShowCancelModal(false)}
                            disabled={canceling}
                        >
                            Keep Subscription
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleCancelSubscription}
                            disabled={canceling}
                            rightIcon={
                                canceling ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : undefined
                            }
                        >
                            {canceling ? 'Canceling...' : 'Confirm Cancellation'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </UserLayout>
    );
}
