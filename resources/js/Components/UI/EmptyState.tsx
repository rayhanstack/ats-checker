import React from 'react';
import Card from './Card';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export default function EmptyState({
    icon,
    title,
    description,
    action,
    className = '',
}: EmptyStateProps) {
    return (
        <Card variant="glass" className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center ${className}`}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shadow-sm mb-4">
                {icon || <Inbox className="h-7 w-7" />}
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {title}
            </h3>
            {description && (
                <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {description}
                </p>
            )}
            {action && (
                <div className="mt-5 flex items-center justify-center gap-3">
                    {action}
                </div>
            )}
        </Card>
    );
}
