import React, { useEffect, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
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
    Loader2,
    RefreshCw,
    TrendingUp,
    Check,
    X,
    Info,
    ChevronDown,
    ChevronUp,
    Zap,
    Tag,
    Copy,
    Printer,
    RotateCcw,
    Trash2,
    Lock,
    GitCompare,
    HelpCircle,
    Sliders,
    Lightbulb,
} from 'lucide-react';

interface SuggestionItem {
    section: string;
    priority: 'high' | 'medium' | 'low';
    issue: string;
    fix: string;
    example_rewrite: string;
}

interface BreakdownCategory {
    score: number;
    note: string;
}

interface KeywordOverlapData {
    score: number;
    overlap_percentage: number;
    matched_keywords: string[];
    missing_keywords: string[];
    total_jd_keywords: number;
    matched_count: number;
}

interface PreviousAnalysisSummary {
    id: number;
    job_title: string;
    resume_name: string;
    score: number | null;
    formatted_date: string;
}

interface ComparisonData {
    id: number;
    job_title: string;
    resume_name: string;
    score: number | null;
    breakdown?: Record<string, BreakdownCategory> | null;
    matched_keywords: string[];
    missing_keywords: string[];
    score_delta: number | null;
    formatted_date: string;
}

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
    summary?: string | null;
    matched_keywords?: string[];
    missing_keywords?: string[];
    strengths?: string[];
    suggestions?: SuggestionItem[];
    breakdown?: {
        skills_match?: BreakdownCategory;
        experience_relevance?: BreakdownCategory;
        keywords?: BreakdownCategory;
        format_readability?: BreakdownCategory;
    } | null;
    keyword_overlap?: KeywordOverlapData | null;
    is_delayed: boolean;
    is_basic_fallback: boolean;
    error_message?: string | null;
    created_at: string;
    formatted_date: string;
}

interface ShowProps {
    analysis: AnalysisDetail;
    previous_analyses?: PreviousAnalysisSummary[];
    comparison_analysis?: ComparisonData | null;
}

