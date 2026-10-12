import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, Badge, Button } from '@/Components/UI';
import {
    CreditCard,
    Plus,
    Edit3,
    Trash2,
    Check,
    X,
    Sparkles,
    AlertCircle,
    Users,
    Zap,
    ShieldAlert,
    Clock,
    DollarSign,
    Layers,
} from 'lucide-react';

interface PlanItem {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    formatted_price: string;
    currency: string;
    billing_interval: 'none' | 'month' | 'year';
    analyses_limit: number | null;
    limit_period: 'trial' | 'month' | 'year';
    features: string[];
    is_active: boolean;
    is_featured: boolean;
    sort_order: number;
    active_subscribers_count: number;
    total_subscriptions_count: number;
}

interface PlansIndexProps {
    plans: PlanItem[];
}

export default function Index({ plans }: PlansIndexProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
    const [deletingPlan, setDeletingPlan] = useState<PlanItem | null>(null);
    const [featureInput, setFeatureInput] = useState('');

    // Form for Create / Edit
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        slug: '',
        description: '',
        price: '0.00',
        currency: 'USD',
        billing_interval: 'month' as 'none' | 'month' | 'year',
        analyses_limit: '' as string | number,
        limit_period: 'month' as 'trial' | 'month' | 'year',
        features: [] as string[],
        is_active: true,
        is_featured: false,
        sort_order: 0,
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setData({
            name: '',
            slug: '',
            description: '',
            price: '19.00',
            currency: 'USD',
            billing_interval: 'month',
            analyses_limit: '30',
            limit_period: 'month',
            features: [
                'Unlimited CV uploads',
                'Advanced ATS score algorithm',
                'Custom AI keyword matching',
                'PDF score export',
            ],
            is_active: true,
            is_featured: false,
            sort_order: plans.length + 1,
        });
        setFeatureInput('');
        setEditingPlan(null);
        setIsCreateOpen(true);
    };

    const openEditModal = (plan: PlanItem) => {
        clearErrors();
        setEditingPlan(plan);
        setData({
            name: plan.name,
            slug: plan.slug,
            description: plan.description || '',
            price: plan.price.toString(),
            currency: plan.currency,
            billing_interval: plan.billing_interval,
            analyses_limit: plan.analyses_limit !== null ? plan.analyses_limit.toString() : '',
            limit_period: plan.limit_period,
            features: plan.features || [],
            is_active: plan.is_active,
            is_featured: plan.is_featured,
            sort_order: plan.sort_order,
        });
        setFeatureInput('');
        setIsCreateOpen(false);
    };

    const handleAddFeature = (e: React.KeyboardEvent | React.MouseEvent) => {
        if ('key' in e && e.key !== 'Enter') return;
        e.preventDefault();
        const trimmed = featureInput.trim();
        if (trimmed && !data.features.includes(trimmed)) {
            setData('features', [...data.features, trimmed]);
            setFeatureInput('');
        }
    };

    const handleRemoveFeature = (indexToRemove: number) => {
        setData('features', data.features.filter((_, idx) => idx !== indexToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...data,
            price: parseFloat(data.price) || 0,
            analyses_limit: data.analyses_limit === '' ? null : parseInt(String(data.analyses_limit), 10),
            sort_order: Number(data.sort_order) || 0,
        };

        if (editingPlan) {
            put(route('admin.plans.update', editingPlan.id), {
                onSuccess: () => {
                    setEditingPlan(null);
                    reset();
                },
            });
        } else {
            post(route('admin.plans.store'), {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = () => {
        if (!deletingPlan) return;
        router.delete(route('admin.plans.destroy', deletingPlan.id), {
            onSuccess: () => setDeletingPlan(null),
        });
    };

    const handleToggleActive = (plan: PlanItem) => {
        router.put(route('admin.plans.update', plan.id), {
            name: plan.name,
            slug: plan.slug,
            description: plan.description || '',
            price: plan.price,
            currency: plan.currency,
            billing_interval: plan.billing_interval,
            analyses_limit: plan.analyses_limit,
            limit_period: plan.limit_period,
            features: plan.features,
            is_active: !plan.is_active,
            is_featured: plan.is_featured,
            sort_order: plan.sort_order,
        });
    };

    const totalActiveSubscribers = plans.reduce((acc, p) => acc + p.active_subscribers_count, 0);

    return (
        <AdminLayout>
            <Head title="Plans Management - Admin" />

            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">
                                    Plans & Tier Pricing
                                </h1>
                                <p className="text-sm text-slate-400">
                                    Configure subscription tiers, limits, feature tags, and display ordering.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <Button
                            onClick={openCreateModal}
                            variant="primary"
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create New Plan</span>
                        </Button>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Plans</p>
                                <p className="text-2xl font-bold text-white mt-1">{plans.length}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
                                <Layers className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Active Plans</p>
                                <p className="text-2xl font-bold text-emerald-400 mt-1">
                                    {plans.filter((p) => p.is_active).length}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <Check className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Active Subscribers</p>
                                <p className="text-2xl font-bold text-indigo-400 mt-1">
                                    {totalActiveSubscribers}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Featured Tier</p>
                                <p className="text-lg font-bold text-amber-400 mt-1 truncate">
                                    {plans.find((p) => p.is_featured)?.name || 'None Set'}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                <Sparkles className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Plan Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={`p-6 bg-slate-900/70 border backdrop-blur-xl relative flex flex-col justify-between transition-all duration-300 hover:border-slate-700 ${
                                plan.is_featured
                                    ? 'border-indigo-500/50 shadow-xl shadow-indigo-500/10'
                                    : 'border-slate-800/80'
                            }`}
                        >
                            {/* Badges strip */}
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={plan.is_active ? 'success' : 'default'}
                                            className="text-xs font-semibold"
                                        >
                                            {plan.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        {plan.is_featured && (
                                            <Badge
                                                variant="warning"
                                                className="text-xs font-semibold flex items-center gap-1 bg-amber-500/10 border-amber-500/30 text-amber-400"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                Featured
                                            </Badge>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono">
                                        Order: #{plan.sort_order}
                                    </span>
                                </div>

                                {/* Plan Title & Slug */}
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-white tracking-tight">{plan.name}</h3>
                                    <p className="text-xs font-mono text-slate-400 mt-0.5">slug: {plan.slug}</p>
                                    {plan.description && (
                                        <p className="text-sm text-slate-300 mt-2 line-clamp-2">
                                            {plan.description}
                                        </p>
                                    )}
                                </div>

                                {/* Pricing */}
                                <div className="mb-6 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-extrabold text-white">
                                            {plan.price === 0 ? 'Free' : `$${plan.price.toFixed(2)}`}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {plan.price === 0 ? '' : ` ${plan.currency}`}
                                            {plan.billing_interval !== 'none' && ` / ${plan.billing_interval}`}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                                        <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                        <span>
                                            {plan.analyses_limit === null
                                                ? 'Unlimited CV Analyses'
                                                : `${plan.analyses_limit} analyses per ${plan.limit_period}`}
                                        </span>
                                    </div>
                                </div>

                                {/* Features List */}
                                <div className="space-y-2 mb-6">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Included Features
                                    </p>
                                    <ul className="space-y-2">
                                        {plan.features?.length > 0 ? (
                                            plan.features.map((feat, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                                    <span>{feat}</span>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-xs text-slate-500 italic">No features listed.</li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            {/* Footer & Actions */}
                            <div className="pt-4 border-t border-slate-800/80">
                                <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-slate-400" />
                                        <span>
                                            <strong className="text-white font-medium">
                                                {plan.active_subscribers_count}
                                            </strong>{' '}
                                            active ({plan.total_subscriptions_count} total)
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleActive(plan)}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                                    >
                                        {plan.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => openEditModal(plan)}
                                        variant="secondary"
                                        size="sm"
                                        className="flex-1 flex items-center justify-center gap-1.5 border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Edit Plan</span>
                                    </Button>

                                    <Button
                                        onClick={() => setDeletingPlan(plan)}
                                        variant="danger"
                                        size="sm"
                                        className="p-2 border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                        title="Delete plan"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Create / Edit Plan Modal */}
                {(isCreateOpen || editingPlan) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
                        <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100 max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                        {editingPlan ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create New Plan'}
                                        </h2>
                                        <p className="text-xs text-slate-400">
                                            {editingPlan
                                                ? 'Update plan limits, price, features and display parameters.'
                                                : 'Define a new tier for candidate subscription and trial usage.'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsCreateOpen(false);
                                        setEditingPlan(null);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Name & Slug */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Plan Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setData((prev) => ({
                                                    ...prev,
                                                    name: val,
                                                    slug: !editingPlan && prev.slug === '' ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : prev.slug,
                                                }));
                                            }}
                                            placeholder="e.g. Pro Monthly"
                                            required
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Plan Slug *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9_-]+/g, ''))}
                                            placeholder="e.g. pro-monthly"
                                            required
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {errors.slug && <p className="text-xs text-red-400 mt-1">{errors.slug}</p>}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Description
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={2}
                                        placeholder="Short summary displayed on public pricing cards..."
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
                                </div>

                                {/* Price, Currency & Interval */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Price *
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.price}
                                                onChange={(e) => setData('price', e.target.value)}
                                                required
                                                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        {errors.price && <p className="text-xs text-red-400 mt-1">{errors.price}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Currency *
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={3}
                                            value={data.currency}
                                            onChange={(e) => setData('currency', e.target.value.toUpperCase())}
                                            required
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {errors.currency && <p className="text-xs text-red-400 mt-1">{errors.currency}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Billing Interval *
                                        </label>
                                        <select
                                            value={data.billing_interval}
                                            onChange={(e) => setData('billing_interval', e.target.value as any)}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="none">None (One-time / Free)</option>
                                            <option value="month">Monthly</option>
                                            <option value="year">Yearly</option>
                                        </select>
                                        {errors.billing_interval && (
                                            <p className="text-xs text-red-400 mt-1">{errors.billing_interval}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Limits & Limit Period */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Analyses Limit (Leave blank for Unlimited)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="Unlimited"
                                            value={data.analyses_limit}
                                            onChange={(e) => setData('analyses_limit', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {errors.analyses_limit && (
                                            <p className="text-xs text-red-400 mt-1">{errors.analyses_limit}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Limit Period *
                                        </label>
                                        <select
                                            value={data.limit_period}
                                            onChange={(e) => setData('limit_period', e.target.value as any)}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="trial">Trial period</option>
                                            <option value="month">Per month</option>
                                            <option value="year">Per year</option>
                                        </select>
                                        {errors.limit_period && (
                                            <p className="text-xs text-red-400 mt-1">{errors.limit_period}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Features List Editor */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Features List *
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={featureInput}
                                            onChange={(e) => setFeatureInput(e.target.value)}
                                            onKeyDown={handleAddFeature}
                                            placeholder="Type a feature and press Enter or click Add..."
                                            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleAddFeature}
                                            variant="secondary"
                                            size="sm"
                                            className="border-slate-700"
                                        >
                                            Add
                                        </Button>
                                    </div>

                                    {/* Features chips */}
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950/40 rounded-xl border border-slate-800">
                                        {data.features.map((feat, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 text-xs text-slate-200 border border-slate-700/60"
                                            >
                                                <span className="truncate">{feat}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFeature(idx)}
                                                    className="text-slate-400 hover:text-red-400 transition"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {data.features.length === 0 && (
                                            <p className="text-xs text-slate-500 italic p-1">
                                                No features added yet. Add at least 1 feature.
                                            </p>
                                        )}
                                    </div>
                                    {errors.features && <p className="text-xs text-red-400 mt-1">{errors.features}</p>}
                                </div>

                                {/* Flags & Sort order */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="is_active" className="text-sm text-slate-300">
                                            Active (Available)
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_featured"
                                            checked={data.is_featured}
                                            onChange={(e) => setData('is_featured', e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="is_featured" className="text-sm text-slate-300">
                                            Featured Tier
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                                            Sort Order
                                        </label>
                                        <input
                                            type="number"
                                            value={data.sort_order}
                                            onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            setIsCreateOpen(false);
                                            setEditingPlan(null);
                                        }}
                                        className="border-slate-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={processing || data.features.length === 0}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                    >
                                        {processing ? 'Saving...' : editingPlan ? 'Save Changes' : 'Create Plan'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete / Deactivate Protection Modal */}
                {deletingPlan && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
                            {deletingPlan.active_subscribers_count > 0 ? (
                                // Guarded: Active subscribers exist
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
                                        <ShieldAlert className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white text-center">
                                        Cannot Delete Plan
                                    </h3>
                                    <p className="text-sm text-slate-300 text-center mt-2">
                                        Plan <strong className="text-white">'{deletingPlan.name}'</strong> currently has{' '}
                                        <strong className="text-amber-400">{deletingPlan.active_subscribers_count} active subscriber(s)</strong>.
                                    </p>
                                    <p className="text-xs text-slate-400 text-center mt-2">
                                        To protect user billing continuity, active plans with subscribers cannot be deleted. You can deactivate this plan instead so no new candidates can choose it.
                                    </p>

                                    <div className="flex flex-col gap-2 mt-6">
                                        {deletingPlan.is_active && (
                                            <Button
                                                onClick={() => {
                                                    handleToggleActive(deletingPlan);
                                                    setDeletingPlan(null);
                                                }}
                                                variant="primary"
                                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                                            >
                                                Deactivate Plan Now
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => setDeletingPlan(null)}
                                            variant="secondary"
                                            className="w-full border-slate-700"
                                        >
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                // Safe to delete
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
                                        <Trash2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white text-center">
                                        Delete Plan
                                    </h3>
                                    <p className="text-sm text-slate-300 text-center mt-2">
                                        Are you sure you want to permanently delete{' '}
                                        <strong className="text-white">'{deletingPlan.name}'</strong>?
                                    </p>
                                    <p className="text-xs text-slate-500 text-center mt-1">
                                        This plan has 0 active subscribers and will be removed.
                                    </p>

                                    <div className="flex items-center gap-3 mt-6">
                                        <Button
                                            onClick={() => setDeletingPlan(null)}
                                            variant="secondary"
                                            className="flex-1 border-slate-700"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleDelete}
                                            variant="danger"
                                            className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
