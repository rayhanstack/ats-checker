import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { Card, Button, Input, Badge, EmptyState, Modal } from '@/Components/UI';
import {
    Search,
    Filter,
    Trash2,
    FileText,
    ArrowUpDown,
    RotateCcw,
    Sparkles,
    Calendar,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
} from 'lucide-react';
import { AnalysisItem, PaginatedData } from '@/types';

interface AnalysesIndexProps {
    analyses: PaginatedData<AnalysisItem>;
    filters: {
        search: string;
        score: string;
        date: string;
    };
    stats: {
        total: number;
        avg_score: number;
    };
}

export default function AnalysesIndex({
    analyses,
    filters,
    stats,
}: AnalysesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [score, setScore] = useState(filters.score || 'all');
    const [date, setDate] = useState(filters.date || 'all');
    const [analysisToDelete, setAnalysisToDelete] = useState<AnalysisItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search, score, date });
    };

    const handleScoreChange = (newScore: string) => {
        setScore(newScore);
        applyFilters({ search, score: newScore, date });
    };

    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        applyFilters({ search, score, date: newDate });
    };

    const applyFilters = (params: { search: string; score: string; date: string }) => {
        router.get(
            route('analyses.index'),
            {
                search: params.search || undefined,
                score: params.score !== 'all' ? params.score : undefined,
                date: params.date !== 'all' ? params.date : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const clearFilters = () => {
        setSearch('');
        setScore('all');
        setDate('all');
        router.get(route('analyses.index'), {}, { preserveScroll: true });
    };

    const confirmDelete = (analysis: AnalysisItem) => {
        setAnalysisToDelete(analysis);
    };

    const handleDelete = () => {
        if (!analysisToDelete) return;
        setIsDeleting(true);

        router.delete(route('analyses.destroy', analysisToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                setAnalysisToDelete(null);
                setIsDeleting(false);
            },
            onError: () => setIsDeleting(false),
        });
    };

    const hasActiveFilters = Boolean(filters.search || filters.score !== 'all' || filters.date !== 'all');

    const getScoreBadge = (val: number) => {
        if (val >= 80) return <Badge variant="success" size="md">{val} / 100</Badge>;
        if (val >= 60) return <Badge variant="warning" size="md">{val} / 100</Badge>;
        return <Badge variant="danger" size="md">{val} / 100</Badge>;
    };

    return (
        <UserLayout title="Analysis History">
            <Head title="Analysis History - ATS Checker" />

            <div className="space-y-6 max-w-6xl mx-auto">
                {/* 1. Header & Quick Stats */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Resume Analysis History
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            Review and manage all past resume checks, match score benchmarks, and keyword diagnoses.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href={route('analyze')}>
                            <Button variant="primary" size="md" leftIcon={<Sparkles className="h-4 w-4" />}>
                                New Analysis
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 2. Filter & Search Toolbar */}
                <Card variant="glass" className="p-4 sm:p-5">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1 w-full">
                            <Input
                                id="search"
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by job title, company, or resume name..."
                                leftIcon={<Search className="h-4 w-4" />}
                                className="w-full"
                            />
                        </div>

                        {/* Filter by Score Dropdown */}
                        <div className="w-full md:w-44 shrink-0">
                            <select
                                value={score}
                                onChange={(e) => handleScoreChange(e.target.value)}
                                aria-label="Filter by ATS Score"
                                className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-3.5 py-2.5 text-xs font-medium text-slate-800 backdrop-blur-md transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
                            >
                                <option value="all">All Scores</option>
                                <option value="high">High Match (80–100)</option>
                                <option value="medium">Medium Match (60–79)</option>
                                <option value="low">Needs Work (&lt; 60)</option>
                            </select>
                        </div>

                        {/* Filter by Date Dropdown */}
                        <div className="w-full md:w-44 shrink-0">
                            <select
                                value={date}
                                onChange={(e) => handleDateChange(e.target.value)}
                                aria-label="Filter by Date"
                                className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-3.5 py-2.5 text-xs font-medium text-slate-800 backdrop-blur-md transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
                            >
                                <option value="all">All Time</option>
                                <option value="7d">Past 7 Days</option>
                                <option value="30d">Past 30 Days</option>
                                <option value="90d">Past 90 Days</option>
                            </select>
                        </div>

                        {/* Search & Reset Buttons */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Button type="submit" variant="secondary" size="md">
                                Search
                            </Button>
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="md"
                                    onClick={clearFilters}
                                    title="Reset filters"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>

                {/* 3. Analyses List */}
                {analyses.data.length === 0 ? (
                    hasActiveFilters ? (
                        <EmptyState
                            icon={<Search className="h-7 w-7 text-indigo-500" />}
                            title="No matching analyses found"
                            description="Try adjusting your search terms or clearing score and date filters."
                            action={
                                <Button variant="outline" size="sm" onClick={clearFilters}>
                                    Clear All Filters
                                </Button>
                            }
                        />
                    ) : (
                        <EmptyState
                            icon={<FileText className="h-7 w-7 text-indigo-500" />}
                            title="No analyses in your history yet"
                            description="Upload your CV and paste your first job description to get an immediate AI ATS rating."
                            action={
                                <Link href={route('analyze')}>
                                    <Button variant="primary" size="md" leftIcon={<Sparkles className="h-4 w-4" />}>
                                        Scan Your Resume Now
                                    </Button>
                                </Link>
                            }
                        />
                    )
                ) : (
                    <div className="space-y-3">
                        {analyses.data.map((item) => (
                            <Card
                                key={item.id}
                                variant="glass"
                                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-indigo-500/30"
                            >
                                <div className="flex items-start sm:items-center gap-3.5">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {item.job_title}
                                            {item.job_company && (
                                                <span className="text-slate-400 font-normal"> • {item.job_company}</span>
                                            )}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            File: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.resume_name}</span> • {item.formatted_date}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 self-end sm:self-center">
                                    {getScoreBadge(item.match_score)}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => confirmDelete(item)}
                                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40 p-2"
                                        aria-label="Delete analysis"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* 4. Pagination */}
                {analyses.last_page > 1 && (
                    <div className="flex items-center justify-between pt-4">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            Showing {analyses.from ?? 0} to {analyses.to ?? 0} of {analyses.total} analyses
                        </div>

                        <div className="flex items-center gap-1.5">
                            {analyses.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveScroll
                                    className={`inline-flex min-w-[32px] h-8 items-center justify-center rounded-lg px-2.5 text-xs font-semibold transition-all ${
                                        link.active
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : link.url
                                            ? 'border border-slate-200/80 bg-white/70 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800'
                                            : 'pointer-events-none opacity-40 text-slate-400'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={Boolean(analysisToDelete)} onClose={() => setAnalysisToDelete(null)}>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/70">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Delete Analysis Record?
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                This will permanently remove the score and diagnostic data for this scan.
                            </p>
                        </div>
                    </div>

                    {analysisToDelete && (
                        <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-slate-800/60">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                                {analysisToDelete.job_title}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                                Resume: {analysisToDelete.resume_name} • Score: {analysisToDelete.match_score}/100
                            </p>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setAnalysisToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            isLoading={isDeleting}
                            onClick={handleDelete}
                            leftIcon={<Trash2 className="h-4 w-4" />}
                        >
                            Confirm Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </UserLayout>
    );
}
