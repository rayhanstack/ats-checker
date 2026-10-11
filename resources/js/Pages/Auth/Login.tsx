import React, { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { Button, Input } from '@/Components/UI';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
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

            {status && (
                <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {status}
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

                <div className="pt-4 text-center border-t border-slate-200/50 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                    Don't have an account yet?{' '}
                    <Link
                        href={route('register')}
                        className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center gap-1"
                    >
                        Start 7-day free trial <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}
