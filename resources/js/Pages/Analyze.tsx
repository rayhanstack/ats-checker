import React from 'react';
import { Head } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { Card, Badge, Button } from '@/Components/UI';
import { UploadCloud, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

interface AnalyzeProps {
    uploadConfig?: {
        maxUploadMb: number;
        allowedFileTypes: string;
        maxJdChars: number;
    };
}

export default function Analyze({ uploadConfig }: AnalyzeProps) {
    const maxMb = uploadConfig?.maxUploadMb ?? 5;
    const fileTypes = uploadConfig?.allowedFileTypes ?? 'pdf,docx';

    return (
        <UserLayout title="Analyze Resume">
            <Head title="Analyze Resume" />

            <div className="space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Check My CV
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Upload your resume and paste a target job description to generate your AI ATS score and actionable fixes.
                        </p>
                    </div>
                    <Badge variant="success" dot size="sm">
                        Trial Active
                    </Badge>
                </div>

                {/* Upload Sandbox Card */}
                <Card variant="glass" className="p-8 text-center border-dashed border-2 border-slate-300 dark:border-white/20">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shadow-sm">
                        <UploadCloud className="h-8 w-8" />
                    </div>

                    <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                        Upload Your Resume
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Drag and drop your document here, or browse from your device. Supported formats: {fileTypes.toUpperCase()} (up to {maxMb}MB).
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Button variant="primary" size="md" leftIcon={<FileText className="h-4 w-4" />}>
                            Select Resume File
                        </Button>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> AES-256 Encrypted
                        </span>
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Instant ATS Analysis
                        </span>
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Claude 3.5 AI
                        </span>
                    </div>
                </Card>
            </div>
        </UserLayout>
    );
}
