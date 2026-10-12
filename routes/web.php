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

    // CV & Analysis Tracking
    Route::get('/analyses', [\App\Http\Controllers\Admin\AnalysisController::class, 'index'])->name('analyses.index');
    Route::get('/analyses/export-csv', [\App\Http\Controllers\Admin\AnalysisController::class, 'exportCsv'])->name('analyses.export-csv');
    Route::get('/analyses/{analysis}/download-cv', [\App\Http\Controllers\Admin\AnalysisController::class, 'downloadCv'])->name('analyses.download-cv');
    Route::post('/analyses/{analysis}/rerun', [\App\Http\Controllers\Admin\AnalysisController::class, 'rerun'])->name('analyses.rerun');
    Route::delete('/analyses/{analysis}', [\App\Http\Controllers\Admin\AnalysisController::class, 'destroy'])->name('analyses.destroy');

    // Plans Management
    Route::get('/plans', [\App\Http\Controllers\Admin\PlanController::class, 'index'])->name('plans.index');
    Route::post('/plans', [\App\Http\Controllers\Admin\PlanController::class, 'store'])->name('plans.store');
    Route::put('/plans/{plan}', [\App\Http\Controllers\Admin\PlanController::class, 'update'])->name('plans.update');
    Route::delete('/plans/{plan}', [\App\Http\Controllers\Admin\PlanController::class, 'destroy'])->name('plans.destroy');

    // Subscriptions Management
    Route::get('/subscriptions', [\App\Http\Controllers\Admin\SubscriptionController::class, 'index'])->name('subscriptions.index');
    Route::put('/subscriptions/{subscription}', [\App\Http\Controllers\Admin\SubscriptionController::class, 'updateStatus'])->name('subscriptions.update');
    Route::post('/subscriptions/{subscription}/cancel', [\App\Http\Controllers\Admin\SubscriptionController::class, 'cancel'])->name('subscriptions.cancel');

    // Payments & Invoices
    Route::get('/payments', [\App\Http\Controllers\Admin\PaymentController::class, 'index'])->name('payments.index');
    Route::post('/payments/{payment}/mark-paid', [\App\Http\Controllers\Admin\PaymentController::class, 'markPaid'])->name('payments.mark-paid');
    Route::post('/payments/{payment}/refund', [\App\Http\Controllers\Admin\PaymentController::class, 'refund'])->name('payments.refund');

    // Audit Logs
    Route::get('/audit-logs', [\App\Http\Controllers\Admin\AuditLogController::class, 'index'])->name('audit-logs.index');

    // AI Models Management
    Route::get('/ai-models', [\App\Http\Controllers\Admin\AiModelController::class, 'index'])->name('ai-models.index');
    Route::post('/ai-models', [\App\Http\Controllers\Admin\AiModelController::class, 'store'])->name('ai-models.store');
    Route::put('/ai-models/{ai_model}', [\App\Http\Controllers\Admin\AiModelController::class, 'update'])->name('ai-models.update');
    Route::post('/ai-models/{ai_model}/toggle-active', [\App\Http\Controllers\Admin\AiModelController::class, 'toggleActive'])->name('ai-models.toggle-active');
    Route::post('/ai-models/{ai_model}/set-default', [\App\Http\Controllers\Admin\AiModelController::class, 'setDefault'])->name('ai-models.set-default');
    Route::post('/ai-models/{ai_model}/test', [\App\Http\Controllers\Admin\AiModelController::class, 'testModel'])->name('ai-models.test');
    Route::delete('/ai-models/{ai_model}', [\App\Http\Controllers\Admin\AiModelController::class, 'destroy'])->name('ai-models.destroy');

    // System Settings
    Route::get('/settings', [\App\Http\Controllers\Admin\SettingController::class, 'index'])->name('settings.index');
    Route::put('/settings', [\App\Http\Controllers\Admin\SettingController::class, 'update'])->name('settings.update');
    Route::post('/settings/test-mail', [\App\Http\Controllers\Admin\SettingController::class, 'sendTestEmail'])->name('settings.test-mail');
    Route::post('/settings/testimonials', [\App\Http\Controllers\Admin\SettingController::class, 'storeTestimonial'])->name('settings.testimonials.store');
    Route::put('/settings/testimonials/{testimonial}', [\App\Http\Controllers\Admin\SettingController::class, 'updateTestimonial'])->name('settings.testimonials.update');
    Route::delete('/settings/testimonials/{testimonial}', [\App\Http\Controllers\Admin\SettingController::class, 'destroyTestimonial'])->name('settings.testimonials.destroy');

    // FAQs Management
    Route::get('/faqs', [\App\Http\Controllers\Admin\FaqController::class, 'index'])->name('faqs.index');
    Route::post('/faqs', [\App\Http\Controllers\Admin\FaqController::class, 'store'])->name('faqs.store');
    Route::put('/faqs/{faq}', [\App\Http\Controllers\Admin\FaqController::class, 'update'])->name('faqs.update');
    Route::post('/faqs/reorder', [\App\Http\Controllers\Admin\FaqController::class, 'reorder'])->name('faqs.reorder');
    Route::post('/faqs/{faq}/toggle-publish', [\App\Http\Controllers\Admin\FaqController::class, 'togglePublish'])->name('faqs.toggle-publish');
    Route::delete('/faqs/{faq}', [\App\Http\Controllers\Admin\FaqController::class, 'destroy'])->name('faqs.destroy');

    // Contact Messages Inbox
    Route::get('/contact-messages', [\App\Http\Controllers\Admin\ContactMessageController::class, 'index'])->name('contact-messages.index');
    Route::post('/contact-messages/{contact_message}/mark-read', [\App\Http\Controllers\Admin\ContactMessageController::class, 'markRead'])->name('contact-messages.mark-read');
    Route::post('/contact-messages/{contact_message}/mark-replied', [\App\Http\Controllers\Admin\ContactMessageController::class, 'markReplied'])->name('contact-messages.mark-replied');
    Route::delete('/contact-messages/{contact_message}', [\App\Http\Controllers\Admin\ContactMessageController::class, 'destroy'])->name('contact-messages.destroy');
});

require __DIR__.'/auth.php';
