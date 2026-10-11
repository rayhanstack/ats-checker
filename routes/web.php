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
Route::middleware(['auth', 'verified', 'can.analyze'])->group(function () {
    Route::get('/analyze', [\App\Http\Controllers\AnalysisController::class, 'create'])->name('analyze');
    Route::post('/analyze', [\App\Http\Controllers\AnalysisController::class, 'store'])
        ->middleware('throttle:analyses')
        ->name('analyze.store');
});

// Candidate Workspace Dashboard
Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])
    ->middleware(['auth'])
    ->name('dashboard');

// Analyses History & Management
Route::middleware('auth')->group(function () {
    Route::get('/analyses', [\App\Http\Controllers\AnalysisController::class, 'index'])->name('analyses.index');
    Route::get('/analyses/{analysis}', [\App\Http\Controllers\AnalysisController::class, 'show'])->name('analyses.show');
    Route::post('/analyses/{analysis}/rerun', [\App\Http\Controllers\AnalysisController::class, 'rerun'])->name('analyses.rerun');
    Route::post('/analyses/{analysis}/retry', [\App\Http\Controllers\AnalysisController::class, 'retry'])->name('analyses.retry');
    Route::get('/analyses/{analysis}/print', [\App\Http\Controllers\AnalysisController::class, 'print'])->name('analyses.print');
    Route::delete('/analyses/{analysis}', [\App\Http\Controllers\AnalysisController::class, 'destroy'])->name('analyses.destroy');

    // Billing & Subscriptions
    Route::get('/billing', [\App\Http\Controllers\BillingController::class, 'index'])->name('billing');
    Route::post('/billing/subscribe', [\App\Http\Controllers\BillingController::class, 'subscribe'])->name('billing.subscribe');
    Route::post('/billing/cancel', [\App\Http\Controllers\BillingController::class, 'cancel'])->name('billing.cancel');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin Console
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn () => redirect()->route('admin.dashboard'));
    Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');

    // Users Management
    Route::get('/users', [\App\Http\Controllers\Admin\UserController::class, 'index'])->name('users.index');
    Route::post('/users', [\App\Http\Controllers\Admin\UserController::class, 'store'])->name('users.store');
    Route::get('/users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'show'])->name('users.show');
    Route::put('/users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'update'])->name('users.update');
    Route::post('/users/{user}/toggle-status', [\App\Http\Controllers\Admin\UserController::class, 'toggleStatus'])->name('users.toggle-status');
    Route::post('/users/{user}/extend-trial', [\App\Http\Controllers\Admin\UserController::class, 'extendTrial'])->name('users.extend-trial');
    Route::post('/users/{user}/assign-plan', [\App\Http\Controllers\Admin\UserController::class, 'assignPlan'])->name('users.assign-plan');
    Route::post('/users/{user}/reset-password', [\App\Http\Controllers\Admin\UserController::class, 'resetPassword'])->name('users.reset-password');
    Route::delete('/users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'destroy'])->name('users.destroy');

    // Audit Logs
    Route::get('/audit-logs', [\App\Http\Controllers\Admin\AuditLogController::class, 'index'])->name('audit-logs.index');
});

require __DIR__.'/auth.php';
