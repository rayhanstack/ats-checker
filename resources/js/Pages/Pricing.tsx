import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Section, Card, Button, Badge } from '@/Components/UI';
import { Check, Sparkles, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { PageProps, PricingPlan } from '@/types';

interface PricingProps {
    plans: PricingPlan[];
}

export default function Pricing({ plans = [] }: PricingProps) {
    const { auth, flash, settings } = usePage<PageProps>().props;

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

                    {/* Flash Error Banner (e.g. from EnsureUserCanAnalyze) */}
                    {flash?.error && (
                        <div className="mt-8 w-full flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-50/90 p-4 text-left text-xs sm:text-sm font-semibold text-rose-900 shadow-sm dark:border-rose-500/50 dark:bg-rose-950/70 dark:text-rose-200">
                            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                            <div>
                                <p>{flash.error}</p>
                                <p className="mt-1 text-xs font-normal text-rose-700 dark:text-rose-300">
                                    Select one of the options below to reactivate your AI resume scanning immediately.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Plans Grid */}
                <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            variant="glass"
                            className={`flex flex-col justify-between p-8 relative transition-all duration-300 hover:scale-[1.02] ${
                                plan.popular
                                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl shadow-indigo-500/10'
                                    : 'border-slate-200/80 dark:border-white/10'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                    <Badge variant="primary" size="sm" className="shadow-md">
                                        Most Popular
                                    </Badge>
                                </div>
                            )}

                            <div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                        {plan.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">
                                        {plan.description}
                                    </p>
                                </div>

                                <div className="mt-6 flex items-baseline gap-1.5">
                                    <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {plan.price}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                        {plan.period}
                                    </span>
                                </div>

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
                                <Link
                                    href={
                                        auth.user
                                            ? route('analyze')
                                            : route('register')
                                    }
                                    className="w-full block"
                                >
                                    <Button
                                        variant={plan.popular ? 'primary' : 'outline'}
                                        size="lg"
                                        className="w-full"
                                        rightIcon={<ArrowRight className="h-4 w-4" />}
                                    >
                                        {auth.user ? 'Get Started' : plan.cta_text}
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="mt-16 text-center text-xs text-slate-400 flex items-center justify-center gap-6">
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" /> Cancel anytime with 1 click
                    </span>
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" /> Instant activation
                    </span>
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" /> 100% money-back satisfaction
                    </span>
                </div>
            </Section>
        </PublicLayout>
    );
}
