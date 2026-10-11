import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Button, Card, Badge, Section } from '@/Components/UI';
import FaqAccordion from '@/Components/FaqAccordion';
import {
    ArrowRight,
    CheckCircle2,
    Sparkles,
    UploadCloud,
    FileCheck,
    Zap,
    ShieldCheck,
    Target,
    BarChart3,
    FileText,
    Star,
    AlertCircle,
    Check,
    ChevronRight,
    TrendingUp,
    Users,
    Search,
} from 'lucide-react';
import { PageProps, FaqItem, TestimonialItem, PricingPlan } from '@/types';

interface WelcomeProps {
    faqs: FaqItem[];
    testimonials: TestimonialItem[];
    plans: PricingPlan[];
    stats: {
        resumes_analyzed: string;
        average_score_lift: string;
        callback_rate_increase: string;
        active_candidates: string;
    };
}

export default function Welcome({ faqs, testimonials, plans, stats }: WelcomeProps) {
    const { auth, settings } = usePage<PageProps>().props;
    const [previewTab, setPreviewTab] = useState<'overview' | 'keywords' | 'fixes'>('overview');

    const trialDays = settings?.trial_days ?? 7;

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };

    return (
        <PublicLayout>
            <Head>
                <title>{`${settings?.site_name || 'ATS Checker'} - AI Resume Optimization & ATS Scoring`}</title>
                <meta
                    name="description"
                    content="Check your resume against any job description. Get an instant ATS compatibility score (0-100), identify missing keywords, and receive tailored line-by-line recommendations. Start your 7-day free trial today."
                />
                <meta property="og:title" content={`${settings?.site_name || 'ATS Checker'} - AI Resume Scanner`} />
                <meta
                    property="og:description"
                    content="Scan your CV against any job post. Discover missing keywords, fix formatting flaws, and boost your interview callback rate with Claude AI."
                />
                <meta property="og:type" content="website" />
                <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
            </Head>

            {/* 1. Hero Section */}
            <Section className="pt-10 sm:pt-16 pb-16">
                <div className="flex flex-col items-center text-center">
                    <Badge variant="primary" dot size="md" className="mb-6 shadow-sm">
                        AI-Powered Applicant Tracking System Diagnostics
                    </Badge>

                    <h1 className="max-w-4xl text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                        Beat the Filter. Land the Interview.{' '}
                        <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">
                            Guaranteed Clarity.
                        </span>
                    </h1>

                    <p className="mt-6 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        Upload your CV and submit any job description. Our advanced AI calculates your match score (0–100), pinpoints missing keywords, and gives you actionable line-by-line recommendations.
                    </p>

                    {/* CTAs */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        <Link href={route('analyze')}>
                            <Button
                                variant="primary"
                                size="lg"
                                rightIcon={<ArrowRight className="h-5 w-5" />}
                                className="shadow-lg shadow-indigo-500/30"
                            >
                                Check My CV Now
                            </Button>
                        </Link>
                        <a href="#sample-preview">
                            <Button variant="glass" size="lg">
                                View Sample Analysis
                            </Button>
                        </a>
                    </div>

                    {/* Key Trust Signals */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            {trialDays}-Day Free Trial
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            No Credit Card Required
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            Instant Evaluation in &lt; 60s
                        </span>
                    </div>

                    {/* Hero Mockup Card */}
                    <div className="mt-14 w-full max-w-4xl">
                        <div className="relative rounded-3xl p-1 bg-gradient-to-b from-indigo-500/20 via-white/40 to-transparent dark:from-indigo-500/20 dark:via-white/5 dark:to-transparent">
                            <Card padding="lg" className="border-indigo-500/20 shadow-glass-lg backdrop-blur-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                    {/* Score Meter */}
                                    <div className="space-y-4 md:border-r md:border-slate-200/50 dark:md:border-white/10 md:pr-6">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="purple" size="sm">Compatibility Score</Badge>
                                            <span className="text-xs text-slate-400">Target: 80+</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-6xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                                                88
                                            </span>
                                            <span className="text-2xl font-bold text-slate-400">/ 100</span>
                                        </div>
                                        <div className="w-full bg-slate-200/80 rounded-full h-2 dark:bg-slate-800 overflow-hidden">
                                            <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 rounded-full w-[88%]" />
                                        </div>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                            High probability of passing automated screening
                                        </p>
                                    </div>

                                    {/* Key Highlights */}
                                    <div className="space-y-3.5 md:col-span-2">
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Hard Skills & Keywords Matched (14/17)
                                                </span>
                                                <Badge variant="success" size="sm">82% Matched</Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['React', 'TypeScript', 'Tailwind CSS', 'REST API', 'CI/CD Pipelines', 'System Architecture', 'Git'].map((kw) => (
                                                    <span
                                                        key={kw}
                                                        className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs px-2.5 py-1 border border-emerald-200/50 dark:border-emerald-800/40 font-medium"
                                                    >
                                                        ✓ {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-1">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    High-Impact Missing Keywords (3)
                                                </span>
                                                <Badge variant="danger" size="sm">Action Required</Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['Docker Containerization', 'GraphQL', 'AWS CloudFormation'].map((kw) => (
                                                    <span
                                                        key={kw}
                                                        className="rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs px-2.5 py-1 border border-rose-200/50 dark:border-rose-800/40 font-medium"
                                                    >
                                                        + {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </Section>

            {/* 2. Trust / Stats Strip */}
            <div className="border-y border-slate-200/50 bg-white/40 dark:border-white/10 dark:bg-slate-900/40 backdrop-blur-md py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <p className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">
                                {stats.resumes_analyzed}
                            </p>
                            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                                Resumes Analyzed
                            </p>
                        </div>
                        <div>
                            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                                {stats.average_score_lift}
                            </p>
                            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                                Average Score Lift
                            </p>
                        </div>
                        <div>
                            <p className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">
                                {stats.callback_rate_increase}
                            </p>
                            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                                Interview Callback Rate
                            </p>
                        </div>
                        <div>
                            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                                {stats.active_candidates}
                            </p>
                            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                                Active Candidates
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Features Section */}
            <Section
                id="features"
                badge="Platform Capabilities"
                title="Engineered Specifically for Modern ATS Algorithms"
                subtitle="Most resume rejections are automated. ATS Checker illuminates the invisible filters and shows you exactly how to pass."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    <Card padding="md" interactive>
                        <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                            <Zap className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                            Claude AI Semantic Matching
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Understands related terminology and context instead of rigid keyword matching. Knows that "PostgreSQL" satisfies "relational database" requirements.
                        </p>
                    </Card>

                    <Card padding="md" interactive>
                        <div className="h-11 w-11 rounded-xl bg-violet-50 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
                            <Target className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                            Keyword Gap Identification
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Extracts every hard skill, qualification, and competency demanded in the job post, classifying them into matched and critical missing keywords.
                        </p>
                    </Card>

                    <Card padding="md" interactive>
                        <div className="h-11 w-11 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
                            <FileCheck className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                            Section-by-Section Guidance
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Pinpoints precisely which experience bullets, summary sentences, or skill sections need rewording to align with target role requirements.
                        </p>
                    </Card>

                    <Card padding="md" interactive>
                        <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                            Formatting & Readability Checks
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Detects tables, text boxes, non-standard headers, and column splits that frequently crash legacy ATS parser engines.
                        </p>
                    </Card>

                    <Card padding="md" interactive>
                        <div className="h-11 w-11 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                            <UploadCloud className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                            PDF & DOCX Deep Parsing
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Background text extraction workers extract structured data cleanly without hanging browser tabs or losing formatting fidelity.
                        </p>
                    </Card>

                    <Card padding="md" interactive>
                        <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                            Automatic Privacy Retention
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            We never sell your resume data. Documents automatically purge after 30 days to guarantee privacy and compliance.
                        </p>
                    </Card>
                </div>
            </Section>

            {/* 4. How It Works Section */}
            <Section
                id="how-it-works"
                badge="3-Step Workflow"
                title="Simple, Fast & Completely Transparent"
                subtitle="Optimize your resume in less than 2 minutes before submitting your next application."
                className="bg-slate-100/50 dark:bg-white/[0.02]"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card padding="lg" className="relative">
                        <div className="flex items-center justify-between">
                            <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">01</span>
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <UploadCloud className="h-5 w-5" />
                            </div>
                        </div>
                        <h4 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">
                            Upload Your CV
                        </h4>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Upload your resume in PDF or DOCX format (up to 5MB). Text is extracted securely in the background.
                        </p>
                    </Card>

                    <Card padding="lg" className="relative">
                        <div className="flex items-center justify-between">
                            <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">02</span>
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <FileText className="h-5 w-5" />
                            </div>
                        </div>
                        <h4 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">
                            Paste Job Description
                        </h4>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Paste the target role description, responsibilities, and required qualifications from LinkedIn, Indeed, or company career pages.
                        </p>
                    </Card>

                    <Card padding="lg" className="relative">
                        <div className="flex items-center justify-between">
                            <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">03</span>
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Sparkles className="h-5 w-5" />
                            </div>
                        </div>
                        <h4 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">
                            Get Score & Actionable Fixes
                        </h4>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Receive your 0–100 match score, missing skills breakdown, and specific sentence rewrites to pass recruiter filters.
                        </p>
                    </Card>
                </div>
            </Section>

            {/* 5. Sample Result Preview Section */}
            <Section
                id="sample-preview"
                badge="Interactive Demo"
                title="See What a Full Diagnosis Report Looks Like"
                subtitle="We do not give you vague scores. You get a concrete, actionable blueprint to upgrade your application."
            >
                <div className="mx-auto max-w-4xl">
                    <Card padding="none" className="overflow-hidden shadow-glass-lg border-indigo-500/20">
                        {/* Interactive Tab Strip */}
                        <div className="flex border-b border-slate-200/60 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/60 p-2 gap-2 text-sm font-semibold">
                            <button
                                type="button"
                                onClick={() => setPreviewTab('overview')}
                                className={`rounded-xl px-4 py-2 transition-all ${
                                    previewTab === 'overview'
                                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                Overview Score
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewTab('keywords')}
                                className={`rounded-xl px-4 py-2 transition-all ${
                                    previewTab === 'keywords'
                                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                Keyword Gap Analysis
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewTab('fixes')}
                                className={`rounded-xl px-4 py-2 transition-all ${
                                    previewTab === 'fixes'
                                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                Recommended Line Fixes
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6 sm:p-8">
                            {previewTab === 'overview' && (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
                                        <div className="space-y-1 text-center sm:text-left">
                                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                                Position Analyzed: Senior Full-Stack Engineer
                                            </span>
                                            <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                                                Overall ATS Match Score
                                            </h4>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                                Based on 32 analyzed requirements across frontend, backend, and cloud.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400">
                                                88
                                            </div>
                                            <div className="text-xs text-slate-500 text-left">
                                                <div className="font-bold text-emerald-600 dark:text-emerald-400">GOOD MATCH</div>
                                                <div>Top 15% percentile</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-slate-900/40">
                                            <span className="text-xs font-semibold text-slate-500">Hard Skills</span>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">91%</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-slate-900/40">
                                            <span className="text-xs font-semibold text-slate-500">Experience Alignment</span>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">84%</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-slate-900/40">
                                            <span className="text-xs font-semibold text-slate-500">Formatting ATS Safety</span>
                                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">100%</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewTab === 'keywords' && (
                                <div className="space-y-6 animate-in fade-in">
                                    <div>
                                        <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <Check className="h-4 w-4" /> Detected & Matched Keywords (14)
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                'React.js',
                                                'TypeScript',
                                                'Node.js',
                                                'Tailwind CSS',
                                                'PostgreSQL',
                                                'RESTful APIs',
                                                'Git Version Control',
                                                'CI/CD Pipelines',
                                                'Jest Testing',
                                                'Agile Scrum',
                                            ].map((kw) => (
                                                <span
                                                    key={kw}
                                                    className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 text-xs font-medium"
                                                >
                                                    ✓ {kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" /> High-Priority Missing Keywords (3)
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                'Docker Containerization',
                                                'GraphQL Querying',
                                                'AWS Lambda (Serverless)',
                                            ].map((kw) => (
                                                <span
                                                    key={kw}
                                                    className="px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40 text-xs font-medium"
                                                >
                                                    + {kw}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewTab === 'fixes' && (
                                <div className="space-y-4 animate-in fade-in">
                                    <div className="p-4 rounded-xl border border-amber-200/60 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/30 text-xs space-y-2">
                                        <span className="font-bold text-amber-800 dark:text-amber-300 uppercase">
                                            Work Experience • Bullet #2 Suggestion
                                        </span>
                                        <div className="text-rose-600 line-through">
                                            "Built modern web apps using React and managed database models."
                                        </div>
                                        <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                                            ✓ "Engineered performant full-stack features using React and TypeScript, deploying to AWS Docker containers and improving page load speeds by 42%."
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl border border-indigo-200/60 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/30 text-xs space-y-2">
                                        <span className="font-bold text-indigo-800 dark:text-indigo-300 uppercase">
                                            Skills Section • Header Organization
                                        </span>
                                        <p className="text-slate-700 dark:text-slate-300">
                                            Categorize loose skills into clear standard headers: <strong>"Languages & Frameworks"</strong>, <strong>"Databases & Tools"</strong>, and <strong>"Cloud & DevOps"</strong> for 100% parse rate.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </Section>

            {/* 6. Pricing Section */}
            <Section
                id="pricing"
                badge="Transparent Pricing"
                title="Simple Plans Tailored for Your Job Search"
                subtitle="Start with our 7-day free trial. Upgrade or cancel anytime with one click."
                className="bg-slate-100/50 dark:bg-white/[0.02]"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            padding="lg"
                            className={`relative flex flex-col justify-between ${
                                plan.popular
                                    ? 'border-indigo-500 shadow-glow ring-2 ring-indigo-500/20 bg-white/90 dark:bg-slate-900/90'
                                    : ''
                            }`}
                        >
                            <div>
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <Badge variant="primary" size="sm">
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                        {plan.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">
                                        {plan.description}
                                    </p>
                                </div>

                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                                        {plan.price}
                                    </span>
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {plan.period}
                                    </span>
                                </div>

                                <div className="mt-8 space-y-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        What's Included:
                                    </span>
                                    <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-2">
                                                <Check className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-white/10">
                                <Link href={plan.cta_link}>
                                    <Button
                                        variant={plan.popular ? 'primary' : 'outline'}
                                        className="w-full"
                                        size="md"
                                    >
                                        {plan.cta_text}
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            </Section>

            {/* 7. Testimonials Section */}
            <Section
                badge="Success Stories"
                title="Trusted by Candidates Getting Hired"
                subtitle="Read how applicants transformed their resumes and accelerated their job searches."
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {testimonials.map((t) => (
                        <Card key={t.id} padding="lg" interactive>
                            <div className="flex items-center gap-1 text-amber-400 mb-4">
                                {[...Array(t.rating)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-current" />
                                ))}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic mb-6">
                                "{t.content}"
                            </p>
                            <div className="pt-4 border-t border-slate-200/50 dark:border-white/10 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                                    {t.name.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                        {t.name}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {t.role} • {t.company}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </Section>

            {/* 8. FAQ Section */}
            <Section
                id="faq"
                badge="Got Questions?"
                title="Frequently Asked Questions"
                subtitle="Everything you need to know about ATS scoring, trial access, privacy, and file compatibility."
                className="bg-slate-100/50 dark:bg-white/[0.02]"
            >
                <FaqAccordion faqs={faqs} />
            </Section>

            {/* 9. Final CTA Banner */}
            <Section className="pb-24">
                <div className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 shadow-glow">
                    <Card
                        padding="lg"
                        className="border-0 bg-gradient-to-br from-indigo-600/95 via-indigo-700/95 to-violet-800/95 text-white text-center py-14 sm:py-20 backdrop-blur-2xl"
                    >
                        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
                            Stop Guessing What Recruiters See.
                        </h2>
                        <p className="mt-4 text-indigo-100 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
                            Start your {trialDays}-day free trial now. Upload your resume, match against any job description, and get instant recommendations in under 60 seconds.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                            <Link href={auth.user ? route('dashboard') : route('register')}>
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    rightIcon={<ArrowRight className="h-5 w-5" />}
                                    className="font-bold shadow-xl shadow-black/20"
                                >
                                    Start 7-Day Free Trial
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>
            </Section>
        </PublicLayout>
    );
}
