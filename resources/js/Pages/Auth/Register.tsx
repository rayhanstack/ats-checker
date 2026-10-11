import React, { FormEventHandler } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { Button, Input, Badge } from '@/Components/UI';
import GoogleButton from '@/Components/GoogleButton';
import { User, Mail, Lock, Sparkles, ArrowRight, AlertCircle, Info } from 'lucide-react';
import { PageProps } from '@/types';

export default function Register() {
    const { settings, features, flash } = usePage<PageProps>().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const isRegistrationDisabled = features?.registration_enabled === false;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    if (isRegistrationDisabled) {
        return (
            <AuthLayout
                title="Registration Closed"
                description="New account registrations are temporarily paused. If you already have an account, please sign in."
            >
                <Head title="Registration Closed" />
                <div className="space-y-4 text-center">
                    <div className="rounded-xl border border-amber-500/30 bg-amber-50/80 p-4 text-xs font-semibold text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/60 dark:text-amber-200">
                        We are currently not accepting new user signups. Please check back later.
                    </div>
                    <Link
                        href={route('login')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-all"
                    >
                        Return to Sign In
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Start Your Free Trial"
            description={`Create your account in 30 seconds. Includes full ${settings?.trial_days ?? 7}-day access to our AI ATS analysis platform.`}
        >
            <Head title="Start Free Trial" />

            <div className="mb-4 flex justify-center">
                <Badge variant="primary" dot size="sm">
                    {settings?.trial_days ?? 7} Days Free • No Credit Card Required
                </Badge>
            </div>

            {/* Flash Alerts */}
            {flash?.error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-50/80 p-3 text-xs font-semibold text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/60 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{flash.error}</span>
                </div>
            )}
            {flash?.info && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-50/80 p-3 text-xs font-semibold text-indigo-900 dark:border-indigo-500/40 dark:bg-indigo-950/60 dark:text-indigo-200">
                    <Info className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <span>{flash.info}</span>
                </div>
            )}

            {/* Google OAuth Option */}
            {features?.google_login_enabled && (
                <div className="space-y-4 mb-4">
                    <GoogleButton label="Sign up with Google" />

                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200/60 dark:border-white/10" />
                        </div>
                        <span className="relative bg-white/70 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 backdrop-blur-md dark:bg-slate-900/60 dark:text-slate-500">
                            or sign up with email
                        </span>
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Full Name"
                    id="name"
                    name="name"
                    value={data.name}
                    autoComplete="name"
                    autoFocus
                    placeholder="Alex Morgan"
                    leftIcon={<User className="h-4 w-4" />}
                    error={errors.name}
                    onChange={(e) => setData('name', e.target.value)}
                    required
                />

                <Input
                    label="Email Address"
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    autoComplete="username"
                    placeholder="alex@example.com"
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
                    autoComplete="new-password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4" />}
                    showPasswordToggle
                    error={errors.password}
                    onChange={(e) => setData('password', e.target.value)}
                    required
                />

                <Input
                    label="Confirm Password"
                    id="password_confirmation"
                    type="password"
                    name="password_confirmation"
                    value={data.password_confirmation}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4" />}
                    showPasswordToggle
                    error={errors.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    required
                />

                <div className="pt-2">
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        size="md"
                        isLoading={processing}
                        rightIcon={<Sparkles className="h-4 w-4" />}
                    >
                        Create Account & Start Trial
                    </Button>
                </div>

                <div className="pt-4 text-center border-t border-slate-200/50 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                    Already have an account?{' '}
                    <Link
                        href={route('login')}
                        className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center gap-1"
                    >
                        Sign in <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}
