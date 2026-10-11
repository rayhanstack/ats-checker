import React from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { Card, Button, Badge, EmptyState } from '@/Components/UI';
import {
    Sparkles,
    Calendar,
    Zap,
    BarChart3,
    ArrowRight,
    Lock,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    Check,
} from 'lucide-react';
import { AccessSummary, AnalysisItem } from '@/types';

interface DashboardProps {
    greeting: string;
    access: AccessSummary;
    stats: {
        total_scans: number;
        avg_score: number;
        best_score: number;
    };
    recentAnalyses: AnalysisItem[];
}

export default function Dashboard({
    greeting,
    access,
    stats,
    recentAnalyses = [],
}: DashboardProps) {
    const isTrial = access.status === 'trial';
    const isActive = access.status === 'active';
    const isExpired = access.status === 'expired';

    const getScoreVariant = (score: number): 'success' | 'warning' | 'danger' => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'danger';
    };

    return (
        <UserLayout title="Dashboard">
            <Head title="Candidate Workspace - Dashboard" />

            <div className="space-y-8 max-w-6xl mx-auto">
                {/* 1. Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            {greeting}
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            Monitor your resume matching performance, review ATS scores, and optimize for recruiter filters.
                        </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                        {access.can_analyze ? (
                            <Link href={route('analyze')}>
                                <Button
                                    variant="primary"
                                    size="md"
                                    leftIcon={<Sparkles className="h-4 w-4" />}
                                    rightIcon={<ArrowRight className="h-4 w-4" />}
                                    className="shadow-md shadow-indigo-500/20"
                                >
                                    New Analysis
                                </Button>
                            </Link>
                        ) : (
                            <Link href={route('pricing')}>
                                <Button
                                    variant="secondary"
                                    size="md"
                                    leftIcon={<Lock className="h-4 w-4 text-amber-500" />}
                                    rightIcon={<ArrowRight className="h-4 w-4" />}
                                >
                                    Upgrade to Scan
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* 2. Status & Usage Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card A: Plan & Trial Status Card */}
                    <Card
                        variant="glass"
                        className={`p-6 sm:p-7 relative overflow-hidden transition-all ${
                            isExpired
                                ? 'border-rose-400/40 bg-gradient-to-br from-rose-50/50 via-white/50 to-white/50 dark:from-rose-950/20 dark:via-slate-900/60'
                                : 'border-indigo-500/20 bg-gradient-to-br from-indigo-50/40 via-white/60 to-white/60 dark:from-indigo-950/20 dark:via-slate-900/60'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-2 mb-4">
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Membership Status
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                                    {access.plan_name}
                                </h3>
                            </div>
                            <Badge
                                variant={isActive ? 'success' : isTrial ? 'primary' : 'danger'}
                                dot
                                size="sm"
                            >
                                {isActive ? 'Active Subscription' : isTrial ? '7-Day Free Trial' : 'Trial Expired'}
                            </Badge>
                        </div>

                        {/* Status body depending on state */}
                        {isTrial && (
                            <div className="space-y-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
                                        {access.trial_days_remaining}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                        days remaining in trial
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Your full access free trial ends on{' '}
                                    <strong className="text-slate-700 dark:text-slate-200">
                                        {access.trial_ends_at ? new Date(access.trial_ends_at).toLocaleDateString() : 'soon'}
                                    </strong>
                                    . Upgrade anytime to ensure uninterrupted access.
                                </p>
                                <div className="pt-2">
                                    <Link href={route('pricing')}>
                                        <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                                            View Pro Plans
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {isActive && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                                    <span>Full AI Matching Engine Active</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {access.renews_at
                                        ? `Subscription automatically renews on ${new Date(access.renews_at).toLocaleDateString()}.`
                                        : 'Your subscription is active and running.'}
                                </p>
                                <div className="pt-2">
                                    <Link href={route('profile.edit')}>
                                        <Button variant="ghost" size="sm">
                                            Account Settings
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {isExpired && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-bold">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <span>Trial Ended — Choose a Plan to Continue</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                    Your 7-day trial has completed. Choose one of our affordable plans to unlock unlimited resume match scoring.
                                </p>
                                <div className="pt-2">
                                    <Link href={route('pricing')}>
                                        <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                                            Choose a Plan
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Card B: Usage Meter Card */}
                    <Card variant="glass" className="p-6 sm:p-7 flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between gap-2 mb-4">
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Usage Meter
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                                        Resume Scans Quota
                                    </h3>
                                </div>
                                <Badge variant="default" size="sm">
                                    {access.remaining_analyses === 'Unlimited'
                                        ? 'Unlimited'
                                        : `${access.remaining_analyses} remaining`}
                                </Badge>
                            </div>

                            {/* Meter Bar */}
                            <div className="space-y-2 mt-6">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className="text-slate-700 dark:text-slate-300">
                                        {access.used_analyses} scans conducted
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400">
                                        Quota: {access.total_limit}
                                    </span>
                                </div>

                                <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            access.usage_percentage >= 90
                                                ? 'bg-rose-500'
                                                : access.usage_percentage >= 70
                                                ? 'bg-amber-500'
                                                : 'bg-gradient-to-r from-indigo-500 to-violet-600'
                                        }`}
                                        style={{ width: `${Math.max(4, access.usage_percentage)}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                                    <span>0</span>
                                    <span>{access.usage_percentage}% utilized</span>
                                    <span>{access.total_limit}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Resets with next billing cycle</span>
                            <Link href={route('analyses.index')} className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                                View Scan History &rarr;
                            </Link>
                        </div>
                    </Card>
                </div>

                {/* 3. Performance Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <Card variant="glass" className="p-5 flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Resumes Analyzed
                            </span>
                            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                                {stats.total_scans}
                            </div>
                        </div>
                    </Card>

                    <Card variant="glass" className="p-5 flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Average ATS Score
                            </span>
                            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                                {stats.avg_score > 0 ? `${stats.avg_score}/100` : '—'}
                            </div>
                        </div>
                    </Card>

                    <Card variant="glass" className="p-5 flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/70 dark:text-violet-400">
                            <Zap className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Best Match Score
                            </span>
                            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                                {stats.best_score > 0 ? `${stats.best_score}/100` : '—'}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* 4. Recent Analyses Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Recent Analyses
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Your latest resume comparisons and ATS match scores.
                            </p>
                        </div>
                        <Link
                            href={route('analyses.index')}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 flex items-center gap-1"
                        >
                            View All <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    {recentAnalyses.length === 0 ? (
                        <EmptyState
                            icon={<FileText className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />}
                            title="No resumes analyzed yet"
                            description="Upload your first resume and paste a job description to see your ATS match score, keyword gaps, and line-by-line recommendations."
                            action={
                                <Link href={access.can_analyze ? route('analyze') : route('pricing')}>
                                    <Button
                                        variant="primary"
                                        size="md"
                                        leftIcon={<Sparkles className="h-4 w-4" />}
                                    >
                                        Run Your First Scan
                                    </Button>
                                </Link>
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {recentAnalyses.map((item) => (
                                <Card
                                    key={item.id}
                                    variant="glass"
                                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-500/30 transition-all"
                                >
                                    <div className="flex items-start sm:items-center gap-3.5">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                {item.job_title}
                                                {item.job_company && (
                                                    <span className="text-slate-400 font-normal"> • {item.job_company}</span>
                                                )}
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                CV: <span className="font-medium text-slate-700 dark:text-slate-300">{item.resume_name}</span> • {item.formatted_date}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 self-end sm:self-center">
                                        <Badge variant={getScoreVariant(item.match_score)} size="md" className="font-bold">
                                            {item.match_score} / 100
                                        </Badge>
                                        <Link href={route('analyses.index')}>
                                            <Button variant="ghost" size="sm">
                                                Details
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
