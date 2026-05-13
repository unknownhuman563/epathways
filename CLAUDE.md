# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ePathways — a New Zealand education & immigration consultancy site. Laravel 12 backend, React 19 frontend rendered through Inertia.js (no separate API/SPA split — controllers return Inertia page components). Public marketing pages + lead/assessment/booking funnels + an authenticated `/admin` portal.

## Commands

```bash
# Full dev environment (server + queue worker + log tailer + vite, all in one):
composer run dev          # = php artisan serve + queue:listen + pail + npm run dev

# Or run pieces individually:
php artisan serve         # app on http://localhost:8000
npm run dev               # Vite dev server (HMR)
npm run build             # production asset build (also what CI runs)
php artisan queue:listen  # required for AI lead analysis (queued jobs)

# Tests
composer test             # config:clear + php artisan test (PHPUnit, sqlite :memory:)
php artisan test --filter ProgramControllerTest        # single test class
php artisan test tests/Feature/FreeAssessmentTest.php  # single file
npx playwright test                                    # e2e (needs app running on :8000)
npx playwright test e2e/free-assessment.spec.ts

# Lint / format
./vendor/bin/pint         # PHP formatter (Laravel Pint) — no JS linter configured

# DB
php artisan migrate
php artisan db:seed --class=AdminSeeder    # creates admin login from ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD env vars
php artisan migrate:fresh --seed
```

Local DB is MySQL by default (`DB_CONNECTION=mysql`, db name `epathways`); copy `.env.example` to `.env` and `php artisan key:generate`. Tests force sqlite in-memory via `phpunit.xml`, so they don't touch your dev DB.

## Architecture

### Request flow (Inertia)
- Routes in `routes/web.php` either `return inertia('pages/SomePage', [...props])` directly for static pages, or call a controller that does `Inertia::render(...)`.
- `app/Http/Middleware/HandleInertiaRequests.php` shares `auth.user` and a `flash` bag (`success`, `lead_id`, `intake_id`, `review_success`, `review_id`) into every page's props. **Form-submit → redirect-with-flash → frontend reads `usePage().props.flash`** is the pattern used by assessment/intake/review submissions; `resources/js/components/ui/FlashToaster.jsx` turns these into toasts.
- Frontend entry is `resources/js/app.jsx`. It auto-resolves page components from `resources/js/pages/**/*.jsx` by the string passed to `inertia(...)`. Any page under `pages/admin/` is automatically wrapped in `AdminLayout`.
- `routes/api.php` has only `POST /api/chat` (Gemini-backed chatbot) and the Sanctum `/api/user`. `/api/chat` and `/api/sync-calendar` are CSRF-exempt (see `bootstrap/app.php`).

### Frontend conventions
- React 19 + Vite 7 + Tailwind CSS v4 (via `@tailwindcss/vite`, configured in CSS not a JS config). UI libs: `flowbite-react`, `framer-motion`, `lucide-react`, `swiper`, `sonner` (toasts).
- Path aliases: `@` → `resources/js`, `@assets` → `resources/assets` (defined in `vite.config.js`). **Linux CI is case-sensitive** — match the real `resources/assets` casing exactly in imports, or `npm run build` fails on GitHub Actions while passing on Windows.
- `pages/` = full Inertia pages; each marketing page (e.g. `pages/home/HomePage.jsx`) composes section components colocated in the same folder. `components/layout/` = Navbar/Footer/AdminLayout, `components/ui/` = ChatBot/Modal/FlashToaster/ScrollToTop.
- Public pages render their own `<Navbar />` / `<Footer />`; admin pages get chrome from `AdminLayout` automatically.

### Backend domains
- **Leads / Free Assessment** (`LeadController`, `Lead` + `LeadEducationExp` + `LeadStudyPlan` models): the multi-step free-assessment form. On submit, `AnalyzeLeadAssessment` job is queued → `App\Services\CerebrasService` calls the Cerebras LLM API to produce an eligibility score JSON stored in `leads.ai_analysis` with `ai_analysis_status` (`processing`/`completed`/`failed`). `CerebrasService` deliberately does NOT use `response_format: json_object` and instead extracts/validates JSON from the response (small models misbehave with that flag — see `docs/deployment.md` troubleshooting).
- **Events / Registration** (`EventController`, `Event` + `EventSession`): public `register/{event_code}` flow that also creates leads.
- **Bookings** (`BookingController`, `Booking`): consultation booking form. `SyncController` (`POST /api/sync-calendar`, token in `X-Sync-Token` header == `CALENDAR_SYNC_TOKEN`) lets an external Google Apps Script push confirmed appointment times back onto bookings.
- **Programs** (`ProgramController`, `Program`): public program-levels / program-details / fee-guide pages + admin CRUD. Programs have a `slug`; several migrations reshape `entry_requirements` / `employment_outcomes` into structured "sections" JSON.
- **Immigration** (`ResidentIntakeController`, `UserReviewController`): resident-visa intake form and user reviews, each with public submit + admin review screens under `/admin/immigration/...`.
- **Facebook Live** (`FacebookLiveController`, `FacebookLiveSession`): admin CRUD, surfaced on the public Activities page.
- **Chatbot** (`ChatController`, invokable): proxies to Google Gemini (`gemini-2.5-flash`) with an ePathways system prompt.
- **Auth** (`AuthController`): simple email/password login; `User` model has no role column — any authenticated user can reach `/admin/*` (the `auth` middleware group in `routes/web.php`).

### Config / external services
Read external creds via `config('services.*')`, never `env()` in app code (config is cached in deployed envs — `env()` returns `null`). Relevant keys in `config/services.php`: `cerebras` (`CEREBRAS_API_KEY`, `CEREBRAS_MODEL`, `CEREBRAS_BASE_URL`), `gemini` (`GEMINI_API_KEY`), `openai`. Queue/cache/session default to the `database` driver locally, `redis` in production.

## Deployment

Pushes to `staging` → `staging.epathways.co.nz`, pushes to `main` → `epathways.co.nz`, via GitHub Actions (`.github/workflows/deploy-*.yml`) which build on the runner and rsync to a single Hostinger VPS. **`docs/deployment.md` is the authoritative ops/troubleshooting reference** — read it before touching deploy workflows, server config, file-upload/permissions code, or the Cerebras integration. Key gotchas it documents: rsync `--delete` will eat `storage/app/{public,private}` user uploads if not excluded; rsync `-p` wipes `storage` setgid perms each deploy (post-deploy step re-chmods + re-`storage:link`); `env()` returns null after `config:cache`.

Workflow: feature branch → merge to `staging` (verify) → merge to `main` (production). The current working branch here is `angi`.
