import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { Card, Badge } from '@/Components/UI';
import { PageProps } from '@/types';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import ConnectedAccountsCard from './Partials/ConnectedAccountsCard';
import DeleteUserForm from './Partials/DeleteUserForm';
import { Shield, Sparkles, Key, Mail } from 'lucide-react';

interface EditProps {
    mustVerifyEmail: boolean;
    status?: string;
    hasPassword?: boolean;
    isGoogleLinked?: boolean;
    socialAccounts?: Array<{
        provider: string;
        provider_email: string;
        avatar_url?: string | null;
        created_at: string;
    }>;
}

export default function Edit({
    mustVerifyEmail,
    status,
    hasPassword = true,
    isGoogleLinked = false,
    socialAccounts = [],
}: EditProps) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user!;

    // Determine sign-in method badge
    const signInMethod = isGoogleLinked && hasPassword
        ? 'Password + Google'
        : isGoogleLinked
        ? 'Google OAuth'
        : 'Password';

    return (
        <UserLayout title="Profile & Account Settings">
            <Head title="Profile Settings" />

            <div className="mx-auto max-w-4xl space-y-8">
                {/* Profile Header Card */}
                <Card variant="glass" className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                        {user.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md"
                            />
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-black text-white shadow-md ring-4 ring-indigo-500/20">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                                {user.name}
                            </h1>
                            <Badge variant={user.role === 'admin' ? 'purple' : 'primary'} size="sm">
                                {user.role === 'admin' ? 'Administrator' : 'Candidate'}
                            </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            {user.email}
                        </p>
                        <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <Key className="h-3.5 w-3.5 text-indigo-500" /> Method: {signInMethod}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                                {user.has_active_trial ? 'Trial Active' : 'Trial Ended'}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* 1. Profile Information */}
                <UpdateProfileInformationForm
                    mustVerifyEmail={mustVerifyEmail}
                    status={status}
                />

                {/* 2. Connected Accounts (Google OAuth) */}
                <ConnectedAccountsCard
                    hasPassword={hasPassword}
                    isGoogleLinked={isGoogleLinked}
                    socialAccounts={socialAccounts}
                />

                {/* 3. Password Management */}
                <UpdatePasswordForm hasPassword={hasPassword} />

                {/* 4. Danger Zone: Delete Account */}
                <DeleteUserForm hasPassword={hasPassword} />
            </div>
        </UserLayout>
    );
}
