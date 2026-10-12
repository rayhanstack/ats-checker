import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, Badge, Button } from '@/Components/UI';
import {
    FileCheck2,
    Search,
    Download,
    RotateCcw,
    Trash2,
    Eye,
    Filter,
    FileSpreadsheet,
    X,
    Check,
    AlertCircle,
    Cpu,
    Clock,
    FileText,
    User,
    Tag,
    ChevronRight,
} from 'lucide-react';

interface AnalysisItem {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    resume_name: string;
    job_title: string;
    job_company?: string | null;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    score: number | null;
    ai_model_name: string;
    tokens_in: number;
    tokens_out: number;
    total_tokens: number;
    duration_seconds: number | null;
    is_delayed: boolean;
    is_basic_fallback: boolean;
    has_file: boolean;
    resume_text?: string | null;
    jd_text?: string | null;
    result?: Record<string, any> | null;
    error_message?: string | null;
    created_at: string;
    formatted_date: string;
}

interface AnalysesIndexProps {
    analyses: {
        data: AnalysisItem[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search: string;
        user_id: string;
        status: string;
        score_range: string;
        date_range: string;
        model_id: string;
    };
    users: { id: number; name: string; email: string }[];
    models: { id: number; name: string }[];
    stats: {
        total: number;
        completed: number;
        failed: number;
        avg_score: number;
    };
}

export default function Index({
    analyses,
    filters,
    users,
    models,
    stats,
}: AnalysesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [scoreFilter, setScoreFilter] = useState(filters.score_range || 'all');
    const [dateFilter, setDateFilter] = useState(filters.date_range || 'all');
    const [modelFilter, setModelFilter] = useState(filters.model_id || '');
    const [userFilter, setUserFilter] = useState(filters.user_id || '');

    // Drawer state
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisItem | null>(null);
    const [drawerTab, setDrawerTab] = useState<'overview' | 'resume' | 'jd' | 'result'>('overview');

    // Delete modal
    const [deletingAnalysis, setDeletingAnalysis] = useState<AnalysisItem | null>(null);

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(
            route('admin.analyses.index'),
            {
                search,
                status: statusFilter,
                score_range: scoreFilter,
                date_range: dateFilter,
                model_id: modelFilter,
                user_id: userFilter,
                ...overrides,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleRerun = (analysis: AnalysisItem) => {
        router.post(route('admin.analyses.rerun', analysis.id));
    };

    const handleDelete = () => {
        if (!deletingAnalysis) return;
        router.delete(route('admin.analyses.destroy', deletingAnalysis.id), {
            onSuccess: () => setDeletingAnalysis(null),
        });
    };

    const getScoreBadge = (score: number | null) => {
        if (score === null) return <Badge variant="default" size="sm">Pending</Badge>;
        if (score >= 80) return <Badge variant="success" size="sm">{score}%</Badge>;
        if (score >= 50) return <Badge variant="warning" size="sm">{score}%</Badge>;
        return <Badge variant="danger" size="sm">{score}%</Badge>;
    };

    return (
        <AdminLayout
            title="CV & Analysis Tracking"
            description="Comprehensive audit of all candidate CV uploads, extracted text, AI scoring tokens, and pipeline results."
        >
            <Head title="CV Analyses - Admin Console" />

            <div className="space-y-6">
                {/* Header Strip & Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                            Total Scans: <strong className="text-slate-900 dark:text-white">{stats.total}</strong>
                        </span>
                        <span>•</span>
                        <span>
                            Completed: <strong className="text-emerald-600 dark:text-emerald-400">{stats.completed}</strong>
                        </span>
                        <span>•</span>
                        <span>
                            Failed: <strong className="text-rose-600 dark:text-rose-400">{stats.failed}</strong>
                        </span>
                        <span>•</span>
                        <span>
                            Average ATS Score: <strong className="text-indigo-600 dark:text-indigo-400">{stats.avg_score}%</strong>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={route('admin.analyses.export-csv', {
                                search,
                                status: statusFilter,
                            })}
                            className="inline-flex"
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />}
                            >
                                Export CSV
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Filters & Search Toolbar */}
                <Card variant="glass" className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                        {/* Search Input */}
                        <div className="relative sm:col-span-2">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search })}
                                placeholder="Search by job title, CV file, candidate..."
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                applyFilters({ status: e.target.value });
                            }}
                            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="processing">Processing</option>
                            <option value="queued">Queued</option>
                            <option value="failed">Failed</option>
                        </select>

                        {/* Score Filter */}
                        <select
                            value={scoreFilter}
                            onChange={(e) => {
                                setScoreFilter(e.target.value);
                                applyFilters({ score_range: e.target.value });
                            }}
                            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Scores</option>
                            <option value="high">High (80+)</option>
                            <option value="medium">Medium (50-79)</option>
                            <option value="low">Low (&lt;50)</option>
                        </select>

                        {/* Date Filter */}
                        <select
                            value={dateFilter}
                            onChange={(e) => {
                                setDateFilter(e.target.value);
                                applyFilters({ date_range: e.target.value });
                            }}
                            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="all">All Dates</option>
                            <option value="today">Today</option>
                            <option value="7d">Past 7 Days</option>
                            <option value="30d">Past 30 Days</option>
                            <option value="90d">Past 90 Days</option>
                        </select>

                        {/* Model Filter */}
                        <select
                            value={modelFilter}
                            onChange={(e) => {
                                setModelFilter(e.target.value);
                                applyFilters({ model_id: e.target.value });
                            }}
                            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="">All AI Models</option>
                            {models.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </Card>

                {/* Analyses Table */}
                <Card variant="glass" className="overflow-hidden">
                    <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">Candidate</th>
                                    <th className="py-3 px-4">Target Role / CV</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Score</th>
                                    <th className="py-3 px-4">AI Model</th>
                                    <th className="py-3 px-4">Tokens</th>
                                    <th className="py-3 px-4">Duration</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                                {analyses.data.length > 0 ? (
                                    analyses.data.map((an) => (
                                        <tr key={an.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                            {/* Candidate */}
                                            <td className="py-3 px-4">
                                                {an.user ? (
                                                    <Link
                                                        href={route('admin.users.show', an.user.id)}
                                                        className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 block"
                                                    >
                                                        {an.user.name}
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-400">Guest / Deleted</span>
                                                )}
                                                <span className="text-[11px] text-slate-400 truncate block max-w-xs">
                                                    {an.user?.email}
                                                </span>
                                            </td>

                                            {/* Target Role & CV file */}
                                            <td className="py-3 px-4">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-xs">
                                                    {an.job_title}
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-mono truncate block max-w-xs">
                                                    {an.resume_name}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3 px-4">
                                                <Badge
                                                    variant={
                                                        an.status === 'completed'
                                                            ? 'success'
                                                            : an.status === 'failed'
                                                            ? 'danger'
                                                            : 'primary'
                                                    }
                                                    size="sm"
                                                    className="capitalize"
                                                >
                                                    {an.is_basic_fallback ? 'Basic Fallback' : an.status}
                                                </Badge>
                                            </td>

                                            {/* Score */}
                                            <td className="py-3 px-4">
                                                {getScoreBadge(an.score)}
                                            </td>

                                            {/* AI Model */}
                                            <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                                                {an.ai_model_name}
                                            </td>

                                            {/* Tokens */}
                                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                                                {an.total_tokens > 0 ? (
                                                    <span title={`In: ${an.tokens_in} / Out: ${an.tokens_out}`}>
                                                        {an.total_tokens.toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>

                                            {/* Duration */}
                                            <td className="py-3 px-4 text-slate-500">
                                                {an.duration_seconds !== null ? `${an.duration_seconds}s` : '—'}
                                            </td>

                                            {/* Date */}
                                            <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                                                {an.formatted_date}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* View Drawer */}
                                                    <button
                                                        title="Inspect Parsed Text & JSON Result"
                                                        onClick={() => {
                                                            setSelectedAnalysis(an);
                                                            setDrawerTab('overview');
                                                        }}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </button>

                                                    {/* Download File */}
                                                    {an.has_file && (
                                                        <a
                                                            href={route('admin.analyses.download-cv', an.id)}
                                                            title="Download Original Resume File"
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                                        >
                                                            <Download className="h-3.5 w-3.5" />
                                                        </a>
                                                    )}

                                                    {/* Re-run */}
                                                    <button
                                                        title="Re-run Analysis Job"
                                                        onClick={() => handleRerun(an)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        title="Delete Analysis"
                                                        onClick={() => setDeletingAnalysis(an)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="py-8 text-center text-slate-400">
                                            No resume analyses found matching the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {analyses.links.length > 3 && (
                        <div className="p-4 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs">
                            <span className="text-slate-400">
                                Page {analyses.current_page} of {analyses.last_page} ({analyses.total} records)
                            </span>
                            <div className="flex gap-1">
                                {analyses.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1.5 rounded-lg transition-colors ${
                                            link.active
                                                ? 'bg-amber-600 text-white font-bold'
                                                : link.url
                                                ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                : 'text-slate-400 opacity-50 cursor-not-allowed'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Analysis Detail Drawer Modal */}
            {selectedAnalysis && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 dark:border-white/10 flex flex-col">
                        {/* Drawer Header */}
                        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Analysis Inspector #{selectedAnalysis.id}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {selectedAnalysis.job_title} • {selectedAnalysis.user?.name ?? 'Candidate'}
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedAnalysis(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Drawer Tabs */}
                        <div className="flex border-b border-slate-200 dark:border-white/10 px-5 text-xs font-semibold">
                            <button
                                onClick={() => setDrawerTab('overview')}
                                className={`py-3 px-3 border-b-2 transition-colors ${
                                    drawerTab === 'overview'
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Telemetry Overview
                            </button>
                            <button
                                onClick={() => setDrawerTab('resume')}
                                className={`py-3 px-3 border-b-2 transition-colors ${
                                    drawerTab === 'resume'
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Parsed Resume Text
                            </button>
                            <button
                                onClick={() => setDrawerTab('jd')}
                                className={`py-3 px-3 border-b-2 transition-colors ${
                                    drawerTab === 'jd'
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Job Description
                            </button>
                            <button
                                onClick={() => setDrawerTab('result')}
                                className={`py-3 px-3 border-b-2 transition-colors ${
                                    drawerTab === 'result'
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                JSON Result Payload
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
                            {drawerTab === 'overview' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">ATS Score</span>
                                            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                                {selectedAnalysis.score !== null ? `${selectedAnalysis.score}%` : 'Pending'}
                                            </span>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                                            <span className="text-base font-bold capitalize text-slate-800 dark:text-slate-200">
                                                {selectedAnalysis.status}
                                            </span>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Engine</span>
                                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                                                {selectedAnalysis.ai_model_name}
                                            </span>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Tokens</span>
                                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                                                {selectedAnalysis.total_tokens.toLocaleString()} (In: {selectedAnalysis.tokens_in} / Out: {selectedAnalysis.tokens_out})
                                            </span>
                                        </div>
                                    </div>

                                    {selectedAnalysis.error_message && (
                                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 text-rose-800 dark:text-rose-200">
                                            <span className="font-bold block mb-1">Execution Failure Error:</span>
                                            <p className="font-mono text-[11px]">{selectedAnalysis.error_message}</p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                                            Quick Actions
                                        </h4>
                                        <div className="flex gap-2">
                                            {selectedAnalysis.has_file && (
                                                <a
                                                    href={route('admin.analyses.download-cv', selectedAnalysis.id)}
                                                    className="inline-flex"
                                                >
                                                    <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>
                                                        Download Original CV File
                                                    </Button>
                                                </a>
                                            )}
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                                                onClick={() => handleRerun(selectedAnalysis)}
                                            >
                                                Re-run Pipeline
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {drawerTab === 'resume' && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-slate-400 text-[11px]">
                                        <span>Extracted text character count: {selectedAnalysis.resume_text?.length || 0}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigator.clipboard.writeText(selectedAnalysis.resume_text || '')}
                                        >
                                            Copy Text
                                        </Button>
                                    </div>
                                    <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                                        {selectedAnalysis.resume_text || 'No resume text extracted.'}
                                    </pre>
                                </div>
                            )}

                            {drawerTab === 'jd' && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-slate-400 text-[11px]">
                                        <span>Job description character count: {selectedAnalysis.jd_text?.length || 0}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigator.clipboard.writeText(selectedAnalysis.jd_text || '')}
                                        >
                                            Copy Text
                                        </Button>
                                    </div>
                                    <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                                        {selectedAnalysis.jd_text || 'No job description provided.'}
                                    </pre>
                                </div>
                            )}

                            {drawerTab === 'result' && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-slate-400 text-[11px]">
                                        <span>Structured Report Payload</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedAnalysis.result, null, 2))}
                                        >
                                            Copy JSON
                                        </Button>
                                    </div>
                                    <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                                        {selectedAnalysis.result
                                            ? JSON.stringify(selectedAnalysis.result, null, 2)
                                            : 'No result data recorded.'}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Delete Analysis Confirmation */}
            {deletingAnalysis && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-rose-500/30 space-y-4">
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                            <AlertCircle className="h-5 w-5" />
                            <h3 className="text-base font-bold">Confirm Deletion</h3>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300">
                            Are you sure you want to delete analysis #{deletingAnalysis.id} ({deletingAnalysis.job_title})? The stored CV file and result data will be permanently removed.
                        </p>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10 text-xs">
                            <Button type="button" variant="outline" size="sm" onClick={() => setDeletingAnalysis(null)}>
                                Cancel
                            </Button>
                            <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
                                Yes, Delete Record
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
