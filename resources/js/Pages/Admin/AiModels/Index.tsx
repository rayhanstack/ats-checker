import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, Badge, Button } from '@/Components/UI';
import {
    Cpu,
    Plus,
    Edit3,
    Trash2,
    Check,
    X,
    Star,
    Sparkles,
    AlertCircle,
    Play,
    Clock,
    DollarSign,
    Zap,
    ShieldAlert,
    Layers,
    Activity,
    Info,
    RefreshCw,
} from 'lucide-react';

interface AiModelItem {
    id: number;
    name: string;
    provider: string;
    model_id: string;
    purpose: 'analysis' | 'parsing';
    temperature: number;
    max_tokens: number;
    is_active: boolean;
    is_default: boolean;
    fallback_priority: number | null;
    input_cost_per_mtok: number;
    output_cost_per_mtok: number;
    notes: string | null;
    attempts_count: number;
}

interface AiModelsIndexProps {
    models: AiModelItem[];
    stats: {
        total: number;
        active: number;
        default_analysis: string;
        providers: string[];
        supported_providers: {
            id: string;
            name: string;
            available: boolean;
            badge?: string;
        }[];
    };
}

interface TestResultData {
    success: boolean;
    model_name: string;
    model_id: string;
    provider: string;
    latency_ms: number;
    tokens_in?: number;
    tokens_out?: number;
    score?: number;
    summary?: string;
    parsed_json?: Record<string, any>;
    error?: string;
}

