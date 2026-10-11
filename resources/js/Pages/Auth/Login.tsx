import React, { FormEventHandler } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { Button, Input } from '@/Components/UI';
import GoogleButton from '@/Components/GoogleButton';
import { Mail, Lock, LogIn, ArrowRight, AlertCircle, Info } from 'lucide-react';
import { PageProps } from '@/types';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { features, flash } = usePage<PageProps>().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title="Welcome Back"
            description="Sign in to your ATS Checker account to analyze resumes and review past scores."
        >
            <Head title="Log In" />

            {/* Status notification */}
            {status && (
                <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {status}
                </div>
            )}

            {/* Flash Info (e.g., guest redirect from /analyze) */}
            {flash?.info && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-50/80 p-3 text-xs font-semibold text-indigo-900 dark:border-indigo-500/40 dark:bg-indigo-950/60 dark:text-indigo-200">
                    <Info className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <span>{flash.info}</span>
                </div>
            )}

            {/* Flash Error */}
            {flash?.error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-50/80 p-3 text-xs font-semibold text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/60 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{flash.error}</span>
                </div>
            )}

            {/* Google OAuth Option */}
            {features?.google_login_enabled && (
                <div className="space-y-4 mb-4">
                    <GoogleButton label="Continue with Google" />

                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200/60 dark:border-white/10" />
                        </div>
                        <span className="relative bg-white/70 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 backdrop-blur-md dark:bg-slate-900/60 dark:text-slate-500">
                            or continue with email
                        </span>
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Email Address"
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    autoComplete="username"
                    autoFocus
                    placeholder="you@example.com"
                    leftIcon={<Mail className="h-4 w-4" />}
                    error={errors.email}
                    onChange={(e) => setData('email', e.target.value)}
                    required
                />

                <Input
                    label="Password"
                    id="password"
                    type="password"
                    name="password"
                    value={data.password}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4" />}
                    showPasswordToggle
                    error={errors.password}
                    onChange={(e) => setData('password', e.target.value)}
                    required
                />

                <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500 dark:border-white/20 dark:bg-slate-900 dark:focus:ring-offset-slate-900"
                        />
                        <span className="text-slate-600 dark:text-slate-400">Remember me</span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        size="md"
                        isLoading={processing}
                        rightIcon={<LogIn className="h-4 w-4" />}
                    >
                        Sign In
                    </Button>
                </div>

                {features?.registration_enabled !== false ? (
                    <div className="pt-4 text-center border-t border-slate-200/50 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                        Don't have an account yet?{' '}
                        <Link
                            href={route('register')}
                            className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center gap-1"
                        >
                            Start 7-day free trial <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                ) : (
                    <div className="pt-4 text-center border-t border-slate-200/50 dark:border-white/10 text-xs text-slate-400">
                        New registrations are currently closed.
                    </div>
                )}
            </form>
        </AuthLayout>
    );
}
