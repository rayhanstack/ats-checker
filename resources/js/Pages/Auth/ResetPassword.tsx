import React, { FormEventHandler } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { Button, Input } from '@/Components/UI';
import { Mail, Lock, KeyRound } from 'lucide-react';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Set New Password"
            description="Choose a strong password to secure your ATS Checker account."
        >
            <Head title="Reset Password" />

            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Email Address"
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    autoComplete="username"
                    leftIcon={<Mail className="h-4 w-4" />}
                    error={errors.email}
                    onChange={(e) => setData('email', e.target.value)}
                    required
                />

                <Input
                    label="New Password"
                    id="password"
                    type="password"
                    name="password"
                    value={data.password}
                    autoComplete="new-password"
                    autoFocus
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4" />}
                    showPasswordToggle
                    error={errors.password}
                    onChange={(e) => setData('password', e.target.value)}
                    required
                />

                <Input
                    label="Confirm New Password"
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
                        rightIcon={<KeyRound className="h-4 w-4" />}
                    >
                        Save & Reset Password
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
}
