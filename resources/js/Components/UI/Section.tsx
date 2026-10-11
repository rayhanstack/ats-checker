import React, { HTMLAttributes } from 'react';
import Badge from './Badge';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
    badge?: string;
    title?: string;
    subtitle?: string;
    align?: 'left' | 'center';
}

export default function Section({
    badge,
    title,
    subtitle,
    align = 'center',
    children,
    className = '',
    ...props
}: SectionProps) {
    const isCenter = align === 'center';

    return (
        <section className={`py-16 sm:py-24 ${className}`} {...props}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {(badge || title || subtitle) && (
                    <div className={`mb-12 sm:mb-16 ${isCenter ? 'text-center' : 'text-left'}`}>
                        {badge && (
                            <div className={`mb-4 flex ${isCenter ? 'justify-center' : 'justify-start'}`}>
                                <Badge variant="primary" dot size="md">
                                    {badge}
                                </Badge>
                            </div>
                        )}
                        {title && (
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className={`mt-4 text-base text-slate-600 dark:text-slate-400 sm:text-lg ${isCenter ? 'mx-auto max-w-3xl' : 'max-w-2xl'}`}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                )}
                {children}
            </div>
        </section>
    );
}
