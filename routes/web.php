<?php

use App\Enums\Role;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProfileController;
use App\Models\User;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public Website Routes
Route::get('/', [HomeController::class, 'index'])->name('home');

// Contact Form
Route::get('/contact', [ContactController::class, 'create'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store')->middleware('throttle:5,1');

// Static Pages
Route::get('/about', fn () => app(PageController::class)->show('about'))->name('about');
Route::get('/privacy', fn () => app(PageController::class)->show('privacy'))->name('privacy');
Route::get('/terms', fn () => app(PageController::class)->show('terms'))->name('terms');
Route::get('/p/{slug}', [PageController::class, 'show'])->name('page.show');

// SEO Sitemap Route
Route::get('/sitemap.xml', function () {
    $baseUrl = config('app.url', url('/'));
    $urls = [
        ['loc' => $baseUrl, 'changefreq' => 'daily', 'priority' => '1.0'],
        ['loc' => $baseUrl . '/about', 'changefreq' => 'weekly', 'priority' => '0.8'],
        ['loc' => $baseUrl . '/contact', 'changefreq' => 'monthly', 'priority' => '0.7'],
        ['loc' => $baseUrl . '/privacy', 'changefreq' => 'monthly', 'priority' => '0.5'],
        ['loc' => $baseUrl . '/terms', 'changefreq' => 'monthly', 'priority' => '0.5'],
        ['loc' => $baseUrl . '/login', 'changefreq' => 'monthly', 'priority' => '0.6'],
        ['loc' => $baseUrl . '/register', 'changefreq' => 'monthly', 'priority' => '0.8'],
    ];

    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($urls as $url) {
        $xml .= "  <url>\n";
        $xml .= "    <loc>" . htmlspecialchars($url['loc']) . "</loc>\n";
        $xml .= "    <lastmod>" . date('Y-m-d') . "</lastmod>\n";
        $xml .= "    <changefreq>" . $url['changefreq'] . "</changefreq>\n";
        $xml .= "    <priority>" . $url['priority'] . "</priority>\n";
        $xml .= "  </url>\n";
    }
    $xml .= '</urlset>';

    return Response::make($xml, 200, ['Content-Type' => 'application/xml']);
})->name('sitemap');

// Pricing Page
Route::get('/pricing', [\App\Http\Controllers\PricingController::class, 'index'])->name('pricing');

// Protected Analysis / Upload Route (auth + verified + can.analyze)
Route::get('/analyze', function () {
    return Inertia::render('Analyze', [
        'uploadConfig' => [
            'maxUploadMb' => (int) \App\Services\SettingsService::get('max_upload_mb', 5),
            'allowedFileTypes' => \App\Services\SettingsService::get('allowed_file_types', 'pdf,docx'),
            'maxJdChars' => (int) \App\Services\SettingsService::get('max_jd_chars', 15000),
        ],
    ]);
})->middleware(['auth', 'verified', 'can.analyze'])->name('analyze');

// Candidate Workspace Dashboard
Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])
    ->middleware(['auth'])
    ->name('dashboard');

// Analyses History & Management
Route::middleware('auth')->group(function () {
    Route::get('/analyses', [\App\Http\Controllers\AnalysisController::class, 'index'])->name('analyses.index');
    Route::delete('/analyses/{analysis}', [\App\Http\Controllers\AnalysisController::class, 'destroy'])->name('analyses.destroy');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin Console
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_users' => User::count(),
                'active_trials' => User::where('trial_ends_at', '>', now())->count(),
                'admin_users' => User::where('role', Role::Admin)->count(),
            ],
            'recent_users' => User::latest()
                ->take(5)
                ->get(['id', 'name', 'email', 'role', 'is_active', 'trial_ends_at', 'created_at']),
        ]);
    })->name('dashboard');
});

require __DIR__.'/auth.php';
