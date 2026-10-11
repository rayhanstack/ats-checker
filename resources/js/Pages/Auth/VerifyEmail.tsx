import React, { FormEventHandler } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { Button } from '@/Components/UI';
import { MailCheck, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { PageProps } from '@/types';

export default function VerifyEmail({ status }: { status?: string }) {
    const { auth } = usePage<PageProps>().props;
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <AuthLayout
            title="Verify Your Email"
            description="We've sent a verification link to your email address. Please click the link to activate all features and start analyzing resumes."
        >
            <Head title="Verify Email" />

            {auth.user?.email && (
                <div className="mb-4 rounded-xl border border-indigo-500/20 bg-indigo-50/60 p-3 text-center text-xs font-medium text-indigo-950 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-200">
                    Verification sent to: <span className="font-semibold">{auth.user.email}</span>
                </div>
            )}

            {status === 'verification-link-sent' && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>A fresh verification link has been sent to your email address.</span>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    size="md"
                    isLoading={processing}
                    leftIcon={<RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />}
                >
                    Resend Verification Email
                </Button>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-white/10 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                        Need to sign in with a different account?
                    </span>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                        <LogOut className="h-3.5 w-3.5" /> Log Out
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}
