import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, Badge, Button } from '@/Components/UI';
import {
    HelpCircle,
    Plus,
    Edit3,
    Trash2,
    Check,
    X,
    ArrowUp,
    ArrowDown,
    Eye,
    EyeOff,
    Search,
    RotateCcw,
} from 'lucide-react';

interface FaqItem {
    id: number;
    question: string;
    answer: string;
    sort_order: number;
    is_published: boolean;
    created_at: string;
}

interface FaqsIndexProps {
    faqs: FaqItem[];
    stats: {
        total: number;
        published: number;
        unpublished: number;
    };
}

export default function Index({ faqs, stats }: FaqsIndexProps) {
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
    const [deletingFaq, setDeletingFaq] = useState<FaqItem | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        question: '',
        answer: '',
        sort_order: 1,
        is_published: true,
    });

    const openCreateModal = () => {
        reset();
        setData({
            question: '',
            answer: '',
            sort_order: faqs.length + 1,
            is_published: true,
        });
        setEditingFaq(null);
        setIsModalOpen(true);
    };

    const openEditModal = (faq: FaqItem) => {
        setEditingFaq(faq);
        setData({
            question: faq.question,
            answer: faq.answer,
            sort_order: faq.sort_order,
            is_published: faq.is_published,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingFaq) {
            put(route('admin.faqs.update', editingFaq.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingFaq(null);
                },
            });
        } else {
            post(route('admin.faqs.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                },
            });
        }
    };

    const handleTogglePublish = (faq: FaqItem) => {
        router.post(route('admin.faqs.toggle-publish', faq.id));
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= faqs.length) return;

        const newOrder = [...faqs];
        const temp = newOrder[index];
        newOrder[index] = newOrder[targetIndex];
        newOrder[targetIndex] = temp;

        router.post(route('admin.faqs.reorder'), {
            order: newOrder.map((f) => f.id),
        });
    };

    const handleDelete = () => {
        if (!deletingFaq) return;
        router.delete(route('admin.faqs.destroy', deletingFaq.id), {
            onSuccess: () => setDeletingFaq(null),
        });
    };

    const filteredFaqs = faqs.filter(
        (f) =>
            f.question.toLowerCase().includes(search.toLowerCase()) ||
            f.answer.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <Head title="FAQs Management - Admin" />

            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
                            <HelpCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                Frequently Asked Questions
                            </h1>
                            <p className="text-sm text-slate-400">
                                Manage candidate FAQs, adjust display order, and publish answers to the landing page.
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
                            <span>Add New FAQ</span>
                        </Button>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Questions</p>
                        <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                    </Card>
                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Published (Live)</p>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.published}</p>
                    </Card>
                    <Card className="p-4 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Draft / Hidden</p>
                        <p className="text-2xl font-bold text-amber-400 mt-1">{stats.unpublished}</p>
                    </Card>
                </div>

                {/* Search */}
                <Card className="p-3 bg-slate-900/60 border-slate-800 backdrop-blur-md">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter questions or answer text..."
                            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </Card>

                {/* FAQs List */}
                <div className="space-y-3">
                    {filteredFaqs.map((faq, index) => (
                        <Card
                            key={faq.id}
                            className="p-5 bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                        >
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-semibold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                                        #{faq.sort_order}
                                    </span>
                                    <Badge
                                        variant={faq.is_published ? 'success' : 'default'}
                                        className="text-xs"
                                    >
                                        {faq.is_published ? 'Published' : 'Hidden'}
                                    </Badge>
                                </div>
                                <h3 className="text-base font-bold text-white">{faq.question}</h3>
                                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                                    {faq.answer}
                                </p>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                                {/* Order up / down */}
                                <button
                                    onClick={() => handleMove(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move Up"
                                >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleMove(index, 'down')}
                                    disabled={index === faqs.length - 1}
                                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move Down"
                                >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                </button>

                                {/* Publish toggle */}
                                <button
                                    onClick={() => handleTogglePublish(faq)}
                                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
                                    title={faq.is_published ? 'Unpublish' : 'Publish'}
                                >
                                    {faq.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>

                                {/* Edit */}
                                <button
                                    onClick={() => openEditModal(faq)}
                                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
                                    title="Edit"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={() => setDeletingFaq(faq)}
                                    className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                                    title="Delete"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </Card>
                    ))}
                    {filteredFaqs.length === 0 && (
                        <Card className="p-8 text-center text-slate-400">
                            No FAQ items found.
                        </Card>
                    )}
                </div>

                {/* Create / Edit Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                                <h3 className="text-lg font-bold text-white">
                                    {editingFaq ? 'Edit FAQ' : 'Create New FAQ'}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1 text-slate-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Question *</label>
                                    <input
                                        type="text"
                                        value={data.question}
                                        onChange={(e) => setData('question', e.target.value)}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.question && <p className="text-xs text-red-400 mt-1">{errors.question}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Answer (Markdown Supported) *</label>
                                    <textarea
                                        rows={5}
                                        value={data.answer}
                                        onChange={(e) => setData('answer', e.target.value)}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.answer && <p className="text-xs text-red-400 mt-1">{errors.answer}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">Sort Order</label>
                                        <input
                                            type="number"
                                            value={data.sort_order}
                                            onChange={(e) => setData('sort_order', parseInt(e.target.value) || 1)}
                                            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-6">
                                        <input
                                            type="checkbox"
                                            id="faq_pub"
                                            checked={data.is_published}
                                            onChange={(e) => setData('is_published', e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                                        />
                                        <label htmlFor="faq_pub" className="text-xs text-slate-300">Publish Immediately</label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={processing}
                                        className="bg-indigo-600 text-white"
                                    >
                                        {processing ? 'Saving...' : editingFaq ? 'Save Changes' : 'Create FAQ'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deletingFaq && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
                            <h3 className="text-lg font-bold text-white text-center">Delete FAQ</h3>
                            <p className="text-sm text-slate-300 text-center mt-2">
                                Permanently delete FAQ: <strong className="text-white">"{deletingFaq.question}"</strong>?
                            </p>
                            <div className="flex items-center gap-3 mt-6">
                                <Button
                                    onClick={() => setDeletingFaq(null)}
                                    variant="secondary"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDelete}
                                    variant="danger"
                                    className="flex-1 bg-red-600 text-white"
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
