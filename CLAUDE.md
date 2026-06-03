# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ePathways — a New Zealand education & immigration consultancy site. Laravel 12 backend, React 19 frontend rendered through Inertia.js (no separate API/SPA split — controllers return Inertia page components). Public marketing pages + lead/assessment/booking funnels + an authenticated `/admin` portal + six department staff portals at `/portal/<role>` + an external client-facing `/portal/lead`.

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
- `app/Http/Middleware/HandleInertiaRequests.php` shares three things into every page's props:
  - `auth.user`
  - A wide **flash** bag: `success`, `error`, `lead_id`, `intake_id`, `review_success`, `review_id`, `edit_link_url`, `edit_link_intake_id`, `invitation_link`, `invitation_link_lead_id`, `generated_credentials`, `import_summary`. **Form-submit → redirect-with-flash → frontend reads `usePage().props.flash`** is the canonical pattern; `resources/js/components/ui/FlashToaster.jsx` turns these into sonner toasts.
  - `contact` (phone/whatsapp/messenger/facebook/email from `config('services.contact.*')`) for the sticky CTA, floating contact, and footer.
  - `sidebarBadges` — a lazy closure that returns badge counts only for the portal whose URL prefix matches the request (avoids running sales queries on the lead portal etc.).
- Frontend entry is `resources/js/app.jsx`. It auto-resolves page components from `resources/js/pages/**/*.jsx` by the string passed to `inertia(...)`, and **auto-wraps pages by URL prefix**:
  - `pages/admin/*` → `AdminLayout`
  - `pages/portal/sales/*` → `SalesLayout`; `portal/education/*` → `EducationLayout`; `portal/english/*` → `EnglishLayout`; `portal/immigration/*` → `ImmigrationLayout`; `portal/accommodation/*` → `AccommodationLayout`; `portal/lead/*` → `LeadLayout`.
  - Adding a new staff portal = new layout import + new entry in the `PORTAL_LAYOUTS` map.
- Global UI mounted once at the app root: `FlashToaster`, `FloatingContact`, `MobileStickyCTA`, and a sonner `<Toaster>` — public pages render their own `<Navbar />` / `<Footer />`; portal pages get chrome from their layout.
- `routes/api.php` has only `POST /api/chat` (Gemini-backed chatbot) and the Sanctum `/api/user`. The calendar-sync endpoint `POST /api/sync-calendar` actually lives in `routes/web.php` and self-authenticates via the `X-Sync-Token` header (`SyncController`), so it sits outside the auth group; it and `/api/chat` are CSRF-exempt (see `bootstrap/app.php`).

### Auth, roles, and portals
- `User` has a `role` column. Two singleton roles — `admin` (full access to `/admin` and every portal) and `lead` (external client logging into `/portal/lead`) — plus five department roles in `User::PORTAL_ROLES`: `sales`, `education`, `english`, `immigration`, `accommodation`.
- Route protection is `auth` + the **`portal:<role>[,<role>...]`** middleware (`App\Http\Middleware\EnsurePortalAccess`, registered as alias `portal` in `bootstrap/app.php`). Multiple roles in one call act as OR. `User::canAccessPortal()` lets admins satisfy every `portal:*` check, so an admin can open any department's screens.
- `User::homeRoute()` is where login lands a user: admins → `/admin/dashboard`, department staff → `/portal/<role>/dashboard`, leads → `/portal/lead/dashboard`.
- Some `/admin/...` URLs are shared between admins and the relevant department (e.g. `/admin/immigration/resident-intakes` is wrapped in `portal:admin,immigration`; lead documents are `portal:admin,sales` for staff actions and `portal:admin,sales,education,english,immigration,accommodation` for checklist uploads/downloads). The immigration portal's sidebar deep-links into these `/admin/immigration/...` screens for historical reasons.

