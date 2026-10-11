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
