# ATS Checker - Enterprise AI-Powered Resume Optimization & ATS Scoring Platform

ATS Checker is a high-performance web application built with **Laravel 11**, **React 18 / TypeScript**, **Inertia.js**, and **Tailwind CSS**. It compares candidate resumes against job descriptions, delivering instant ATS compatibility scores (0–100), keyword match breakdowns, formatting diagnostics, and section-by-section AI-powered suggestions powered by Anthropic Claude.

---

## 🚀 Quickstart Guide (Up and Running in < 10 Minutes)

### Prerequisites
- **PHP**: 8.2 or higher (with `mbstring`, `pdo_mysql`, `curl`, `gd`, `zip` extensions enabled)
- **Composer**: 2.x
- **Node.js**: 18.x or 20.x and **npm**
- **Database**: MySQL 8.0+ or MariaDB 10.5+ (SQLite is supported out-of-the-box for rapid evaluation)

### Step-by-Step Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/ats-checker.git
cd ats-checker

# 2. Install PHP and JavaScript dependencies
composer install
npm install

# 3. Prepare environment configuration
cp .env.example .env
php artisan key:generate

# 4. Configure your database in .env
# Edit DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
# Or set DB_CONNECTION=sqlite for instant local zero-config testing:
# touch database/database.sqlite

# 5. Run database migrations and seed system defaults
php artisan migrate --seed

# 6. Symlink storage directory
php artisan storage:link

# 7. Compile frontend production assets
npm run build

# 8. Start the local development server
php artisan serve
```

Your app is now live at **`http://localhost:8000`**!

### Default Admin Credentials
When seeded, a Super-Admin user is automatically created:
- **Email**: `admin@atschecker.local`
- **Password**: `Password123!`
- **Admin Dashboard**: `http://localhost:8000/admin`

---

## ⚙️ Background Workers & Task Scheduling

ATS Checker uses background queue jobs for AI resume parsing, Anthropic API calls, and scoring to keep HTTP response times snappy.

### 1. Running the Queue Worker
In development or staging, start the queue worker:
```bash
php artisan queue:work --tries=4 --timeout=240
```
- **Why `--tries=4`**: If Anthropic API encounters a rate-limit or temporary outage, the job retries with exponential backoff (60s, 180s, 600s) before marking the analysis as failed.
- **Why `--timeout=240`**: Large multi-page PDF/DOCX files processed through high-context AI models require ample execution time.

### 2. Running the Scheduler
ATS Checker features scheduled tasks (e.g. daily subscription expiration checks and resume retention cleanup):
```bash
# Local development simulation:
php artisan schedule:work
```

### 3. Monitoring Failed Queue Jobs
If an analysis job encounters an unrecoverable error, inspect and manage it using standard Artisan commands:
```bash
# List all failed jobs
php artisan queue:failed

# Retry all failed jobs
php artisan queue:retry all

# Retry a specific failed job
php artisan queue:retry <id>

# Flush failed jobs table
php artisan queue:flush
```

---

## 🔒 Security Architecture & Guardrails

ATS Checker is built following enterprise security principles:

1. **Enterprise Security Headers**: Every HTTP response is filtered through `App\Http\Middleware\SecurityHeaders`:
   - `X-Frame-Options: SAMEORIGIN` (prevents clickjacking)
   - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   - Strict `Content-Security-Policy` (CSP)
   - `Strict-Transport-Security` automatically attached on HTTPS/production.
