import React, { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Printer, ArrowLeft, Check, X, FileText, Building2, Calendar, ShieldCheck } from 'lucide-react';

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

interface AnalysisPrintProps {
    analysis: {
        id: number;
        resume_name: string;
        job_title: string;
        job_company?: string | null;
        jd_text: string;
        resume_text?: string | null;
        status: string;
        score: number | null;
        match_score: number;
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
        formatted_date: string;
    };
    site_name: string;
}

export default function Print({ analysis, site_name }: AnalysisPrintProps) {
    useEffect(() => {
        // Auto-trigger print dialog after mounting
        const timer = setTimeout(() => {
            window.print();
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-emerald-700 border-emerald-600 bg-emerald-50';
        if (score >= 50) return 'text-amber-700 border-amber-600 bg-amber-50';
        return 'text-rose-700 border-rose-600 bg-rose-50';
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 p-8 sm:p-12 font-sans print:p-0 print:m-0">
            <Head title={`ATS Report - ${analysis.job_title} (${analysis.match_score}%)`} />

            {/* Non-print action bar */}
            <div className="print:hidden max-w-4xl mx-auto mb-8 flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <Link
                    href={route('analyses.show', analysis.id)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Interactive Analysis
                </Link>

                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Printer className="h-4 w-4" />
                    Print / Save PDF
                </button>
            </div>

            {/* Printable Document Container */}
            <main className="max-w-4xl mx-auto space-y-8 bg-white print:max-w-none">
                {/* Header */}
                <header className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-700 font-black text-xl tracking-tight">
                            <ShieldCheck className="h-6 w-6" />
                            <span>{site_name}</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                            ATS Resume Diagnostic Report
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                            Candidate Evaluation & Algorithmic Keyword Alignment
                        </p>
                    </div>

                    <div className="text-right text-xs text-slate-500 space-y-1">
                        <p className="font-semibold text-slate-700">Confidential Report</p>
                        <p>Report ID: #{analysis.id.toString().padStart(6, '0')}</p>
                        <p>Generated: {analysis.formatted_date}</p>
                    </div>
                </header>

                {/* Candidate & Job Metadata */}
                <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div>
                        <span className="font-bold text-slate-400 uppercase tracking-wider block">Target Position</span>
                        <span className="font-bold text-slate-900 text-sm">{analysis.job_title}</span>
                    </div>
                    <div>
                        <span className="font-bold text-slate-400 uppercase tracking-wider block">Company</span>
                        <span className="font-bold text-slate-900 text-sm">{analysis.job_company || 'Not Specified'}</span>
                    </div>
                    <div>
                        <span className="font-bold text-slate-400 uppercase tracking-wider block">Resume Document</span>
                        <span className="font-bold text-slate-900 text-sm truncate block">{analysis.resume_name}</span>
                    </div>
                    <div>
                        <span className="font-bold text-slate-400 uppercase tracking-wider block">Evaluation Date</span>
                        <span className="font-bold text-slate-900 text-sm">{analysis.formatted_date}</span>
                    </div>
                </section>

                {/* Overall Score + Executive Summary */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                    <div className={`p-6 rounded-2xl border-2 text-center flex flex-col items-center justify-center ${getScoreColor(analysis.match_score)}`}>
                        <span className="text-xs font-bold uppercase tracking-wider">Overall ATS Score</span>
                        <span className="text-5xl font-black my-2">{analysis.match_score}%</span>
                        <span className="text-xs font-bold uppercase tracking-wide">
                            {analysis.match_score >= 75 ? 'Strong Fit' : analysis.match_score >= 50 ? 'Moderate Fit' : 'High Revision Needed'}
                        </span>
                    </div>

                    <div className="sm:col-span-2 p-6 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Executive Assessment</h2>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {analysis.summary || 'Resume successfully evaluated against target position requirements.'}
                        </p>
                        {analysis.keyword_overlap && (
                            <div className="pt-2 text-xs font-semibold text-slate-600 flex items-center justify-between border-t border-slate-200">
                                <span>Lexical Keyword Overlap: {analysis.keyword_overlap.overlap_percentage}%</span>
                                <span>{analysis.keyword_overlap.matched_count} of {analysis.keyword_overlap.total_jd_keywords} critical terms detected</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Rubric Breakdown */}
                {analysis.breakdown && (
                    <section className="space-y-3">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Scoring Breakdown (100 Pt Rubric)</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {analysis.breakdown.skills_match && (
                                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span>Skills Match</span>
                                        <span className="text-indigo-600">{analysis.breakdown.skills_match.score} / 40</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 mt-1">{analysis.breakdown.skills_match.note}</p>
                                </div>
                            )}

                            {analysis.breakdown.experience_relevance && (
                                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span>Experience</span>
                                        <span className="text-indigo-600">{analysis.breakdown.experience_relevance.score} / 30</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 mt-1">{analysis.breakdown.experience_relevance.note}</p>
                                </div>
                            )}

                            {analysis.breakdown.keywords && (
                                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span>Keywords</span>
                                        <span className="text-indigo-600">{analysis.breakdown.keywords.score} / 20</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 mt-1">{analysis.breakdown.keywords.note}</p>
                                </div>
                            )}

                            {analysis.breakdown.format_readability && (
                                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span>Readability</span>
                                        <span className="text-indigo-600">{analysis.breakdown.format_readability.score} / 10</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 mt-1">{analysis.breakdown.format_readability.note}</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Keywords Summary */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Matched Keywords */}
                    <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                            <Check className="h-4 w-4 text-emerald-600" />
                            Matched Keywords ({analysis.matched_keywords?.length || 0})
                        </h2>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {analysis.matched_keywords?.map((kw, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Missing Keywords */}
                    <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                            <X className="h-4 w-4 text-rose-600" />
                            Missing Key JD Terms ({analysis.missing_keywords?.length || 0})
                        </h2>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {analysis.missing_keywords?.map((kw, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Standout Strengths */}
                {analysis.strengths && analysis.strengths.length > 0 && (
                    <section className="p-4 rounded-xl border border-slate-200 space-y-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Identified Strengths
                        </h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                            {analysis.strengths.map((str, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{str}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Concrete Suggestions */}
                {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                            Priority Recommendations & Concrete Rewrites
                        </h2>
                        <div className="space-y-3">
                            {analysis.suggestions.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs">
                                    <div className="flex justify-between items-center font-bold">
                                        <span className="uppercase text-slate-700">{item.section}</span>
                                        <span className={`px-2 py-0.5 rounded uppercase text-[10px] ${item.priority === 'high' ? 'bg-rose-100 text-rose-800' : item.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'}`}>
                                            {item.priority} Priority
                                        </span>
                                    </div>
                                    <p className="text-slate-600"><span className="font-semibold text-slate-800">Issue:</span> {item.issue}</p>
                                    <p className="text-slate-600"><span className="font-semibold text-slate-800">Action:</span> {item.fix}</p>
                                    {item.example_rewrite && (
                                        <div className="p-2.5 rounded bg-white border border-slate-200 font-mono text-[11px] text-slate-800">
                                            <span className="font-bold font-sans text-indigo-700 block mb-0.5">Recommended Bullet:</span>
                                            "{item.example_rewrite}"
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Footer / Disclaimer */}
                <footer className="border-t border-slate-300 pt-6 text-[11px] text-slate-500 leading-relaxed">
                    <p className="font-bold text-slate-700 mb-1">ATS Simulation Methodology & Limitations</p>
                    <p>
                        This report was generated using LLM-assisted semantic parsing and deterministic lexical matching against the target job posting. Real-world Applicant Tracking Systems (e.g. Workday, Taleo, Greenhouse, Lever, iCIMS) employ diverse proprietary parsing algorithms and recruiter-configured filters. Use these suggestions as tactical guidance to maximize clarity, relevance, and keyword visibility.
                    </p>
                </footer>
            </main>
        </div>
    );
}
