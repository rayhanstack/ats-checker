import React, { FormEventHandler } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { Button, Input, Badge } from '@/Components/UI';
import { User, Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { PageProps } from '@/types';

export default function Register() {
    const { settings } = usePage<PageProps>().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Start Your Free Trial"
            description={`Create your account in 30 seconds. Includes full ${settings?.trial_days ?? 7}-day access to our AI ATS analysis platform.`}
        >
            <Head title="Start 7-Day Free Trial" />

            <div className="mb-4 flex justify-center">
                <Badge variant="primary" dot size="sm">
                    {settings?.trial_days ?? 7} Days Free • No Credit Card Required
                </Badge>
            </div>

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
