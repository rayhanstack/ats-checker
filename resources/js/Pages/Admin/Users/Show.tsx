import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, Badge, Button } from '@/Components/UI';
import {
    Users,
    ArrowLeft,
    Mail,
    Calendar,
    Shield,
    Clock,
    CreditCard,
    FileText,
    KeyRound,
    Power,
    CalendarPlus,
    X,
    CheckCircle2,
    Check,
} from 'lucide-react';

interface UserDetailProps {
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        is_active: boolean;
        trial_ends_at?: string | null;
        has_active_trial: boolean;
        email_verified_at?: string | null;
        last_login_at?: string | null;
        created_at: string;
        formatted_date: string;
        active_plan: string;
    };
    subscriptions: {
        id: number;
        plan_name: string;
        status: string;
        gateway: string;
        starts_at: string;
        ends_at: string;
        created_at: string;
    }[];
    payments: {
        id: number;
        amount: number | string;
        currency: string;
        status: string;
        gateway: string;
        invoice_number: string;
        paid_at?: string | null;
    }[];
    analyses: {
        id: number;
        resume_name: string;
        job_title: string;
        score: number | null;
        status: string;
        tokens_in: number | null;
        tokens_out: number | null;
        formatted_date: string;
    }[];
    usage: {
        total_analyses: number;
        completed_analyses: number;
        total_tokens_used: number;
    };
    available_plans: {
        id: number;
        name: string;
        price: number | string;
        billing_interval: string;
    }[];
}

