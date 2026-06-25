# Production configuration reference

Authoritative ops reference for the runtime config the app needs in
**production** (and staging). This complements `docs/deployment.md`
(which covers the deploy mechanics) — this file is about the values that
must live in the server `.env`.

> Reminder: after editing `.env` on a server, run `php artisan config:clear`
> (and re-cache if you cache config). `env()` returns `null` once config is
> cached, so app code must read `config(...)`, never `env(...)`.

---

## Mail (transactional email)

**This is the most common silent misconfiguration.** Laravel's framework
default and `.env.example` both ship `MAIL_MAILER=log`, which records
"sent" mail to the log channel instead of delivering it.

Today the app sends one transactional email — the **lead-portal
invitation** (`App\Mail\LeadPortalInvitation`, dispatched from
`LeadPortalInvitationController`). If `MAIL_MAILER=log` in production, that
invitation is silently never delivered and invited leads cannot complete
account setup.

### Required production values

```dotenv
MAIL_MAILER=smtp                 # or ses / postmark / resend — NOT log/array
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=587
MAIL_USERNAME=<provider username>
MAIL_PASSWORD=<provider password / API key>
MAIL_SCHEME=null                 # or "tls" depending on provider
MAIL_FROM_ADDRESS="no-reply@epathways.co.nz"   # NOT hello@example.com
MAIL_FROM_NAME="ePathways"
```

If using Amazon SES instead of SMTP, set `MAIL_MAILER=ses` and provide
`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_DEFAULT_REGION`
(see `config/services.php` → `ses`). Postmark/Resend similarly use
`POSTMARK_TOKEN` / `RESEND_KEY`.

### Verify

```bash
php artisan ep:check-mail
```

Prints the active mailer + from address and **exits non-zero** if the
mailer is `log`/`array` or the from address is still the placeholder.
Safe to wire into a post-deploy smoke check.

---

## SMS (Twilio)

SMS is sent through `App\Services\Sms\TwilioSmsProvider` (via the
`CommunicationService`). Leave `TWILIO_SID` unset to disable SMS — the
system falls back to a no-op provider that records a `failed` `message_logs`
row with a clear reason, so nothing breaks without Twilio.

```dotenv
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+64xxxxxxxxx   # a Twilio number you own, E.164
```

Phone numbers are normalized to E.164 (default region NZ) before sending;
un-normalizable numbers skip SMS and log a failure.

**Verify:** `php artisan ep:test-sms "+64211234567" "Hello"` — prints the
provider result and writes a `message_logs` row.

**Cost note:** outbound SMS to NZ mobiles is roughly **US$0.04–0.08 per
segment** via Twilio (a "segment" is ~160 GSM-7 chars; long messages split
into multiple segments). Verify current pricing at twilio.com/sms/pricing
before enabling at volume.

## Calendar sync token

`SyncController` (`POST /api/sync-calendar`) authenticates inbound
appointment pushes from the external Google Apps Script by comparing the
`X-Sync-Token` request header against `config('services.calendar.sync_token')`.

```dotenv
CALENDAR_SYNC_TOKEN=<long random shared secret>
```

Must match the token configured in the Apps Script. If unset, every sync
request is rejected with 401.

---

## Other external services

Set only what is in use; unset keys leave the corresponding feature
dormant (see `config/services.php` for the full list).

| Concern | Env keys | Notes |
|---|---|---|
| Cerebras (lead AI analysis) | `CEREBRAS_API_KEY`, `CEREBRAS_MODEL`, `CEREBRAS_BASE_URL` | Required for free-assessment scoring |
| Gemini (chatbot) | `GEMINI_API_KEY` | Required for `POST /api/chat` |
| Calendar sync | `CALENDAR_SYNC_TOKEN` | See above |
| Queue / cache / session | `QUEUE_CONNECTION`, `CACHE_STORE`, `SESSION_DRIVER` | `redis` in production (per CLAUDE.md) |
| PLAI ad launch | `PLAI_API_KEY`, `PLAI_WORKSPACE_ID` | Dormant until set |
| Social MVP (n8n) | `SOCIAL_WEBHOOK_BASE`, `SOCIAL_WEBHOOK_SECRET` | Falls back to stub fixtures when unset |
| Stripe | `STRIPE_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET` | Intentionally **disabled** per client direction; payments are simulated |
| Contact widgets | `CONTACT_PHONE`, `CONTACT_WHATSAPP`, `CONTACT_MESSENGER`, `CONTACT_FACEBOOK`, `CONTACT_EMAIL` | Public-facing CTA destinations |

---

## Background processing

Two things must be running on the server for the app to work end-to-end:

- **Queue worker** — `php artisan queue:work` (or `queue:listen`). Required
  for the `AnalyzeLeadAssessment` job (free-assessment AI scoring).
- **Scheduler** — a system cron running `php artisan schedule:run` every
  minute. Drives the hourly news-feed cache refresh
  (`routes/console.php`).

Without the worker, free-assessment submissions never get an AI analysis.
Without the scheduler, the news feed silently goes stale.
