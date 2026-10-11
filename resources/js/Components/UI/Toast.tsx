import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

export default function Toast() {
    const { flash } = usePage<PageProps>().props;
    const [messages, setMessages] = useState<ToastMessage[]>([]);

    useEffect(() => {
        if (flash.success) {
            addMessage('success', flash.success);
        }
        if (flash.error) {
            addMessage('error', flash.error);
        }
        if (flash.info) {
            addMessage('info', flash.info);
        }
    }, [flash]);

    const addMessage = (type: ToastType, message: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setMessages((prev) => [...prev, { id, type, message }]);

        setTimeout(() => {
            setMessages((prev) => prev.filter((item) => item.id !== id));
        }, 5000);
    };

    const removeMessage = (id: string) => {
        setMessages((prev) => prev.filter((item) => item.id !== id));
    };

    if (messages.length === 0) return null;

    return (
        <div className="fixed bottom-5 right-5 z-50 flex max-w-sm flex-col gap-2.5">
            {messages.map(({ id, type, message }) => {
                const styles = {
                    success:
                        'border-emerald-500/30 bg-emerald-50/90 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/90 dark:text-emerald-100',
                    error:
                        'border-rose-500/30 bg-rose-50/90 text-rose-900 dark:border-rose-500/40 dark:bg-rose-950/90 dark:text-rose-100',
                    info:
                        'border-sky-500/30 bg-sky-50/90 text-sky-900 dark:border-sky-500/40 dark:bg-sky-950/90 dark:text-sky-100',
                };

                const icons = {
                    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
                    error: <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
                    info: <Info className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
                };

                return (
                    <div
                        key={id}
                        role="alert"
                        className={`flex items-start gap-3 rounded-2xl border p-4 shadow-glass-lg backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${styles[type]}`}
                    >
                        <span className="shrink-0 mt-0.5">{icons[type]}</span>
                        <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>
                        <button
                            type="button"
                            onClick={() => removeMessage(id)}
                            aria-label="Dismiss alert"
                            className="shrink-0 rounded-lg p-1 text-current opacity-70 hover:opacity-100"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
