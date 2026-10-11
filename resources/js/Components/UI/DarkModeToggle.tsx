import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';

interface DarkModeToggleProps {
    className?: string;
}

export default function DarkModeToggle({ className = '' }: DarkModeToggleProps) {
    const { isDark, toggleTheme } = useDarkMode();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/60 bg-white/70 p-2 text-slate-700 shadow-sm backdrop-blur-md transition-all hover:border-indigo-300 hover:bg-white hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-indigo-400/40 dark:hover:bg-slate-800 dark:hover:text-indigo-400 ${className}`}
        >
            {isDark ? (
                <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
                <Moon className="h-4 w-4 text-indigo-600 transition-transform duration-200 hover:-rotate-12" />
            )}
        </button>
    );
}
