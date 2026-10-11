import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            id,
            className = '',
            disabled,
            ...props
        },
        ref
    ) => {
        const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        id={inputId}
                        ref={ref}
                        disabled={disabled}
                        className={`w-full rounded-xl border bg-white/70 px-4 py-2.5 text-sm text-slate-800 backdrop-blur-md transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                            leftIcon ? 'pl-10' : ''
                        } ${rightIcon ? 'pr-10' : ''} ${
                            error
                                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500/40'
                                : 'border-slate-200/80 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-white/10 dark:hover:border-white/20 dark:focus:border-indigo-400'
                        } ${className}`}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="text-xs font-medium text-rose-500 dark:text-rose-400">
                        {error}
                    </p>
                )}
                {!error && helperText && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
