import React, { FormEventHandler } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { Button, Input } from '@/Components/UI';
import { Lock, ShieldCheck } from 'lucide-react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title="Confirm Password"
            description="This is a secure area of ATS Checker. Please confirm your password before continuing."
        >
            <Head title="Confirm Password" />

            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Password"
                    id="password"
                    type="password"
                    name="password"
                    value={data.password}
                    autoFocus
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4" />}
                    showPasswordToggle
                    error={errors.password}
                    onChange={(e) => setData('password', e.target.value)}
                    required
                />

                <div className="pt-2">
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        size="md"
                        isLoading={processing}
                        rightIcon={<ShieldCheck className="h-4 w-4" />}
                    >
                        Confirm Identity
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
}
