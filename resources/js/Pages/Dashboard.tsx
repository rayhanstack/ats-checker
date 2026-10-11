import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@/Components/UI';
import { PageProps } from '@/types';
import { UploadCloud, Sparkles, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Dashboard() {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    return (
        <UserLayout title="Candidate Workspace">
            <Head title="Dashboard - ATS Checker" />

            <div className="space-y-8 max-w-5xl">
                {/* Welcome Hero Card */}
                <Card padding="lg" className="border-indigo-500/20 bg-gradient-to-br from-white/80 via-white/60 to-indigo-50/50 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-indigo-950/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="primary" dot size="sm">
                                    {user?.has_active_trial ? '7-Day Free Trial Active' : 'Account Ready'}
                                </Badge>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Welcome back, {user?.name}! 👋
                            </h2>
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl">
                                Ready to optimize your resume? Upload your CV and paste your target job description to get instant ATS scoring, keyword match breakdown, and actionable suggestions.
                            </p>
                        </div>

                        <div className="shrink-0">
                            <Button
                                variant="primary"
                                size="lg"
                                leftIcon={<UploadCloud className="h-5 w-5" />}
                                rightIcon={<ArrowRight className="h-4 w-4" />}
                                onClick={() => {
                                    // Will scroll or link to upload in Phase 2
                                    alert('Resume upload workflow will be connected in Phase 2!');
                                }}
                            >
                                Start New Analysis
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Quick Process Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card padding="md" interactive>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                1
                            </span>
                            <h3 className="font-bold text-slate-900 dark:text-white">Upload Your CV</h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Upload your resume in PDF or DOCX format (up to 5MB). Text is securely extracted in seconds.
                        </p>
                    </Card>

                    <Card padding="md" interactive>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                2
                            </span>
                            <h3 className="font-bold text-slate-900 dark:text-white">Target Job Post</h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Paste the complete job description text. Our system parses key responsibilities and required skills.
                        </p>
                    </Card>

                    <Card padding="md" interactive>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                3
                            </span>
                            <h3 className="font-bold text-slate-900 dark:text-white">AI ATS Diagnosis</h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Get your match score (0-100), missing keywords, formatting alerts, and line-by-line bullet rewrites.
                        </p>
                    </Card>
                </div>
            </div>
        </UserLayout>
    );
}
