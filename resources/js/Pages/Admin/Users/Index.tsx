import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, Badge, Button } from '@/Components/UI';
import {
    Users,
    Search,
    Filter,
    Plus,
    Edit2,
    Power,
    KeyRound,
    CalendarPlus,
    CreditCard,
    Trash2,
    Eye,
    Shield,
    X,
    Check,
    AlertCircle,
    Loader2,
    ArrowUpDown,
} from 'lucide-react';

interface UserListItem {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    is_active: boolean;
    has_password: boolean;
    trial_ends_at?: string | null;
    has_active_trial: boolean;
    plan_name: string;
    created_at: string;
    formatted_date: string;
}

interface PlanOption {
    id: number;
    name: string;
    price: string | number;
    billing_interval: string;
}

interface UsersIndexProps {
    users: {
        data: UserListItem[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search: string;
        role: string;
        status: string;
        plan_state: string;
        sort: string;
        direction: string;
    };
    available_plans: PlanOption[];
    stats: {
        total: number;
        admins: number;
        trials: number;
    };
}

export default function Index({
    users,
    filters,
    available_plans,
    stats,
}: UsersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [planStateFilter, setPlanStateFilter] = useState(filters.plan_state || 'all');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
    const [trialUser, setTrialUser] = useState<UserListItem | null>(null);
    const [planUser, setPlanUser] = useState<UserListItem | null>(null);
    const [passwordUser, setPasswordUser] = useState<UserListItem | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null);

