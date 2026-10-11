import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, Badge, Button } from '@/Components/UI';
import { Shield, Search, Clock, User, Filter, ArrowUpDown } from 'lucide-react';

interface AuditLogItem {
    id: number;
    admin_name: string;
    admin_email: string;
    action: string;
    target_type: string;
    target_id: number | null;
    meta: Record<string, any> | null;
    ip: string | null;
    created_at: string;
    formatted_date: string;
}

interface AuditLogsIndexProps {
    logs: {
        data: AuditLogItem[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        action: string;
    };
}

export default function Index({ logs, filters }: AuditLogsIndexProps) {
    const [actionFilter, setActionFilter] = useState(filters.action || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.audit-logs.index'),
            { action: actionFilter },
            { preserveState: true, replace: true }
        );
    };

    const getActionBadge = (action: string) => {
        if (action.includes('delete')) return 'danger';
        if (action.includes('create') || action.includes('assign')) return 'success';
        if (action.includes('extend') || action.includes('toggle')) return 'warning';
        return 'default';
    };

    return (
        <AdminLayout
            title="Security Audit Logs"
            description="Immutable record of administrative actions, account mutations, and subscription adjustments."
        >
            <Head title="Audit Logs - Admin Console" />

            <div className="space-y-6">
                {/* Search Bar */}
                <Card variant="glass" className="p-4">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value)}
                                placeholder="Filter by action keyword (e.g. user.create, user.delete)..."
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="sm">
                            Apply Filter
                        </Button>
                    </form>
                </Card>

                {/* Audit Logs Table */}
                <Card variant="glass" className="overflow-hidden">
                    <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">Timestamp</th>
                                    <th className="py-3 px-4">Admin Operator</th>
                                    <th className="py-3 px-4">Action</th>
                                    <th className="py-3 px-4">Target Entity</th>
                                    <th className="py-3 px-4">Metadata Payload</th>
                                    <th className="py-3 px-4">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                                {logs.data.length > 0 ? (
                                    logs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                            {/* Timestamp */}
                                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                                {log.formatted_date}
                                            </td>

                                            {/* Admin */}
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {log.admin_name}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {log.admin_email}
                                                </div>
                                            </td>

                                            {/* Action */}
                                            <td className="py-3 px-4">
                                                <Badge variant={getActionBadge(log.action)} size="sm" className="font-mono">
                                                    {log.action}
                                                </Badge>
                                            </td>

                                            {/* Target */}
                                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                                {log.target_type ? (
                                                    <span>
                                                        {log.target_type} #{log.target_id}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">System</span>
                                                )}
                                            </td>

                                            {/* Metadata */}
                                            <td className="py-3 px-4 max-w-xs">
                                                {log.meta ? (
                                                    <pre className="text-[10px] font-mono bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200 dark:border-white/5 overflow-x-auto text-slate-700 dark:text-slate-300">
                                                        {JSON.stringify(log.meta, null, 2)}
                                                    </pre>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>

                                            {/* IP */}
                                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                                                {log.ip || '127.0.0.1'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-400">
                                            No audit events recorded matching your query.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.links.length > 3 && (
                        <div className="p-4 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs">
                            <span className="text-slate-400">
                                Showing page {logs.current_page} of {logs.last_page} ({logs.total} total)
                            </span>
                            <div className="flex gap-1">
                                {logs.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1.5 rounded-lg transition-colors ${
                                            link.active
                                                ? 'bg-amber-600 text-white font-bold'
                                                : link.url
                                                ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                : 'text-slate-400 opacity-50 cursor-not-allowed'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
}
