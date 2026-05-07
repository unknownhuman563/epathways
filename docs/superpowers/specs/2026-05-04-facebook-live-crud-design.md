# Facebook Live Sessions CRUD — Design

**Date:** 2026-05-04
**Status:** Approved for implementation

## Summary

Add admin CRUD for Facebook Live sessions on the Activities page. Past and upcoming sessions are derived automatically from a `session_date` field. One row may be marked as the "featured" upcoming session, which renders in the hero card on `/activities`. The public `FacebookLive` component switches from a hardcoded array to data driven by these records.

## Goals

- Admins can create, edit, delete Facebook Live session entries.
- Public Activities page reflects those entries: a featured upcoming card and a grid of past sessions.
- Past vs upcoming is self-maintaining (date-driven) so admins don't have to flip flags as time passes.

## Non-goals

- No host or mode (online/in-person) input fields. The "Host: ePathways team" and "Online" labels remain static display copy in the UI.
- No bulk import, scheduling, or notifications.
- No public detail page per session — the FB link is the destination.
- No upcoming-sessions grid on the public page beyond the single featured card.

## Data model

New table `facebook_live_sessions`:

| Column | Type | Notes |
|---|---|---|
| `id` | `bigIncrements` | PK |
| `title` | `string(255)` | required |
| `description` | `text` | required |
| `fb_link` | `string(500)` | required, validated as URL |
| `image` | `string`, nullable | path on `public` disk |
| `session_date` | `date` | required; drives past vs upcoming |
| `is_featured` | `boolean`, default `false` | only one upcoming row should be true |
| `created_at` / `updated_at` | timestamps | |

Model: `App\Models\FacebookLiveSession`.

- Casts: `session_date => date`, `is_featured => boolean`.
- Accessor `image_url`: `Storage::disk('public')->url($image)` when `image` is set, else `null`. Appended via controller (matches `ProgramController` pattern).

## Backend

### `FacebookLiveController` (new)

Mirrors `ProgramController` style.

- `index()` — returns all rows ordered by `session_date desc` to `Admin/FacebookLive`.
- `store(Request $request)` — validate, handle image upload to `facebook-live/images` on `public` disk, enforce single-featured invariant, create.
- `update(Request $request, $id)` — same as store; replace image (deleting prior file) only if a new file is uploaded.
- `destroy($id)` — delete image file if present, delete row.

**Single-featured invariant** — when the incoming payload sets `is_featured = true`:

```php
DB::transaction(function () use ($id, &$validated) {
    FacebookLiveSession::where('is_featured', true)
        ->when($id, fn ($q) => $q->where('id', '!=', $id))
        ->update(['is_featured' => false]);
    // then create or update with $validated
});
```

Race conditions are acceptable for an admin-only tool.

### Validation rules

```
title:        required|string|max:255
description:  required|string
fb_link:      required|url|max:500
image:        nullable|image|mimes:jpeg,png,jpg,webp|max:4096
session_date: required|date
is_featured:  sometimes|boolean
```

Unchecked checkboxes are not sent in form submissions, so `is_featured` defaults to `false` in the controller before persisting (`$validated['is_featured'] = $request->boolean('is_featured')`).

### `EventController@activities` extension

Currently passes `events` to `Activities` page. Add:

- `pastSessions` — `FacebookLiveSession::whereDate('session_date', '<', today())->orderBy('session_date', 'desc')->get()` with `image_url` appended.
- `featuredSession` — `FacebookLiveSession::whereDate('session_date', '>=', today())` `->orderBy('is_featured', 'desc')->orderBy('session_date', 'asc')->first()` with `image_url` appended (so explicitly featured wins; otherwise earliest upcoming).

Both serialized as plain arrays with the `image_url` accessor present.

### Routes (`routes/web.php`)

Inside the existing `Route::middleware(['auth'])->group(...)`:

```php
Route::get('/admin/facebook-live',         [FacebookLiveController::class, 'index'])->name('admin.facebook-live');
Route::post('/admin/facebook-live',        [FacebookLiveController::class, 'store']);
Route::post('/admin/facebook-live/{id}',   [FacebookLiveController::class, 'update']);
Route::delete('/admin/facebook-live/{id}', [FacebookLiveController::class, 'destroy']);
```

