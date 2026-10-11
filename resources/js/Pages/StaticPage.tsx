import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Card, Badge, Section } from '@/Components/UI';
import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { PageProps, PageData } from '@/types';

interface StaticPageProps {
    page: PageData;
}

export default function StaticPage({ page }: StaticPageProps) {
    const { settings } = usePage<PageProps>().props;

    // Render simple markdown headers, lists and bold items cleanly
    const renderMarkdownContent = (content: string) => {
        const paragraphs = content.split('\n\n');

        return paragraphs.map((block, idx) => {
            const trimmed = block.trim();

            if (trimmed.startsWith('# ')) {
                return (
                    <h1
                        key={idx}
                        className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-8 mb-4 first:mt-0"
                    >
                        {trimmed.substring(2)}
                    </h1>
                );
            }
            if (trimmed.startsWith('## ')) {
                return (
                    <h2
                        key={idx}
                        className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-8 mb-3"
                    >
                        {trimmed.substring(3)}
                    </h2>
                );
            }
            if (trimmed.startsWith('### ')) {
                return (
                    <h3
                        key={idx}
                        className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-6 mb-2"
                    >
                        {trimmed.substring(4)}
                    </h3>
                );
            }
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const items = trimmed.split('\n');
                return (
                    <ul key={idx} className="my-4 space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300">
                        {items.map((it, itemIdx) => (
                            <li key={itemIdx} className="leading-relaxed">
                                {it.replace(/^[-*]\s+/, '')}
                            </li>
                        ))}
                    </ul>
                );
            }

            return (
                <p
                    key={idx}
                    className="my-3 text-slate-600 dark:text-slate-300 leading-relaxed text-base"
                >
                    {trimmed}
                </p>
            );
        });
    };

    return (
        <PublicLayout>
            <Head>
                <title>{`${page.title} - ${settings?.site_name || 'ATS Checker'}`}</title>
                {page.meta_description && <meta name="description" content={page.meta_description} />}
                <meta property="og:title" content={`${page.title} - ${settings?.site_name || 'ATS Checker'}`} />
                {page.meta_description && <meta property="og:description" content={page.meta_description} />}
            </Head>

            <Section className="pt-10 sm:pt-16 pb-20">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Homepage</span>
                        </Link>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Updated {page.updated_at}</span>
                        </div>
                    </div>

                    <Card padding="lg" className="shadow-glass-lg border-white/60 dark:border-white/10">
                        <article className="prose prose-slate dark:prose-invert max-w-none">
                            {renderMarkdownContent(page.content)}
                        </article>
                    </Card>
                </div>
            </Section>
        </PublicLayout>
    );
}