### Backend domains
- **Leads** (`LeadController` + `Lead` model with `LogsActivity` trait): central pipeline record. Lead detail screen aggregates per-lead sub-resources — `LeadNote`, `LeadTag` (free-form, auto-created), `LeadTask` (assignee/due_at; only creator or admin can delete), `LeadDocument`. Stage advances and conversions (`convert-to-student`, `convert-to-case`, `convert-to-accommodation`, each with a revert) all funnel through `LeadController` and audit-log via the trait. Bulk CSV import (`importLeads`) dedupes by email or name+phone and flashes `import_summary` to the client.
- **Free Assessment** (`LeadController::storeFreeAssessment` + `LeadEducationExp` + `LeadStudyPlan`): the multi-step assessment form. On submit, `AnalyzeLeadAssessment` job is queued → `App\Services\CerebrasService` calls the Cerebras LLM API to produce an eligibility score JSON stored in `leads.ai_analysis` with `ai_analysis_status` (`processing`/`completed`/`failed`). `CerebrasService` deliberately does NOT use `response_format: json_object` and instead extracts/validates JSON from the response (small models misbehave with that flag — see `docs/deployment.md` troubleshooting). The lightweight `QuickLeadController` is the inline capture used by hero/exit-intent/footer; same `leads` table, source-tagged.
- **Lead Documents** (`LeadDocumentController` + `LeadDocument` model): checklist + section-verification flow. Staff can request specific docs; leads upload via `/portal/lead/documents`; staff review status (`Submitted` / `UnderReview` / etc.). Includes a **templated agreement generator** — staff "Generate" on a checklist key (currently `agree.consultancy` single|partner) renders a Blade view → dompdf → attaches as a `LeadDocument` with `source='generated'`. Downloads always re-check role + ownership inside the controller before streaming.
- **Lead Portal Invitations** (`LeadPortalInvitationController`): sales requests an invitation on a lead → admin approves/rejects/revokes → admin "generate credentials" flashes `invitation_link` + `generated_credentials` once. Leads complete account setup via `/lead-portal/setup/{token}` (the token itself is the bearer credential, no auth middleware).
- **Events / Registration** (`EventController` + `Event` + `EventSession`): public `register/{event_code}` flow that also creates leads.
- **Bookings** (`BookingController` + `Booking`): consultation booking form. `SyncController` (`POST /api/sync-calendar`, token in `X-Sync-Token` header == `CALENDAR_SYNC_TOKEN`) lets an external Google Apps Script push confirmed appointment times back onto bookings.
- **Programs** (`ProgramController` + `Program`): public program-levels / program-details / fee-guide pages + admin CRUD. Programs have a `slug`; several migrations reshape `entry_requirements` / `employment_outcomes` into structured "sections" JSON.
- **Program Promos** (`ProgramPromoController` + `PromoFeed`): time-bound discount campaigns surfaced on Home / Education Journey / Programs. Managed by admin+sales+education. Banner uploads live in `storage/app/public/promos`.
- **Immigration intake & visa** (`ResidentIntakeController`): resident-visa intake form with public submit + admin review under `/admin/immigration/resident-intakes`. **Token-based edit links** (`/resident-interest/edit/{token}`) let staff send a lead back to their own submission without an account.
- **User Reviews** (`UserReviewController`): public submit (`/user-reviews`, `/leave-review`) + per-department admin moderation. `adminUpdate` is shared between immigration and education (toggles `is_published` / `is_featured` / `status` / `visa_type`). A unified `/admin/user-reviews` page (`adminUnifiedIndex`) replaces the two separate sidebar entries.
- **Facebook Live** (`FacebookLiveController` + `FacebookLiveSession`): admin CRUD, surfaced on the public Activities page.
- **AI Ads** (`AiAdController`): Cerebras-backed local ad-copy brainstorming + PLAI Partner API for launching to FB/IG/Google/LinkedIn/TikTok. PLAI launch is **dormant until `PLAI_API_KEY` is set**.
- **Social MVP** (`AiAdsWebhookController`, routes under `/webhook/social/*`): thin Laravel proxy that forwards to an n8n workflow when configured, otherwise returns stub data so the React UI (`pages/admin/social/*`) can be built in isolation.
- **Chatbot** (`ChatController`, invokable): proxies to Google Gemini (`gemini-2.5-flash`) with an ePathways system prompt.
- **News feed** (`NewsFeedService`): pulled into props for the public immigration page.
- **Activity log** (`ActivityLogController` + `LogsActivity` trait on `Lead`): every change to a lead is audited and surfaced under `/admin/activity-logs`.
- **Auth** (`AuthController`): simple email/password login; redirects to `homeRoute()` on success.

### Frontend conventions
- React 19 + Vite 7 + Tailwind CSS v4 (via `@tailwindcss/vite`, configured in CSS not a JS config). UI libs: `flowbite-react`, `framer-motion`, `lucide-react`, `swiper`, `sonner` (toasts).
- Path aliases: `@` → `resources/js`, `@assets` → `resources/assets` (defined in `vite.config.js`). **Linux CI is case-sensitive** — match the real `resources/assets` casing exactly in imports, or `npm run build` fails on GitHub Actions while passing on Windows.
- `pages/` = full Inertia pages; each marketing page (e.g. `pages/home/HomePage.jsx`) composes section components colocated in the same folder. `components/layout/` = Navbar/Footer + the seven portal/admin layouts; `components/ui/` = ChatBot/Modal/FlashToaster/FloatingContact/MobileStickyCTA/ScrollToTop.

### Config / external services
Read external creds via `config('services.*')`, **never `env()` in app code** (config is cached in deployed envs — `env()` returns `null`). Relevant keys in `config/services.php`: `cerebras` (`CEREBRAS_API_KEY`, `CEREBRAS_MODEL`, `CEREBRAS_BASE_URL`), `gemini` (`GEMINI_API_KEY`), `openai`, `plai` (`PLAI_API_KEY`), `contact.*` (public phone/whatsapp/messenger/facebook/email), plus the n8n webhook base used by `AiAdsWebhookController`. Queue/cache/session default to the `database` driver locally, `redis` in production.

## Deployment

Pushes to `staging` → `staging.epathways.co.nz`, pushes to `main` → `epathways.co.nz`, via GitHub Actions (`.github/workflows/deploy-*.yml`) which build on the runner and rsync to a single Hostinger VPS. **`docs/deployment.md` is the authoritative ops/troubleshooting reference** — read it before touching deploy workflows, server config, file-upload/permissions code, or the Cerebras integration. Key gotchas it documents: rsync `--delete` will eat `storage/app/{public,private}` user uploads if not excluded; rsync `-p` wipes `storage` setgid perms each deploy (post-deploy step re-chmods + re-`storage:link`); `env()` returns null after `config:cache`.

Workflow: feature branch → merge to `staging` (verify) → merge to `main` (production).
