import React, { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { Button, Input } from '@/Components/UI';
import { Mail, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <AuthLayout
            title="Reset Password"
            description="Enter the email associated with your account and we will send you a link to reset (or set) your password."
        >
            <Head title="Forgot Password" />

            {status && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{status}</span>
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
                    helperText="If you signed up with Google, this link will allow you to create a password."
                    onChange={(e) => setData('email', e.target.value)}
                    required
                />

                <div className="pt-2">
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        size="md"
                        isLoading={processing}
                        rightIcon={<Send className="h-4 w-4" />}
                    >
                        Email Reset Link
                    </Button>
                </div>

                <div className="pt-4 text-center border-t border-slate-200/50 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                    Remembered your password?{' '}
                    <Link
                        href={route('login')}
                        className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center gap-1"
                    >
                        <ArrowLeft className="h-3 w-3" /> Back to sign in
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}
