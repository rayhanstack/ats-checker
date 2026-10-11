import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import BrandLogo from '@/Components/BrandLogo';
import { DarkModeToggle, Button, Toast } from '@/Components/UI';
import { ArrowRight, Menu, X, Shield, Sparkles } from 'lucide-react';

interface PublicLayoutProps {
    children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
    const { auth, settings } = usePage<PageProps>().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { label: 'Features', href: '/#features' },
        { label: 'How it works', href: '/#how-it-works' },
        { label: 'Pricing', href: '/#pricing' },
        { label: 'FAQ', href: '/#faq' },
        { label: 'Contact', href: '/#contact' },
    ];

    return (
        <div className="bg-mesh min-h-screen flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-300">
            {/* Top Announcement Bar if trial */}
            <div className="bg-indigo-600/90 dark:bg-indigo-950/80 backdrop-blur-md text-white text-xs py-2 px-4 text-center font-medium border-b border-white/10 flex items-center justify-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>
                    Start optimizing today with our <strong>{settings?.trial_days ?? 7}-day free trial</strong>. No credit card required!
                </span>
            </div>

            {/* Sticky Glass Navbar */}
            <header className="sticky top-0 z-40 w-full glass-header">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
                    <BrandLogo />

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="hidden sm:flex items-center gap-3">
                        <DarkModeToggle />

                        {auth.user ? (
                            <Link href={auth.user.is_admin ? route('admin.dashboard') : route('dashboard')}>
                                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                                    {auth.user.is_admin ? 'Admin Console' : 'Go to Dashboard'}
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')}>
                                    <Button variant="ghost" size="sm">
                                        Log in
                                    </Button>
                                </Link>
                                <Link href={route('register')}>
                                    <Button variant="primary" size="sm">
                                        Start Free Trial
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex sm:hidden items-center gap-2">
                        <DarkModeToggle />
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle Navigation Menu"
                            className="rounded-xl border border-slate-200/60 bg-white/70 p-2 text-slate-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown */}
                {mobileMenuOpen && (
                    <div className="sm:hidden border-b border-slate-200/60 bg-white/95 px-4 pt-2 pb-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 animate-in slide-in-from-top-2">
                        <div className="flex flex-col space-y-3 pt-2">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-slate-900"
                                >
                                    {link.label}
                                </a>
                            ))}

                            <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-white/10 flex flex-col gap-2">
                                {auth.user ? (
                                    <Link href={route('dashboard')}>
                                        <Button variant="primary" className="w-full">
                                            Dashboard
                                        </Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link href={route('login')}>
                                            <Button variant="outline" className="w-full">
                                                Log in
                                            </Button>
                                        </Link>
                                        <Link href={route('register')}>
                                            <Button variant="primary" className="w-full">
                                                Start Free Trial
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main className="flex-1">{children}</main>

            {/* Glass Footer */}
            <footer className="border-t border-slate-200/50 bg-white/60 dark:border-white/10 dark:bg-slate-950/60 backdrop-blur-xl py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="space-y-4 md:col-span-2">
                            <BrandLogo />
                            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
                                {settings?.site_tagline || 'AI-Powered Resume Optimization & ATS Scoring. Tailor your resume precisely for applicant tracking systems and land more interviews.'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                                <Shield className="h-4 w-4 text-emerald-500" />
                                <span>Privacy-first design. We never share or sell your resume data.</span>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                                Product
                            </h4>
                            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li><a href="/#features" className="hover:text-indigo-600 dark:hover:text-indigo-400">Features</a></li>
                                <li><a href="/#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400">How It Works</a></li>
                                <li><a href="/#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400">Pricing Plans</a></li>
                                <li><a href="/#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400">FAQ</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                                Account & Legal
                            </h4>
                            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li><Link href={route('login')} className="hover:text-indigo-600 dark:hover:text-indigo-400">Sign In</Link></li>
                                <li><Link href={route('register')} className="hover:text-indigo-600 dark:hover:text-indigo-400">Register</Link></li>
                                <li><a href="#contact" className="hover:text-indigo-600 dark:hover:text-indigo-400">Contact Support</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-200/50 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-500 gap-4">
                        <p>© {new Date().getFullYear()} {settings?.site_name || 'ATS Checker'}. All rights reserved.</p>
                        <p>Built with Laravel, React & Claude AI</p>
                    </div>
                </div>
            </footer>

            <Toast />
        </div>
    );
}
