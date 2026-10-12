<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FaqController extends Controller
{
    /**
     * Display a listing of FAQs.
     */
    public function index(): Response
    {
        $faqs = Faq::orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (Faq $f) => [
                'id' => $f->id,
                'question' => $f->question,
                'answer' => $f->answer,
                'sort_order' => $f->sort_order,
                'is_published' => (bool) $f->is_published,
                'created_at' => $f->created_at->format('M j, Y'),
            ]);

        return Inertia::render('Admin/Faqs/Index', [
            'faqs' => $faqs,
            'stats' => [
                'total' => Faq::count(),
                'published' => Faq::where('is_published', true)->count(),
                'unpublished' => Faq::where('is_published', false)->count(),
            ],
        ]);
    }

    /**
     * Store a newly created FAQ.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'max:500'],
            'answer' => ['required', 'string'],
            'sort_order' => ['nullable', 'integer'],
            'is_published' => ['boolean'],
        ]);

        $validated['sort_order'] = $validated['sort_order'] ?? (Faq::max('sort_order') + 1);
        $validated['is_published'] = $request->boolean('is_published', true);

        $faq = Faq::create($validated);
        \Illuminate\Support\Facades\Cache::forget('home:faqs');

        AuditLogger::log('faq.create', $faq, [
            'question' => $faq->question,
            'is_published' => $faq->is_published,
        ]);

        return back()->with('success', 'FAQ created successfully.');
    }

    /**
     * Update the specified FAQ.
     */
    public function update(Request $request, Faq $faq): RedirectResponse
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'max:500'],
            'answer' => ['required', 'string'],
            'sort_order' => ['nullable', 'integer'],
            'is_published' => ['boolean'],
        ]);

        $validated['is_published'] = $request->boolean('is_published', true);

        $faq->update($validated);
        \Illuminate\Support\Facades\Cache::forget('home:faqs');

        AuditLogger::log('faq.update', $faq, [
            'question' => $faq->question,
            'is_published' => $faq->is_published,
        ]);

        return back()->with('success', 'FAQ updated.');
    }

    /**
     * Toggle the publish status of the FAQ.
     */
    public function togglePublish(Faq $faq): RedirectResponse
    {
        $faq->update([
            'is_published' => ! $faq->is_published,
        ]);
        \Illuminate\Support\Facades\Cache::forget('home:faqs');

        AuditLogger::log('faq.toggle_publish', $faq, [
            'question' => $faq->question,
            'is_published' => $faq->is_published,
        ]);

        return back()->with('success', "FAQ marked as " . ($faq->is_published ? 'published' : 'unpublished') . '.');
    }

    /**
     * Reorder FAQs based on submitted array of items or IDs.
     */
    public function reorder(Request $request): RedirectResponse
    {
        $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer', 'exists:faqs,id'],
        ]);

        $orderIds = $request->input('order');
        foreach ($orderIds as $index => $id) {
            Faq::where('id', $id)->update(['sort_order' => $index + 1]);
        }
        \Illuminate\Support\Facades\Cache::forget('home:faqs');

        AuditLogger::log('faq.reorder', null, [
            'count' => count($orderIds),
        ]);

        return back()->with('success', 'FAQs reordered successfully.');
    }

    /**
     * Remove the specified FAQ.
     */
    public function destroy(Faq $faq): RedirectResponse
    {
        AuditLogger::log('faq.delete', $faq, [
            'question' => $faq->question,
        ]);

        $faq->delete();
        \Illuminate\Support\Facades\Cache::forget('home:faqs');

        return back()->with('success', 'FAQ deleted.');
    }
}
