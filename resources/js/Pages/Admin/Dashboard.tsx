import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/UI';
import { Users, Sparkles, Shield, UserCheck } from 'lucide-react';
import { User } from '@/types';

interface AdminDashboardProps {
    stats: {
        total_users: number;
        active_trials: number;
        admin_users: number;
    };
    recent_users: (User & { created_at: string })[];
}

export default function AdminDashboard({ stats, recent_users }: AdminDashboardProps) {
    return (
        <AdminLayout
            title="Administration Overview"
            description="System metrics, user accounts, and ATS engine status"
        >
            <Head title="Admin Console" />

            <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <Card padding="md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Total Users
                                </p>
                                <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                                    {stats.total_users}
                                </p>
                            </div>
                            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                <Users className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>

                    <Card padding="md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Active 7-Day Trials
                                </p>
                                <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                                    {stats.active_trials}
                                </p>
                            </div>
                            <div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                                <Sparkles className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>

                    <Card padding="md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Admin Operators
                                </p>
                                <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                                    {stats.admin_users}
                                </p>
                            </div>
                            <div className="rounded-xl bg-purple-50 p-3 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                                <Shield className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Recent Users Table */}
                <Card padding="none" className="overflow-hidden">
                    <div className="p-6 border-b border-slate-200/50 dark:border-white/10">
                        <CardHeader className="mb-0">
                            <div>
                                <CardTitle>Recent Registered Accounts</CardTitle>
                                <CardDescription>User credentials, status and remaining trial windows</CardDescription>
                            </div>
                        </CardHeader>
                    </div>

                    <Table className="border-0">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Trial Expiration</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recent_users.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-semibold text-slate-900 dark:text-white">
                                        {u.name}
                                    </TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-300">
                                        {u.email}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={u.role === 'admin' ? 'warning' : 'default'} size="sm">
                                            {u.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={u.is_active ? 'success' : 'danger'} dot size="sm">
                                            {u.is_active ? 'Active' : 'Disabled'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                                        {u.trial_ends_at ? new Date(u.trial_ends_at).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </AdminLayout>
    );
}