Update uses POST (not PUT) because Inertia file uploads need multipart — same convention as `/admin/programs/{id}`.

## Frontend — Admin

### New page: `resources/js/pages/Admin/FacebookLive.jsx`

Visual language matches `Admin/Programs.jsx`. Receives `sessions` prop.

- Header with **Add Session** button.
- Two tabs: **Upcoming** (`session_date >= today` in browser TZ) and **Past** (`session_date < today`). Default tab: Upcoming.
- Card grid: thumbnail, title, formatted date, "Featured" badge if `is_featured && upcoming`, edit/delete actions.
- Modal form with:
  - **Title** (text, required)
  - **Description** (textarea, required)
  - **Facebook Link** (URL, required)
  - **Picture** (file, optional — preview existing on edit)
  - **Date** (date picker, required)
  - **Mark as featured** (checkbox; visible only when the chosen date is today or later, since featured is meaningful only for upcoming)
- Delete uses a confirmation modal (mirroring Programs pattern).
- `useForm` from Inertia for state + validation errors. POST with `forceFormData: true` for file upload.

### `AdminLayout.jsx` — sidebar nav

Add an entry to `navItems`:

```js
{ name: "Facebook Live", href: "/admin/facebook-live", icon: <Video size={20} /> }
```

(`Video` from `lucide-react`; final icon choice flexible.)

## Frontend — Public

### `resources/js/pages/Activities.jsx`

Update destructured props from controller:

```jsx
export default function Activities({ events, pastSessions, featuredSession }) {
  // ...
  <FacebookLive pastSessions={pastSessions} featuredSession={featuredSession} />
}
```

### `resources/js/components/FacebookLive.jsx`

Refactor from hardcoded arrays to props.

- Accept `{ pastSessions = [], featuredSession = null }`.
- Featured Session card:
  - Renders only when `featuredSession` is non-null.
  - Title ← `featuredSession.title`.
  - Date ← formatted from `featuredSession.session_date` ISO string via `Intl.DateTimeFormat` (e.g., "Sat 10 Feb 2024").
  - Mode label stays static "Online".
  - Host stays static "ePathways team".
  - Details paragraph ← `featuredSession.description`.
  - "Watch replay" anchor → `featuredSession.fb_link` (`target="_blank"`, `rel="noopener noreferrer"`).
  - Image ← `featuredSession.image_url` (with a sensible placeholder fallback).
- Past Sessions grid:
  - Iterates over `pastSessions`.
  - Each card: image (or placeholder), formatted date, title, description, `fb_link` for "Watch now".
  - Hide the entire "Past sessions" section when the array is empty.

### Date formatting helper

Inline in `FacebookLive.jsx`:

```js
const formatSessionDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
};
```

## Storage

- Images saved to `storage/app/public/facebook-live/images/` via the `public` disk.
- Requires `php artisan storage:link` (already present in this project per existing Program image flow).

## Files touched

**New:**
- `database/migrations/2026_05_04_xxxxxx_create_facebook_live_sessions_table.php`
- `app/Models/FacebookLiveSession.php`
- `app/Http/Controllers/FacebookLiveController.php`
- `resources/js/pages/Admin/FacebookLive.jsx`

**Edited:**
- `routes/web.php` — add 4 admin routes
- `app/Http/Controllers/EventController.php` — extend `activities()` props
- `resources/js/pages/Activities.jsx` — receive + pass props
- `resources/js/components/FacebookLive.jsx` — props-driven render
- `resources/js/components/AdminLayout.jsx` — sidebar nav entry

## Open considerations / accepted trade-offs

- **Single-featured invariant** is enforced in PHP, not at the DB level. Acceptable for low-traffic admin writes.
- **Featured fallback** to "earliest upcoming" prevents an empty hero when admins forget to set `is_featured`.
- **Past sessions empty state** — hide the entire "Past sessions" section if the array is empty, rather than show a placeholder.
- **No timezone correction** — server-side filter uses Laravel's `today()`, browser-side filter uses `new Date()`. Mismatch only at the midnight boundary, immaterial for this UI.
