<?php

use App\Models\Faq;
use App\Models\Page;
use App\Models\Testimonial;
use Database\Seeders\FaqSeeder;
use Database\Seeders\PageSeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\TestimonialSeeder;

beforeEach(function () {
    $this->seed(SettingSeeder::class);
    $this->seed(FaqSeeder::class);
    $this->seed(TestimonialSeeder::class);
    $this->seed(PageSeeder::class);
});

test('home page renders with db driven faqs, testimonials and plans', function () {
    $response = $this->get(route('home'));

    $response->assertOk();

    // Verify Inertia props contains FAQs and testimonials
    $response->assertInertia(fn ($page) => $page
        ->component('Welcome')
        ->has('faqs', 9)
        ->has('testimonials', 3)
        ->has('plans', 3)
        ->has('stats')
    );
});

test('home page excludes unpublished faqs', function () {
    Faq::create([
        'question' => 'Unpublished secret question?',
        'answer' => 'Secret answer',
        'is_published' => false,
        'sort_order' => 99,
    ]);

    $response = $this->get(route('home'));

    $response->assertInertia(fn ($page) => $page
        ->has('faqs', 9) // Only the 9 published ones
    );
});

test('static pages render correctly from database', function (string $slug, string $title) {
    $response = $this->get("/{$slug}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('StaticPage')
        ->where('page.slug', $slug)
        ->where('page.title', $title)
    );
})->with([
    ['about', 'About ATS Checker'],
    ['privacy', 'Privacy Policy'],
    ['terms', 'Terms of Service'],
]);

test('non existent static page returns 404', function () {
    $response = $this->get('/p/non-existent-page-slug');

    $response->assertNotFound();
});

test('sitemap xml route returns valid xml content', function () {
    $response = $this->get(route('sitemap'));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/xml');
    expect($response->getContent())
        ->toContain('<urlset')
        ->toContain('/about')
        ->toContain('/contact')
        ->toContain('/privacy')
        ->toContain('/terms');
});
