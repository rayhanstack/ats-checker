import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import BrandLogo from '@/Components/BrandLogo';
import { DarkModeToggle, Button, Toast } from '@/Components/UI';
import {
    ArrowRight,
    Menu,
    X,
    Shield,
    Sparkles,
    Mail,
    Phone,
    MapPin,
} from 'lucide-react';

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
        { label: 'Contact', href: route('contact') },
    ];

    const socialLinks = settings.social_links || {};

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
                            link.href.startsWith('/#') ? (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                                >
                                    {link.label}
                                </a>
                            ) : (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                                >
                                    {link.label}
                                </Link>
                            )
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
                                link.href.startsWith('/#') ? (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-slate-900"
                                    >
                                        {link.label}
                                    </a>
                                ) : (
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-slate-900"
                                    >
                                        {link.label}
                                    </Link>
                                )
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
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        {/* Col 1: Brand & Bio */}
                        <div className="space-y-4 md:col-span-2">
                            <BrandLogo />
                            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
                                {settings?.site_tagline || 'AI-Powered Resume Optimization & ATS Scoring. Tailor your resume precisely for applicant tracking systems and land more interviews.'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Strict privacy policy. Resumes purged after retention window.</span>
                            </div>

                            {/* Social Icons from Settings */}
                            <div className="flex items-center gap-3 pt-2">
                                {socialLinks.twitter && (
                                    <a
                                        href={socialLinks.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Twitter / X"
                                        className="h-8 w-8 rounded-lg border border-slate-200/70 bg-white/70 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-300 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    </a>
                                )}
                                {socialLinks.linkedin && (
                                    <a
                                        href={socialLinks.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="LinkedIn"
                                        className="h-8 w-8 rounded-lg border border-slate-200/70 bg-white/70 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-300 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                        </svg>
                                    </a>
                                )}
                                {socialLinks.github && (
                                    <a
                                        href={socialLinks.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="GitHub"
                                        className="h-8 w-8 rounded-lg border border-slate-200/70 bg-white/70 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-300 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Col 2: Navigation */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                Product
                            </h4>
                            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li><a href="/#features" className="hover:text-indigo-600 dark:hover:text-indigo-400">Features</a></li>
                                <li><a href="/#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400">How It Works</a></li>
                                <li><a href="/#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400">Pricing Plans</a></li>
                                <li><a href="/#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400">FAQ</a></li>
                            </ul>
                        </div>

                        {/* Col 3: Legal & About */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                Company & Legal
                            </h4>
                            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li><Link href={route('about')} className="hover:text-indigo-600 dark:hover:text-indigo-400">About Us</Link></li>
                                <li><Link href={route('privacy')} className="hover:text-indigo-600 dark:hover:text-indigo-400">Privacy Policy</Link></li>
                                <li><Link href={route('terms')} className="hover:text-indigo-600 dark:hover:text-indigo-400">Terms of Service</Link></li>
                                <li><Link href={route('contact')} className="hover:text-indigo-600 dark:hover:text-indigo-400">Contact Us</Link></li>
                            </ul>
                        </div>

                        {/* Col 4: Contact Section from Settings */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                Contact & Support
                            </h4>
                            <ul className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-400">
                                {settings.contact_email && (
                                    <li className="flex items-start gap-2">
                                        <Mail className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                                        <a href={`mailto:${settings.contact_email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 break-all">
                                            {settings.contact_email}
                                        </a>
                                    </li>
                                )}
                                {settings.contact_phone && (
                                    <li className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-indigo-500 shrink-0" />
                                        <a href={`tel:${settings.contact_phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                                            {settings.contact_phone}
                                        </a>
                                    </li>
                                )}
                                {settings.contact_address && (
                                    <li className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                                        <span>{settings.contact_address}</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-200/50 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-500 gap-4">
                        <p>© {new Date().getFullYear()} {settings?.site_name || 'ATS Checker'}. All rights reserved.</p>
                        <p>Powered by Claude AI • Built with Laravel & React</p>
                    </div>
                </div>
            </footer>

            <Toast />
        </div>
    );
}
