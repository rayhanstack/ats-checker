import React from 'react';
import BrandLogo from '@/Components/BrandLogo';
import { DarkModeToggle, Card, Toast } from '@/Components/UI';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
}

export default function AuthLayout({
    title,
    description,
    children,
}: AuthLayoutProps) {
    return (
        <div className="bg-mesh min-h-screen flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 text-slate-800 dark:text-slate-100 transition-colors duration-300">
            {/* Top Navigation */}
            <div className="mx-auto flex w-full max-w-md items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to home</span>
                </Link>
                <DarkModeToggle />
            </div>

            {/* Auth Card Container */}
            <div className="mx-auto my-auto w-full max-w-md">
                <div className="mb-6 flex flex-col items-center text-center">
                    <BrandLogo size="lg" />
                    {title && (
                        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                            {title}
                        </h1>
                    )}
                    {description && (
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                            {description}
                        </p>
                    )}
                </div>

                <Card padding="lg" className="shadow-glass-lg border-white/60 dark:border-white/10">
                    {children}
                </Card>
            </div>

            {/* Simple Footer */}
            <div className="mx-auto text-center text-xs text-slate-500 dark:text-slate-500">
                <p>© {new Date().getFullYear()} ATS Checker. All rights reserved.</p>
            </div>

            <Toast />
        </div>
    );
}
