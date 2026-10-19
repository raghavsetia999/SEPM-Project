# CP Performance Analyzer

CP Performance Analyzer turns public Codeforces activity into explainable performance insights
and focused practice guidance.

## Current implementation

- React/Vite analytics frontend with protected application routes
- Express API foundation with security, validation, and consistent error responses
- MongoDB User and Report models
- Cookie-based JWT authentication and onboarding APIs
- Session-aware public navigation, Google OAuth, and one-time password reset links
- Codeforces profile, submission, and rating-history adapter
- Stable submission normalization and unique-problem grouping
- Explainable topic weakness engine with unit tests
- Rating-band, verdict-pattern, and upsolving analyzers
- Gemini-grounded coaching with validated structured output and a deterministic rule-based fallback
- Unseen-problem recommendations ranked from the cached Codeforces problem catalogue
- Saved report APIs and multi-report progress history
- Authenticated PDF export for saved reports
- One-click PDF generation from handle analysis with visually verified multi-page layouts
- Opt-in weekly reports with seven-day deduplication and week-over-week comparison metrics
- Backend-connected profile, handle, practice, and notification preferences
- Coalesced Codeforces requests with snapshot, problemset, and stale-cache handling
- Shared frontend analytics snapshots with session and latest-saved-report fallback
- Functional dashboard controls and global hot-toast feedback for user actions
- Live weakness, rating, verdict, upsolving, recommendation, coach, plan, progress, and report pages

Gemini is optional and runs only through the authenticated backend. Its responses are grounded in a
compact verified analytics snapshot, schema-validated, rate-limited, and replaced by the
deterministic coach whenever the provider is missing, blocked, unavailable, or returns invalid data.

## Local setup

```bash
npm install
copy .env.example .env

cd server
npm install
copy .env.example .env
npm run dev
```

Run the frontend from a second terminal:

```bash
npm run dev
```

The API defaults to `http://localhost:5000`; the frontend defaults to
`http://localhost:5000/api`.

### Google sign-in and password email setup

Create a Google OAuth 2.0 Web application and register these local values:

- Authorized JavaScript origin: `http://localhost:5173`
- Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`

Then set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `server/.env`. Keep both values on the
server; they must never use the `VITE_` prefix. For deployed environments, also update
`CLIENT_ORIGIN`, `GOOGLE_CALLBACK_URL`, and `PASSWORD_RESET_URL` to the HTTPS production URLs.

Password reset email uses the `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and
`SMTP_FROM` settings documented in `server/.env.example`. When SMTP is intentionally absent in local
development, the forgot-password response supplies a development-only reset link. Production never
returns this link.

## Validation

```bash
npm run format:check
npm run build

cd server
npm test
```

The backend currently has 42 tests covering API validation, Codeforces mapping and caching,
analytics, unseen recommendations, report/PDF payloads, progress history, the rule-based coach, and
the guarded Gemini provider. Weekly report generation and reuse boundaries are also covered.

See [the frontend-aligned implementation report](docs/CP-Performance-Analyzer-Aligned-Report.md)
for the architecture, data contracts, two-week roadmap, testing plan, and deployment checklist.
