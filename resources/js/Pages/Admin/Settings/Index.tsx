import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, Badge, Button } from '@/Components/UI';
import {
    Settings,
    Globe,
    Sliders,
    Shield,
    Lock,
    Mail,
    CreditCard,
    FileText,
    Check,
    Send,
    Plus,
    Edit3,
    Trash2,
    X,
    Info,
    AlertCircle,
    Star,
    ExternalLink,
} from 'lucide-react';

interface SettingsProps {
    settings: {
        site_name: string;
        site_tagline: string;
        logo_path: string | null;
        favicon_path: string | null;
        contact_email: string;
        contact_phone: string;
        contact_address: string;
        social_links: {
            twitter?: string;
            linkedin?: string;
            github?: string;
            facebook?: string;
        };

        trial_days: number;
        free_plan_analyses_limit: number;
        max_upload_mb: number;
        allowed_file_types: string;
        max_jd_chars: number;
        analysis_throttle_per_hour: number;

        resume_retention_days: number;
        keep_results_after_resume_deleted: boolean;

        registration_enabled: boolean;
        email_verification_required: boolean;
        google_login_enabled: boolean;
        maintenance_mode: boolean;
        maintenance_message: string;

        mail_from_name: string;
        mail_from_address: string;
        mail_host: string;
        mail_port: number;
        mail_username: string;
        mail_encryption: string;
        mail_has_password: boolean;

        payment_gateway: string;
        currency: string;
        stripe_has_keys: boolean;
        paypal_has_keys: boolean;
    };
    pages: {
        about: { title: string; content: string };
        privacy: { title: string; content: string };
        terms: { title: string; content: string };
    };
    testimonials: {
        id: number;
        name: string;
        role: string;
        company: string;
        content: string;
        rating: number;
        sort_order: number;
        is_active: boolean;
    }[];
}

type TabKey = 'general' | 'trial_limits' | 'privacy' | 'access' | 'mail' | 'payments' | 'content';