export default function Index({ models, stats }: AiModelsIndexProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<AiModelItem | null>(null);
    const [deletingModel, setDeletingModel] = useState<AiModelItem | null>(null);

    // Test Model state
    const [testingModel, setTestingModel] = useState<AiModelItem | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<TestResultData | null>(null);

    // Form for Create / Edit
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        provider: 'anthropic',
        model_id: '',
        purpose: 'analysis' as 'analysis' | 'parsing',
        temperature: '0.2',
        max_tokens: '4096',
        is_active: true,
        is_default: false,
        fallback_priority: '' as string | number,
        input_cost_per_mtok: '3.00',
        output_cost_per_mtok: '15.00',
        notes: '',
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setData({
            name: '',
            provider: 'anthropic',
            model_id: 'claude-sonnet-5-5',
            purpose: 'analysis',
            temperature: '0.2',
            max_tokens: '4096',
            is_active: true,
            is_default: false,
            fallback_priority: '',
            input_cost_per_mtok: '3.00',
            output_cost_per_mtok: '15.00',
            notes: '',
        });
        setEditingModel(null);
        setIsCreateOpen(true);
    };

    const openEditModal = (model: AiModelItem) => {
        clearErrors();
        setEditingModel(model);
        setData({
            name: model.name,
            provider: model.provider,
            model_id: model.model_id,
            purpose: model.purpose,
            temperature: model.temperature.toString(),
            max_tokens: model.max_tokens.toString(),
            is_active: model.is_active,
            is_default: model.is_default,
            fallback_priority: model.fallback_priority !== null ? model.fallback_priority.toString() : '',
            input_cost_per_mtok: model.input_cost_per_mtok.toString(),
            output_cost_per_mtok: model.output_cost_per_mtok.toString(),
            notes: model.notes || '',
        });
        setIsCreateOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...data,
            temperature: parseFloat(data.temperature) || 0.2,
            max_tokens: parseInt(String(data.max_tokens), 10) || 4096,
            fallback_priority: data.fallback_priority === '' ? null : parseInt(String(data.fallback_priority), 10),
            input_cost_per_mtok: parseFloat(String(data.input_cost_per_mtok)) || 0,
            output_cost_per_mtok: parseFloat(String(data.output_cost_per_mtok)) || 0,
        };

        if (editingModel) {
            put(route('admin.ai-models.update', editingModel.id), {
                onSuccess: () => {
                    setEditingModel(null);
                    reset();
                },
            });
        } else {
            post(route('admin.ai-models.store'), {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                },
            });
        }
    };

    const handleSetDefault = (model: AiModelItem) => {
        router.post(route('admin.ai-models.set-default', model.id));
    };

    const handleToggleActive = (model: AiModelItem) => {
        router.post(route('admin.ai-models.toggle-active', model.id));
    };

    const handleDelete = () => {
        if (!deletingModel) return;
        router.delete(route('admin.ai-models.destroy', deletingModel.id), {
            onSuccess: () => setDeletingModel(null),
        });
    };

    const handleRunTest = async (model: AiModelItem) => {
        setTestingModel(model);
        setIsTesting(true);
        setTestResult(null);

        try {
            // Get CSRF token from document
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch(route('admin.ai-models.test', model.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    Accept: 'application/json',
                },
            });

            const data = await res.json();
            setTestResult(data);
        } catch (err: any) {
            setTestResult({
                success: false,
                model_name: model.name,
                model_id: model.model_id,
                provider: model.provider,
                latency_ms: 0,
                error: err.message || 'Network error executing diagnostic test.',
            });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="AI Models - Admin" />

            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
                            <Cpu className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                AI Models & Providers
                            </h1>
                            <p className="text-sm text-slate-400">
                                Configure LLM parameters, set default evaluation tiers, verify API keys, and test latency.
                            </p>
                        </div>
                    </div>
                    <div>
                        <Button
                            onClick={openCreateModal}
                            variant="primary"
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add AI Model</span>
                        </Button>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Configured</p>
                                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
                                <Layers className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Active Models</p>
                                <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.active}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Default Analysis</p>
                                <p className="text-base font-bold text-indigo-400 mt-1 truncate">
                                    {stats.default_analysis || 'None'}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                <Star className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Active Provider</p>
                                <p className="text-base font-bold text-amber-400 mt-1">Anthropic (Claude)</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                <Zap className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Provider Ecosystem Strip */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                        <span className="text-xs text-slate-300">
                            <strong>AI Provider Pipeline:</strong> Anthropic Messages API with forced tool-use is actively connected. Additional LLM providers are pre-architected in the model catalog.
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {stats.supported_providers.map((p) => (
                            <span
                                key={p.id}
                                className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                                    p.available
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                        : 'bg-slate-800/80 border-slate-700/80 text-slate-400'
                                }`}
                            >
                                {p.name} {p.badge && `(${p.badge})`}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Models Table */}
                <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="px-5 py-3.5">Model Name / ID</th>
                                    <th className="px-5 py-3.5">Provider</th>
                                    <th className="px-5 py-3.5">Purpose</th>
                                    <th className="px-5 py-3.5">Role / Priority</th>
                                    <th className="px-5 py-3.5">Parameters</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {models.map((model) => (
                                    <tr key={model.id} className="hover:bg-slate-800/30 transition">
                                        {/* Model Name & ID */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-white">{model.name}</span>
                                                {model.is_default && (
                                                    <span className="p-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center gap-0.5 px-1.5" title="Default Model">
                                                        <Star className="w-3 h-3 fill-amber-400" /> Default
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-mono text-slate-400 mt-0.5">{model.model_id}</p>
                                            {model.notes && (
                                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{model.notes}</p>
                                            )}
                                        </td>

                                        {/* Provider */}
                                        <td className="px-5 py-4">
                                            <Badge variant="primary" className="capitalize text-xs font-semibold">
                                                {model.provider}
                                            </Badge>
                                        </td>

                                        {/* Purpose */}
                                        <td className="px-5 py-4">
                                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono text-slate-300 capitalize">
                                                {model.purpose}
                                            </span>
                                        </td>

                                        {/* Role / Priority */}
                                        <td className="px-5 py-4">
                                            {model.is_default ? (
                                                <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
                                                    <Zap className="w-3.5 h-3.5" /> Primary Engine
                                                </span>
                                            ) : model.fallback_priority ? (
                                                <span className="text-xs text-indigo-300 font-medium">
                                                    Backup Priority #{model.fallback_priority}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-500">Standby (No chain)</span>
                                            )}
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {model.attempts_count} historical attempts
                                            </p>
                                        </td>

                                        {/* Parameters */}
                                        <td className="px-5 py-4 text-xs font-mono text-slate-400">
                                            <div>Temp: <span className="text-slate-200">{model.temperature}</span></div>
                                            <div>Max: <span className="text-slate-200">{model.max_tokens}</span> tokens</div>
                                            <div>Cost: <span className="text-slate-200">${model.input_cost_per_mtok}</span> / <span className="text-slate-200">${model.output_cost_per_mtok}</span></div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-4">
                                            <Badge
                                                variant={model.is_active ? 'success' : 'default'}
                                                className="text-xs font-semibold"
                                            >
                                                {model.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {/* Test model button */}
                                                <Button
                                                    onClick={() => handleRunTest(model)}
                                                    variant="secondary"
                                                    size="sm"
                                                    className="text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                                                    title="Send sample test to verify model latency & token usage"
                                                >
                                                    <Play className="w-3.5 h-3.5 mr-1" />
                                                    Test
                                                </Button>

                                                {!model.is_default && (
                                                    <Button
                                                        onClick={() => handleSetDefault(model)}
                                                        variant="secondary"
                                                        size="sm"
                                                        className="text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                                                        title="Make default for this purpose"
                                                    >
                                                        <Star className="w-3.5 h-3.5 mr-1" />
                                                        Default
                                                    </Button>
                                                )}

                                                <Button
                                                    onClick={() => openEditModal(model)}
                                                    variant="secondary"
                                                    size="sm"
                                                    className="p-1.5 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                                                    title="Edit model"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </Button>

                                                <Button
                                                    onClick={() => setDeletingModel(model)}
                                                    variant="danger"
                                                    size="sm"
                                                    className="p-1.5 border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                                    title="Delete model"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Create / Edit Modal */}
                {(isCreateOpen || editingModel) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
                        <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                        {editingModel ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {editingModel ? `Edit Model: ${editingModel.name}` : 'Configure New AI Model'}
                                        </h2>
                                        <p className="text-xs text-slate-400">
                                            Set up endpoint identifiers, temperature limits, and fallback priority ordering.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsCreateOpen(false);
                                        setEditingModel(null);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name & Model ID */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Model Display Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="e.g. Claude 3.5 Sonnet"
                                            required
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            API Model ID (Provider String) *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.model_id}
                                            onChange={(e) => setData('model_id', e.target.value)}
                                            placeholder="e.g. claude-sonnet-5-5"
                                            required
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {errors.model_id && <p className="text-xs text-red-400 mt-1">{errors.model_id}</p>}
                                    </div>
                                </div>

                                {/* Provider & Purpose */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            AI Provider *
                                        </label>
                                        <select
                                            value={data.provider}
                                            onChange={(e) => setData('provider', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="anthropic">Anthropic (Claude API)</option>
                                            <option value="openai" disabled>OpenAI (Coming Soon)</option>
                                            <option value="gemini" disabled>Google Gemini (Coming Soon)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            System Purpose *
                                        </label>
                                        <select
                                            value={data.purpose}
                                            onChange={(e) => setData('purpose', e.target.value as any)}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="analysis">ATS Analysis & Scoring</option>
                                            <option value="parsing">Resume Parsing & Text Extraction</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Temperature, Max Tokens, Fallback Priority */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Temperature (0.0 - 1.0) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.05"
                                            min="0"
                                            max="1"
                                            value={data.temperature}
                                            onChange={(e) => setData('temperature', e.target.value)}
                                            required
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Max Output Tokens *
                                        </label>
                                        <input
                                            type="number"
                                            step="256"
                                            min="512"
                                            max="32000"
                                            value={data.max_tokens}
                                            onChange={(e) => setData('max_tokens', e.target.value)}
                                            required
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Fallback Priority (1, 2, 3...)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="Leave blank if primary"
                                            value={data.fallback_priority}
                                            onChange={(e) => setData('fallback_priority', e.target.value)}
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* Cost per Mtok */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Input Cost ($ per Million Tokens)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.input_cost_per_mtok}
                                            onChange={(e) => setData('input_cost_per_mtok', e.target.value)}
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                            Output Cost ($ per Million Tokens)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.output_cost_per_mtok}
                                            onChange={(e) => setData('output_cost_per_mtok', e.target.value)}
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                        Internal Notes / API Details
                                    </label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={2}
                                        placeholder="Operational notes, latency characteristics or fallback recommendations..."
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Flags */}
                                <div className="flex items-center gap-6 pt-2 border-t border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="is_active" className="text-sm text-slate-300">
                                            Active (Usable in Pipeline)
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_default"
                                            checked={data.is_default}
                                            onChange={(e) => setData('is_default', e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="is_default" className="text-sm text-slate-300">
                                            Set as Default for Purpose
                                        </label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            setIsCreateOpen(false);
                                            setEditingModel(null);
                                        }}
                                        className="border-slate-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={processing}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                    >
                                        {processing ? 'Saving...' : editingModel ? 'Save Changes' : 'Create Model'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Test Model Diagnostic Modal */}
                {testingModel && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
                        <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                        <Play className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">
                                            Diagnostic Probe: {testingModel.name}
                                        </h3>
                                        <p className="text-xs font-mono text-slate-400">
                                            {testingModel.provider} • {testingModel.model_id}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setTestingModel(null)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Testing In-Progress */}
                            {isTesting && (
                                <div className="py-12 text-center space-y-3">
                                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                                    <p className="text-sm font-semibold text-white">
                                        Sending test payload to Claude Messages API...
                                    </p>
                                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                        Executing mini ATS diagnostic with forced tool schema to verify authentication, latency, and parser response.
                                    </p>
                                </div>
                            )}

                            {/* Test Results */}
                            {!isTesting && testResult && (
                                <div className="space-y-4">
                                    {testResult.success ? (
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-emerald-500/20">
                                                    <Check className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white">Model Probe Successful!</h4>
                                                    <p className="text-xs text-emerald-300/80">
                                                        API key authenticated, tool calling executed cleanly, and structured JSON parsed without error.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Metrics */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                                                    <span className="text-[10px] uppercase font-semibold text-slate-400">Latency</span>
                                                    <p className="text-lg font-bold text-white font-mono">{testResult.latency_ms}ms</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                                                    <span className="text-[10px] uppercase font-semibold text-slate-400">Tokens In/Out</span>
                                                    <p className="text-lg font-bold text-indigo-400 font-mono">
                                                        {testResult.tokens_in} / {testResult.tokens_out}
                                                    </p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                                                    <span className="text-[10px] uppercase font-semibold text-slate-400">Test Score</span>
                                                    <p className="text-lg font-bold text-emerald-400 font-mono">{testResult.score}/100</p>
                                                </div>
                                            </div>

                                            {/* Parsed JSON Preview */}
                                            <div>
                                                <p className="text-xs font-semibold text-slate-300 mb-1.5">Parsed Result JSON:</p>
                                                <pre className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56">
                                                    {JSON.stringify(testResult.parsed_json, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-red-500/20 shrink-0">
                                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white">Diagnostic Probe Failed</h4>
                                                    <p className="text-xs text-red-300/80 mt-1 font-mono break-all">
                                                        {testResult.error}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-2">
                                                        Verify that the Anthropic API key in your environment (.env) is valid and that the model ID '{testingModel.model_id}' is active on your account.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                        <Button
                                            onClick={() => handleRunTest(testingModel)}
                                            variant="secondary"
                                            className="border-slate-700 text-xs"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5 mr-1" />
                                            Re-run Test
                                        </Button>
                                        <Button
                                            onClick={() => setTestingModel(null)}
                                            variant="primary"
                                            className="bg-indigo-600 text-white text-xs"
                                        >
                                            Done
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Delete / Guard Protection Modal */}
                {deletingModel && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
                            {deletingModel.is_default || deletingModel.attempts_count > 0 ? (
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
                                        <ShieldAlert className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white text-center">
                                        Cannot Delete AI Model
                                    </h3>
                                    <p className="text-sm text-slate-300 text-center mt-2">
                                        {deletingModel.is_default
                                            ? `Model '${deletingModel.name}' is currently designated as the default engine for ${deletingModel.purpose}.`
                                            : `Model '${deletingModel.name}' has ${deletingModel.attempts_count} analysis attempts recorded in historical analytics.`}
                                    </p>
                                    <p className="text-xs text-slate-400 text-center mt-2">
                                        To maintain audit consistency, models with history or default status cannot be deleted. You can deactivate this model instead so the fallback chain skips it.
                                    </p>

                                    <div className="flex flex-col gap-2 mt-6">
                                        {deletingModel.is_active && !deletingModel.is_default && (
                                            <Button
                                                onClick={() => {
                                                    handleToggleActive(deletingModel);
                                                    setDeletingModel(null);
                                                }}
                                                variant="primary"
                                                className="w-full bg-indigo-600 text-white"
                                            >
                                                Deactivate Model Now
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => setDeletingModel(null)}
                                            variant="secondary"
                                            className="w-full border-slate-700"
                                        >
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
                                        <Trash2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white text-center">
                                        Delete AI Model
                                    </h3>
                                    <p className="text-sm text-slate-300 text-center mt-2">
                                        Permanently delete <strong className="text-white">'{deletingModel.name}'</strong>?
                                    </p>
                                    <p className="text-xs text-slate-500 text-center mt-1">
                                        This model has 0 historical attempts and is safe to remove.
                                    </p>

                                    <div className="flex items-center gap-3 mt-6">
                                        <Button
                                            onClick={() => setDeletingModel(null)}
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
