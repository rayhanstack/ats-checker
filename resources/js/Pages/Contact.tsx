import React, { FormEventHandler } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Button, Card, Input, Badge, Section } from '@/Components/UI';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { PageProps } from '@/types';

interface ContactPageProps {
    contactInfo: {
        email: string;
        phone: string;
        address: string;
        socialLinks: Record<string, string>;
    };
}

export default function Contact({ contactInfo }: ContactPageProps) {
    const { settings } = usePage<PageProps>().props;

    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
        name: '',
        email: '',
        subject: '',
        message: '',
        honeypot: '', // bot trap
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('contact.store'), {
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <PublicLayout>
            <Head>
                <title>{`Contact Support - ${settings?.site_name || 'ATS Checker'}`}</title>
                <meta
                    name="description"
                    content="Get in touch with the ATS Checker support team for assistance, billing questions, or enterprise inquiries."
                />
            </Head>

            <Section className="pt-12 sm:pt-20 pb-20">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <Badge variant="primary" dot size="md" className="mb-4">
                        We're Here to Help
                    </Badge>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                        Get in Touch with Our Team
                    </h1>
                    <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
                        Have a question about ATS scoring, need help with your subscription, or want to discuss enterprise hiring solutions? Drop us a line below.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Left Column: Contact Cards */}
                    <div className="space-y-4">
                        <Card padding="md">
                            <div className="flex items-start gap-3.5">
                                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Email Support
                                    </span>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        <a href={`mailto:${contactInfo.email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                            {contactInfo.email}
                                        </a>
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Typically replies in under 4 hours
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card padding="md">
                            <div className="flex items-start gap-3.5">
                                <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                                    <Phone className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Phone Inquiries
                                    </span>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        <a href={`tel:${contactInfo.phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                            {contactInfo.phone}
                                        </a>
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Mon–Fri from 9am to 6pm PST
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card padding="md">
                            <div className="flex items-start gap-3.5">
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Headquarters
                                    </span>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {contactInfo.address}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        San Francisco Tech Innovation Hub
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card padding="md" className="bg-gradient-to-br from-indigo-50/70 to-violet-50/70 dark:from-indigo-950/40 dark:to-violet-950/40 border-indigo-200/50 dark:border-indigo-800/40">
                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-xs mb-1">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                <span>Candidate Priority Queue</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Paid and active 7-day trial subscribers receive expedited support from career specialists and engineers.
                            </p>
                        </Card>
                    </div>

                    {/* Right Column: Contact Form */}
                    <div className="lg:col-span-2">
                        <Card padding="lg" className="shadow-glass-lg border-white/60 dark:border-white/10">
                            <form onSubmit={submit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <Input
                                        label="Your Name"
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        placeholder="Alex Morgan"
                                        error={errors.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />

                                    <Input
                                        label="Email Address"
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        placeholder="alex@example.com"
                                        error={errors.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>

                                <Input
                                    label="Subject"
                                    id="subject"
                                    name="subject"
                                    value={data.subject}
                                    placeholder="Question about resume score calibration"
                                    error={errors.subject}
                                    onChange={(e) => setData('subject', e.target.value)}
                                    required
                                />

                                {/* Honeypot field (hidden from humans) */}
                                <div className="hidden" aria-hidden="true">
                                    <label htmlFor="hp_field">Do not fill this field</label>
                                    <input
                                        type="text"
                                        id="hp_field"
                                        name="honeypot"
                                        tabIndex={-1}
                                        autoComplete="off"
                                        value={data.honeypot}
                                        onChange={(e) => setData('honeypot', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="message"
                                        className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                                    >
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={5}
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        placeholder="Please describe how we can assist you..."
                                        className={`w-full rounded-xl border bg-white/70 px-4 py-3 text-sm text-slate-800 backdrop-blur-md transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                                            errors.message
                                                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500/40'
                                                : 'border-slate-200/80 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-white/10 dark:hover:border-white/20'
                                        }`}
                                        required
                                    />
                                    {errors.message && (
                                        <p className="text-xs font-medium text-rose-500 dark:text-rose-400">
                                            {errors.message}
                                        </p>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        isLoading={processing}
                                        rightIcon={<Send className="h-4 w-4" />}
                                        className="w-full sm:w-auto"
                                    >
                                        Send Message
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                </div>
            </Section>
        </PublicLayout>
    );
}