2. **Private File Storage**: Resumes are uploaded to private disk storage (`storage/app/resumes`) using randomized UUID filenames. They are **NEVER** exposed via public URLs. File downloads require strict policy authorization via `AnalysisPolicy`.
3. **No Secrets in Frontend**: `HandleInertiaRequests` strictly filters public session attributes. API keys (e.g., `ANTHROPIC_API_KEY`, OAuth client secrets) never enter Inertia props or Vite client bundles.
4. **XSS-Safe AI Rendering**: AI output and suggestions are parsed as structured JSON and rendered via native React elements. `dangerouslySetInnerHTML` is **NEVER** used for AI outputs.
5. **Rate Limiting**:
   - Authentication / Login: Rate limited via `LoginRequest` throttle rules.
   - Contact Form: Protected by `throttle:5,1` (max 5 submissions per minute).
   - Resume Upload / Analysis: Dynamically rate-limited via `throttle:analyses` adhering to the admin-configured limit (`analysis_throttle_per_hour`).
6. **Multi-Tenant Authorization & Policies**:
   - `AnalysisPolicy`: Ensures users can only view, rerun, or delete their own analyses.
   - `EnsureUserIsAdmin`: Restricts all `/admin` management routes to verified administrators.
   - Last-Admin Protection: Prevents an admin from deleting or deactivating the last remaining active administrator.
7. **N+1 Query Prevention**: All paginated queries in user and admin controllers implement eager loading (`with(['user', 'aiModel', 'attempts'])`).

---

## 💳 Payment Gateway Architecture & Integration Guide

ATS Checker includes a pluggable payment driver contract defined in `App\Contracts\PaymentGateway`:

```php
namespace App\Contracts;

use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;

interface PaymentGateway
{
    public function createCheckout(User $user, Plan $plan, array $options = []): array;
    public function handleWebhook(array $payload): bool;
    public function cancel(Subscription $subscription): bool;
    public function refund(Payment $payment): bool;
}
```

### Active Driver Architecture
- The active driver is dynamically bound in `App\Providers\AppServiceProvider` reading from `SettingsService::get('payment_gateway', 'manual')`.
- Default: `App\Services\PaymentGateways\ManualGateway` records pending invoices (`INV-YYYYMMDD-XXXXXX`), allowing candidates to request plans and administrators to activate them via the Admin Console.

### How to Plug in a Production Gateway (e.g., Stripe)

1. **Install Gateway SDK**:
   ```bash
   composer require stripe/stripe-php
   ```

2. **Implement `PaymentGateway`**:
   Create `app/Services/PaymentGateways/StripeGateway.php`:
   ```php
   namespace App\Services\PaymentGateways;

   use App\Contracts\PaymentGateway;
   use App\Models\Payment;
   use App\Models\Plan;
   use App\Models\Subscription;
   use App\Models\User;
   use Stripe\StripeClient;

   class StripeGateway implements PaymentGateway
   {
       protected StripeClient $stripe;

       public function __construct()
       {
           $this->stripe = new StripeClient(config('services.stripe.secret'));
       }

       public function createCheckout(User $user, Plan $plan, array $options = []): array
       {
           $session = $this->stripe->checkout->sessions->create([
               'customer_email' => $user->email,
               'payment_method_types' => ['card'],
               'line_items' => [[
                   'price_data' => [
                       'currency' => strtolower($plan->currency),
                       'unit_amount' => (int) ($plan->price * 100),
                       'product_data' => ['name' => $plan->name],
                       'recurring' => ['interval' => $plan->billing_interval === 'year' ? 'year' : 'month'],
                   ],
                   'quantity' => 1,
               ]],
               'mode' => 'subscription',
               'success_url' => route('billing') . '?session_id={CHECKOUT_SESSION_ID}',
               'cancel_url' => route('pricing'),
           ]);

           return [
               'checkout_url' => $session->url,
               'session_id' => $session->id,
           ];
       }

       public function handleWebhook(array $payload): bool
       {
           // Validate webhook signature and update Subscription & Payment status
           return true;
       }

       public function cancel(Subscription $subscription): bool
       {
           if ($subscription->gateway_subscription_id) {
               $this->stripe->subscriptions->cancel($subscription->gateway_subscription_id);
           }
           $subscription->update(['status' => 'canceled', 'canceled_at' => now()]);
           return true;
       }

       public function refund(Payment $payment): bool
       {
           // Issue Stripe refund and record status
           return true;
       }
   }
   ```

