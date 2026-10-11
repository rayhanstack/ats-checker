import React, { HTMLAttributes } from 'react';

export type BadgeVariant =
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    dot?: boolean;
    size?: 'sm' | 'md';
}

export default function Badge({
    children,
    variant = 'default',
    dot = false,
    size = 'md',
    className = '',
    ...props
}: BadgeProps) {
    const sizeStyles = {
        sm: 'text-[11px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
    };

    const variantStyles = {
        default:
            'bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-white/10',
        primary:
            'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/40',
        success:
            'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40',
        warning:
            'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40',
        danger:
            'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/40',
        info:
            'bg-sky-50 text-sky-700 border-sky-200/60 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/40',
        purple:
            'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/40',
    };

    const dotColors = {
        default: 'bg-slate-400',
        primary: 'bg-indigo-500',
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        danger: 'bg-rose-500',
        info: 'bg-sky-500',
        purple: 'bg-purple-500',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-full border backdrop-blur-sm ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
            {...props}
        >
            {dot && (
                <span
                    className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]} animate-pulse`}
                />
            )}
            {children}
        </span>
    );
}
