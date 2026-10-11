import React, { FormEventHandler } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Card, Button, Input } from '@/Components/UI';
import { User, Mail, Save, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PageProps } from '@/types';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage<PageProps>().props.auth.user!;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <Card variant="glass" className={`p-6 sm:p-8 space-y-6 ${className}`}>
            <header className="border-b border-slate-200/50 pb-4 dark:border-white/10">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Profile Information
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Update your account's display name and primary email address.
                </p>
            </header>

            {/* Re-verification notice if email is unverified */}
            {mustVerifyEmail && user.email_verified_at === null && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-50/70 p-3.5 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/50 dark:text-amber-200">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                        <p className="font-semibold">Your email address is unverified.</p>
                        <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                            You must verify your email before running resume analyses.
                        </p>
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="mt-2 inline-flex items-center gap-1 font-bold text-indigo-700 underline hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            Click here to resend the verification email
                        </Link>
                    </div>
                </div>
            )}

            {status === 'verification-link-sent' && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>A new verification link has been sent to your email address.</span>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Full Name"
                    id="name"
                    name="name"
                    value={data.name}
                    autoComplete="name"
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
                    leftIcon={<Mail className="h-4 w-4" />}
                    error={errors.email}
                    helperText="Changing your email address will require re-verification."
                    onChange={(e) => setData('email', e.target.value)}
                    required
                />

                <div className="flex items-center gap-4 pt-2">
                    <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        isLoading={processing}
                        leftIcon={<Save className="h-4 w-4" />}
                    >
                        Save Changes
                    </Button>

                    {recentlySuccessful && (
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Saved successfully.
                        </p>
                    )}
                </div>
            </form>
        </Card>
    );
}