export default function Show({
    analysis,
    previous_analyses = [],
    comparison_analysis = null,
}: ShowProps) {
    const isProcessing = analysis.status === 'queued' || analysis.status === 'processing';
    const [showResumeText, setShowResumeText] = useState(false);
    const [showJdText, setShowJdText] = useState(false);
    const [showExplainer, setShowExplainer] = useState(false);
    const [showRerunModal, setShowRerunModal] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [pollStep, setPollStep] = useState(0);

    // Tip rotation while processing
    const processingTips = [
        'ATS scanners search for exact matches in job titles, skills, and hard competencies.',
        'Action verbs paired with quantifiable metrics rank higher in semantic relevance.',
        'Complex multi-column tables and text boxes often break standard ATS text extractors.',
        'Aligning your experience bullets directly with the job requirements maximizes match scores.',
    ];

    // Live polling when queued or processing
    useEffect(() => {
        if (!isProcessing) return;

        const timer = setInterval(() => {
            router.reload({ only: ['analysis'] });
            setPollStep((prev) => (prev + 1) % processingTips.length);
        }, 3000);

        return () => clearInterval(timer);
    }, [isProcessing]);

    // Copy to clipboard handler
    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Re-run form
    const { data: rerunData, setData: setRerunData, post: postRerun, processing: rerunProcessing, errors: rerunErrors } = useForm({
        job_title: analysis.job_title,
        job_company: analysis.job_company || '',
        jd_text: analysis.jd_text,
    });

    const submitRerun = (e: React.FormEvent) => {
        e.preventDefault();
        postRerun(route('analyses.rerun', analysis.id), {
            onSuccess: () => setShowRerunModal(false),
        });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this analysis? The resume and scoring data will be permanently removed.')) {
            router.delete(route('analyses.destroy', analysis.id));
        }
    };

    const handleRetry = () => {
        router.post(route('analyses.retry', analysis.id));
    };

    // Score color palette
    const getScoreHue = (score: number) => {
        if (score >= 75) return { stroke: '#10b981', text: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-500/30' };
        if (score >= 50) return { stroke: '#f59e0b', text: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-500/30' };
        return { stroke: '#ef4444', text: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-500/30' };
    };

    const scoreHue = getScoreHue(analysis.match_score);

    // Group suggestions by section, sorted by priority (high > medium > low)
    const priorityWeight: Record<string, number> = { high: 1, medium: 2, low: 3 };
    const sortedSuggestions = [...(analysis.suggestions || [])].sort(
        (a, b) => (priorityWeight[a.priority.toLowerCase()] || 4) - (priorityWeight[b.priority.toLowerCase()] || 4)
    );

    const groupedSuggestions = sortedSuggestions.reduce((acc, curr) => {
        const sec = curr.section || 'General Suggestions';
        if (!acc[sec]) acc[sec] = [];
        acc[sec].push(curr);
        return acc;
    }, {} as Record<string, SuggestionItem[]>);

    return (
        <UserLayout title="ATS Analysis Result">
            <Head title={`ATS Score (${analysis.match_score}%) - ${analysis.job_title}`} />

            <div className="space-y-6 max-w-5xl mx-auto pb-16">
                {/* Top Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <Link
                        href={route('analyses.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Analyses History
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Compare Dropdown */}
                        {previous_analyses.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <GitCompare className="h-4 w-4 text-slate-400" />
                                <select
                                    value={comparison_analysis?.id || ''}
                                    onChange={(e) => {
                                        const compId = e.target.value;
                                        if (compId) {
                                            router.visit(route('analyses.show', { analysis: analysis.id, compare: compId }), { preserveScroll: true });
                                        } else {
                                            router.visit(route('analyses.show', analysis.id), { preserveScroll: true });
                                        }
                                    }}
                                    className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="">Compare with previous scan...</option>
                                    {previous_analyses.map((prev) => (
                                        <option key={prev.id} value={prev.id}>
                                            {prev.job_title} ({prev.score ?? 0}%) • {prev.formatted_date}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Print / Download PDF */}
                        <a
                            href={route('analyses.print', analysis.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Printer className="h-3.5 w-3.5" />}
                            >
                                Download PDF
                            </Button>
                        </a>

                        {/* Re-run With Edited JD */}
                        <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<RotateCcw className="h-3.5 w-3.5 text-indigo-500" />}
                            onClick={() => setShowRerunModal(true)}
                        >
                            Re-run With Edited JD
                        </Button>

                        {/* Delete Analysis */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Layer 7: Delayed Notice Banner */}
                {analysis.is_delayed && (
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-50/90 p-4 text-xs sm:text-sm text-amber-900 shadow-sm backdrop-blur-md dark:border-amber-500/40 dark:bg-amber-950/70 dark:text-amber-200">
                        <Info className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                            <p className="font-bold">We are taking a bit longer than usual</p>
                            <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                                High queue volume detected across AI providers. We will email you as soon as your full result is ready. You can safely close or bookmark this page.
                            </p>
                        </div>
                    </div>
                )}

                {/* Layer 8: Basic Degraded Fallback Banner */}
                {analysis.is_basic_fallback && (
                    <div className="flex items-start gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-50/90 p-4 text-xs sm:text-sm text-indigo-900 shadow-sm backdrop-blur-md dark:border-indigo-500/40 dark:bg-indigo-950/70 dark:text-indigo-200">
                        <Zap className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                        <div>
                            <p className="font-bold">Basic Keyword Analysis (AI Review Pending)</p>
                            <p className="mt-0.5 text-xs text-indigo-700 dark:text-indigo-300">
                                Showing deterministic keyword alignment. Your full semantic rubric score and actionable bullet rewrites are queuing and will replace this view automatically when complete.
                            </p>
                        </div>
                    </div>
                )}

                {/* Header Card with Privacy Guarantee */}
                <Card variant="glass" className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
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
                                    {analysis.is_basic_fallback
                                        ? 'Basic Fallback'
                                        : analysis.status}
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

                        {/* Privacy / Share-Free guarantee badge */}
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-white/[0.04] px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-white/5 w-fit">
                            <Lock className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Confidential • Share-Free</span>
                        </div>
                    </div>
                </Card>

                {/* Comparison Card (When Active) */}
                {comparison_analysis && (
                    <Card
                        variant="glass"
                        className="p-5 border-indigo-500/30 bg-gradient-to-r from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/30 dark:to-purple-950/20"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                    <GitCompare className="h-4 w-4" /> Comparison with Previous Scan
                                </span>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                                    Comparing against <span className="text-indigo-600 dark:text-indigo-400">{comparison_analysis.job_title}</span> ({comparison_analysis.formatted_date})
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Baseline Score</span>
                                    <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                                        {comparison_analysis.score ?? 0}%
                                    </span>
                                </div>

                                <div className="text-center">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Score</span>
                                    <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                                        {analysis.match_score}%
                                    </span>
                                </div>

                                {comparison_analysis.score_delta !== null && (
                                    <div className="text-center pl-2 border-l border-slate-200 dark:border-white/10">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Score Delta</span>
                                        <span
                                            className={`text-lg font-black ${
                                                comparison_analysis.score_delta > 0
                                                    ? 'text-emerald-500'
                                                    : comparison_analysis.score_delta < 0
                                                    ? 'text-rose-500'
                                                    : 'text-slate-500'
                                            }`}
                                        >
                                            {comparison_analysis.score_delta > 0 ? `+${comparison_analysis.score_delta}` : comparison_analysis.score_delta}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Processing State with Live Rotator */}
                {isProcessing && !analysis.is_basic_fallback && (
                    <Card
                        variant="glass"
                        className="p-10 text-center space-y-6 border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/20"
                    >
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-inner">
                            <Loader2 className="h-10 w-10 animate-spin" />
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                Analyzing Your Resume With Claude AI...
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                                Cross-referencing competencies, measuring keyword density, and generating concrete bullet rewrites.
                            </p>
                        </div>

                        {/* Animated Live Progress Bar */}
                        <div className="max-w-md mx-auto space-y-2">
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full animate-pulse w-3/4" />
                            </div>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 animate-fade-in">
                                Tip: {processingTips[pollStep]}
                            </p>
                        </div>

                        <div className="pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.reload({ only: ['analysis'] })}
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
                                    Analysis System Encountered a Problem
                                </h3>
                                <p className="mt-1 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                                    {analysis.error_message ||
                                        'Our AI analysis cluster was temporarily unable to complete the scoring pipeline. No scan quota was consumed for this attempt.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleRetry}
                                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                            >
                                Try Again With 1-Click
                            </Button>

                            <Link href={route('analyze')}>
                                <Button variant="outline" size="sm">
                                    Upload Different Resume
                                </Button>
                            </Link>
                        </div>
                    </Card>
                )}

                {/* Completed (or Basic Fallback) Content */}
                {(analysis.status === 'completed' || analysis.is_basic_fallback) && (
                    <div className="space-y-6">
                        {/* Primary Animated Gauge + Executive Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Score Gauge Card */}
                            <Card variant="glass" className="p-6 text-center flex flex-col justify-center items-center">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Overall Match Score
                                </span>

                                {/* Animated SVG Circular Gauge */}
                                <div className="relative mt-4 flex items-center justify-center">
                                    <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                                        {/* Background Track */}
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="48"
                                            className="stroke-slate-200 dark:stroke-slate-800"
                                            strokeWidth="10"
                                            fill="transparent"
                                        />
                                        {/* Animated Value Arc */}
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="48"
                                            stroke={scoreHue.stroke}
                                            strokeWidth="10"
                                            strokeDasharray={2 * Math.PI * 48}
                                            strokeDashoffset={2 * Math.PI * 48 * (1 - analysis.match_score / 100)}
                                            strokeLinecap="round"
                                            fill="transparent"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>

                                    {/* Score In Center */}
                                    <div className="absolute flex flex-col items-center justify-center">
                                        <span className={`text-4xl font-black tracking-tight ${scoreHue.text}`}>
                                            {analysis.match_score}
                                            <span className="text-xl font-bold">%</span>
                                        </span>
                                    </div>
                                </div>

                                <span className="mt-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {analysis.match_score >= 75
                                        ? 'Strong ATS Fit'
                                        : analysis.match_score >= 50
                                        ? 'Moderate Fit'
                                        : 'Needs Immediate Tailoring'}
                                </span>
                            </Card>

                            {/* Executive Summary Card */}
                            <Card variant="glass" className="md:col-span-2 p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Executive Assessment
                                        </h3>

                                        <button
                                            type="button"
                                            onClick={() => setShowExplainer(!showExplainer)}
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            <HelpCircle className="h-3.5 w-3.5" />
                                            How scoring works
                                        </button>
                                    </div>

                                    <p className="mt-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                                        {analysis.summary ||
                                            'Resume parsed and analyzed against job requirements. Review the category breakdown and recommended section rewrites below.'}
                                    </p>
                                </div>

                                {/* Deterministic Secondary Overlap Signal */}
                                {analysis.keyword_overlap && (
                                    <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <TrendingUp className="h-4 w-4 text-indigo-500" />
                                            Secondary Signal: Lexical Overlap {analysis.keyword_overlap.overlap_percentage}% ({analysis.keyword_overlap.matched_count}/{analysis.keyword_overlap.total_jd_keywords} critical terms)
                                        </span>
                                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                                            <CheckCircle2 className="h-4 w-4" /> Deterministic Match
                                        </span>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Collapsible Explainer: How Scoring Works & ATS Limitations */}
                        {showExplainer && (
                            <Card variant="glass" className="p-6 border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                                <div className="flex items-start justify-between">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Sliders className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        How ATS Scoring Works & Real-World Limitations
                                    </h4>
                                    <button
                                        onClick={() => setShowExplainer(false)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                                    <p>
                                        <strong>100-Point Rubric:</strong> Skills Match (40 pts), Experience Relevance (30 pts), Keyword Coverage (20 pts), and Format & Readability (10 pts).
                                    </p>
                                    <p>
                                        <strong>Real-World ATS Variations:</strong> Applicant Tracking Systems vary significantly. Systems like Workday and Taleo historically relied on exact token overlap, whereas modern platforms like Greenhouse, Lever, and Ashby use semantic ranking and recruiter search filters.
                                    </p>
                                    <p>
                                        <strong>Untrusted Data Guardrails:</strong> Our engine treats all submitted resume and job posting text strictly as untrusted data, ignoring any instructions embedded in resumes attempting to manipulate score outputs.
                                    </p>
                                </div>
                            </Card>
                        )}

                        {/* 4 Rubric Breakdown Bars */}
                        {analysis.breakdown && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Skills Match (40 pts) */}
                                {analysis.breakdown.skills_match && (
                                    <Card variant="glass" className="p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Skills Match
                                            </span>
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                                {analysis.breakdown.skills_match.score} / 40
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                                                style={{ width: `${Math.min(100, (analysis.breakdown.skills_match.score / 40) * 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {analysis.breakdown.skills_match.note}
                                        </p>
                                    </Card>
                                )}

                                {/* Experience Relevance (30 pts) */}
                                {analysis.breakdown.experience_relevance && (
                                    <Card variant="glass" className="p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Experience Relevance
                                            </span>
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                                {analysis.breakdown.experience_relevance.score} / 30
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                                                style={{ width: `${Math.min(100, (analysis.breakdown.experience_relevance.score / 30) * 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {analysis.breakdown.experience_relevance.note}
                                        </p>
                                    </Card>
                                )}

                                {/* Keywords Coverage (20 pts) */}
                                {analysis.breakdown.keywords && (
                                    <Card variant="glass" className="p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Keywords Coverage
                                            </span>
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                                {analysis.breakdown.keywords.score} / 20
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                                                style={{ width: `${Math.min(100, (analysis.breakdown.keywords.score / 20) * 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {analysis.breakdown.keywords.note}
                                        </p>
                                    </Card>
                                )}

                                {/* Format & Readability (10 pts) */}
                                {analysis.breakdown.format_readability && (
                                    <Card variant="glass" className="p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Format & Readability
                                            </span>
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                                {analysis.breakdown.format_readability.score} / 10
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                                                style={{ width: `${Math.min(100, (analysis.breakdown.format_readability.score / 10) * 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {analysis.breakdown.format_readability.note}
                                        </p>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Standout Strengths */}
                        {analysis.strengths && analysis.strengths.length > 0 && (
                            <Card variant="glass" className="p-6 space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                                    Standout Resume Strengths
                                </h3>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                                    {analysis.strengths.map((str, idx) => (
                                        <li key={idx} className="flex items-start gap-2.5">
                                            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>{str}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}

                        {/* Keyword Chips: Missing (Red) and Matched (Green) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Missing Keywords (Red Chips) */}
                            <Card variant="glass" className="p-6 space-y-4 border-rose-500/20">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <X className="h-4 w-4 text-rose-500" />
                                        Missing Keywords ({analysis.missing_keywords?.length || 0})
                                    </h3>
                                    <span className="text-xs text-rose-500 font-semibold">Priority Additions</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    These terms are emphasized in the job description but absent or understated in your resume.
                                </p>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {analysis.missing_keywords && analysis.missing_keywords.length > 0 ? (
                                        analysis.missing_keywords.map((kw, idx) => (
                                            <Badge
                                                key={idx}
                                                variant="danger"
                                                size="sm"
                                                className="font-medium"
                                            >
                                                + {kw}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-xs text-emerald-500 font-semibold">
                                            Zero missing keywords! Excellent lexical coverage.
                                        </span>
                                    )}
                                </div>
                            </Card>

                            {/* Matched Keywords (Green Chips) */}
                            <Card variant="glass" className="p-6 space-y-4 border-emerald-500/20">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Check className="h-4 w-4 text-emerald-500" />
                                        Matched Keywords ({analysis.matched_keywords?.length || 0})
                                    </h3>
                                    <span className="text-xs text-emerald-500 font-semibold">Confirmed Coverage</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Successfully detected in your resume, directly contributing to your positive ATS match score.
                                </p>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {analysis.matched_keywords && analysis.matched_keywords.length > 0 ? (
                                        analysis.matched_keywords.map((kw, idx) => (
                                            <Badge
                                                key={idx}
                                                variant="success"
                                                size="sm"
                                                className="font-medium"
                                            >
                                                ✓ {kw}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-xs text-slate-400">
                                            No matched keywords detected.
                                        </span>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Suggestion Cards Grouped by Section & Sorted by Priority */}
                        {Object.keys(groupedSuggestions).length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Sparkles className="h-5 w-5 text-indigo-500" />
                                            Actionable Section Fixes & Rewrites
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Grouped by resume section and sorted by impact priority.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {Object.entries(groupedSuggestions).map(([section, items]) => (
                                        <Card key={section} variant="glass" className="p-6 space-y-4">
                                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-white/10">
                                                <Tag className="h-4 w-4 text-indigo-500" />
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                                    {section}
                                                </h4>
                                                <span className="text-xs text-slate-400">
                                                    ({items.length} {items.length === 1 ? 'fix' : 'fixes'})
                                                </span>
                                            </div>

                                            <div className="space-y-4">
                                                {items.map((item, idx) => {
                                                    const itemKey = `${section}-${idx}`;
                                                    const isCopied = copiedKey === itemKey;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 dark:border-white/5 dark:bg-white/[0.02] space-y-3"
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <Badge
                                                                    variant={
                                                                        item.priority.toLowerCase() === 'high'
                                                                            ? 'danger'
                                                                            : item.priority.toLowerCase() === 'medium'
                                                                            ? 'warning'
                                                                            : 'primary'
                                                                    }
                                                                    size="sm"
                                                                    className="uppercase text-[10px]"
                                                                >
                                                                    {item.priority} Priority
                                                                </Badge>

                                                                {item.example_rewrite && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCopy(item.example_rewrite, itemKey)}
                                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors shadow-sm"
                                                                    >
                                                                        {isCopied ? (
                                                                            <>
                                                                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                                                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Copy className="h-3.5 w-3.5 text-slate-400" />
                                                                                <span>Copy Suggested Text</span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            <div className="text-xs space-y-1">
                                                                <p className="font-semibold text-slate-700 dark:text-slate-300">
                                                                    Issue: <span className="font-normal">{item.issue}</span>
                                                                </p>
                                                                <p className="font-semibold text-slate-700 dark:text-slate-300">
                                                                    Recommendation: <span className="font-normal">{item.fix}</span>
                                                                </p>
                                                            </div>

                                                            {item.example_rewrite && (
                                                                <div className="rounded-lg bg-indigo-50/60 p-3 border border-indigo-200/50 dark:bg-indigo-950/30 dark:border-indigo-900/40 text-xs">
                                                                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                                                                        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                                                                        <span>Recommended Bullet Rewrite:</span>
                                                                    </div>
                                                                    <p className="font-mono text-indigo-950 dark:text-indigo-200 pl-5">
                                                                        "{item.example_rewrite}"
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Collapsible Parsed Text */}
                        <div className="space-y-3">
                            {analysis.resume_text && (
                                <Card variant="glass" className="overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setShowResumeText(!showResumeText)}
                                        className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <span>Parsed Resume Text ({analysis.resume_text.length.toLocaleString()} characters)</span>
                                        {showResumeText ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </button>

                                    {showResumeText && (
                                        <div className="p-4 border-t border-slate-200/60 dark:border-white/10 max-h-64 overflow-y-auto bg-slate-900 text-slate-200 text-xs font-mono whitespace-pre-wrap">
                                            {analysis.resume_text}
                                        </div>
                                    )}
                                </Card>
                            )}

                            {analysis.jd_text && (
                                <Card variant="glass" className="overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setShowJdText(!showJdText)}
                                        className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <span>Target Job Description ({analysis.jd_text.length.toLocaleString()} characters)</span>
                                        {showJdText ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </button>

                                    {showJdText && (
                                        <div className="p-4 border-t border-slate-200/60 dark:border-white/10 max-h-64 overflow-y-auto bg-slate-900 text-slate-200 text-xs font-mono whitespace-pre-wrap">
                                            {analysis.jd_text}
                                        </div>
                                    )}
                                </Card>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Re-run With Edited JD Modal */}
            {showRerunModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-2">
                                <RotateCcw className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Re-run With Edited Job Description
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowRerunModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Re-evaluates your existing uploaded resume <span className="font-semibold text-slate-700 dark:text-slate-300">({analysis.resume_name})</span> against an updated job posting. Creates a new analysis and consumes 1 scan quota.
                        </p>

                        <form onSubmit={submitRerun} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Job Title
                                </label>
                                <input
                                    type="text"
                                    value={rerunData.job_title}
                                    onChange={(e) => setRerunData('job_title', e.target.value)}
                                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. Senior Laravel Engineer"
                                />
                                {rerunErrors.job_title && (
                                    <p className="text-[11px] text-rose-500 mt-1">{rerunErrors.job_title}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Company (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={rerunData.job_company}
                                    onChange={(e) => setRerunData('job_company', e.target.value)}
                                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. Acme Corp"
                                />
                                {rerunErrors.job_company && (
                                    <p className="text-[11px] text-rose-500 mt-1">{rerunErrors.job_company}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Updated Job Description <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={8}
                                    value={rerunData.jd_text}
                                    onChange={(e) => setRerunData('jd_text', e.target.value)}
                                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                                    placeholder="Paste the revised job description..."
                                    required
                                />
                                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                                    <span>Minimum 50 characters required</span>
                                    <span>{rerunData.jd_text.length.toLocaleString()} characters</span>
                                </div>
                                {rerunErrors.jd_text && (
                                    <p className="text-[11px] text-rose-500 mt-1">{rerunErrors.jd_text}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowRerunModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={rerunProcessing}
                                    leftIcon={rerunProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                >
                                    {rerunProcessing ? 'Queuing Analysis...' : 'Start New Analysis'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </UserLayout>
    );
}
