import React from 'react';
import { FileCheck, Sparkles } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface BrandLogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    asLink?: boolean;
    href?: string;
}

export default function BrandLogo({
    className = '',
    size = 'md',
    asLink = true,
    href = '/',
}: BrandLogoProps) {
    const iconSizes = {
        sm: 'h-7 w-7 rounded-lg',
        md: 'h-9 w-9 rounded-xl',
        lg: 'h-11 w-11 rounded-2xl',
    };

    const textSizes = {
        sm: 'text-base font-bold',
        md: 'text-lg font-bold',
        lg: 'text-2xl font-extrabold',
    };

    const Content = (
        <div className={`inline-flex items-center gap-2.5 ${className}`}>
            <div
                className={`relative flex items-center justify-center bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25 ${iconSizes[size]}`}
            >
                <FileCheck className="h-5 w-5" />
                <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-300 drop-shadow" />
            </div>
            <div className="flex flex-col leading-none">
                <span className={`tracking-tight text-slate-900 dark:text-white ${textSizes[size]}`}>
                    ATS<span className="text-indigo-600 dark:text-indigo-400">Checker</span>
                </span>
            </div>
        </div>
    );

    if (asLink) {
        return (
            <Link href={href} className="focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg">
                {Content}
            </Link>
        );
    }

    return Content;
}
