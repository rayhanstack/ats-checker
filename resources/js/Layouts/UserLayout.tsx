import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import BrandLogo from '@/Components/BrandLogo';
import { DarkModeToggle, Toast, Badge } from '@/Components/UI';
import {
    LayoutDashboard,
    FileText,
    CreditCard,
    User as UserIcon,
    LogOut,
    Menu,
    X,
    Clock,
    Sparkles,
    Shield,
} from 'lucide-react';

interface UserLayoutProps {
    title?: string;
    children: React.ReactNode;
}

export default function UserLayout({ title, children }: UserLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    const [mobileOpen, setMobileOpen] = useState(false);

    const user = auth.user;

    const navItems = [
        {
            label: 'Dashboard',
            href: route('dashboard'),
            icon: LayoutDashboard,
            active: route().current('dashboard'),
        },
        {
            label: 'Profile & Settings',
            href: route('profile.edit'),
            icon: UserIcon,
            active: route().current('profile.edit'),
        },
    ];

    // Compute trial remaining days
    const trialDaysLeft = React.useMemo(() => {
        if (!user?.trial_ends_at) return null;
        const end = new Date(user.trial_ends_at);
        const now = new Date();
        const diffMs = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }, [user?.trial_ends_at]);

    return (
        <div className="bg-mesh min-h-screen flex flex-col md:flex-row text-slate-800 dark:text-slate-100 transition-colors duration-300">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col glass-sidebar fixed inset-y-0 z-30 justify-between p-4">
                <div className="space-y-6">
                    <div className="px-2 py-1">
                        <BrandLogo size="md" />
                    </div>

                    {/* Trial / Plan Status Card */}
                    <div className="rounded-xl border border-indigo-200/50 bg-indigo-50/70 p-3.5 backdrop-blur-md dark:border-indigo-900/40 dark:bg-indigo-950/40">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                {user?.has_active_trial ? 'Free Trial' : 'Subscription'}
                            </span>
                            <Badge variant={user?.has_active_trial ? 'primary' : 'default'} size="sm">
                                {user?.has_active_trial ? `${trialDaysLeft}d left` : 'Active'}
                            </Badge>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                            {user?.has_active_trial
                                ? 'Full ATS analysis features unlocked during trial.'
                                : 'Manage your subscription anytime.'}
                        </p>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                                        item.active
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 dark:bg-indigo-500'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
                                    }`}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}

                        {user?.is_admin && (
                            <Link
                                href={route('admin.dashboard')}
                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-amber-700 bg-amber-50/80 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/60 transition-all"
                            >
                                <Shield className="h-4 w-4 shrink-0 text-amber-500" />
                                <span>Admin Console</span>
                            </Link>
                        )}
                    </nav>
                </div>

                {/* Bottom User Profile & Controls */}
                <div className="pt-4 border-t border-slate-200/50 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex flex-col min-w-0">
                            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {user?.name}
                            </span>
                            <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {user?.email}
                            </span>
                        </div>
                        <DarkModeToggle />
                    </div>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white/60 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-white/10 dark:bg-slate-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Log Out</span>
                    </Link>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden glass-header sticky top-0 z-40 flex items-center justify-between px-4 py-3">
                <BrandLogo size="sm" />
                <div className="flex items-center gap-2">
                    <DarkModeToggle />
                    <button
                        type="button"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle navigation drawer"
                        className="rounded-xl border border-slate-200/60 bg-white/70 p-2 text-slate-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="md:hidden glass-sidebar border-b border-slate-200/60 p-4 space-y-4">
                    <div className="rounded-xl border border-indigo-200/50 bg-indigo-50/70 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/40 text-xs">
                        <div className="flex justify-between font-semibold text-indigo-700 dark:text-indigo-300">
                            <span>Status</span>
                            <span>{user?.has_active_trial ? `${trialDaysLeft} days left` : 'Active'}</span>
                        </div>
                    </div>
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                        {user?.is_admin && (
                            <Link
                                href={route('admin.dashboard')}
                                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-400"
                            >
                                <Shield className="h-4 w-4" />
                                <span>Admin Console</span>
                            </Link>
                        )}
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Log Out</span>
                        </Link>
                    </nav>
                </div>
            )}

            {/* Main Area */}
            <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
                {/* Topbar on Desktop */}
                <header className="hidden md:flex h-16 items-center justify-between px-8 glass-header">
                    <div>
                        {title && (
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {title}
                            </h1>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                        >
                            View Public Site
                        </Link>
                        <DarkModeToggle />
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>

            <Toast />
        </div>
    );
}
