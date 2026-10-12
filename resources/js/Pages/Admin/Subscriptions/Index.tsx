import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, Badge, Button } from '@/Components/UI';
import {
    Users,
    Search,
    Filter,
    ShieldAlert,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
    RotateCcw,
    Calendar,
    ChevronRight,
    CreditCard,
    Info,
    ExternalLink,
    Edit2,
    Ban,
    DollarSign,
} from 'lucide-react';

interface SubscriptionItem {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    plan: {
        id: number;
        name: string;
        formatted_price: string;
        billing_interval: string;
    } | null;
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
    gateway: string;
    gateway_subscription_id: string | null;
    starts_at: string | null;
    ends_at: string | null;
    canceled_at: string | null;
    created_at: string;
    formatted_date: string;
}

interface SubscriptionsIndexProps {
    subscriptions: {
        data: SubscriptionItem[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search: string;
        status: string;
        plan_id: string;
    };
    plans: { id: number; name: string }[];
    stats: {
        total: number;
        active: number;
        trialing: number;
        canceled: number;
    };
}

export default function Index({
    subscriptions,
    filters,
    plans,
    stats,
}: SubscriptionsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [planFilter, setPlanFilter] = useState(filters.plan_id || '');

    // Status change modal
    const [selectedSub, setSelectedSub] = useState<SubscriptionItem | null>(null);
    const [newStatus, setNewStatus] = useState<string>('active');
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    // Cancel modal
    const [cancelingSub, setCancelingSub] = useState<SubscriptionItem | null>(null);

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(
            route('admin.subscriptions.index'),
            {
                search: overrides.search !== undefined ? overrides.search : search,
                status: overrides.status !== undefined ? overrides.status : statusFilter,
                plan_id: overrides.plan_id !== undefined ? overrides.plan_id : planFilter,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setPlanFilter('');
        router.get(route('admin.subscriptions.index'));
    };

    const openStatusModal = (sub: SubscriptionItem) => {
        setSelectedSub(sub);
        setNewStatus(sub.status);
        setIsStatusModalOpen(true);
    };

    const handleUpdateStatus = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSub) return;

        router.put(
            route('admin.subscriptions.update', selectedSub.id),
            { status: newStatus },
            {
                onSuccess: () => {
                    setIsStatusModalOpen(false);
                    setSelectedSub(null);
                },
            }
        );
    };

    const handleCancelSubscription = () => {
        if (!cancelingSub) return;

        router.post(
            route('admin.subscriptions.cancel', cancelingSub.id),
            {},
            {
                onSuccess: () => setCancelingSub(null),
            }
        );
    };

    const getStatusBadge = (status: SubscriptionItem['status']) => {
        switch (status) {
            case 'active':
                return (
                    <Badge variant="success" className="capitalize flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                    </Badge>
                );
            case 'trialing':
                return (
                    <Badge variant="info" className="capitalize flex items-center gap-1 bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                        <Clock className="w-3 h-3" />
                        Trialing
                    </Badge>
                );
            case 'past_due':
                return (
                    <Badge variant="warning" className="capitalize flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Past Due
                    </Badge>
                );
            case 'canceled':
                return (
                    <Badge variant="danger" className="capitalize flex items-center gap-1 bg-red-500/10 text-red-400 border-red-500/30">
                        <XCircle className="w-3 h-3" />
                        Canceled
                    </Badge>
                );
            case 'expired':
            default:
                return (
                    <Badge variant="default" className="capitalize">
                        Expired
                    </Badge>
                );
        }
    };

