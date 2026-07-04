# Support Ticket System Audit — Deep-Dive

**Date:** 2026-07-01
**Branch:** `full_blown`
**Scope:** The "System Tickets" feature — staff-raised change/feature/bug requests. Investigation only; no code changed.
**Method:** Read the migration, model, controller, notifications, routes, React components, and tests. Verified with `php artisan route:list | grep -i ticket` and `grep -r`.

> **Headline:** The ticket system is real and working, but it is a **staff → admin change-request board**, not a departmental helpdesk. A `department` column exists **but it stores the submitter's role**, not a routing target. Notifications go **only to admins/super-admins**. There are **no per-department tabs, no per-department routing, and no per-department notifications** — those are all net-new for the redesign.

---

## Section 1 — Locating the ticket system

| Piece | File |
|---|---|
| Controller | [`app/Http/Controllers/SystemTicketController.php`](../../app/Http/Controllers/SystemTicketController.php) (`store`, `myTickets`, `adminIndex`, `adminUpdate`) |
| Model | [`app/Models/SystemTicket.php`](../../app/Models/SystemTicket.php) |
| Migration | [`database/migrations/2026_06_15_140000_create_system_tickets_table.php`](../../database/migrations/2026_06_15_140000_create_system_tickets_table.php) |
| Admin triage board (React) | [`resources/js/pages/admin/SystemTickets.jsx`](../../resources/js/pages/admin/SystemTickets.jsx) |
| Staff "My Tickets" list (React) | [`resources/js/pages/tickets/MyTickets.jsx`](../../resources/js/pages/tickets/MyTickets.jsx) (shared) + 5 thin re-export wrappers `pages/portal/{sales,education,english,immigration,accommodation}/Tickets.jsx` |
| Raise-a-ticket modal (topbar, all portals) | [`resources/js/components/RequestTicketButton.jsx`](../../resources/js/components/RequestTicketButton.jsx) |
| Dashboard widget | [`resources/js/components/OpenRequestsCard.jsx`](../../resources/js/components/OpenRequestsCard.jsx) |
| Notifications | [`app/Notifications/TicketSubmitted.php`](../../app/Notifications/TicketSubmitted.php), [`app/Notifications/TicketUpdated.php`](../../app/Notifications/TicketUpdated.php) |
| Notification UI mapping | [`app/Support/NotificationFormatter.php:63-72`](../../app/Support/NotificationFormatter.php#L63) |

**Routes** (`php artisan route:list | grep -i ticket`):
```
POST    tickets                     tickets.store                 → SystemTicketController@store
GET     portal/tickets              portal.tickets                → SystemTicketController@myTickets
GET     admin/system-tickets        admin.system-tickets          → SystemTicketController@adminIndex
POST    admin/system-tickets/{id}   admin.system-tickets.update   → SystemTicketController@adminUpdate
```

**Portals containing ticket UI:** *All of them.* The **"Ticket" button lives in the shared topbar** ([`DashboardLayout.jsx:249`](../../resources/js/components/layout/DashboardLayout.jsx#L249) — rendered for every non-lead user), so admin + all 5 department portals can raise tickets. The **admin triage board** is admin-only (`/admin/system-tickets`, "System Tickets" sidebar item at [`AdminLayout.jsx:49`](../../resources/js/components/layout/AdminLayout.jsx#L49)). Each department portal has a **"My Tickets"** sidebar item → `/portal/tickets`.

> ⚠️ **Naming caution:** there is an unrelated `Concern` model (staging's renamed "Complaint" for accommodation) — *not* part of this system. "Ticket" = `SystemTicket` only.

---

## Section 2 — Ticket data model

**One table: `system_tickets`.** No related tables (no comments, attachments, status-history, or watchers).

```
id               bigint PK
ticket_ref       varchar  unique      # auto "TKT-XXXXXX" (Str::random(6), set in Model::booted creating)
title            varchar
description       text
category         varchar(20) default 'change'   # change | feature | bug | other
priority         varchar(20) default 'normal'   # low | normal | high | urgent
status           varchar(20) default 'open'     # open | in_review | planned | in_progress | done | declined
submitted_by     bigint FK users NULL nullOnDelete
department       varchar(40) NULL               # ← submitter's role at submit time (see §5)
admin_response   text NULL                       # single free-text reply from admin
resolved_by      bigint FK users NULL nullOnDelete
resolved_at      timestamp NULL
created_at/updated_at, deleted_at (softDeletes)
INDEX (status, department)
```

**Model** ([`SystemTicket.php`](../../app/Models/SystemTicket.php)):
- Traits: `LogsActivity` (audit — see §7), `SoftDeletes`.
- Relations: `submitter()` → `belongsTo(User, submitted_by)`, `resolver()` → `belongsTo(User, resolved_by)`.
- Scope: `scopeOpen()` = `whereNotIn('status', ['done','declined'])`.
- **"Enums" are PHP class constants, not DB enums** — `CATEGORIES`, `PRIORITIES`, `STATUSES`. The DB columns are plain `varchar` with string defaults; validation enforces membership (`Rule::in`).
- Static `dashboardSummary()` — open count + latest 3 open, for the dashboard widget.
- Casts: only `resolved_at => datetime`.
- **No encrypted fields; no sensitive/PII data** (free-text title/description only).

---

## Section 3 — Ticket lifecycle

**Create:** `RequestTicketButton` (topbar) → `POST /tickets` → `store()`.
- **Who:** any authenticated staff member; `abort_if($user->isLead(), 403)` blocks external lead-portal users.
- Validates `title` (≤160), `description` (≤5000), `category` (in CATEGORIES), `priority` (nullable).
- Side effects on create ([`store()`](../../app/Http/Controllers/SystemTicketController.php#L31)): sets `status='open'`, `submitted_by=user->id`, **`department = $user->role`**, then **notifies every `admin` + `super_admin`** via `TicketSubmitted` (database channel). Also writes an `activity_logs` row (LogsActivity).

**Edit:** Only via the admin board `adminUpdate()`. **Only `status` + `admin_response` are editable** — title/description/category/priority/department are immutable after creation, and the submitter cannot edit their own ticket. Editor must be admin/super-admin (route middleware).

**Reassign:** ❌ No concept of assignment/reassignment. `resolved_by` is stamped automatically when a ticket is closed; there is no "assignee".

**Close:** `adminUpdate()` — setting status to `done` or `declined` stamps `resolved_by = current admin` + `resolved_at = now()`; any other status clears them. So "close" is just a status value, done by an admin.

**Statuses & transitions:** `open → in_review → planned → in_progress → done → declined`. **No state machine** — the drawer's `<select>` lets an admin jump to *any* status directly; there are no guarded transitions.

**Automation:** ❌ None. No auto-assign, no auto-close, no escalation, no SLA timers, no reminders.

---

## Section 4 — Current UI

### Admin triage board — `admin/SystemTickets.jsx`
- **Header:** "System Tickets" (Ticket icon) + open-count pill ("N open").
- **Status tabs:** `All` + the 6 statuses (`STATUS_META` labels/colors) — [line 51](../../resources/js/pages/admin/SystemTickets.jsx#L51). Clicking sets `?status=` via `router.get`.
- **Search box** (top-right): title / description / ticket_ref (`?search=`).
- **Table columns:** `Request` (title + priority text), `Department`, `Type` (category), `Status` (colored chip), `Submitted` (date). No checkbox column.
- **Ordering:** open/active first, then newest (`CASE WHEN status IN ('done','declined')…`, then `created_at DESC`).
- **Pagination:** yes — Laravel paginator, **20/page** (`Pagination` component). No column sorting.
- **Row click → `TicketDrawer`** (right slide-over): shows ref · department · submitter, full description, a **status `<select>`**, and a **"Response to the department" textarea**, with a **"Save & notify department"** button → `POST /admin/system-tickets/{id}`.
- **Bulk / quick actions:** ❌ none (no bulk close, no inline status change from the row).

### Staff "My Tickets" — `tickets/MyTickets.jsx`
- Lists the current user's own tickets (cards): title, category, priority, **status chip**, the **admin's reply** (if any), raised/closed dates, ticket_ref. Open-count pill; empty state; a header **"Ticket"** button that opens the same raise-a-ticket modal. Paginated **15/page**. Read-only (no edit).

### Raise-a-ticket modal — `RequestTicketButton.jsx`
- Topbar "🛟 Ticket" button (icon-only on mobile). Modal fields: **Title, Type (category), Priority, Details**. Posts to `/tickets`, toasts success. That's the *only* creation surface.

### Dashboard widget — `OpenRequestsCard.jsx`
- On the admin + super-admin dashboards: open count + latest 3 open tickets + "View all →" link to the board.

---

## Section 5 — Current routing / department awareness  *(most important)*

- **Is there a department concept?** Partially — there is a **`department` column**, but it is **populated with the submitter's own role** at submit time (`'department' => $user->role`, [`store()`](../../app/Http/Controllers/SystemTicketController.php#L36)). It answers *"who raised this?"*, **not** *"who should handle this?"*. There is **no target/assigned department, no category-of-team, no tags, no watchers.**
- **`category`** = change/feature/bug/other (nature of the request), unrelated to any team.
- **How do tickets reach the right people today?** They all go to **one audience: admins + super-admins.** Every admin sees every ticket on the shared board. There is no fan-out to Sales/Immigration/etc. — a department can only *raise* requests and see *their own* under "My Tickets"; they never receive other departments' tickets.
- **Notification on creation:** yes — `TicketSubmitted` to **admins + super-admins only** (database bell). No department is notified.
- **Any existing department segmentation?** The board's **backend `adminIndex()` accepts a `?department=` query filter** ([line ~112](../../app/Http/Controllers/SystemTicketController.php#L108)) and the `(status, department)` index exists — **but the UI never exposes a department filter or tabs** (only status tabs + search). So the plumbing to filter by the *submitter's* department is half-present; routing to a *target* department does not exist at all.
- **Edge case:** `department` stores the raw role string, so `immigration_manager` / `immigration_adviser` are distinct values from `immigration` — a naive `?department=immigration` filter would miss them.

---

## Section 6 — Roles and permissions

| Action | Route middleware | In-controller gate | Effective access |
|---|---|---|---|
| Raise ticket (`store`) | `auth` | `abort_if(isLead)` | Any staff (all roles except external `lead`) |
| My tickets (`myTickets`) | `auth` | `abort_if(isLead)`; admins/super redirect to board | Any staff; admins bounce to the board |
| Board (`adminIndex`) | `portal:admin` | — | `admin` + `super_admin` (super satisfies `portal:admin` via `canAccessPortal`) |
| Update ticket (`adminUpdate`) | `portal:admin` | — | `admin` + `super_admin` |

- The board is **not** role-scoped beyond admin — every admin sees **all** tickets regardless of department.
- **No `TicketPolicy`** (or any policy) exists — access is enforced purely by route middleware + the inline `isLead()` check. `grep -ri "TicketPolicy\|Gate::.*ticket"` → none.

---

## Section 7 — Comments, attachments, activity

- **Comments:** ❌ No comment thread. The only reply mechanism is the **single `admin_response` text field** (one admin reply, overwritten on each save). Submitters cannot reply.
- **Attachments:** ❌ None (no file columns, no upload endpoint).
- **Per-ticket activity log:** The model uses the **`LogsActivity` trait**, so create/update write rows to the global `activity_logs` table (audit trail exists at the data layer). **However, that activity is not surfaced anywhere in the ticket UI** — there's no per-ticket history view. Status changes/edits are only implicitly visible via the current `status` + `resolved_at`.
- **Visibility:** the admin board (with `admin_response`) is admin-only; the submitter sees the response on their "My Tickets" page. No shared/threaded conversation.

---

## Section 8 — Notifications

| Notification | Trigger | Recipients | Channel |
|---|---|---|---|
| `TicketSubmitted` | ticket created (`store`) | **all `admin` + `super_admin`** | `database` only |
| `TicketUpdated` | admin saves status/response (`adminUpdate`) | **the submitter** | `database` only |

- Both use `Illuminate\Notifications\Notification` with the **`Queueable`** trait but **not `ShouldQueue`** → they dispatch **synchronously** in-request.
- Both are wired into the shared bell via **`NotificationFormatter`** ([lines 63-72](../../app/Support/NotificationFormatter.php#L63)): `TicketSubmitted` → icon `Ticket`, color **amber**; `TicketUpdated` → icon `Ticket`, color **blue**. Frontend `NotificationBell.jsx` + `notifications/Index.jsx` already import the `Ticket` icon.
- **No email, no SMS.** Delivery is **on-demand refresh** — the bell fetches `/api/notifications/recent`; there is no websocket/push. `link`: `TicketSubmitted` → `/admin/system-tickets`; `TicketUpdated` → `null` (no deep link).

---

## Section 9 — Integration with the rest of the CRM

- **References a lead/case/CRM entity?** ❌ No. `system_tickets` has no `lead_id`/`case_id`/morph columns. Tickets are standalone system-improvement requests, not tied to any customer record.
- **Shared infrastructure:** uses the **notification bell + `NotificationFormatter`** (Build 3) and the **shared topbar** (`DashboardLayout`). It does **not** use `CommunicationService`, `MessageTemplate`, or `message_logs` (that's the lead-facing comms stack).
- **Automatic ticket creation:** ❌ None. System errors, failed jobs, and **AI critical alerts** (`AiCriticalLeadAlert` / `AiCriticalCaseAlert`) are separate **notifications**, not tickets. Nothing in the codebase calls `SystemTicket::create` except the `store()` endpoint. (`grep -rn "SystemTicket::create"` → only the controller.)

---

## Section 10 — Existing tests

**One file:** [`tests/Feature/Tickets/SystemTicketTest.php`](../../tests/Feature/Tickets/SystemTicketTest.php) — **12 tests**, PHPUnit + `RefreshDatabase`:

| Test | Behavior |
|---|---|
| `test_staff_can_submit_a_ticket` | sales user → `POST /tickets` creates row (`department='sales'`, `TKT-` ref) |
| `test_submission_notifies_admins_and_super_admins` | `TicketSubmitted` sent to admin + super_admin, **not** to the submitter |
| `test_lead_cannot_submit` | lead role → 403 |
| `test_validation_requires_title_description_category` | 422 on missing fields |
| `test_admin_can_list_all_tickets` | admin GET board → Inertia `admin/SystemTickets` with data |
| `test_super_admin_can_access_board` | super_admin → 200 |
| `test_non_admin_cannot_access_board` | sales → 403 |
| `test_staff_see_only_their_own_tickets` | `/portal/tickets` scoped to submitter |
| `test_my_tickets_redirects_admins_to_the_board` | admin → redirect `/admin/system-tickets` |
| `test_lead_cannot_view_my_tickets` | lead → 403 |
| `test_admin_update_changes_status_and_notifies_submitter` | status→in_progress, response saved, `TicketUpdated` to submitter |
| `test_resolving_stamps_resolver_and_time` | status=done stamps `resolved_by`/`resolved_at` |

**Tests that would need changing for the redesign:**
- `test_staff_can_submit_a_ticket` asserts `department = 'sales'` (submitter's role). If `department` is repurposed as a **routing target**, this assertion + the store payload change.
- `test_submission_notifies_admins_and_super_admins` — if creation should also/instead notify a *target department*, this needs new assertions (and probably `Notification::assertSentTo` for the target-dept users).
- No test currently covers a department filter/tab or department routing (they don't exist), so those are net-new.

---

## Section 11 — Gaps identified (today vs. redesign target)

| Feature needed | Exists today? | What it would take |
|---|---|---|
| Department field on ticket (as a **routing target**) | ⚠️ **Partial** — a `department` column exists but holds the **submitter's role**, not a target | Add a distinct `target_department` (or repurpose `department` + add `submitted_by`-derived origin), migration + form field in `RequestTicketButton` |
| Notify a **specific department** when a ticket is created | ❌ No — only admins/super-admins are notified | New notification fan-out to users whose role matches the target department (reuse the `TicketSubmitted` pattern + a recipients-by-role query) |
| **UI tabs per department** on the ticket list | ❌ No — only status tabs on the admin board | Add department tabs to `admin/SystemTickets.jsx` (backend `?department=` filter already exists; UI + counts are new). For non-admins seeing "their department's" tickets, a **new department-scoped index** + route is needed |
| **Filter tickets by department** | ⚠️ Backend only — `adminIndex()` honors `?department=`, but no UI control | Surface a department filter/tab; handle the `immigration_manager/adviser` alias problem |
| **"Needs my attention" indicator** for a department | ❌ No — no per-department view, badge, or count | Sidebar badge (like the existing `sidebarBadges`) counting open tickets targeted at the viewer's department; requires a department-scoped query + a department-visible ticket list |
| Department staff can **see/action** tickets routed to them | ❌ No — only admins triage; departments see only their **own submissions** | New role-scoped board (or open the admin board to department roles for their department), plus who-can-update rules |
| Per-ticket **comment thread** (for back-and-forth) | ❌ No — single `admin_response` only | New `system_ticket_comments` table + UI (out of stated scope, but the "announce to a department" flow may want a reply path) |
| **Assignment / assignee** | ❌ No — only `resolved_by` auto-stamp | New `assigned_to` (user) + assignment UI/notification, if routing-to-a-person is wanted |
| Email/real-time notification | ❌ Database bell only, on-demand | Add mail channel and/or broadcast if "notified it needs attention" must be push |

---

## Section 12 — Confidence and gaps

**High confidence (read the code directly):**
- §1 location, §2 data model (migration + model read in full), §3 lifecycle, §5 department semantics, §6 permissions, §8 notifications, §9 integration, §10 tests — all verified against source.
- §4 UI verified by reading `admin/SystemTickets.jsx` (table head, tabs, drawer, pagination), `RequestTicketButton.jsx`, `MyTickets.jsx`, and layout wiring.

**Inferred / lower confidence:**
- The **visual "screenshot-by-text"** descriptions are reconstructed from the JSX/Tailwind classes, not a running render.
- **Notification delivery timing** — inferred synchronous from `Queueable` without `ShouldQueue`; not exercised against a live queue.
- **`activity_logs` writes** — inferred from the `LogsActivity` trait being present; I did not trace the exact columns it writes for a ticket event.

**Not investigated / out of scope:**
- The unrelated `Concern` (accommodation) model beyond confirming it's separate.
- Whether any **staging-side** ticket changes existed pre-merge (this reflects the current `full_blown` tree only).
- Load/performance of the board at scale (paginated at 20, no obvious N+1 — `submitter`/`resolver` are eager-loaded).

**Surprises (not on the checklist):**
- The **`department` column is a decoy for the redesign** — it looks like routing support but is the submitter's role. Reusing it as a target could quietly break the existing "My Tickets" semantics and one test.
- The **backend already filters by `?department=`** even though no UI uses it — a small head-start for per-department tabs.
- **Naming collision risk**: "Ticket" (topbar) = `SystemTicket`; the separate accommodation **`Concern`** model is easy to confuse in search. Keep them distinct in the redesign.
- Both notifications are **`database`-only and link-thin** (`TicketUpdated.link = null`), so "announce to a department" will need new notification classes, not just a recipient tweak.

---

### One-paragraph summary
The System Tickets feature is a **working staff→admin change-request board**: any non-lead staffer raises a ticket from the shared topbar (`title/category/priority/description`), it's stored in `system_tickets`, and **all admins/super-admins** get a bell notification and triage it (status + a single `admin_response`) from `/admin/system-tickets`; the submitter is notified back and sees it under "My Tickets". It has **no true departmental routing**: the `department` column records *who submitted*, notifications reach *only admins*, and there are **no department tabs, no department-scoped visibility, no per-department notification, and no assignment/comments/attachments**. The redesign's per-department tabs + routing + "needs attention" notifications are therefore **mostly greenfield**, with two small head-starts (an existing `?department=` backend filter and the `(status, department)` index) and two traps (the `department`-means-submitter semantics and the `immigration_manager/adviser` role-alias problem).
