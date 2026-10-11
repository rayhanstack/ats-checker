import React, { useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { Card, Badge, Button } from '@/Components/UI';
import {
    Sparkles,
    FileText,
    ArrowLeft,
    Clock,
    AlertCircle,
    CheckCircle2,
    Building2,
    Briefcase,
    Loader2,
    RefreshCw,
} from 'lucide-react';

interface AnalysisDetail {
    id: number;
    resume_name: string;
    job_title: string;
    job_company?: string | null;
    jd_text: string;
    resume_text?: string | null;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    score: number | null;
    match_score: number;
    badge_variant: 'success' | 'warning' | 'danger';
    result?: Record<string, unknown> | null;
    summary?: string | null;
    matched_keywords?: string[];
    missing_keywords?: string[];
    suggestions?: string[];
    error_message?: string | null;
    created_at: string;
    formatted_date: string;
}

interface ShowProps {
    analysis: AnalysisDetail;
}

export default function Show({ analysis }: ShowProps) {
    const isProcessing = analysis.status === 'queued' || analysis.status === 'processing';

    // Auto-poll while queued or processing
    useEffect(() => {
        if (!isProcessing) return;

        const interval = setInterval(() => {
            router.reload({ only: ['analysis'] });
        }, 3000);

        return () => clearInterval(interval);
    }, [isProcessing]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500 border-emerald-500';
        if (score >= 60) return 'text-amber-500 border-amber-500';
        return 'text-rose-500 border-rose-500';
    };

    return (
        <UserLayout title="ATS Analysis Result">
            <Head title={`ATS Score - ${analysis.job_title}`} />

            <div className="space-y-6 max-w-5xl mx-auto pb-12">
                {/* Top Nav */}
                <div className="flex items-center justify-between">
                    <Link
                        href={route('analyses.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Analyses History
                    </Link>

                    <Link href={route('analyze')}>
                        <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Sparkles className="h-3.5 w-3.5 text-indigo-500" />}
                        >
                            Scan Another Resume
                        </Button>
                    </Link>
                </div>

                {/* Header Card */}
                <Card variant="glass" className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                                    {analysis.job_title}
                                </h1>
                                <Badge
                                    variant={
                                        analysis.status === 'completed'
                                            ? 'success'
                                            : analysis.status === 'failed'
                                            ? 'danger'
                                            : 'primary'
                                    }
                                    size="sm"
                                    className="capitalize"
                                >
                                    {analysis.status}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                                {analysis.job_company && (
                                    <span className="flex items-center gap-1">
                                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                        {analysis.job_company}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                                    {analysis.resume_name}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                    {analysis.formatted_date}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Processing State */}
                {isProcessing && (
                    <Card
                        variant="glass"
                        className="p-12 text-center space-y-4 border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/20"
                    >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Analyzing Resume & Extracting Match Data...
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                            Our algorithms and AI pipeline are parsing your resume structure and comparing semantic keywords against the job description. This page refreshes automatically.
                        </p>
                        <div className="pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.reload()}
                                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                            >
                                Refresh Status
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Failed State */}
                {analysis.status === 'failed' && (
                    <Card
                        variant="glass"
                        className="p-8 border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20 space-y-4"
                    >
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
                                    Analysis Encountered An Error
                                </h3>
                                <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                                    {analysis.error_message ||
                                        'An unexpected error occurred during processing. Please try submitting again with a different document.'}
                                </p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Link href={route('analyze')}>
                                <Button variant="primary" size="sm">
                                    Upload New Resume
                                </Button>
                            </Link>
                        </div>
                    </Card>
                )}

                {/* Completed State */}
                {analysis.status === 'completed' && (
                    <div className="space-y-6">
                        {/* Match Score Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card variant="glass" className="p-6 text-center flex flex-col justify-center items-center">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    ATS Match Score
                                </span>
                                <div
                                    className={`mt-4 flex h-28 w-28 items-center justify-center rounded-full border-4 text-3xl font-black ${getScoreColor(
                                        analysis.match_score
                                    )}`}
                                >
                                    {analysis.match_score}%
                                </div>
                                <span className="mt-3 text-xs font-medium text-slate-500">
                                    {analysis.match_score >= 80
                                        ? 'Strong Match'
                                        : analysis.match_score >= 60
                                        ? 'Moderate Match'
                                        : 'Needs Optimization'}
                                </span>
                            </Card>

                            <Card variant="glass" className="md:col-span-2 p-6 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-slate-400">
                                        Executive Assessment
                                    </h3>
                                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {analysis.summary ||
                                            'Resume parsed successfully. The document text is extracted and ready for in-depth keyword gap comparison.'}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-slate-400">
                                    <span>Status: Extraction Verified</span>
                                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4" /> Ready for AI Analysis
                                    </span>
                                </div>
                            </Card>
                        </div>

                        {/* Extracted Text Preview Card */}
                        {analysis.resume_text && (
                            <Card variant="glass" className="p-6 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Parsed Resume Content
                                    </h3>
                                    <span className="text-xs text-slate-400">
                                        {analysis.resume_text.length.toLocaleString()} characters extracted
                                    </span>
                                </div>

                                <div className="max-h-64 overflow-y-auto rounded-xl bg-slate-900 p-4 text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
                                    {analysis.resume_text}
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