export default function Index({ settings, pages, testimonials }: SettingsProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('general');
    const [testEmailAddress, setTestEmailAddress] = useState('');
    const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

    // Testimonial modal state
    const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState<any>(null);

    // 1. General Form
    const generalForm = useForm({
        tab: 'general',
        site_name: settings.site_name,
        site_tagline: settings.site_tagline,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        contact_address: settings.contact_address,
        social_links: settings.social_links,
        logo: null as File | null,
        favicon: null as File | null,
    });

    // 2. Trial & Limits Form
    const trialForm = useForm({
        tab: 'trial_limits',
        trial_days: settings.trial_days,
        free_plan_analyses_limit: settings.free_plan_analyses_limit,
        max_upload_mb: settings.max_upload_mb,
        allowed_file_types: settings.allowed_file_types,
        max_jd_chars: settings.max_jd_chars,
        analysis_throttle_per_hour: settings.analysis_throttle_per_hour,
    });

    // 3. Privacy Form
    const privacyForm = useForm({
        tab: 'privacy',
        resume_retention_days: settings.resume_retention_days,
        keep_results_after_resume_deleted: settings.keep_results_after_resume_deleted,
    });

    // 4. Access Form
    const accessForm = useForm({
        tab: 'access',
        registration_enabled: settings.registration_enabled,
        email_verification_required: settings.email_verification_required,
        google_login_enabled: settings.google_login_enabled,
        maintenance_mode: settings.maintenance_mode,
        maintenance_message: settings.maintenance_message,
    });

    // 5. Mail Form
    const mailForm = useForm({
        tab: 'mail',
        mail_from_name: settings.mail_from_name,
        mail_from_address: settings.mail_from_address,
        mail_host: settings.mail_host,
        mail_port: settings.mail_port,
        mail_username: settings.mail_username,
        mail_password: '',
        mail_encryption: settings.mail_encryption,
    });

    // 6. Payments Form
    const paymentsForm = useForm({
        tab: 'payments',
        payment_gateway: settings.payment_gateway,
        currency: settings.currency,
        stripe_key: '',
        stripe_secret: '',
        paypal_client_id: '',
        paypal_secret: '',
    });

    // 7. Content Pages Form
    const contentForm = useForm({
        tab: 'content',
        about_title: pages.about.title,
        about_content: pages.about.content,
        privacy_title: pages.privacy.title,
        privacy_content: pages.privacy.content,
        terms_title: pages.terms.title,
        terms_content: pages.terms.content,
    });

    // Testimonial Form
    const testimonialForm = useForm({
        name: '',
        role: '',
        company: '',
        content: '',
        rating: 5,
        sort_order: 1,
        is_active: true,
    });

    const handleSendTestEmail = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSendingTestEmail(true);
        router.post(
            route('admin.settings.test-mail'),
            { test_email: testEmailAddress || undefined },
            {
                onFinish: () => setIsSendingTestEmail(false),
            }
        );
    };

    const openCreateTestimonial = () => {
        testimonialForm.reset();
        testimonialForm.setData({
            name: '',
            role: 'Senior Software Engineer',
            company: 'TechCorp',
            content: 'ATS Checker identified critical keywords missing from my resume and helped me land 3 interviews!',
            rating: 5,
            sort_order: testimonials.length + 1,
            is_active: true,
        });
        setEditingTestimonial(null);
        setIsTestimonialModalOpen(true);
    };

    const openEditTestimonial = (t: any) => {
        setEditingTestimonial(t);
        testimonialForm.setData({
            name: t.name,
            role: t.role,
            company: t.company,
            content: t.content,
            rating: t.rating,
            sort_order: t.sort_order,
            is_active: t.is_active,
        });
        setIsTestimonialModalOpen(true);
    };

    const handleTestimonialSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTestimonial) {
            testimonialForm.put(route('admin.settings.testimonials.update', editingTestimonial.id), {
                onSuccess: () => setIsTestimonialModalOpen(false),
            });
        } else {
            testimonialForm.post(route('admin.settings.testimonials.store'), {
                onSuccess: () => setIsTestimonialModalOpen(false),
            });
        }
    };

    const handleDeleteTestimonial = (id: number) => {
        router.delete(route('admin.settings.testimonials.destroy', id));
    };

    const tabs: { key: TabKey; label: string; icon: any }[] = [
        { key: 'general', label: 'General', icon: Globe },
        { key: 'trial_limits', label: 'Trial & Limits', icon: Sliders },
        { key: 'privacy', label: 'Privacy & Retention', icon: Shield },
        { key: 'access', label: 'Access & Auth', icon: Lock },
        { key: 'mail', label: 'Mail Server', icon: Mail },
        { key: 'payments', label: 'Payments', icon: CreditCard },
        { key: 'content', label: 'Content & Pages', icon: FileText },
    ];

    return (
        <AdminLayout>
            <Head title="System Settings - Admin" />

            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
                        <Settings className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            Platform Settings
                        </h1>
                        <p className="text-sm text-slate-400">
                            Configure branding, usage limits, privacy rules, mail transport, and public content.
                        </p>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto pb-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab 1: General Settings */}
                {activeTab === 'general' && (
                    <Card className="p-6 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                generalForm.post(route('admin.settings.update'), {
                                    forceFormData: true,
                                });
                            }}
                            className="space-y-6 max-w-3xl"
                        >
                            <h2 className="text-lg font-bold text-white">General & Branding Information</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Site Name *</label>
                                    <input
                                        type="text"
                                        value={generalForm.data.site_name}
                                        onChange={(e) => generalForm.setData('site_name', e.target.value)}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Site Tagline *</label>
                                    <input
                                        type="text"
                                        value={generalForm.data.site_tagline}
                                        onChange={(e) => generalForm.setData('site_tagline', e.target.value)}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Logos */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Site Logo Upload</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => generalForm.setData('logo', e.target.files?.[0] || null)}
                                        className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-indigo-400 hover:file:bg-slate-700 cursor-pointer"
                                    />
                                    {settings.logo_path && (
                                        <p className="text-[11px] text-slate-500 mt-1">Current: {settings.logo_path}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Favicon (.ico / .png)</label>
                                    <input
                                        type="file"
                                        accept=".ico,.png,.svg"
                                        onChange={(e) => generalForm.setData('favicon', e.target.files?.[0] || null)}
                                        className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-indigo-400 hover:file:bg-slate-700 cursor-pointer"
                                    />
                                    {settings.favicon_path && (
                                        <p className="text-[11px] text-slate-500 mt-1">Current: {settings.favicon_path}</p>
                                    )}
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contact Support Email *</label>
                                    <input
                                        type="email"
                                        value={generalForm.data.contact_email}
                                        onChange={(e) => generalForm.setData('contact_email', e.target.value)}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contact Phone</label>
                                    <input
                                        type="text"
                                        value={generalForm.data.contact_phone}
                                        onChange={(e) => generalForm.setData('contact_phone', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Physical Address / Headquarters</label>
                                <input
                                    type="text"
                                    value={generalForm.data.contact_address}
                                    onChange={(e) => generalForm.setData('contact_address', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Social Links */}
                            <div className="pt-2">
                                <label className="block text-xs font-semibold text-slate-300 mb-2">Social Profiles</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <input
                                        type="url"
                                        placeholder="Twitter URL"
                                        value={generalForm.data.social_links?.twitter || ''}
                                        onChange={(e) =>
                                            generalForm.setData('social_links', {
                                                ...generalForm.data.social_links,
                                                twitter: e.target.value,
                                            })
                                        }
                                        className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="url"
                                        placeholder="LinkedIn URL"
                                        value={generalForm.data.social_links?.linkedin || ''}
                                        onChange={(e) =>
                                            generalForm.setData('social_links', {
                                                ...generalForm.data.social_links,
                                                linkedin: e.target.value,
                                            })
                                        }
                                        className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="url"
                                        placeholder="GitHub URL"
                                        value={generalForm.data.social_links?.github || ''}
                                        onChange={(e) =>
                                            generalForm.setData('social_links', {
                                                ...generalForm.data.social_links,
                                                github: e.target.value,
                                            })
                                        }
                                        className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={generalForm.processing}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                                >
                                    {generalForm.processing ? 'Saving...' : 'Save General Settings'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Tab 2: Trial & Limits */}
                {activeTab === 'trial_limits' && (
                    <Card className="p-6 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                trialForm.put(route('admin.settings.update'));
                            }}
                            className="space-y-6 max-w-3xl"
                        >
                            <h2 className="text-lg font-bold text-white">Trial Tenures & Extraction Limits</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Free Trial Length (Days) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="90"
                                        value={trialForm.data.trial_days}
                                        onChange={(e) => trialForm.setData('trial_days', parseInt(e.target.value) || 7)}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">Given to every new registered candidate.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Free Plan Analysis Allowance *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={trialForm.data.free_plan_analyses_limit}
                                        onChange={(e) => trialForm.setData('free_plan_analyses_limit', parseInt(e.target.value) || 5)}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">Total analyses allowed before requiring paid plan.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Max CV Upload Size (MB) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={trialForm.data.max_upload_mb}
                                        onChange={(e) => trialForm.setData('max_upload_mb', parseInt(e.target.value) || 5)}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Allowed Extensions (comma separated) *
                                    </label>
                                    <input
                                        type="text"
                                        value={trialForm.data.allowed_file_types}
                                        onChange={(e) => trialForm.setData('allowed_file_types', e.target.value)}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Max Job Description Characters *
                                    </label>
                                    <input
                                        type="number"
                                        min="1000"
                                        max="50000"
                                        value={trialForm.data.max_jd_chars}
                                        onChange={(e) => trialForm.setData('max_jd_chars', parseInt(e.target.value) || 15000)}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Rate Limit Throttle (Analyses / Hour / User) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={trialForm.data.analysis_throttle_per_hour}
                                        onChange={(e) => trialForm.setData('analysis_throttle_per_hour', parseInt(e.target.value) || 10)}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={trialForm.processing}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                                >
                                    {trialForm.processing ? 'Saving...' : 'Save Trial & Limits'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Tab 3: Privacy & Retention */}
                {activeTab === 'privacy' && (
                    <Card className="p-6 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                privacyForm.put(route('admin.settings.update'));
                            }}
                            className="space-y-6 max-w-3xl"
                        >
                            <h2 className="text-lg font-bold text-white">Privacy Policy & Automatic CV Purging</h2>

                            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-3">
                                <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                <div className="text-xs text-slate-300 space-y-1">
                                    <p className="font-semibold text-white">Scheduled Retention Lifecycle</p>
                                    <p>
                                        The system runs a daily cron command (`resumes:purge-expired`) to delete original resume documents and raw extracted text from private storage once they exceed your retention threshold.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Resume Retention Window (Days) *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={privacyForm.data.resume_retention_days}
                                    onChange={(e) => privacyForm.setData('resume_retention_days', parseInt(e.target.value) || 0)}
                                    required
                                    className="w-full max-w-xs px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Resumes older than this count will have their files and extracted text securely purged. Set to 0 to disable automated purging.
                                </p>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={privacyForm.data.keep_results_after_resume_deleted}
                                        onChange={(e) => privacyForm.setData('keep_results_after_resume_deleted', e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <span className="text-sm font-semibold text-white">
                                            Retain Diagnostic Scores & Suggestions After Purge
                                        </span>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            When enabled, the physical PDF/DOCX file and raw resume text are removed from storage, but the candidate keeps their historical match score and advice cards in their dashboard.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={privacyForm.processing}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                                >
                                    {privacyForm.processing ? 'Saving...' : 'Save Privacy Settings'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Tab 4: Access & Auth */}
                {activeTab === 'access' && (
                    <Card className="p-6 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                accessForm.put(route('admin.settings.update'));
                            }}
                            className="space-y-6 max-w-3xl"
                        >
                            <h2 className="text-lg font-bold text-white">Authentication & Platform Access Controls</h2>

                            <div className="space-y-4">
                                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 cursor-pointer">
                                    <div>
                                        <span className="text-sm font-semibold text-white">Public Registration Enabled</span>
                                        <p className="text-xs text-slate-400">Allow new visitors to register accounts.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={accessForm.data.registration_enabled}
                                        onChange={(e) => accessForm.setData('registration_enabled', e.target.checked)}
                                        className="w-5 h-5 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 cursor-pointer">
                                    <div>
                                        <span className="text-sm font-semibold text-white">Email Verification Required</span>
                                        <p className="text-xs text-slate-400">Candidates must verify email address before uploading resumes.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={accessForm.data.email_verification_required}
                                        onChange={(e) => accessForm.setData('email_verification_required', e.target.checked)}
                                        className="w-5 h-5 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 cursor-pointer">
                                    <div>
                                        <span className="text-sm font-semibold text-white">Google OAuth Login</span>
                                        <p className="text-xs text-slate-400">Display "Sign in with Google" button on login/register pages.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={accessForm.data.google_login_enabled}
                                        onChange={(e) => accessForm.setData('google_login_enabled', e.target.checked)}
                                        className="w-5 h-5 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                                    />
                                </label>

                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                                    <label className="flex items-center justify-between cursor-pointer mb-3">
                                        <div>
                                            <span className="text-sm font-bold text-amber-300">Platform Maintenance Mode</span>
                                            <p className="text-xs text-amber-200/80">Blocks candidate requests with maintenance banner. Admins bypass.</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={accessForm.data.maintenance_mode}
                                            onChange={(e) => accessForm.setData('maintenance_mode', e.target.checked)}
                                            className="w-5 h-5 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-500"
                                        />
                                    </label>
                                    <div>
                                        <label className="block text-xs font-semibold text-amber-200 mb-1">Custom Maintenance Notice</label>
                                        <input
                                            type="text"
                                            value={accessForm.data.maintenance_message}
                                            onChange={(e) => accessForm.setData('maintenance_message', e.target.value)}
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-amber-500/30 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={accessForm.processing}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                                >
                                    {accessForm.processing ? 'Saving...' : 'Save Access Settings'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Tab 5: Mail Server */}
                {activeTab === 'mail' && (
                    <Card className="p-6 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="space-y-6 max-w-3xl">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    mailForm.put(route('admin.settings.update'));
                                }}
                                className="space-y-4"
                            >
                                <h2 className="text-lg font-bold text-white">SMTP & Mail Delivery Configuration</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">From Name *</label>
                                        <input
                                            type="text"
                                            value={mailForm.data.mail_from_name}
                                            onChange={(e) => mailForm.setData('mail_from_name', e.target.value)}
                                            required
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">From Address *</label>
                                        <input
                                            type="email"
                                            value={mailForm.data.mail_from_address}
                                            onChange={(e) => mailForm.setData('mail_from_address', e.target.value)}
                                            required
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">SMTP Host *</label>
                                        <input
                                            type="text"
                                            value={mailForm.data.mail_host}
                                            onChange={(e) => mailForm.setData('mail_host', e.target.value)}
                                            required
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">SMTP Port *</label>
                                        <input
                                            type="number"
                                            value={mailForm.data.mail_port}
                                            onChange={(e) => mailForm.setData('mail_port', parseInt(e.target.value) || 2525)}
                                            required
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Encryption</label>
                                        <select
                                            value={mailForm.data.mail_encryption}
                                            onChange={(e) => mailForm.setData('mail_encryption', e.target.value)}
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="tls">TLS</option>
                                            <option value="ssl">SSL</option>
                                            <option value="none">None</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">SMTP Username</label>
                                        <input
                                            type="text"
                                            value={mailForm.data.mail_username}
                                            onChange={(e) => mailForm.setData('mail_username', e.target.value)}
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            SMTP Password (Encrypted at rest)
                                        </label>
                                        <input
                                            type="password"
                                            placeholder={settings.mail_has_password ? '•••••••••••• (Leave blank to keep current)' : 'Enter password'}
                                            value={mailForm.data.mail_password}
                                            onChange={(e) => mailForm.setData('mail_password', e.target.value)}
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={mailForm.processing}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white"
                                    >
                                        {mailForm.processing ? 'Saving...' : 'Save Mail Settings'}
                                    </Button>
                                </div>
                            </form>

                            {/* Test Email Section */}
                            <div className="pt-6 border-t border-slate-800">
                                <h3 className="text-sm font-bold text-white mb-2">Send Test Email Verification</h3>
                                <p className="text-xs text-slate-400 mb-3">
                                    Dispatches an instant verification email to confirm that your SMTP connection credentials and ports are functioning correctly.
                                </p>
                                <form onSubmit={handleSendTestEmail} className="flex gap-2 max-w-md">
                                    <input
                                        type="email"
                                        placeholder="Recipient email (defaults to your email)"
                                        value={testEmailAddress}
                                        onChange={(e) => setTestEmailAddress(e.target.value)}
                                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <Button
                                        type="submit"
                                        variant="secondary"
                                        disabled={isSendingTestEmail}
                                        className="text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                                    >
                                        <Send className="w-3.5 h-3.5 mr-1" />
                                        {isSendingTestEmail ? 'Sending...' : 'Send Test'}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Tab 6: Payments & Gateway */}
                {activeTab === 'payments' && (
                    <Card className="p-6 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                paymentsForm.put(route('admin.settings.update'));
                            }}
                            className="space-y-6 max-w-3xl"
                        >
                            <h2 className="text-lg font-bold text-white">Payment Gateway & Billing Configuration</h2>

                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
                                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-white">Manual Gateway Mode Active</p>
                                    <p className="mt-1">
                                        Per current architecture, payments run in manual reconciliation mode. When live Stripe and PayPal SDKs are activated in upcoming updates, your encrypted credentials below will be utilized.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Active Payment Gateway *</label>
                                    <select
                                        value={paymentsForm.data.payment_gateway}
                                        onChange={(e) => paymentsForm.setData('payment_gateway', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="manual">Manual Checkout / Admin Approval (Active)</option>
                                        <option value="stripe">Stripe Cards & Apple Pay (Coming Soon)</option>
                                        <option value="paypal">PayPal Express (Coming Soon)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">System Currency *</label>
                                    <input
                                        type="text"
                                        maxLength={3}
                                        value={paymentsForm.data.currency}
                                        onChange={(e) => paymentsForm.setData('currency', e.target.value.toUpperCase())}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white uppercase font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Stripe Placeholders */}
                            <div className="pt-2 border-t border-slate-800">
                                <h3 className="text-sm font-bold text-white mb-1">Stripe Credentials (Future Gateway)</h3>
                                <p className="text-xs text-slate-400 mb-3">All API secrets are stored AES-256 encrypted at rest.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Publishable Key</label>
                                        <input
                                            type="text"
                                            placeholder="pk_live_..."
                                            value={paymentsForm.data.stripe_key}
                                            onChange={(e) => paymentsForm.setData('stripe_key', e.target.value)}
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Secret Key</label>
                                        <input
                                            type="password"
                                            placeholder={settings.stripe_has_keys ? '•••••••••••• (Leave blank to keep)' : 'sk_live_...'}
                                            value={paymentsForm.data.stripe_secret}
                                            onChange={(e) => paymentsForm.setData('stripe_secret', e.target.value)}
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* PayPal Placeholders */}
                            <div className="pt-2 border-t border-slate-800">
                                <h3 className="text-sm font-bold text-white mb-1">PayPal Credentials (Future Gateway)</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Client ID</label>
                                        <input
                                            type="text"
                                            placeholder="client_id_..."
                                            value={paymentsForm.data.paypal_client_id}
                                            onChange={(e) => paymentsForm.setData('paypal_client_id', e.target.value)}
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Secret</label>
                                        <input
                                            type="password"
                                            placeholder={settings.paypal_has_keys ? '•••••••••••• (Leave blank to keep)' : 'secret_...'}
                                            value={paymentsForm.data.paypal_secret}
                                            onChange={(e) => paymentsForm.setData('paypal_secret', e.target.value)}
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={paymentsForm.processing}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                                >
                                    {paymentsForm.processing ? 'Saving...' : 'Save Payment Settings'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Tab 7: Content & Testimonials */}
                {activeTab === 'content' && (
                    <div className="space-y-6">
                        {/* Legal & About Pages Markdown */}
                        <Card className="p-6 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    contentForm.put(route('admin.settings.update'));
                                }}
                                className="space-y-6 max-w-4xl"
                            >
                                <h2 className="text-lg font-bold text-white">Public Pages Content (Markdown)</h2>

                                {/* About Us */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">About Page Title & Body</label>
                                        <Link href="/about" target="_blank" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                                            View Page <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>
                                    <input
                                        type="text"
                                        value={contentForm.data.about_title}
                                        onChange={(e) => contentForm.setData('about_title', e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm"
                                    />
                                    <textarea
                                        rows={6}
                                        value={contentForm.data.about_content}
                                        onChange={(e) => contentForm.setData('about_content', e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs font-mono"
                                    />
                                </div>

                                {/* Privacy Policy */}
                                <div className="space-y-2 pt-2 border-t border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Privacy Policy Title & Body</label>
                                        <Link href="/privacy" target="_blank" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                                            View Page <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>
                                    <input
                                        type="text"
                                        value={contentForm.data.privacy_title}
                                        onChange={(e) => contentForm.setData('privacy_title', e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm"
                                    />
                                    <textarea
                                        rows={6}
                                        value={contentForm.data.privacy_content}
                                        onChange={(e) => contentForm.setData('privacy_content', e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs font-mono"
                                    />
                                </div>

                                {/* Terms of Service */}
                                <div className="space-y-2 pt-2 border-t border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Terms of Service Title & Body</label>
                                        <Link href="/terms" target="_blank" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                                            View Page <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>
                                    <input
                                        type="text"
                                        value={contentForm.data.terms_title}
                                        onChange={(e) => contentForm.setData('terms_title', e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm"
                                    />
                                    <textarea
                                        rows={6}
                                        value={contentForm.data.terms_content}
                                        onChange={(e) => contentForm.setData('terms_content', e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs font-mono"
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-800">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={contentForm.processing}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white"
                                    >
                                        {contentForm.processing ? 'Saving...' : 'Save Public Pages Content'}
                                    </Button>
                                </div>
                            </form>
                        </Card>

                        {/* Testimonials Management */}
                        <Card className="p-6 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Social Proof Testimonials</h2>
                                    <p className="text-xs text-slate-400">Manage candidate reviews displayed on the public landing page.</p>
                                </div>
                                <Button
                                    onClick={openCreateTestimonial}
                                    variant="primary"
                                    size="sm"
                                    className="bg-indigo-600 text-white"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    Add Review
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {testimonials.map((t) => (
                                    <div
                                        key={t.id}
                                        className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-semibold text-white text-sm">{t.name}</span>
                                                <Badge variant={t.is_active ? 'success' : 'default'} className="text-[10px]">
                                                    {t.is_active ? 'Active' : 'Hidden'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-400">{t.role} • {t.company}</p>
                                            <p className="text-xs text-slate-300 mt-2 line-clamp-3">"{t.content}"</p>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-700/60 text-xs">
                                            <div className="flex items-center gap-0.5 text-amber-400">
                                                {Array.from({ length: t.rating }).map((_, i) => (
                                                    <Star key={i} className="w-3 h-3 fill-amber-400" />
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEditTestimonial(t)}
                                                    className="p-1 rounded text-slate-400 hover:text-white"
                                                    title="Edit"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTestimonial(t.id)}
                                                    className="p-1 rounded text-slate-400 hover:text-red-400"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {/* Testimonial Create / Edit Modal */}
                {isTestimonialModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                                <h3 className="text-base font-bold text-white">
                                    {editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}
                                </h3>
                                <button
                                    onClick={() => setIsTestimonialModalOpen(false)}
                                    className="p-1 rounded text-slate-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleTestimonialSubmit} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Candidate Name *</label>
                                    <input
                                        type="text"
                                        value={testimonialForm.data.name}
                                        onChange={(e) => testimonialForm.setData('name', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">Role *</label>
                                        <input
                                            type="text"
                                            value={testimonialForm.data.role}
                                            onChange={(e) => testimonialForm.setData('role', e.target.value)}
                                            required
                                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">Company *</label>
                                        <input
                                            type="text"
                                            value={testimonialForm.data.company}
                                            onChange={(e) => testimonialForm.setData('company', e.target.value)}
                                            required
                                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Testimonial Quote *</label>
                                    <textarea
                                        rows={3}
                                        value={testimonialForm.data.content}
                                        onChange={(e) => testimonialForm.setData('content', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">Rating (1-5)</label>
                                        <select
                                            value={testimonialForm.data.rating}
                                            onChange={(e) => testimonialForm.setData('rating', parseInt(e.target.value) || 5)}
                                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                                        >
                                            <option value={5}>5 Stars</option>
                                            <option value={4}>4 Stars</option>
                                            <option value={3}>3 Stars</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">Sort Order</label>
                                        <input
                                            type="number"
                                            value={testimonialForm.data.sort_order}
                                            onChange={(e) => testimonialForm.setData('sort_order', parseInt(e.target.value) || 1)}
                                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="test_active"
                                        checked={testimonialForm.data.is_active}
                                        onChange={(e) => testimonialForm.setData('is_active', e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                                    />
                                    <label htmlFor="test_active" className="text-xs text-slate-300">Active (Visible)</label>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setIsTestimonialModalOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        className="bg-indigo-600 text-white"
                                    >
                                        Save
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
