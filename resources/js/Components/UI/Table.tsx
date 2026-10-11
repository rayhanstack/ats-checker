import React, { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

export function Table({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLTableElement>) {
    return (
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/60 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50">
            <table className={`w-full text-left text-sm text-slate-700 dark:text-slate-300 ${className}`} {...props}>
                {children}
            </table>
        </div>
    );
}

export function TableHeader({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <thead
            className={`border-b border-slate-200/60 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-400 ${className}`}
            {...props}
        >
            {children}
        </thead>
    );
}

export function TableBody({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <tbody className={`divide-y divide-slate-200/50 dark:divide-white/5 ${className}`} {...props}>
            {children}
        </tbody>
    );
}

export function TableRow({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLTableRowElement>) {
    return (
        <tr
            className={`transition-colors duration-150 hover:bg-indigo-50/40 dark:hover:bg-white/[0.03] ${className}`}
            {...props}
        >
            {children}
        </tr>
    );
}

export function TableHead({
    children,
    className = '',
    ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th className={`px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 ${className}`} {...props}>
            {children}
        </th>
    );
}

export function TableCell({
    children,
    className = '',
    ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
    return (
        <td className={`px-6 py-4 text-slate-700 dark:text-slate-300 ${className}`} {...props}>
            {children}
        </td>
    );
}