    return (
        <AdminLayout>
            <Head title="Subscriptions - Admin" />

            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                Candidate Subscriptions
                            </h1>
                            <p className="text-sm text-slate-400">
                                Monitor candidate plan tenures, manage subscription statuses, and override limits.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Manual Mode Banner */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-md flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                        <Info className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-amber-300">
                                Payment gateway not connected yet; manual mode
                            </h3>
                            <Badge variant="warning" className="text-[10px] uppercase font-bold py-0.5 px-2 bg-amber-500/20 text-amber-300 border-amber-500/30">
                                Manual Gateway Active
                            </Badge>
                        </div>
                        <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                            Subscriptions and payment reconciliations are operating in manual mode. Administrators can manually activate, cancel, or transition candidate plans. Any manual status change writes a strict audit log entry and immediately updates analysis allowances in the candidate dashboard.
                        </p>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Subscriptions</p>
                                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Active Paid</p>
                                <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.active}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Trialing</p>
                                <p className="text-2xl font-bold text-cyan-400 mt-1">{stats.trialing}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Canceled</p>
                                <p className="text-2xl font-bold text-red-400 mt-1">{stats.canceled}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                                <XCircle className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filter Toolbar */}
                <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                    <form onSubmit={handleSearchSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            {/* Search bar */}
                            <div className="sm:col-span-5 relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search candidate name, email, or plan..."
                                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Status filter */}
                            <div className="sm:col-span-3">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        applyFilters({ status: e.target.value });
                                    }}
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="trialing">Trialing</option>
                                    <option value="past_due">Past Due</option>
                                    <option value="canceled">Canceled</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>

                            {/* Plan filter */}
                            <div className="sm:col-span-3">
                                <select
                                    value={planFilter}
                                    onChange={(e) => {
                                        setPlanFilter(e.target.value);
                                        applyFilters({ plan_id: e.target.value });
                                    }}
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Plans</option>
                                    {plans.map((p) => (
                                        <option key={p.id} value={p.id.toString()}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Reset button */}
                            <div className="sm:col-span-1 flex items-center">
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    title="Reset filters"
                                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition w-full flex items-center justify-center"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </form>
                </Card>

                {/* Subscriptions Table */}
                <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="px-5 py-3.5">Candidate</th>
                                    <th className="px-5 py-3.5">Plan / Tier</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5">Started At</th>
                                    <th className="px-5 py-3.5">Renewal / End</th>
                                    <th className="px-5 py-3.5">Gateway</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {subscriptions.data.length > 0 ? (
                                    subscriptions.data.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-slate-800/30 transition">
                                            {/* Candidate */}
                                            <td className="px-5 py-4">
                                                {sub.user ? (
                                                    <div>
                                                        <Link
                                                            href={route('admin.users.show', sub.user.id)}
                                                            className="font-semibold text-white hover:text-indigo-400 transition"
                                                        >
                                                            {sub.user.name}
                                                        </Link>
                                                        <p className="text-xs text-slate-400">{sub.user.email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic">User deleted</span>
                                                )}
                                            </td>

                                            {/* Plan */}
                                            <td className="px-5 py-4">
                                                {sub.plan ? (
                                                    <div>
                                                        <span className="font-medium text-slate-200">
                                                            {sub.plan.name}
                                                        </span>
                                                        <p className="text-xs text-slate-400">
                                                            {sub.plan.formatted_price}
                                                            {sub.plan.billing_interval !== 'none' && ` / ${sub.plan.billing_interval}`}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500">Custom / Trial</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                {getStatusBadge(sub.status)}
                                                {sub.canceled_at && (
                                                    <p className="text-[10px] text-red-400/80 mt-1">
                                                        Canceled: {sub.canceled_at}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Started At */}
                                            <td className="px-5 py-4 text-xs text-slate-400 font-mono">
                                                {sub.starts_at || '—'}
                                            </td>

                                            {/* Renewal / Ends At */}
                                            <td className="px-5 py-4 text-xs text-slate-300 font-mono">
                                                {sub.ends_at}
                                            </td>

                                            {/* Gateway */}
                                            <td className="px-5 py-4">
                                                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/80 font-mono uppercase text-slate-300">
                                                    {sub.gateway}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        onClick={() => openStatusModal(sub)}
                                                        variant="secondary"
                                                        size="sm"
                                                        className="text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                                                        Status
                                                    </Button>

                                                    {sub.status !== 'canceled' && (
                                                        <Button
                                                            onClick={() => setCancelingSub(sub)}
                                                            variant="danger"
                                                            size="sm"
                                                            className="text-xs border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                                        >
                                                            <Ban className="w-3.5 h-3.5 mr-1" />
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                                            <CreditCard className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                            <p className="text-sm">No subscriptions found matching the filter criteria.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {subscriptions.links && subscriptions.links.length > 3 && (
                        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                            <div>
                                Showing Page {subscriptions.current_page} of {subscriptions.last_page} ({subscriptions.total} total)
                            </div>
                            <div className="flex items-center gap-1">
                                {subscriptions.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveState
                                        className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                                            link.active
                                                ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                                                : link.url
                                                ? 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700'
                                                : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Change Status Modal */}
                {isStatusModalOpen && selectedSub && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-4">
                                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                    <Edit2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        Update Subscription Status
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Subscription #{selectedSub.id} for {selectedSub.user?.name || 'User'}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateStatus} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Select New Status *
                                    </label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="active">Active (Full Access Granted)</option>
                                        <option value="trialing">Trialing</option>
                                        <option value="past_due">Past Due</option>
                                        <option value="canceled">Canceled</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                    <p className="text-[11px] text-slate-400 mt-1.5">
                                        Setting status to 'Active' unlocks instant analysis permissions for this candidate. All changes write to the audit log.
                                    </p>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            setIsStatusModalOpen(false);
                                            setSelectedSub(null);
                                        }}
                                        className="border-slate-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white"
                                    >
                                        Update Status
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Cancel Confirmation Modal */}
                {cancelingSub && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
                                <Ban className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white text-center">
                                Cancel Subscription #{cancelingSub.id}
                            </h3>
                            <p className="text-sm text-slate-300 text-center mt-2">
                                Are you sure you want to cancel the{' '}
                                <strong className="text-white">{cancelingSub.plan?.name || 'subscription'}</strong> for{' '}
                                <strong className="text-white">{cancelingSub.user?.name}</strong>?
                            </p>
                            <p className="text-xs text-slate-400 text-center mt-2">
                                The subscription will be marked as canceled immediately and recorded in the audit logs.
                            </p>

                            <div className="flex items-center gap-3 mt-6">
                                <Button
                                    onClick={() => setCancelingSub(null)}
                                    variant="secondary"
                                    className="flex-1 border-slate-700"
                                >
                                    Keep Active
                                </Button>
                                <Button
                                    onClick={handleCancelSubscription}
                                    variant="danger"
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                                >
                                    Confirm Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
