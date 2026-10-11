import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular' | 'card';
    width?: string | number;
    height?: string | number;
}

export default function Skeleton({
    variant = 'text',
    width,
    height,
    className = '',
    style,
    ...props
}: SkeletonProps) {
    const variantStyles = {
        text: 'h-4 w-full rounded-md',
        circular: 'h-10 w-10 rounded-full',
        rectangular: 'h-24 w-full rounded-xl',
        card: 'h-36 w-full rounded-2xl',
    };

    const inlineStyle: React.CSSProperties = {
        ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
        ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
        ...style,
    };

    return (
        <div
            className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/80 ${variantStyles[variant]} ${className}`}
            style={inlineStyle}
            aria-hidden="true"
            {...props}
        />
    );
}
