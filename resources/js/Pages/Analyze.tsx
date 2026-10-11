import React, { useState, useCallback } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useDropzone, FileRejection } from 'react-dropzone';
import UserLayout from '@/Layouts/UserLayout';
import { Card, Badge, Button, Input } from '@/Components/UI';
import {
    UploadCloud,
    FileText,
    Sparkles,
    CheckCircle2,
    X,
    AlertCircle,
    Building2,
    Briefcase,
    Loader2,
    Shield,
    FileType,
} from 'lucide-react';
import { PageProps } from '@/types';

interface AnalyzeProps {
    uploadConfig?: {
        maxUploadMb: number;
        allowedFileTypes: string;
        maxJdChars: number;
    };
}

export default function Analyze({ uploadConfig }: AnalyzeProps) {
    const { auth, flash } = usePage<PageProps>().props;

    const maxMb = uploadConfig?.maxUploadMb ?? 5;
    const maxBytes = maxMb * 1024 * 1024;
    const maxJdChars = uploadConfig?.maxJdChars ?? 15000;
    const allowedFileTypes = uploadConfig?.allowedFileTypes ?? 'pdf,docx';

    const [dropError, setDropError] = useState<string | null>(null);

    const { data, setData, post, processing, errors, progress, reset } = useForm<{
        resume: File | null;
        job_title: string;
        job_company: string;
        jd_text: string;
    }>({
        resume: null,
        job_title: '',
        job_company: '',
        jd_text: '',
    });

    const onDrop = useCallback(
        (acceptedFiles: File[], fileRejections: FileRejection[]) => {
            setDropError(null);

            if (fileRejections.length > 0) {
                const rejection = fileRejections[0];
                const error = rejection.errors[0];
                if (error.code === 'file-too-large') {
                    setDropError(`File is too large. Maximum allowed size is ${maxMb}MB.`);
                } else if (error.code === 'file-invalid-type') {
                    setDropError('Invalid file type. Only PDF and Word (.docx) resumes are supported.');
                } else {
                    setDropError(error.message);
                }
                return;
            }

            if (acceptedFiles.length > 0) {
                setData('resume', acceptedFiles[0]);
            }
        },
        [maxMb, setData]
    );

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        maxSize: maxBytes,
        multiple: false,
    });

    const handleRemoveFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setData('resume', null);
        setDropError(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setDropError(null);

        post(route('analyze.store'), {
            forceFormData: true,
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const jdLength = data.jd_text.length;
    const isJdTooShort = jdLength > 0 && jdLength < 30;
    const isJdExceeded = jdLength > maxJdChars;
    const canSubmit = !!data.resume && jdLength >= 30 && !isJdExceeded && !processing;

    return (
        <UserLayout title="Check My CV">
            <Head title="Check My CV - AI Resume Analysis" />

            <div className="space-y-8 max-w-4xl mx-auto pb-12">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            Resume ATS Optimizer
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Upload your resume, paste the target job description, and get instant keyword matching and actionable fixes.
                        </p>
                    </div>

                    {auth.access && (
                        <div className="flex items-center gap-2">
                            <Badge
                                variant={auth.access.status === 'active' ? 'success' : 'primary'}
                                size="md"
                                dot
                            >
                                {auth.access.remaining_analyses === 'Unlimited'
                                    ? 'Unlimited Scans'
                                    : `${auth.access.remaining_analyses} Scans Left`}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Form Card */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Step 1: Resume Upload Drag & Drop */}
                    <Card variant="glass" className="p-6 sm:p-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm shadow-indigo-500/30">
                                    1
                                </span>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                    Upload Resume Document
                                </h2>
                            </div>
                            <span className="text-xs text-slate-400">
                                {allowedFileTypes.toUpperCase()} • Max {maxMb}MB
                            </span>
                        </div>

                        {!data.resume ? (
                            <div
                                {...getRootProps()}
                                className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
                                    isDragReject
                                        ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                                        : isDragActive
                                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 scale-[1.01]'
                                        : 'border-slate-300/80 hover:border-indigo-400 bg-slate-50/40 hover:bg-slate-100/60 dark:border-white/15 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]'
                                }`}
                            >
                                <input {...getInputProps()} />
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shadow-sm">
                                    <UploadCloud className="h-7 w-7" />
                                </div>

                                <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-100">
                                    {isDragActive
                                        ? 'Drop your resume file here...'
                                        : 'Drag and drop your resume, or browse'}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                    Supported file types: PDF and Word (.docx). Text-based resumes only.
                                </p>

                                <div className="mt-5 inline-block">
                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm border border-slate-200/80 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">
                                        <FileType className="h-3.5 w-3.5 text-indigo-500" />
                                        Choose File
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/60 dark:border-indigo-900/40 dark:bg-indigo-950/30">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                            {data.resume.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {formatFileSize(data.resume.size)} • Ready for extraction
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                    title="Remove file"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        {/* Error Notices */}
                        {(dropError || errors.resume) && (
                            <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-50/80 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                                <span>{dropError || errors.resume}</span>
                            </div>
                        )}
                    </Card>

                    {/* Step 2: Target Position & Company (Optional) */}
                    <Card variant="glass" className="p-6 sm:p-8 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm shadow-indigo-500/30">
                                2
                            </span>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                Job Details <span className="text-xs font-normal text-slate-400">(Optional)</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Input
                                    label="Target Job Title"
                                    placeholder="e.g. Senior Frontend Developer"
                                    value={data.job_title}
                                    onChange={(e) => setData('job_title', e.target.value)}
                                    error={errors.job_title}
                                    leftIcon={<Briefcase className="h-4 w-4 text-slate-400" />}
                                />
                            </div>

                            <div>
                                <Input
                                    label="Company Name"
                                    placeholder="e.g. Acme Corp"
                                    value={data.job_company}
                                    onChange={(e) => setData('job_company', e.target.value)}
                                    error={errors.job_company}
                                    leftIcon={<Building2 className="h-4 w-4 text-slate-400" />}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Step 3: Job Description Textarea */}
                    <Card variant="glass" className="p-6 sm:p-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm shadow-indigo-500/30">
                                    3
                                </span>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                    Target Job Description
                                </h2>
                            </div>

                            {/* Live Character Counter */}
                            <span
                                className={`text-xs font-semibold ${
                                    isJdExceeded
                                        ? 'text-rose-600'
                                        : jdLength > maxJdChars * 0.9
                                        ? 'text-amber-500'
                                        : 'text-slate-400'
                                }`}
                            >
                                {jdLength.toLocaleString()} / {maxJdChars.toLocaleString()} chars
                            </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Paste the complete job posting including requirements, qualifications, and role responsibilities.
                        </p>

                        <div className="relative">
                            <textarea
                                rows={8}
                                placeholder="Paste the job description here... (min. 30 characters)"
                                value={data.jd_text}
                                onChange={(e) => setData('jd_text', e.target.value)}
                                className={`w-full rounded-2xl border bg-white/70 p-4 text-xs sm:text-sm text-slate-800 backdrop-blur-md placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-900/60 dark:text-slate-100 ${
                                    errors.jd_text || isJdExceeded
                                        ? 'border-rose-400 focus:ring-rose-400'
                                        : 'border-slate-200/80 focus:border-indigo-500 focus:ring-indigo-500/30 dark:border-white/10'
                                }`}
                            />
                        </div>

                        {/* Textarea Helpers / Errors */}
                        {isJdTooShort && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                Please paste at least 30 characters for meaningful ATS matching.
                            </p>
                        )}
                        {errors.jd_text && (
                            <p className="text-xs text-rose-600 dark:text-rose-400">{errors.jd_text}</p>
                        )}
                    </Card>

                    {/* Progress Bar (during upload) */}
                    {progress && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Uploading document...</span>
                                <span>{progress.percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden dark:bg-slate-800">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress.percentage}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <Shield className="h-3.5 w-3.5 text-emerald-500" /> Private & Encrypted
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Instant ATS Feedback
                            </span>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={!canSubmit}
                            className="w-full sm:w-auto min-w-[200px]"
                            rightIcon={
                                processing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )
                            }
                        >
                            {processing ? 'Processing Resume...' : 'Analyze My Resume'}
                        </Button>
                    </div>
                </form>
            </div>
        </UserLayout>
    );
}
