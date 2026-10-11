import React, { FormEventHandler, useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Card, Button, Input } from '@/Components/UI';
import Modal from '@/Components/Modal';
import { Trash2, AlertTriangle, Lock, ShieldAlert } from 'lucide-react';

interface DeleteUserFormProps {
    hasPassword: boolean;
    className?: string;
}

export default function DeleteUserForm({
    hasPassword,
    className = '',
}: DeleteUserFormProps) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
        confirmation: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => {
                if (hasPassword) {
                    passwordInput.current?.focus();
                }
            },
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <Card variant="glass" className={`p-6 sm:p-8 space-y-6 border-rose-200/60 dark:border-rose-900/30 ${className}`}>
            <header className="border-b border-slate-200/50 pb-4 dark:border-white/10">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <Trash2 className="h-5 w-5" />
                    <h2 className="text-lg font-bold">Delete Account</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Permanently delete your ATS Checker account and all associated resumes, scores, and personal data.
                </p>
            </header>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                    Once your account is deleted, all uploaded resumes, match scores, keyword fixes, and trial history will be immediately wiped from our servers. This action is irreversible.
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={confirmUserDeletion}
                    className="border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/50 shrink-0"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                >
                    Delete My Account
                </Button>
            </div>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6 sm:p-8 space-y-5 bg-white dark:bg-slate-900 rounded-2xl">
                    <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/70">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Confirm Account Deletion
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                This action cannot be undone. All resume analyses will be lost.
                            </p>
                        </div>
                    </div>

                    {hasPassword ? (
                        <div className="space-y-2">
                            <Input
                                label="Confirm with Your Password"
                                id="delete-password"
                                type="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                leftIcon={<Lock className="h-4 w-4" />}
                                showPasswordToggle
                                error={errors.password}
                                required
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="rounded-xl border border-amber-500/20 bg-amber-50/60 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                                You are signed in via Google without a password. Type <strong className="font-mono text-rose-600 dark:text-rose-400">DELETE</strong> below to confirm.
                            </div>
                            <Input
                                label="Type DELETE to Confirm"
                                id="delete-confirmation"
                                type="text"
                                value={data.confirmation}
                                onChange={(e) => setData('confirmation', e.target.value)}
                                placeholder="DELETE"
                                error={errors.confirmation}
                                required
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={closeModal}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="danger"
                            size="sm"
                            isLoading={processing}
                            leftIcon={<Trash2 className="h-4 w-4" />}
                        >
                            Confirm Deletion
                        </Button>
                    </div>
                </form>
            </Modal>
        </Card>
    );
}
