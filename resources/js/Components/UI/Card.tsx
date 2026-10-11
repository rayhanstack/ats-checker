import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    interactive?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    variant?: 'glass' | 'solid' | 'subtle';
}

export default function Card({
    children,
    interactive = false,
    padding = 'md',
    variant = 'glass',
    className = '',
    ...props
}: CardProps) {
    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8 sm:p-10',
    };

    const variantStyles = {
        glass: interactive ? 'glass-card-interactive' : 'glass-card',
        solid: 'rounded-2xl border border-slate-200 bg-white shadow-card dark:border-white/10 dark:bg-slate-900',
        subtle: 'rounded-2xl border border-slate-100 bg-slate-50/50 dark:border-white/5 dark:bg-white/[0.02]',
    };

    const cardClass = variantStyles[variant] || (interactive ? 'glass-card-interactive' : 'glass-card');

    return (
        <div className={`${cardClass} ${paddingStyles[padding]} ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={`text-lg font-bold tracking-tight text-slate-900 dark:text-white ${className}`} {...props}>
            {children}
        </h3>
    );
}

export function CardDescription({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={`text-sm text-slate-500 dark:text-slate-400 ${className}`} {...props}>
            {children}
        </p>
    );
}

export function CardContent({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`space-y-4 ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`mt-6 flex items-center justify-between border-t border-slate-200/50 pt-4 dark:border-white/10 ${className}`} {...props}>
            {children}
        </div>
    );
}