export default function Show({
    user,
    subscriptions,
    payments,
    analyses,
    usage,
    available_plans,
}: UserDetailProps) {
    const [showAssignPlan, setShowAssignPlan] = useState(false);
    const [showExtendTrial, setShowExtendTrial] = useState(false);

    const planForm = useForm({
        plan_id: available_plans[0]?.id || '',
        duration_days: 30,
    });

    const trialForm = useForm({
        days: 7,
    });

    const submitAssignPlan = (e: React.FormEvent) => {
        e.preventDefault();
        planForm.post(route('admin.users.assign-plan', user.id), {
            onSuccess: () => setShowAssignPlan(false),
        });
    };

    const submitExtendTrial = (e: React.FormEvent) => {
        e.preventDefault();
        trialForm.post(route('admin.users.extend-trial', user.id), {
            onSuccess: () => setShowExtendTrial(false),
        });
    };

    const toggleStatus = () => {
        router.post(route('admin.users.toggle-status', user.id));
    };

    return (
        <AdminLayout
            title={`User Profile: ${user.name}`}
            description="Account credentials, subscription lifecycle, payments, and CV analysis usage."
        >
            <Head title={`${user.name} - User Detail`} />

            <div className="space-y-6 max-w-6xl mx-auto pb-12">
                {/* Top Nav */}
                <div className="flex items-center justify-between">
                    <Link
                        href={route('admin.users.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Users Directory
                    </Link>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<CalendarPlus className="h-3.5 w-3.5" />}
                            onClick={() => setShowExtendTrial(true)}
                        >
                            Extend Trial
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<CreditCard className="h-3.5 w-3.5" />}
                            onClick={() => setShowAssignPlan(true)}
                        >
                            Assign Plan
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={user.is_active ? 'text-amber-600' : 'text-emerald-600'}
                            onClick={toggleStatus}
                        >
                            <Power className="h-3.5 w-3.5 mr-1" />
                            {user.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                    </div>
                </div>

                {/* Profile Overview Card */}
                <Card variant="glass" className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 font-bold text-xl">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                        {user.name}
                                    </h1>
                                    <Badge variant={user.role === 'admin' ? 'warning' : 'default'} size="sm">
                                        {user.role}
                                    </Badge>
                                    <Badge variant={user.is_active ? 'success' : 'danger'} size="sm">
                                        {user.is_active ? 'Active' : 'Deactivated'}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Mail className="h-3.5 w-3.5" />
                                        {user.email}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Member since {user.formatted_date}
                                    </span>
                                    {user.email_verified_at && (
                                        <span className="flex items-center gap-1 text-emerald-500 font-medium">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Verified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-right sm:border-l sm:border-slate-200/60 dark:sm:border-white/10 sm:pl-6">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                Current Plan
                            </span>
                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                                {user.active_plan}
                            </span>
                            {user.trial_ends_at && (
                                <span className="text-[11px] text-slate-400 block">
                                    Trial ends: {new Date(user.trial_ends_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Usage Statistics Meter */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card variant="glass" className="p-4 space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Total Resumes Scanned
                        </span>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                            {usage.total_analyses}
                        </p>
                        <p className="text-[11px] text-slate-500">
                            {usage.completed_analyses} completed successfully
                        </p>
                    </Card>

                    <Card variant="glass" className="p-4 space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Total LLM Tokens Used
                        </span>
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                            {usage.total_tokens_used.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-slate-500">
                            Input + Output tokens across Claude models
                        </p>
                    </Card>

                    <Card variant="glass" className="p-4 space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Account Security
                        </span>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                            Password Set
                        </p>
                        <p className="text-[11px] text-slate-500">
                            Last Login: {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                        </p>
                    </Card>
                </div>

                {/* Tabbed / Split Content: Subscriptions & Analyses */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Subscriptions History */}
                    <Card variant="glass" className="p-6 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-emerald-500" />
                                Subscriptions History ({subscriptions.length})
                            </h3>
                        </div>

                        {subscriptions.length > 0 ? (
                            <div className="divide-y divide-slate-200/50 dark:divide-white/5 text-xs">
                                {subscriptions.map((s) => (
                                    <div key={s.id} className="py-3 flex items-center justify-between">
                                        <div>
                                            <span className="font-bold text-slate-900 dark:text-white block">
                                                {s.plan_name}
                                            </span>
                                            <span className="text-slate-400 text-[11px]">
                                                {s.starts_at} &rarr; {s.ends_at} • Gateway: {s.gateway}
                                            </span>
                                        </div>
                                        <Badge
                                            variant={s.status === 'active' ? 'success' : 'default'}
                                            size="sm"
                                            className="capitalize"
                                        >
                                            {s.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 py-4 text-center">
                                No active or historical subscriptions on record.
                            </p>
                        )}
                    </Card>

                    {/* Recent Analyses Run */}
                    <Card variant="glass" className="p-6 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileText className="h-4 w-4 text-indigo-500" />
                                CV Analyses History ({analyses.length})
                            </h3>
                        </div>

                        {analyses.length > 0 ? (
                            <div className="divide-y divide-slate-200/50 dark:divide-white/5 text-xs">
                                {analyses.map((an) => (
                                    <div key={an.id} className="py-3 flex items-center justify-between">
                                        <div>
                                            <span className="font-bold text-slate-900 dark:text-white block truncate max-w-xs">
                                                {an.job_title}
                                            </span>
                                            <span className="text-slate-400 text-[11px]">
                                                {an.resume_name} • {an.formatted_date}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            {an.score !== null ? (
                                                <Badge
                                                    variant={an.score >= 75 ? 'success' : an.score >= 50 ? 'warning' : 'danger'}
                                                    size="sm"
                                                >
                                                    {an.score}%
                                                </Badge>
                                            ) : (
                                                <Badge variant="default" size="sm" className="capitalize">
                                                    {an.status}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 py-4 text-center">
                                No resumes submitted by this user yet.
                            </p>
                        )}
                    </Card>
                </div>

                {/* Payments Log */}
                {payments.length > 0 && (
                    <Card variant="glass" className="p-6 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-purple-500" />
                                Payment & Invoice Ledger
                            </h3>
                        </div>
                        <div className="overflow-x-auto text-xs">
                            <table className="w-full text-left">
                                <thead className="text-slate-400 font-bold uppercase">
                                    <tr>
                                        <th className="py-2">Invoice #</th>
                                        <th className="py-2">Amount</th>
                                        <th className="py-2">Gateway</th>
                                        <th className="py-2">Status</th>
                                        <th className="py-2">Paid At</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                                    {payments.map((p) => (
                                        <tr key={p.id}>
                                            <td className="py-2.5 font-mono">{p.invoice_number}</td>
                                            <td className="py-2.5 font-bold">{p.currency} {p.amount}</td>
                                            <td className="py-2.5 capitalize">{p.gateway}</td>
                                            <td className="py-2.5">
                                                <Badge variant={p.status === 'paid' ? 'success' : 'danger'} size="sm">
                                                    {p.status}
                                                </Badge>
                                            </td>
                                            <td className="py-2.5 text-slate-400">{p.paid_at || 'Pending'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* Modal: Assign Plan */}
            {showAssignPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Assign Plan</h3>
                            <button onClick={() => setShowAssignPlan(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitAssignPlan} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Plan</label>
                                <select
                                    value={planForm.data.plan_id}
                                    onChange={(e) => planForm.setData('plan_id', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                                >
                                    {available_plans.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} (${p.price} / {p.billing_interval})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Duration (Days)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={3650}
                                    value={planForm.data.duration_days}
                                    onChange={(e) => planForm.setData('duration_days', parseInt(e.target.value) || 30)}
                                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                                <Button type="button" variant="outline" size="sm" onClick={() => setShowAssignPlan(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" size="sm" disabled={planForm.processing}>
                                    Assign Plan
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Extend Trial */}
            {showExtendTrial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Extend Trial</h3>
                            <button onClick={() => setShowExtendTrial(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitExtendTrial} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Additional Days (+N)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={trialForm.data.days}
                                    onChange={(e) => trialForm.setData('days', parseInt(e.target.value) || 7)}
                                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                                <Button type="button" variant="outline" size="sm" onClick={() => setShowExtendTrial(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" size="sm" disabled={trialForm.processing}>
                                    Extend Trial
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
