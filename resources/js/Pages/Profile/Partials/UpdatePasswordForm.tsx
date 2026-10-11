import React, { FormEventHandler, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Card, Button, Input } from '@/Components/UI';
import { Lock, KeyRound, CheckCircle2 } from 'lucide-react';

interface UpdatePasswordFormProps {
    hasPassword: boolean;
    className?: string;
}

export default function UpdatePasswordForm({
    hasPassword,
    className = '',
}: UpdatePasswordFormProps) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errs) => {
                if (errs.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errs.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <Card variant="glass" className={`p-6 sm:p-8 space-y-6 ${className}`}>
            <header className="border-b border-slate-200/50 pb-4 dark:border-white/10">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {hasPassword ? 'Update Password' : 'Set a Password'}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {hasPassword
                        ? 'Ensure your account is using a long, random password to stay secure.'
                        : 'You currently sign in via Google. Set a local password to enable email & password sign-in.'}
                </p>
            </header>

            <form onSubmit={updatePassword} className="space-y-4">
                {hasPassword && (
                    <Input
                        label="Current Password"
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        leftIcon={<Lock className="h-4 w-4" />}
                        showPasswordToggle
                        error={errors.current_password}
                        required
                    />
                )}

                <Input
                    label={hasPassword ? 'New Password' : 'Password'}
                    id="password"
                    ref={passwordInput}
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4" />}
                    showPasswordToggle
                    error={errors.password}
                    required
                />

                <Input
                    label="Confirm Password"
                    id="password_confirmation"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4" />}
                    showPasswordToggle
                    error={errors.password_confirmation}
                    required
                />

                <div className="flex items-center gap-4 pt-2">
                    <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        isLoading={processing}
                        leftIcon={<KeyRound className="h-4 w-4" />}
                    >
                        {hasPassword ? 'Save Password' : 'Set Password'}
                    </Button>

                    {recentlySuccessful && (
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Password updated.
                        </p>
                    )}
                </div>
            </form>
        </Card>
    );
}
