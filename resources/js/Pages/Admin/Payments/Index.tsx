import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, Badge, Button } from '@/Components/UI';
import {
    DollarSign,
    Search,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    XCircle,
    RotateCcw as RefundIcon,
    FileText,
    Info,
    Calendar,
    CreditCard,
    ArrowUpRight,
    Check,
} from 'lucide-react';

interface PaymentItem {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    plan_name: string;
    amount: number;
    formatted_amount: string;
    currency: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    gateway: string;
    invoice_number: string | null;
    paid_at: string | null;
    created_at: string;
    formatted_date: string;
}

interface PaymentsIndexProps {
    payments: {
        data: PaymentItem[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search: string;
        status: string;
        gateway: string;
    };
    stats: {
        total_count: number;
        paid_count: number;
        pending_count: number;
        refunded_count: number;
        total_revenue: number;
    };
}

export default function Index({
    payments,
    filters,
    stats,
}: PaymentsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [gatewayFilter, setGatewayFilter] = useState(filters.gateway || 'all');

    // Action modals
    const [markingPaidPayment, setMarkingPaidPayment] = useState<PaymentItem | null>(null);
    const [refundingPayment, setRefundingPayment] = useState<PaymentItem | null>(null);

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(
            route('admin.payments.index'),
            {
                search: overrides.search !== undefined ? overrides.search : search,
                status: overrides.status !== undefined ? overrides.status : statusFilter,
                gateway: overrides.gateway !== undefined ? overrides.gateway : gatewayFilter,
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
        setGatewayFilter('all');
        router.get(route('admin.payments.index'));
    };

    const handleConfirmMarkPaid = () => {
        if (!markingPaidPayment) return;
        router.post(
            route('admin.payments.mark-paid', markingPaidPayment.id),
            {},
            {
                onSuccess: () => setMarkingPaidPayment(null),
            }
        );
    };

    const handleConfirmRefund = () => {
        if (!refundingPayment) return;
        router.post(
            route('admin.payments.refund', refundingPayment.id),
            {},
            {
                onSuccess: () => setRefundingPayment(null),
            }
        );
    };

    const getStatusBadge = (status: PaymentItem['status']) => {
        switch (status) {
            case 'paid':
                return (
                    <Badge variant="success" className="capitalize flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Paid
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge variant="warning" className="capitalize flex items-center gap-1 bg-amber-500/10 text-amber-400 border-amber-500/30">
                        <AlertCircle className="w-3 h-3" />
                        Pending
                    </Badge>
                );
            case 'refunded':
                return (
                    <Badge variant="info" className="capitalize flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                        <RefundIcon className="w-3 h-3" />
                        Refunded
                    </Badge>
                );
            case 'failed':
            default:
                return (
                    <Badge variant="danger" className="capitalize flex items-center gap-1 bg-red-500/10 text-red-400 border-red-500/30">
                        <XCircle className="w-3 h-3" />
                        Failed
                    </Badge>
                );
        }
    };

    return (
        <AdminLayout>
            <Head title="Payments & Invoices - Admin" />

            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                Payments & Invoices
                            </h1>
                            <p className="text-sm text-slate-400">
                                Reconcile candidate transactions, mark pending payments as paid, and issue invoice IDs.
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
                            Automated webhooks and live card gateways (e.g. Stripe/PayPal) are in manual simulation mode. When a candidate completes a manual checkout, admins can click "Mark as Paid" below. This generates an invoice number (INV-YYYYMMDD-XXXXXX), activates their subscription immediately, and logs the change in audit history.
                        </p>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Collected</p>
                                <p className="text-2xl font-bold text-emerald-400 mt-1">
                                    ${stats.total_revenue.toFixed(2)}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Paid Invoices</p>
                                <p className="text-2xl font-bold text-white mt-1">{stats.paid_count}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Pending Approval</p>
                                <p className="text-2xl font-bold text-amber-400 mt-1">{stats.pending_count}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Refunded</p>
                                <p className="text-2xl font-bold text-indigo-400 mt-1">{stats.refunded_count}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                <RefundIcon className="w-5 h-5" />
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
                                    placeholder="Search invoice number, candidate name or email..."
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
                                    <option value="all">All Payment Statuses</option>
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                    <option value="refunded">Refunded</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>

                            {/* Gateway filter */}
                            <div className="sm:col-span-3">
                                <select
                                    value={gatewayFilter}
                                    onChange={(e) => {
                                        setGatewayFilter(e.target.value);
                                        applyFilters({ gateway: e.target.value });
                                    }}
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">All Gateways</option>
                                    <option value="manual">Manual</option>
                                    <option value="stripe">Stripe</option>
                                    <option value="paypal">PayPal</option>
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

                {/* Payments Table */}
                <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="px-5 py-3.5">Invoice #</th>
                                    <th className="px-5 py-3.5">Candidate</th>
                                    <th className="px-5 py-3.5">Plan</th>
                                    <th className="px-5 py-3.5">Amount</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5">Gateway</th>
                                    <th className="px-5 py-3.5">Paid At</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {payments.data.length > 0 ? (
                                    payments.data.map((pay) => (
                                        <tr key={pay.id} className="hover:bg-slate-800/30 transition">
                                            {/* Invoice Number */}
                                            <td className="px-5 py-4">
                                                {pay.invoice_number ? (
                                                    <span className="font-mono text-xs font-semibold text-white px-2 py-1 rounded-md bg-slate-800 border border-slate-700/80">
                                                        {pay.invoice_number}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic">Pending invoice</span>
                                                )}
                                                <p className="text-[10px] text-slate-400 mt-1">{pay.formatted_date}</p>
                                            </td>

                                            {/* Candidate */}
                                            <td className="px-5 py-4">
                                                {pay.user ? (
                                                    <div>
                                                        <Link
                                                            href={route('admin.users.show', pay.user.id)}
                                                            className="font-semibold text-white hover:text-indigo-400 transition"
                                                        >
                                                            {pay.user.name}
                                                        </Link>
                                                        <p className="text-xs text-slate-400">{pay.user.email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic">User deleted</span>
                                                )}
                                            </td>

                                            {/* Plan Name */}
                                            <td className="px-5 py-4">
                                                <span className="font-medium text-slate-200">
                                                    {pay.plan_name}
                                                </span>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-5 py-4">
                                                <span className="font-bold text-white text-base">
                                                    {pay.formatted_amount}
                                                </span>
                                                <span className="text-xs text-slate-400 ml-1 uppercase">
                                                    {pay.currency}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                {getStatusBadge(pay.status)}
                                            </td>

                                            {/* Gateway */}
                                            <td className="px-5 py-4">
                                                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/80 font-mono uppercase text-slate-300">
                                                    {pay.gateway}
                                                </span>
                                            </td>

                                            {/* Paid At */}
                                            <td className="px-5 py-4 text-xs text-slate-400 font-mono">
                                                {pay.paid_at || '—'}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {pay.status === 'pending' && (
                                                        <Button
                                                            onClick={() => setMarkingPaidPayment(pay)}
                                                            variant="primary"
                                                            size="sm"
                                                            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                                                        >
                                                            <Check className="w-3.5 h-3.5 mr-1" />
                                                            Mark Paid
                                                        </Button>
                                                    )}

                                                    {pay.status === 'paid' && (
                                                        <Button
                                                            onClick={() => setRefundingPayment(pay)}
                                                            variant="secondary"
                                                            size="sm"
                                                            className="text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                                                        >
                                                            <RefundIcon className="w-3.5 h-3.5 mr-1" />
                                                            Refund
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                                            <DollarSign className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                            <p className="text-sm">No payment records found matching the filter criteria.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {payments.links && payments.links.length > 3 && (
                        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                            <div>
                                Showing Page {payments.current_page} of {payments.last_page} ({payments.total} total)
                            </div>
                            <div className="flex items-center gap-1">
                                {payments.links.map((link, idx) => (
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

                {/* Mark as Paid Confirmation Modal */}
                {markingPaidPayment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white text-center">
                                Confirm Payment Approval
                            </h3>
                            <p className="text-sm text-slate-300 text-center mt-2">
                                Mark payment of{' '}
                                <strong className="text-white">{markingPaidPayment.formatted_amount}</strong> from{' '}
                                <strong className="text-white">{markingPaidPayment.user?.name}</strong> as paid?
                            </p>
                            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 my-4 text-xs text-slate-300 space-y-1">
                                <p>• Generates an official invoice number.</p>
                                <p>• Sets payment status to Paid and timestamp to now.</p>
                                <p>• Automatically activates the candidate's subscription tier.</p>
                                <p>• Records entry in admin audit logs.</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={() => setMarkingPaidPayment(null)}
                                    variant="secondary"
                                    className="flex-1 border-slate-700"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirmMarkPaid}
                                    variant="primary"
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                                >
                                    Confirm Paid
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Record Refund Confirmation Modal */}
                {refundingPayment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                                <RefundIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white text-center">
                                Record Refund for Payment #{refundingPayment.id}
                            </h3>
                            <p className="text-sm text-slate-300 text-center mt-2">
                                Mark invoice <strong className="text-white">{refundingPayment.invoice_number || `#${refundingPayment.id}`}</strong> ({refundingPayment.formatted_amount}) as refunded?
                            </p>
                            <p className="text-xs text-slate-400 text-center mt-2">
                                This will update the payment record to "refunded" and log this action in the audit logs.
                            </p>

                            <div className="flex items-center gap-3 mt-6">
                                <Button
                                    onClick={() => setRefundingPayment(null)}
                                    variant="secondary"
                                    className="flex-1 border-slate-700"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirmRefund}
                                    variant="primary"
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                                >
                                    Confirm Refund
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
