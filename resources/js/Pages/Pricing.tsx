import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Section, Card, Button, Badge } from '@/Components/UI';
import { Check, Sparkles, ArrowRight, AlertCircle, ShieldCheck, Zap, Info, Loader2 } from 'lucide-react';
import { PageProps, PlanData } from '@/types';

interface PricingProps {
    plans: PlanData[];
    currentPlanSlug?: string | null;
    isAuthenticated: boolean;
}

export default function Pricing({
    plans = [],
    currentPlanSlug = null,
    isAuthenticated = false,
}: PricingProps) {
    const { auth, flash, settings } = usePage<PageProps>().props;
    const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('year');
    const [submittingPlanId, setSubmittingPlanId] = useState<string | number | null>(null);

    const handleSelectPlan = (plan: PlanData) => {
        if (!isAuthenticated) {
            router.get(route('register'));
            return;
        }

        setSubmittingPlanId(plan.id);
        router.post(
            route('billing.subscribe'),
            { plan_id: plan.id },
            {
                onFinish: () => setSubmittingPlanId(null),
            }
        );
    };

    // Filter/order plans for display: Free always first, then monthly/yearly
    const freePlan = plans.find((p) => p.slug === 'free');
    const monthlyPlan = plans.find((p) => p.slug === 'monthly');
    const yearlyPlan = plans.find((p) => p.slug === 'yearly');

    const displayPlans = [freePlan, monthlyPlan, yearlyPlan].filter(Boolean) as PlanData[];

    return (
        <PublicLayout>
            <Head>
                <title>{`Pricing & Subscription Plans - ${settings?.site_name || 'ATS Checker'}`}</title>
                <meta
                    name="description"
                    content="Simple, transparent pricing for AI resume optimization and ATS scoring. Choose the right plan to boost your interview callback rate."
                />
            </Head>

            <Section className="pt-12 sm:pt-20 pb-20">
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
                    <Badge variant="primary" size="md" dot className="mb-4">
                        Investment in Your Career
                    </Badge>

                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                        Simple, Predictable Plans.{' '}
                        <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">
                            Maximum Callback Power.
                        </span>
                    </h1>

                    <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
                        Pick the plan tailored to your job hunt pace. Upgrade, downgrade, or cancel anytime with zero friction.
                    </p>

                    {/* Monthly / Yearly Toggle */}
                    <div className="mt-8 flex items-center gap-3 p-1.5 rounded-full border border-slate-200/80 bg-slate-100/80 dark:border-white/10 dark:bg-white/5 backdrop-blur-md">
                        <button
                            type="button"
                            onClick={() => setBillingCycle('month')}
                            className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 ${
                                billingCycle === 'month'
                                    ? 'bg-white text-slate-900 shadow-md dark:bg-slate-800 dark:text-white'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                        >
                            Monthly Billing
                        </button>
                        <button
                            type="button"
                            onClick={() => setBillingCycle('year')}
                            className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 ${
                                billingCycle === 'year'
                                    ? 'bg-white text-slate-900 shadow-md dark:bg-slate-800 dark:text-white'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                        >
                            <span>Annual Billing</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                Save 35%
                            </span>
                        </button>
                    </div>

                    {/* Flash Error Banner */}
                    {flash?.error && (
                        <div className="mt-8 w-full flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-50/90 p-4 text-left text-xs sm:text-sm font-semibold text-rose-900 shadow-sm dark:border-rose-500/50 dark:bg-rose-950/70 dark:text-rose-200">
                            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                            <div>
                                <p>{flash.error}</p>
                                <p className="mt-1 text-xs font-normal text-rose-700 dark:text-rose-300">
                                    Select one of the options below to activate your AI resume scanning immediately.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Plans Grid */}
                <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
                    {displayPlans.map((plan) => {
                        const isCurrent = currentPlanSlug === plan.slug;
                        const isFeatured = plan.is_featured || (billingCycle === 'year' && plan.slug === 'yearly');
                        const isSubmitting = submittingPlanId === plan.id;

                        return (
                            <Card
                                key={plan.id}
                                variant="glass"
                                className={`flex flex-col justify-between p-8 relative transition-all duration-300 hover:scale-[1.02] ${
                                    isFeatured
                                        ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl shadow-indigo-500/10'
                                        : 'border-slate-200/80 dark:border-white/10'
                                }`}
                            >
                                {isFeatured && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                        <Badge variant="primary" size="sm" className="shadow-md">
                                            <Sparkles className="h-3 w-3 mr-1 inline" />
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}

                                <div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                {plan.name}
                                            </h3>
                                            {isCurrent && (
                                                <Badge variant="success" size="sm">
                                                    Current Plan
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="mt-6 flex items-baseline gap-1.5">
                                        <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                                            {plan.formatted_price}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                            {plan.billing_interval === 'year'
                                                ? '/ year'
                                                : plan.billing_interval === 'month'
                                                ? '/ month'
                                                : 'free forever'}
                                        </span>
                                    </div>

                                    {plan.slug === 'yearly' && (
                                        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                            Billed annually (~$12.42/month)
                                        </p>
                                    )}

                                    <div className="mt-8 space-y-3 pt-6 border-t border-slate-200/50 dark:border-white/10">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            What's included:
                                        </span>
                                        <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                            {plan.features.map((feat, idx) => (
                                                <li key={idx} className="flex items-start gap-2.5">
                                                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6">
                                    <Button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={isCurrent || isSubmitting}
                                        variant={isFeatured ? 'primary' : isCurrent ? 'outline' : 'secondary'}
                                        size="lg"
                                        className="w-full"
                                        rightIcon={
                                            isSubmitting ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <ArrowRight className="h-4 w-4" />
                                            )
                                        }
                                    >
                                        {isSubmitting
                                            ? 'Processing...'
                                            : isCurrent
                                            ? 'Active Plan'
                                            : !isAuthenticated
                                            ? 'Choose Plan'
                                            : plan.slug === 'free'
                                            ? 'Select Free'
                                            : 'Choose Plan'}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-16 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-6">
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" /> Cancel anytime with 1 click
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-amber-500" /> Instant scan limits
                    </span>
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure payment processing
                    </span>
                </div>
            </Section>
        </PublicLayout>
    );
}
