<?php

namespace App\Http\Controllers;

use App\Models\Page;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    /**
     * Display a published static page by its slug.
     */
    public function show(string $slug): Response
    {
        $page = Page::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return Inertia::render('StaticPage', [
            'page' => [
                'slug' => $page->slug,
                'title' => $page->title,
                'content' => $page->content,
                'meta_description' => $page->meta_description,
                'updated_at' => $page->updated_at->toFormattedDateString(),
            ],
        ]);
    }
}
