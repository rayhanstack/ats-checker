import React from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Card, Button, Badge } from '@/Components/UI';
import { CheckCircle2, AlertTriangle, Link2, Unlink } from 'lucide-react';
import { PageProps } from '@/types';

interface SocialAccountData {
    provider: string;
    provider_email: string;
    avatar_url?: string | null;
    created_at: string;
}

interface ConnectedAccountsProps {
    hasPassword: boolean;
    isGoogleLinked: boolean;
    socialAccounts?: SocialAccountData[];
}

export default function ConnectedAccountsCard({
    hasPassword,
    isGoogleLinked,
    socialAccounts = [],
}: ConnectedAccountsProps) {
    const { features } = usePage<PageProps>().props;
    const { post, processing } = useForm();

    const googleAccount = socialAccounts.find((acc) => acc.provider === 'google');

    const handleDisconnect = (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasPassword) {
            return;
        }
        if (confirm('Are you sure you want to disconnect your Google account?')) {
            post(route('auth.google.disconnect'));
        }
    };

    return (
        <Card variant="glass" className="p-6 sm:p-8 space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/50 pb-4 dark:border-white/10">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Connected Accounts
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Manage third-party login providers linked to your ATS Checker account.
                    </p>
                </div>
                <Badge variant={isGoogleLinked ? 'success' : 'default'} size="sm" dot={isGoogleLinked}>
                    {isGoogleLinked ? 'Google Linked' : 'No Social Provider'}
                </Badge>
            </header>

            {/* Google Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/40 p-4 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/40">
                <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-800">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                fill="#4285F4"
                                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                            />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                Google
                            </h3>
                            {isGoogleLinked && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3 w-3" /> Connected
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {isGoogleLinked
                                ? googleAccount?.provider_email || 'Linked to Google'
                                : 'Enable one-click sign-in with your Google account'}
                        </p>
                    </div>
                </div>

                <div>
                    {isGoogleLinked ? (
                        <form onSubmit={handleDisconnect}>
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                disabled={!hasPassword || processing}
                                isLoading={processing}
                                leftIcon={<Unlink className="h-3.5 w-3.5" />}
                                className="text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                            >
                                Disconnect
                            </Button>
                        </form>
                    ) : features?.google_login_enabled ? (
                        <a href={route('auth.google.connect')}>
                            <Button
                                variant="glass"
                                size="sm"
                                leftIcon={<Link2 className="h-3.5 w-3.5" />}
                            >
                                Connect Google
                            </Button>
                        </a>
                    ) : (
                        <span className="text-xs text-slate-400">Google login disabled</span>
                    )}
                </div>
            </div>

            {/* Block Disconnect Warning if no password */}
            {isGoogleLinked && !hasPassword && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-50/70 p-3.5 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/50 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                        <span className="font-semibold">Password required to disconnect:</span> You currently sign in exclusively with Google. Please create a password in the "Password" section below first so you don't lose access to your account.
                    </div>
                </div>
            )}
        </Card>
    );
}
