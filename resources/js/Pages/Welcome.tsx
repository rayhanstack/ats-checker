import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Button, Card, Badge, Section } from '@/Components/UI';
import { ArrowRight, CheckCircle2, Sparkles, UploadCloud, FileCheck, Zap, ShieldCheck } from 'lucide-react';

export default function Welcome() {
    return (
        <PublicLayout>
            <Head title="ATS Checker - AI-Powered Resume Optimization" />

            {/* Hero Section */}
            <Section className="pt-12 sm:pt-20 pb-16">
                <div className="flex flex-col items-center text-center">
                    <Badge variant="primary" dot size="md" className="mb-6 shadow-sm">
                        Smart AI ATS Resume Scanner
                    </Badge>

                    <h1 className="max-w-4xl text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                        Optimize Your Resume for{' '}
                        <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">
                            Applicant Tracking Systems
                        </span>
                    </h1>

                    <p className="mt-6 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        Compare your CV against any job description. Get an instant match score (0-100), identify missing keywords, and receive pinpoint line-by-line recommendations.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        <Link href={route('register')}>
                            <Button
                                variant="primary"
                                size="lg"
                                rightIcon={<ArrowRight className="h-5 w-5" />}
                                className="shadow-lg shadow-indigo-500/30"
                            >
                                Start 7-Day Free Trial
                            </Button>
                        </Link>
                        <a href="#how-it-works">
                            <Button variant="glass" size="lg">
                                See How It Works
                            </Button>
                        </a>
                    </div>

                    <div className="mt-6 flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            No credit card required
                        </span>
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            Instant analysis
                        </span>
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            Strict privacy
                        </span>
                    </div>

                    {/* Glass Mockup Preview Card */}
                    <div className="mt-14 w-full max-w-4xl">
                        <Card padding="lg" className="border-indigo-500/20 shadow-glass-lg backdrop-blur-2xl">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                <div className="space-y-4 md:border-r md:border-slate-200/50 dark:md:border-white/10 md:pr-6">
                                    <Badge variant="purple" size="sm">Overall Match Score</Badge>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-indigo-600 dark:text-indigo-400">88</span>
                                        <span className="text-xl font-bold text-slate-400">/ 100</span>
                                    </div>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> High likelihood of passing initial screening
                                    </p>
                                </div>

                                <div className="space-y-3 md:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Identified Keyword Match
                                        </span>
                                        <Badge variant="success" size="sm">14 Matched</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['React', 'TypeScript', 'Tailwind CSS', 'REST API', 'System Architecture', 'CI/CD Pipelines'].map((kw) => (
                                            <span key={kw} className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs px-2.5 py-1 border border-emerald-200/50 dark:border-emerald-800/40 font-medium">
                                                ✓ {kw}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="pt-2 flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Critical Missing Keywords
                                        </span>
                                        <Badge variant="danger" size="sm">3 Missing</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['AWS Lambda', 'GraphQL', 'Docker'].map((kw) => (
                                            <span key={kw} className="rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs px-2.5 py-1 border border-rose-200/50 dark:border-rose-800/40 font-medium">
                                                + {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </Section>

            {/* Features Highlight */}
            <Section id="features" badge="Key Features" title="Everything You Need to Beat the Filter" subtitle="Modern recruiting systems filter up to 75% of resumes before a human ever looks at them. ATS Checker ensures yours makes it through.">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card padding="md" interactive>
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                            <Zap className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Claude AI Evaluation</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            State-of-the-art semantic matching that understands contextual qualifications beyond simple naive keyword counting.
                        </p>
                    </Card>

                    <Card padding="md" interactive>
                        <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
                            <FileCheck className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Section-by-Section Guidance</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Clear instructions highlighting exactly which bullet points in your work experience or skills section need rewording.
                        </p>
                    </Card>

                    <Card padding="md" interactive>
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Privacy & Retention Limits</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Your resume text is strictly confidential. Uploaded documents automatically expire according to privacy retention rules.
                        </p>
                    </Card>
                </div>
            </Section>

            {/* How It Works */}
            <Section id="how-it-works" badge="Workflow" title="3 Simple Steps to a Better CV" subtitle="Analyze, revise, and apply with high confidence." className="bg-slate-100/40 dark:bg-white/[0.02]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card padding="lg">
                        <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">01</span>
                        <h4 className="mt-4 font-bold text-lg text-slate-900 dark:text-white">Upload Your CV</h4>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Drop in your existing resume in PDF or DOCX format.
                        </p>
                    </Card>

                    <Card padding="lg">
                        <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">02</span>
                        <h4 className="mt-4 font-bold text-lg text-slate-900 dark:text-white">Submit Job Description</h4>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Paste the target job posting you are actively applying for.
                        </p>
                    </Card>

                    <Card padding="lg">
                        <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">03</span>
                        <h4 className="mt-4 font-bold text-lg text-slate-900 dark:text-white">Get Score & Fixes</h4>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Review your score, fill the keyword gaps, and apply with confidence.
                        </p>
                    </Card>
                </div>
            </Section>

            {/* Final CTA Banner */}
            <Section className="pb-24">
                <Card padding="lg" className="border-indigo-500/30 bg-gradient-to-r from-indigo-600/90 via-indigo-700/90 to-violet-700/90 text-white text-center py-12">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        Ready to Land More Interviews?
                    </h2>
                    <p className="mt-3 text-indigo-100 max-w-xl mx-auto text-base">
                        Get started with your 7-day free trial today. Analyze your resume in under 60 seconds.
                    </p>
                    <div className="mt-6">
                        <Link href={route('register')}>
                            <Button variant="secondary" size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                                Get Started Free
                            </Button>
                        </Link>
                    </div>
                </Card>
            </Section>
        </PublicLayout>
    );
}
