import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import BrandLogo from '@/Components/BrandLogo';
import { DarkModeToggle, Toast, Badge } from '@/Components/UI';
import {
    Shield,
    Users,
    CreditCard,
    FileCheck2,
    Settings,
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    ExternalLink,
    ChevronRight,
    Cpu,
    HelpCircle,
    Mail,
} from 'lucide-react';

interface AdminLayoutProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
}

export default function AdminLayout({
    title,
    description,
    children,
}: AdminLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    const [mobileOpen, setMobileOpen] = useState(false);

    const user = auth.user;

    const navItems = [
        {
            label: 'Dashboard',
            href: route('admin.dashboard'),
            icon: LayoutDashboard,
            active: route().current('admin.dashboard'),
        },
        {
            label: 'Users',
            href: route('admin.users.index'),
            icon: Users,
            active: route().current('admin.users.*'),
        },
        {
            label: 'CV Analyses',
            href: route('admin.analyses.index'),
            icon: FileCheck2,
            active: route().current('admin.analyses.*'),
        },
        {
            label: 'Plans',
            href: route('admin.plans.index'),
            icon: CreditCard,
            active: route().current('admin.plans.*'),
        },
        {
            label: 'Subscriptions',
            href: route('admin.subscriptions.index'),
            icon: Shield,
            active: route().current('admin.subscriptions.*'),
        },
        {
            label: 'Payments',
            href: route('admin.payments.index'),
            icon: CreditCard,
            active: route().current('admin.payments.*'),
        },
        {
            label: 'AI Models',
            href: route('admin.ai-models.index'),
            icon: Cpu,
            active: route().current('admin.ai-models.*'),
        },
        {
            label: 'FAQs',
            href: route('admin.faqs.index'),
            icon: HelpCircle,
            active: route().current('admin.faqs.*'),
        },
        {
            label: 'Contact Messages',
            href: route('admin.contact-messages.index'),
            icon: Mail,
            active: route().current('admin.contact-messages.*'),
        },
        {
            label: 'Settings',
            href: route('admin.settings.index'),
            icon: Settings,
            active: route().current('admin.settings.*'),
        },
        {
            label: 'Audit Logs',
            href: route('admin.audit-logs.index'),
            icon: Shield,
            active: route().current('admin.audit-logs.*'),
        },
    ];

    return (
        <div className="bg-mesh min-h-screen flex flex-col md:flex-row text-slate-800 dark:text-slate-100 transition-colors duration-300">
            {/* Desktop Admin Sidebar */}
            <aside className="hidden md:flex w-64 flex-col glass-sidebar fixed inset-y-0 z-30 justify-between p-4 border-r border-amber-500/20">
                <div className="space-y-6">
                    <div className="px-2 py-1 flex items-center justify-between">
                        <BrandLogo size="md" />
                    </div>

                    <div className="px-2">
                        <Badge variant="warning" dot size="sm" className="w-full justify-center">
                            Admin Console
                        </Badge>
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
                                            ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25 dark:bg-amber-500'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
                                    }`}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}

                        <div className="pt-4 border-t border-slate-200/50 dark:border-white/10">
                            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Switch Views
                            </span>
                            <div className="mt-2 space-y-1">
                                <Link
                                    href={route('dashboard')}
                                    className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                                >
                                    <span>User Dashboard</span>
                                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                                </Link>
                                <Link
                                    href="/"
                                    className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                                >
                                    <span>Public Website</span>
                                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                                </Link>
                            </div>
                        </div>
                    </nav>
                </div>

                {/* Bottom User Card */}
                <div className="pt-4 border-t border-slate-200/50 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex flex-col min-w-0">
                            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {user?.name}
                            </span>
                            <span className="truncate text-xs text-amber-600 dark:text-amber-400 font-medium">
                                Administrator
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
            <div className="md:hidden glass-header sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-amber-500/20">
                <div className="flex items-center gap-2">
                    <BrandLogo size="sm" />
                    <Badge variant="warning" size="sm">Admin</Badge>
                </div>
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
                        <Link
                            href={route('dashboard')}
                            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            <span>User Dashboard</span>
                        </Link>
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
                <header className="hidden md:flex h-16 items-center justify-between px-8 glass-header">
                    <div>
                        {title && (
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {title}
                            </h1>
                        )}
                        {description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <DarkModeToggle />
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>

            <Toast />
        </div>
    );
}
