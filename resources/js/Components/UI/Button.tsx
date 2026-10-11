import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            disabled,
            className = '',
            ...props
        },
        ref
    ) => {
        const baseStyles =
            'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

        const sizeStyles = {
            sm: 'text-xs px-3 py-1.5 gap-1.5',
            md: 'text-sm px-4 py-2.5 gap-2',
            lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
        };

        const variantStyles = {
            primary:
                'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus:ring-offset-slate-900',
            secondary:
                'bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:focus:ring-offset-slate-900',
            outline:
                'border border-slate-300 dark:border-white/15 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 focus:ring-indigo-500 dark:focus:ring-offset-slate-900',
            ghost:
                'bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 focus:ring-slate-400 dark:focus:ring-offset-slate-900',
            danger:
                'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 focus:ring-rose-500 dark:bg-rose-500 dark:hover:bg-rose-600 dark:focus:ring-offset-slate-900',
            glass:
                'bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-800 dark:text-white backdrop-blur-md border border-white/40 dark:border-white/10 shadow-glass focus:ring-indigo-500 dark:focus:ring-offset-slate-900',
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
                {...props}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-current" />
                ) : (
                    leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
                )}
                <span>{children}</span>
                {!isLoading && rightIcon && (
                    <span className="inline-flex shrink-0">{rightIcon}</span>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