3. **Register in `AppServiceProvider.php`**:
   ```php
   $this->app->bind(PaymentGateway::class, function () {
       $gateway = SettingsService::get('payment_gateway', 'manual');
       return match ($gateway) {
           'stripe' => $this->app->make(\App\Services\PaymentGateways\StripeGateway::class),
           default => $this->app->make(\App\Services\PaymentGateways\ManualGateway::class),
       };
   });
   ```

4. **Add Webhook Route in `routes/web.php` or `routes/api.php`**:
   Exempt the webhook route from CSRF verification in `bootstrap/app.php`:
   ```php
   $middleware->validateCsrfTokens(except: [
       'stripe/webhook',
   ]);
   ```

---

## 🌐 Production Deployment Checklist

Before deploying ATS Checker to a production server, complete this checklist:

### 1. Environment Hardening
- Set `APP_ENV=production` and `APP_DEBUG=false` in `.env`.
- Ensure an application encryption key is generated: `php artisan key:generate`.
- Set an explicit canonical `APP_URL=https://yourdomain.com`.

### 2. Server Optimization Commands
Execute Laravel's production caching commands:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
npm run build
```

### 3. File Permissions
Ensure the web server user (`www-data` or `nginx`) owns the storage and bootstrap cache directories:
```bash
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
chmod -R 700 storage/app/resumes
```

### 4. Supervisor Configuration for Queue Workers
Create `/etc/supervisor/conf.d/ats-checker-worker.conf`:
```ini
[program:ats-checker-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/ats-checker/artisan queue:work --sleep=3 --tries=4 --max-time=3600 --timeout=240
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/ats-checker/storage/logs/worker.log
stopwaitsecs=3600
```
Update and reload supervisor:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start ats-checker-worker:*
```

### 5. Cron Configuration for Laravel Scheduler
Add the following entry to the web server user's crontab (`crontab -e -u www-data`):
```cron
* * * * * cd /var/www/ats-checker && php artisan schedule:run >> /dev/null 2>&1
```

### 6. SSL / HTTPS
Enable TLS 1.3 / HTTPS on your web server (e.g., Let's Encrypt / Certbot). ATS Checker's `SecurityHeaders` middleware automatically enables `Strict-Transport-Security` (HSTS) when requests are served over HTTPS.

---

## 🧪 Testing & Verification

ATS Checker includes a comprehensive test suite covering authentication, subscription tiers, resume upload parsing, AI analysis fallbacks, admin controls, security headers, rate limiting, and private file serving.

```bash
# Run all Pest/PHPUnit feature tests
composer test
# or
php artisan test

# Verify frontend TypeScript and Vite bundle
npm run build
```

---

## 📋 Final QA Checklist Walkthrough

| User Journey | Key Actions & Expected Behavior | Status |
| :--- | :--- | :---: |
| **Guest User** | Visits homepage, views features & pricing, clicks "Check my CV", gets redirected to login with notice, logs in/registers, redirected back to `/analyze`. | ✅ Verified |
| **Trial User** | Registers new account, receives 7-day trial with 5 analysis credits, uploads resume, parses text, runs analysis, views interactive score gauge & suggestions. | ✅ Verified |
| **Expired User** | User whose trial has lapsed attempts to upload or rerun, blocked by `EnsureUserCanAnalyze` middleware, redirected to `/pricing` with upgrade CTA. | ✅ Verified |
| **Paid User** | Subscribes to Monthly/Yearly plan, quota refreshed according to tier limits, full access to re-run, compare, and print reports. | ✅ Verified |
| **Admin Console** | Accesses `/admin`, views dashboard KPIs, manages users (extend trial, assign plans), audits CV uploads, configures AI models, edits system settings. Last admin deletion is blocked. | ✅ Verified |

---

## 📄 License
This application is proprietary software. All rights reserved.
