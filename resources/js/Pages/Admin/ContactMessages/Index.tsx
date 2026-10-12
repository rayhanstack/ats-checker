import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, Badge, Button } from '@/Components/UI';
import {
    Mail,
    Search,
    RotateCcw,
    Check,
    Trash2,
    Eye,
    Send,
    X,
    Clock,
    User,
    Inbox,
    MessageSquare,
    ExternalLink,
} from 'lucide-react';

interface ContactMessageItem {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'new' | 'read' | 'replied';
    ip: string | null;
    created_at: string;
    formatted_date: string;
}

interface ContactMessagesIndexProps {
    messages: {
        data: ContactMessageItem[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search: string;
        status: string;
    };
    stats: {
        total: number;
        new: number;
        read: number;
        replied: number;
    };
}

export default function Index({
    messages,
    filters,
    stats,
}: ContactMessagesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    // Detail drawer state
    const [selectedMessage, setSelectedMessage] = useState<ContactMessageItem | null>(null);
    const [deletingMessage, setDeletingMessage] = useState<ContactMessageItem | null>(null);

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(
            route('admin.contact-messages.index'),
            {
                search: overrides.search !== undefined ? overrides.search : search,
                status: overrides.status !== undefined ? overrides.status : statusFilter,
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
        router.get(route('admin.contact-messages.index'));
    };

    const openMessageDetail = (msg: ContactMessageItem) => {
        setSelectedMessage(msg);
        if (msg.status === 'new') {
            router.post(route('admin.contact-messages.mark-read', msg.id), {}, { preserveScroll: true });
        }
    };

    const handleMarkReplied = (msg: ContactMessageItem) => {
        router.post(route('admin.contact-messages.mark-replied', msg.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                if (selectedMessage && selectedMessage.id === msg.id) {
                    setSelectedMessage({ ...selectedMessage, status: 'replied' });
                }
            },
        });
    };

    const handleDelete = () => {
        if (!deletingMessage) return;
        router.delete(route('admin.contact-messages.destroy', deletingMessage.id), {
            onSuccess: () => {
                if (selectedMessage && selectedMessage.id === deletingMessage.id) {
                    setSelectedMessage(null);
                }
                setDeletingMessage(null);
            },
        });
    };

    const getStatusBadge = (status: ContactMessageItem['status']) => {
        switch (status) {
            case 'new':
                return (
                    <Badge variant="primary" className="text-xs uppercase font-bold bg-indigo-500/20 text-indigo-300 border-indigo-500/40">
                        New
                    </Badge>
                );
            case 'replied':
                return (
                    <Badge variant="success" className="text-xs">
                        Replied
                    </Badge>
                );
            case 'read':
            default:
                return (
                    <Badge variant="default" className="text-xs">
                        Read
                    </Badge>
                );
        }
    };

    return (
        <AdminLayout>
            <Head title="Contact Messages - Admin" />

            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                Contact Inquiries Inbox
                            </h1>
                            <p className="text-sm text-slate-400">
                                Support tickets and general contact requests submitted through the public website.
                            </p>
                        </div>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Inquiries</p>
                        <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                    </Card>
                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Unread (New)</p>
                        <p className="text-2xl font-bold text-indigo-400 mt-1">{stats.new}</p>
                    </Card>
                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Read</p>
                        <p className="text-2xl font-bold text-slate-300 mt-1">{stats.read}</p>
                    </Card>
                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Replied</p>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.replied}</p>
                    </Card>
                </div>

                {/* Filter Toolbar */}
                <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                    <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-8 relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, email, subject, or message content..."
                                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

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
                                <option value="new">New (Unread)</option>
                                <option value="read">Read</option>
                                <option value="replied">Replied</option>
                            </select>
                        </div>

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
                    </form>
                </Card>

                {/* Messages Table */}
                <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5">Sender</th>
                                    <th className="px-5 py-3.5">Subject</th>
                                    <th className="px-5 py-3.5">Received At</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {messages.data.length > 0 ? (
                                    messages.data.map((msg) => (
                                        <tr
                                            key={msg.id}
                                            className={`hover:bg-slate-800/40 transition cursor-pointer ${
                                                msg.status === 'new' ? 'bg-indigo-950/20 font-medium' : ''
                                            }`}
                                            onClick={() => openMessageDetail(msg)}
                                        >
                                            <td className="px-5 py-4">
                                                {getStatusBadge(msg.status)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-white font-semibold">{msg.name}</span>
                                                <p className="text-xs text-slate-400 font-mono">{msg.email}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-slate-200 line-clamp-1">{msg.subject}</span>
                                                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{msg.message}</p>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-slate-400 font-mono">
                                                {msg.formatted_date}
                                            </td>
                                            <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        onClick={() => openMessageDetail(msg)}
                                                        variant="secondary"
                                                        size="sm"
                                                        className="text-xs p-1.5"
                                                        title="Read Message"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => setDeletingMessage(msg)}
                                                        variant="danger"
                                                        size="sm"
                                                        className="text-xs p-1.5 border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                                            <Inbox className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                            <p className="text-sm">No contact inquiries found matching criteria.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {messages.links && messages.links.length > 3 && (
                        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                            <div>
                                Showing Page {messages.current_page} of {messages.last_page} ({messages.total} total)
                            </div>
                            <div className="flex items-center gap-1">
                                {messages.links.map((link, idx) => (
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

                {/* Message Detail Drawer */}
                {selectedMessage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(selectedMessage.status)}
                                    <span className="text-xs text-slate-400 font-mono">#{selectedMessage.id}</span>
                                </div>
                                <button
                                    onClick={() => setSelectedMessage(null)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedMessage.subject}</h2>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                                        <div className="flex items-center gap-1">
                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                            <strong className="text-white">{selectedMessage.name}</strong>
                                        </div>
                                        <span>•</span>
                                        <span className="font-mono text-indigo-400">{selectedMessage.email}</span>
                                        <span>•</span>
                                        <span>{selectedMessage.formatted_date}</span>
                                        {selectedMessage.ip && (
                                            <>
                                                <span>•</span>
                                                <span className="font-mono text-slate-500">IP: {selectedMessage.ip}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                                    {selectedMessage.message}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                    <div className="flex items-center gap-2">
                                        {selectedMessage.status !== 'replied' && (
                                            <Button
                                                onClick={() => handleMarkReplied(selectedMessage)}
                                                variant="secondary"
                                                size="sm"
                                                className="text-xs border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                                            >
                                                <Check className="w-3.5 h-3.5 mr-1" />
                                                Mark Replied
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => setDeletingMessage(selectedMessage)}
                                            variant="danger"
                                            size="sm"
                                            className="text-xs border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                                            Delete
                                        </Button>
                                    </div>

                                    <a
                                        href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                                        onClick={() => handleMarkReplied(selectedMessage)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        Reply by Email
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {deletingMessage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
                            <h3 className="text-lg font-bold text-white text-center">Delete Inquiry</h3>
                            <p className="text-sm text-slate-300 text-center mt-2">
                                Delete message from <strong className="text-white">{deletingMessage.name}</strong> ({deletingMessage.subject})?
                            </p>
                            <div className="flex items-center gap-3 mt-6">
                                <Button
                                    onClick={() => setDeletingMessage(null)}
                                    variant="secondary"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDelete}
                                    variant="danger"
                                    className="flex-1 bg-red-600 text-white"
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