    // Filter apply
    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(
            route('admin.users.index'),
            {
                search,
                role: roleFilter,
                status: statusFilter,
                plan_state: planStateFilter,
                sort: filters.sort,
                direction: filters.direction,
                ...overrides,
            },
            { preserveState: true, replace: true }
        );
    };

    // Sorting
    const handleSort = (field: string) => {
        const nextDir = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        applyFilters({ sort: field, direction: nextDir });
    };

    // Forms
    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        role: 'user',
        trial_days: 7,
        is_active: true,
    });

    const editForm = useForm({
        name: '',
        email: '',
        role: 'user',
    });

    const trialForm = useForm({
        days: 7,
    });

    const planForm = useForm({
        plan_id: available_plans[0]?.id || '',
        duration_days: 30,
    });

    const passwordForm = useForm({
        mode: 'manual',
        password: '',
    });

    // Submissions
    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.users.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        editForm.put(route('admin.users.update', editingUser.id), {
            onSuccess: () => setEditingUser(null),
        });
    };

    const submitExtendTrial = (e: React.FormEvent) => {
        e.preventDefault();
        if (!trialUser) return;
        trialForm.post(route('admin.users.extend-trial', trialUser.id), {
            onSuccess: () => setTrialUser(null),
        });
    };

    const submitAssignPlan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!planUser) return;
        planForm.post(route('admin.users.assign-plan', planUser.id), {
            onSuccess: () => setPlanUser(null),
        });
    };

    const submitResetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordUser) return;
        passwordForm.post(route('admin.users.reset-password', passwordUser.id), {
            onSuccess: () => {
                setPasswordUser(null);
                passwordForm.reset();
            },
        });
    };

    const submitDelete = () => {
        if (!deletingUser) return;
        router.delete(route('admin.users.destroy', deletingUser.id), {
            onSuccess: () => setDeletingUser(null),
        });
    };

    const toggleStatus = (user: UserListItem) => {
        router.post(route('admin.users.toggle-status', user.id));
    };

    return (
        <AdminLayout
            title="User Management"
            description="Manage all candidate accounts, permissions, trial periods, and manual subscriptions."
        >
            <Head title="Users - Admin Console" />

            <div className="space-y-6">
                {/* Header Strip & Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Total Accounts: <strong className="text-slate-900 dark:text-white">{stats.total}</strong>
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Admins: <strong className="text-amber-600 dark:text-amber-400">{stats.admins}</strong>
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Active Trials: <strong className="text-indigo-600 dark:text-indigo-400">{stats.trials}</strong>
                        </span>
                    </div>

                    <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => setShowCreateModal(true)}
                    >
                        Create New User
                    </Button>
                </div>

                {/* Filters & Search Toolbar */}
                <Card variant="glass" className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                                placeholder="Search by name or email..."
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        {/* Role Filter */}
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                applyFilters({ role: e.target.value });
                            }}
                            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Roles</option>
                            <option value="user">Candidate (User)</option>
                            <option value="admin">Administrator</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                applyFilters({ status: e.target.value });
                            }}
                            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Deactivated Only</option>
                        </select>

                        {/* Plan State Filter */}
                        <select
                            value={planStateFilter}
                            onChange={(e) => {
                                setPlanStateFilter(e.target.value);
                                applyFilters({ plan_state: e.target.value });
                            }}
                            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Plan States</option>
                            <option value="trial">On Active Trial</option>
                            <option value="active">Active Paid Subscription</option>
                            <option value="expired">Expired / No Plan</option>
                        </select>
                    </div>
                </Card>

                {/* Users Table */}
                <Card variant="glass" className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-1">
                                            <span>User</span>
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </th>
                                    <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('role')}>
                                        <div className="flex items-center gap-1">
                                            <span>Role</span>
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Plan State</th>
                                    <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('created_at')}>
                                        <div className="flex items-center gap-1">
                                            <span>Joined</span>
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                                {users.data.length > 0 ? (
                                    users.data.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                            {/* Name & Email */}
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col">
                                                    <Link
                                                        href={route('admin.users.show', u.id)}
                                                        className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                                                    >
                                                        {u.name}
                                                    </Link>
                                                    <span className="text-[11px] text-slate-400 font-mono">
                                                        {u.email}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="py-3 px-4">
                                                <Badge
                                                    variant={u.role === 'admin' ? 'warning' : 'default'}
                                                    size="sm"
                                                    className="capitalize"
                                                >
                                                    {u.role}
                                                </Badge>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3 px-4">
                                                <Badge
                                                    variant={u.is_active ? 'success' : 'danger'}
                                                    size="sm"
                                                >
                                                    {u.is_active ? 'Active' : 'Deactivated'}
                                                </Badge>
                                            </td>

                                            {/* Plan State */}
                                            <td className="py-3 px-4">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {u.plan_name}
                                                </span>
                                            </td>

                                            {/* Joined */}
                                            <td className="py-3 px-4 text-slate-400">
                                                {u.formatted_date}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* View Detail */}
                                                    <Link href={route('admin.users.show', u.id)}>
                                                        <button
                                                            title="View Profile & Subscriptions"
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </button>
                                                    </Link>

                                                    {/* Edit */}
                                                    <button
                                                        title="Edit User"
                                                        onClick={() => {
                                                            setEditingUser(u);
                                                            editForm.setData({
                                                                name: u.name,
                                                                email: u.email,
                                                                role: u.role,
                                                            });
                                                        }}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>

                                                    {/* Extend Trial */}
                                                    <button
                                                        title="Extend Trial Days"
                                                        onClick={() => {
                                                            setTrialUser(u);
                                                            trialForm.setData('days', 7);
                                                        }}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                                                    >
                                                        <CalendarPlus className="h-3.5 w-3.5" />
                                                    </button>

                                                    {/* Assign Plan */}
                                                    <button
                                                        title="Assign Subscription Plan"
                                                        onClick={() => {
                                                            setPlanUser(u);
                                                            planForm.setData({
                                                                plan_id: available_plans[0]?.id || '',
                                                                duration_days: 30,
                                                            });
                                                        }}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                                    >
                                                        <CreditCard className="h-3.5 w-3.5" />
                                                    </button>

                                                    {/* Password */}
                                                    <button
                                                        title="Reset Password"
                                                        onClick={() => {
                                                            setPasswordUser(u);
                                                            passwordForm.setData({ mode: 'manual', password: '' });
                                                        }}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                                                    >
                                                        <KeyRound className="h-3.5 w-3.5" />
                                                    </button>

                                                    {/* Toggle Status */}
                                                    <button
                                                        title={u.is_active ? 'Deactivate User' : 'Activate User'}
                                                        onClick={() => toggleStatus(u)}
                                                        className={`p-1.5 rounded-lg transition-colors ${
                                                            u.is_active
                                                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                                                : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                                        }`}
                                                    >
                                                        <Power className="h-3.5 w-3.5" />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        title="Delete User"
                                                        onClick={() => setDeletingUser(u)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-400">
                                            No users found matching the selected filter criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.links.length > 3 && (
                        <div className="p-4 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs">
                            <span className="text-slate-400">
                                Showing page {users.current_page} of {users.last_page} ({users.total} total)
                            </span>
                            <div className="flex gap-1">
                                {users.links.map((link, idx) => (
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

            {/* Modal: Create User */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New User Account</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitCreate} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                                    required
                                />
                                {createForm.errors.name && <p className="text-rose-500 mt-0.5">{createForm.errors.name}</p>}
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={createForm.data.email}
                                    onChange={(e) => createForm.setData('email', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                                    required
                                />
                                {createForm.errors.email && <p className="text-rose-500 mt-0.5">{createForm.errors.email}</p>}
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={createForm.data.password}
                                    onChange={(e) => createForm.setData('password', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                                    required
                                />
                                {createForm.errors.password && <p className="text-rose-500 mt-0.5">{createForm.errors.password}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                                    <select
                                        value={createForm.data.role}
                                        onChange={(e) => createForm.setData('role', e.target.value as any)}
                                        className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Trial Days</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={365}
                                        value={createForm.data.trial_days}
                                        onChange={(e) => createForm.setData('trial_days', parseInt(e.target.value) || 0)}
                                        className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" size="sm" disabled={createForm.processing}>
                                    Create Account
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit User */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit User: {editingUser.name}</h3>
                            <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitEdit} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                                    required
                                />
                                {editForm.errors.name && <p className="text-rose-500 mt-0.5">{editForm.errors.name}</p>}
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                                    required
                                />
                                {editForm.errors.email && <p className="text-rose-500 mt-0.5">{editForm.errors.email}</p>}
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                                <select
                                    value={editForm.data.role}
                                    onChange={(e) => editForm.setData('role', e.target.value as any)}
                                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Administrator</option>
                                </select>
                                {editForm.errors.role && <p className="text-rose-500 mt-0.5">{editForm.errors.role}</p>}
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                                <Button type="button" variant="outline" size="sm" onClick={() => setEditingUser(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" size="sm" disabled={editForm.processing}>
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Extend Trial */}
            {trialUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Extend Trial Period</h3>
                            <button onClick={() => setTrialUser(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Add extra days to <strong className="text-slate-800 dark:text-slate-200">{trialUser.name}</strong>'s free scan trial.
                        </p>

                        <form onSubmit={submitExtendTrial} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Additional Days (+N)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={trialForm.data.days}
                                    onChange={(e) => trialForm.setData('days', parseInt(e.target.value) || 1)}
                                    className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                                <Button type="button" variant="outline" size="sm" onClick={() => setTrialUser(null)}>
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

            {/* Modal: Assign Plan */}
            {planUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Assign Subscription Plan</h3>
                            <button onClick={() => setPlanUser(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Manually grant plan access to <strong className="text-slate-800 dark:text-slate-200">{planUser.name}</strong>.
                        </p>

                        <form onSubmit={submitAssignPlan} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Plan</label>
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
                                <Button type="button" variant="outline" size="sm" onClick={() => setPlanUser(null)}>
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

            {/* Modal: Password Reset */}
            {passwordUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Password</h3>
                            <button onClick={() => setPasswordUser(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitResetPassword} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reset Method</label>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="mode"
                                            value="manual"
                                            checked={passwordForm.data.mode === 'manual'}
                                            onChange={() => passwordForm.setData('mode', 'manual')}
                                        />
                                        <span>Set new password directly</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="mode"
                                            value="link"
                                            checked={passwordForm.data.mode === 'link'}
                                            onChange={() => passwordForm.setData('mode', 'link')}
                                        />
                                        <span>Send reset password link via email</span>
                                    </label>
                                </div>
                            </div>

                            {passwordForm.data.mode === 'manual' && (
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Password (min 8 chars)</label>
                                    <input
                                        type="password"
                                        value={passwordForm.data.password}
                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                                        required
                                    />
                                    {passwordForm.errors.password && <p className="text-rose-500 mt-0.5">{passwordForm.errors.password}</p>}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                                <Button type="button" variant="outline" size="sm" onClick={() => setPasswordUser(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" size="sm" disabled={passwordForm.processing}>
                                    Confirm Reset
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Delete User */}
            {deletingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-rose-500/30 space-y-4">
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                            <AlertCircle className="h-5 w-5" />
                            <h3 className="text-base font-bold">Confirm Account Deletion</h3>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300">
                            Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deletingUser.name}</strong> ({deletingUser.email})? This action will remove their account and analyses.
                        </p>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10 text-xs">
                            <Button type="button" variant="outline" size="sm" onClick={() => setDeletingUser(null)}>
                                Cancel
                            </Button>
                            <Button type="button" variant="danger" size="sm" onClick={submitDelete}>
                                Yes, Delete User
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
