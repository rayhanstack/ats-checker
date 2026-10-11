# ATS Checker - AI-Powered Resume Optimization & ATS Scoring

ATS Checker is a high-performance web application that compares candidate resumes against job descriptions, returning an instant ATS compatibility score (0-100), matched and missing keywords, formatting diagnostics, and section-by-section AI fixes powered by Claude.

---

## Google OAuth Setup (Laravel Socialite)

To enable **"Continue with Google"** authentication:

### 1. Create Credentials in Google Cloud Console
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing project (e.g., `ats-checker`).
3. Under **APIs & Services** &rarr; **OAuth consent screen**:
   - Choose **External** user type.
   - Fill in App name: `ATS Checker`, User support email, and Developer contact information.
   - Add scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
4. Under **APIs & Services** &rarr; **Credentials**:
   - Click **Create Credentials** &rarr; **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `ATS Checker Web Client`.

### 2. Configure Authorized JavaScript Origins & Redirect URIs

#### Local Development:
- **Authorized JavaScript origins**:
  - `http://localhost:8000`
  - `http://127.0.0.1:8000`
- **Authorized redirect URIs**:
  - `http://localhost:8000/auth/google/callback`
  - `http://127.0.0.1:8000/auth/google/callback`

#### Production:
- **Authorized JavaScript origins**:
  - `https://yourdomain.com`
- **Authorized redirect URIs**:
  - `https://yourdomain.com/auth/google/callback`

### 3. Configure `.env`
Add your Client ID and Client Secret to `.env`:
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"
```

> **Security Note:** OAuth secrets reside strictly in `.env` and are never committed to git, stored in the database, or passed to frontend props. When Google credentials are missing or `google_login_enabled` is set to false in settings, the Google login buttons are automatically hidden.

---

## Authentication Features & Security Guardrails
- **7-Day Free Trial:** Automatically initiated on registration (`trial_ends_at = now()->addDays(trial_days)`).
- **Mandatory Email Verification:** `User` implements `MustVerifyEmail`. Unverified users are allowed to log in and access profile settings, but are strictly gated from `/analyze` and resume uploads.
- **Guest Upload Guard:** Guest visitors clicking "Check my CV" or visiting `/analyze` are redirected to `/login` with an informative banner (*"Please log in to upload your resume"*), preserving the intended destination so they seamlessly return after login or registration.
- **Account Takeover Protection:** If a user attempts to sign in with Google using an email that matches an existing local account that is **unverified**, automatic linking is blocked. The user must authenticate using their existing password first.
- **Passwordless Social Disconnect Guard:** Users who authenticated solely via Google cannot disconnect Google without creating a password first.

---

## Payment Gateways & Subscription Architecture

ATS Checker includes a pluggable payment gateway abstraction defined in `App\Contracts\PaymentGateway`:

```php
interface PaymentGateway
{
    public function createCheckout(User $user, Plan $plan, array $options = []): array;
    public function handleWebhook(array $payload): bool;
    public function cancel(Subscription $subscription): bool;
    public function refund(Payment $payment): bool;
}
```

### 1. Active Gateway Resolution
The active gateway driver is dynamically resolved via `AppServiceProvider` using the `payment_gateway` setting stored in the database (`SettingsService::get('payment_gateway', 'manual')`).

- **Default Driver (`manual`):**
  - Implemented by `App\Services\PaymentGateways\ManualGateway`.
  - Generates a unique invoice number (`INV-YYYYMMDD-XXXXXX`) and records a `pending` payment record in the `payments` table.
  - Automatically notifies the candidate: *"Payment gateway coming soon. Your request has been recorded. Please contact support or await admin activation."*
  - Admins can manually verify and activate payments (`markAsPaid`), which transitions the user's subscription to `active` and extends their quota.

### 2. Plugging in Production Gateways (Stripe, SSLCommerz, bKash)
To plug in new payment gateways:

1. **Stripe:**
   - Create `App\Services\PaymentGateways\StripeGateway` implementing `PaymentGateway`.
   - In `createCheckout()`, create a Stripe Checkout Session using `\Stripe\Checkout\Session::create()` with price IDs and return `checkout_url`.
   - In `handleWebhook()`, verify Stripe webhook signatures and process `checkout.session.completed` / `invoice.payment_succeeded`.
   - Bind `'stripe' => $this->app->make(\App\Services\PaymentGateways\StripeGateway::class)` in `AppServiceProvider`.

2. **SSLCommerz:**
   - Create `App\Services\PaymentGateways\SslCommerzGateway` implementing `PaymentGateway`.
   - In `createCheckout()`, initiate the session with SSLCommerz API endpoint and return `GatewayPageURL` as `checkout_url`.
   - In `handleWebhook()`, validate IPN hash and update payment status to `paid`.

3. **bKash (Tokenized Checkout):**
   - Create `App\Services\PaymentGateways\BkashGateway` implementing `PaymentGateway`.
   - In `createCheckout()`, invoke `createPayment` API and return `bkashURL`.
   - In `handleWebhook()`, process `executePayment` query response.

4. **Switching Drivers:**
   - Change the `payment_gateway` key in settings table or Admin Settings panel (`manual`, `stripe`, `sslcommerz`, `bkash`).

### 3. Automated Expiry Command
A daily scheduled command `php artisan subscriptions:expire` automatically checks for subscriptions that have passed their `ends_at` date and updates their status to `expired`.

