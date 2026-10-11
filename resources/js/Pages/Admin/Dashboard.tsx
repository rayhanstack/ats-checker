import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, Badge, Button } from '@/Components/UI';
import {
    Users,
    UserCheck,
    CreditCard,
    FileText,
    AlertTriangle,
    DollarSign,
    TrendingUp,
    ChevronRight,
    Clock,
    Cpu,
    ArrowUpRight,
} from 'lucide-react';

interface AdminDashboardProps {
    kpis: {
        total_users: number;
        new_users_7d: number;
        active_trials: number;
        active_subscribers: number;
        analyses_today: number;
        analyses_7d: number;
        analyses_30d: number;
        failure_rate: number;
        total_tokens_in: number;
        total_tokens_out: number;
        estimated_ai_cost: number;
    };
    trend_data: {
        date: string;
        signups: number;
        analyses: number;
    }[];
    recent_users: {
        id: number;
        name: string;
        email: string;
        role: string;
        is_active: boolean;
        plan_name: string;
        formatted_date: string;
    }[];
    recent_failures: {
        id: number;
        analysis_id: number;
        model_name: string;
        http_status: number;
        failure_type: string;
        error_message: string;
        formatted_date: string;
    }[];
}

export default function Dashboard({
    kpis,
    trend_data,
    recent_users,
    recent_failures,
}: AdminDashboardProps) {
    const maxDailyVolume = Math.max(
        ...trend_data.map((d) => Math.max(d.signups, d.analyses)),
        1
    );

    return (
        <AdminLayout
            title="Administration Console"
            description="High-level telemetry, subscriber health, ATS volume, and LLM operational metrics."
        >
            <Head title="Admin Dashboard" />

            <div className="space-y-8">
                {/* Primary KPIs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Total Users & 7d Growth */}
                    <Card variant="glass" className="p-5 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Total Registered Users
                            </span>
                            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 p-2.5 text-indigo-600 dark:text-indigo-400">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">
                                {kpis.total_users.toLocaleString()}
                            </span>
                            <span className="text-xs font-semibold text-emerald-500 flex items-center">
                                +{kpis.new_users_7d} (7d)
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Candidate and administrative accounts
                        </p>
                    </Card>

                    {/* Paid Subscribers */}
                    <Card variant="glass" className="p-5 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Active Paid Subscribers
                            </span>
                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 p-2.5 text-emerald-600 dark:text-emerald-400">
                                <CreditCard className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">
                                {kpis.active_subscribers.toLocaleString()}
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                                ({kpis.active_trials} on trial)
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Recurring monthly and annual subscriptions
                        </p>
                    </Card>

                    {/* Analyses Volume (Today / 7d / 30d) */}
                    <Card variant="glass" className="p-5 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Resume Analyses
                            </span>
                            <div className="rounded-xl bg-purple-50 dark:bg-purple-950/60 p-2.5 text-purple-600 dark:text-purple-400">
                                <FileText className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">
                                {kpis.analyses_today.toLocaleString()}
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                                today
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {kpis.analyses_7d.toLocaleString()} past 7d • {kpis.analyses_30d.toLocaleString()} past 30d
                        </p>
                    </Card>

                    {/* LLM Operational Health & Cost */}
                    <Card variant="glass" className="p-5 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                AI Failure Rate & Cost
                            </span>
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/60 p-2.5 text-amber-600 dark:text-amber-400">
                                <Cpu className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline justify-between">
                            <div>
                                <span className="text-3xl font-black text-slate-900 dark:text-white">
                                    {kpis.failure_rate}%
                                </span>
                                <span className="text-xs font-medium text-slate-400 ml-1">
                                    fail rate
                                </span>
                            </div>
                            <Badge variant={kpis.failure_rate > 10 ? 'danger' : 'success'} size="sm">
                                {kpis.failure_rate > 10 ? 'Degraded' : 'Nominal'}
                            </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Est. Token Cost: <span className="font-semibold text-slate-700 dark:text-slate-300">${kpis.estimated_ai_cost.toFixed(2)}</span>
                        </p>
                    </Card>
                </div>

                {/* Activity Trends (Past 14 Days) */}
                <Card variant="glass" className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-indigo-500" />
                                14-Day Activity Trends
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Daily registrations and ATS scan throughput
                            </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                                Analyses
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                Signups
                            </span>
                        </div>
                    </div>

                    {/* Visual Bar Chart */}
                    <div className="pt-4 grid grid-cols-7 sm:grid-cols-14 gap-2 items-end h-40 border-b border-slate-200/60 dark:border-white/10 pb-2">
                        {trend_data.map((day, idx) => {
                            const analysesHeight = Math.max(8, (day.analyses / maxDailyVolume) * 100);
                            const signupsHeight = Math.max(8, (day.signups / maxDailyVolume) * 100);

                            return (
                                <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end group relative">
                                    <div className="w-full flex items-end justify-center gap-1 h-28">
                                        {/* Analyses bar */}
                                        <div
                                            className="w-2.5 bg-indigo-500 rounded-t transition-all group-hover:bg-indigo-400"
                                            style={{ height: `${analysesHeight}%` }}
                                            title={`${day.date}: ${day.analyses} analyses`}
                                        />
                                        {/* Signups bar */}
                                        <div
                                            className="w-2.5 bg-emerald-500 rounded-t transition-all group-hover:bg-emerald-400"
                                            style={{ height: `${signupsHeight}%` }}
                                            title={`${day.date}: ${day.signups} signups`}
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-400 truncate max-w-full">
                                        {day.date}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Split Grid: Recent Users & Recent Failures */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Users */}
                    <Card variant="glass" className="p-6 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Users className="h-4 w-4 text-indigo-500" />
                                    Recently Registered Candidates
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Newest accounts on the platform
                                </p>
                            </div>

                            <Link
                                href={route('admin.users.index')}
                                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                                View All
                                <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <div className="divide-y divide-slate-200/50 dark:divide-white/5">
                            {recent_users.map((u) => (
                                <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <Link
                                            href={route('admin.users.show', u.id)}
                                            className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate block"
                                        >
                                            {u.name}
                                        </Link>
                                        <span className="text-[11px] text-slate-400 truncate block">
                                            {u.email}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge variant={u.role === 'admin' ? 'warning' : 'default'} size="sm">
                                            {u.role}
                                        </Badge>
                                        <span className="text-[11px] text-slate-400">
                                            {u.formatted_date}
                                        </span>
                                        <Link href={route('admin.users.show', u.id)}>
                                            <ChevronRight className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Recent Failures / Observability */}
                    <Card variant="glass" className="p-6 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                                    Recent AI Model Exceptions
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Captured errors across the resilience pipeline
                                </p>
                            </div>

                            <Link
                                href={route('admin.audit-logs.index')}
                                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                                Audit Trail
                                <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        {recent_failures.length > 0 ? (
                            <div className="divide-y divide-slate-200/50 dark:divide-white/5">
                                {recent_failures.map((f) => (
                                    <div key={f.id} className="py-3 space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                {f.model_name} (HTTP {f.http_status})
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                {f.formatted_date}
                                            </span>
                                        </div>
                                        <p className="text-[11px] font-mono text-rose-600 dark:text-rose-400 truncate">
                                            {f.error_message || 'Unknown provider error'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs text-slate-400">
                                Zero failure events recorded in the recent window. System running smoothly.
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
