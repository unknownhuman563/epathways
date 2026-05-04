# Facebook Live CRUD — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Note on commits:** This plan deliberately contains no `git add` / `git commit` steps. Implementers must NOT stage or commit changes — leave all modifications unstaged. The user will commit manually when ready.

**Goal:** Add an admin CRUD for Facebook Live sessions and switch the public Activities page from hardcoded data to DB-driven, with auto past/upcoming separation by date plus an `is_featured` flag for the hero card.

**Architecture:** Single Laravel resource (`facebook_live_sessions`) following the existing `ProgramController` + `Admin/Programs.jsx` pattern. Past vs upcoming is computed from `session_date`; one row may carry `is_featured = true` (enforced single via controller transaction). Public `FacebookLive` component refactored to render from props passed by `EventController@activities`.

**Tech Stack:** Laravel 12, Inertia.js, React 19, TailwindCSS 4, MySQL, PHPUnit (backend tests). No JS test framework wired up — frontend changes are verified manually.

**Spec:** `docs/superpowers/specs/2026-05-04-facebook-live-crud-design.md`

---

## File Structure

**Create:**
- `database/migrations/2026_05_04_120000_create_facebook_live_sessions_table.php`
- `app/Models/FacebookLiveSession.php`
- `app/Http/Controllers/FacebookLiveController.php`
- `tests/Feature/FacebookLiveControllerTest.php`
- `resources/js/pages/Admin/FacebookLive.jsx`

**Modify:**
- `routes/web.php` — add 4 admin routes inside the existing `auth` middleware group
- `app/Http/Controllers/EventController.php` — extend `activities()` to load FB live data
- `resources/js/components/AdminLayout.jsx:13-19` — add "Facebook Live" nav entry
- `resources/js/components/FacebookLive.jsx` — convert from hardcoded data to props
- `resources/js/pages/Activities.jsx` — receive new props and pass them to `<FacebookLive />`

---

## Task 1: Migration and Model

**Files:**
- Create: `database/migrations/2026_05_04_120000_create_facebook_live_sessions_table.php`
- Create: `app/Models/FacebookLiveSession.php`

- [ ] **Step 1: Create the migration file**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facebook_live_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('fb_link', 500);
            $table->string('image')->nullable();
            $table->date('session_date');
            $table->boolean('is_featured')->default(false);
            $table->timestamps();

            $table->index('session_date');
            $table->index('is_featured');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facebook_live_sessions');
    }
};
```

- [ ] **Step 2: Run the migration**

Run: `php artisan migrate`
Expected: `INFO  Running migrations.` followed by `... 2026_05_04_120000_create_facebook_live_sessions_table ........ DONE`

- [ ] **Step 3: Create the model**

`app/Models/FacebookLiveSession.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class FacebookLiveSession extends Model
{
    protected $fillable = [
        'title',
        'description',
        'fb_link',
        'image',
        'session_date',
        'is_featured',
    ];

    protected $casts = [
        'session_date' => 'date',
        'is_featured'  => 'boolean',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        return $this->image
            ? Storage::disk('public')->url($this->image)
            : null;
    }
}
```

- [ ] **Step 4: Verify the model loads**

Run: `php artisan tinker --execute="echo App\Models\FacebookLiveSession::class;"`
Expected output: `App\Models\FacebookLiveSession`

---

## Task 2: Controller skeleton + auth/index tests

**Files:**
- Create: `app/Http/Controllers/FacebookLiveController.php`
- Create: `tests/Feature/FacebookLiveControllerTest.php`
- Modify: `routes/web.php` (add only `index` route for now)

- [ ] **Step 1: Add the index route**

In `routes/web.php`, inside the existing `Route::middleware(['auth'])->group(function () { ... })` block, add (next to the existing `/admin/programs` lines):

```php
    Route::get('/admin/facebook-live', [App\Http\Controllers\FacebookLiveController::class, 'index'])->name('admin.facebook-live');
```

- [ ] **Step 2: Write the failing tests**

Create `tests/Feature/FacebookLiveControllerTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\FacebookLiveSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FacebookLiveControllerTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create();
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title'        => 'Visa interview tips',
            'description'  => 'Prepare for your visa interview with confidence.',
            'fb_link'      => 'https://www.facebook.com/share/v/AbCdEf123/',
            'session_date' => now()->subWeek()->toDateString(),
            'is_featured'  => false,
        ], $overrides);
    }

    public function test_admin_index_requires_auth(): void
    {
        $this->get('/admin/facebook-live')->assertRedirect('/login');
    }

    public function test_admin_can_list_sessions(): void
    {
        FacebookLiveSession::create($this->payload());

        $response = $this->actingAs($this->admin())->get('/admin/facebook-live');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/FacebookLive')
            ->has('sessions', 1)
        );
    }
}
```

- [ ] **Step 3: Run the tests to confirm they fail**

Run: `php artisan test --filter=FacebookLiveControllerTest`
Expected: both tests fail with `Target class [App\Http\Controllers\FacebookLiveController] does not exist.` or similar.

- [ ] **Step 4: Create the controller with index**

`app/Http/Controllers/FacebookLiveController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\FacebookLiveSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class FacebookLiveController extends Controller
{
    private function rules(): array
    {
        return [
            'title'        => 'required|string|max:255',
            'description'  => 'required|string',
            'fb_link'      => 'required|url|max:500',
            'image'        => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
            'session_date' => 'required|date',
            'is_featured'  => 'sometimes|boolean',
        ];
    }

    public function index()
    {
        $sessions = FacebookLiveSession::orderBy('session_date', 'desc')->get();

        return inertia('Admin/FacebookLive', ['sessions' => $sessions]);
    }
}
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `php artisan test --filter=FacebookLiveControllerTest`
Expected: 2 passing.

---

## Task 3: Store with image upload

**Files:**
- Modify: `app/Http/Controllers/FacebookLiveController.php`
- Modify: `routes/web.php`
- Modify: `tests/Feature/FacebookLiveControllerTest.php`

- [ ] **Step 1: Add the store route**

In `routes/web.php` (inside the same `auth` group), under the new `/admin/facebook-live` GET line:

```php
    Route::post('/admin/facebook-live', [App\Http\Controllers\FacebookLiveController::class, 'store']);
```

- [ ] **Step 2: Write the failing tests**

Append inside `FacebookLiveControllerTest`:

```php
    public function test_admin_can_create_session_with_image(): void
    {
        Storage::fake('public');

        $payload = $this->payload();
        $payload['image'] = UploadedFile::fake()->create('cover.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->admin())->post('/admin/facebook-live', $payload);

        $response->assertRedirect();
        $this->assertDatabaseHas('facebook_live_sessions', ['title' => 'Visa interview tips']);
        $session = FacebookLiveSession::first();
        $this->assertNotNull($session->image);
        Storage::disk('public')->assertExists($session->image);
    }

    public function test_admin_create_validates_required_fields(): void
    {
        $response = $this->actingAs($this->admin())->post('/admin/facebook-live', []);

        $response->assertSessionHasErrors(['title', 'description', 'fb_link', 'session_date']);
    }

    public function test_admin_create_validates_fb_link_is_url(): void
    {
        $response = $this->actingAs($this->admin())
            ->post('/admin/facebook-live', $this->payload(['fb_link' => 'not-a-url']));

        $response->assertSessionHasErrors(['fb_link']);
    }
```

- [ ] **Step 3: Run the tests to confirm they fail**

Run: `php artisan test --filter=FacebookLiveControllerTest`
Expected: 3 new tests fail (no `store` method).

- [ ] **Step 4: Implement `store`**

Add to `FacebookLiveController` (after `index`):

```php
    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());
        $validated['is_featured'] = $request->boolean('is_featured');

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('facebook-live/images', 'public');
        }

        DB::transaction(function () use ($validated) {
            if ($validated['is_featured']) {
                FacebookLiveSession::where('is_featured', true)->update(['is_featured' => false]);
            }
            FacebookLiveSession::create($validated);
        });

        return redirect()->back()->with('success', 'Session created successfully.');
    }
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `php artisan test --filter=FacebookLiveControllerTest`
Expected: 5 passing.

---

## Task 4: Update with image lifecycle

**Files:**
- Modify: `app/Http/Controllers/FacebookLiveController.php`
- Modify: `routes/web.php`
- Modify: `tests/Feature/FacebookLiveControllerTest.php`

- [ ] **Step 1: Add the update route**

In `routes/web.php`:

```php
    Route::post('/admin/facebook-live/{id}', [App\Http\Controllers\FacebookLiveController::class, 'update']);
```

(POST not PUT — Inertia file uploads need multipart, matching the `/admin/programs/{id}` convention.)

- [ ] **Step 2: Write the failing tests**

Append inside `FacebookLiveControllerTest`:

```php
    public function test_admin_can_update_session(): void
    {
        $session = FacebookLiveSession::create($this->payload());

        $response = $this->actingAs($this->admin())
            ->post('/admin/facebook-live/'.$session->id, $this->payload(['title' => 'Updated title']));

        $response->assertRedirect();
        $this->assertDatabaseHas('facebook_live_sessions', ['id' => $session->id, 'title' => 'Updated title']);
    }

    public function test_admin_update_keeps_existing_image_when_no_new_file(): void
    {
        Storage::fake('public');
        $session = FacebookLiveSession::create($this->payload(['image' => 'facebook-live/images/old.jpg']));
        Storage::disk('public')->put('facebook-live/images/old.jpg', 'fake');

        $this->actingAs($this->admin())
            ->post('/admin/facebook-live/'.$session->id, $this->payload(['title' => 'Renamed']));

        $session->refresh();
        $this->assertSame('facebook-live/images/old.jpg', $session->image);
    }

    public function test_admin_update_replaces_image_and_deletes_old_file(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('facebook-live/images/old.jpg', 'fake');
        $session = FacebookLiveSession::create($this->payload(['image' => 'facebook-live/images/old.jpg']));

        $payload = $this->payload();
        $payload['image'] = UploadedFile::fake()->create('new.jpg', 100, 'image/jpeg');

        $this->actingAs($this->admin())
            ->post('/admin/facebook-live/'.$session->id, $payload);

        $session->refresh();
        Storage::disk('public')->assertMissing('facebook-live/images/old.jpg');
        $this->assertNotSame('facebook-live/images/old.jpg', $session->image);
        Storage::disk('public')->assertExists($session->image);
    }
```

- [ ] **Step 3: Run the tests to confirm they fail**

Run: `php artisan test --filter=FacebookLiveControllerTest`
Expected: 3 new tests fail (no `update` method).

- [ ] **Step 4: Implement `update`**

Add to `FacebookLiveController`:

```php
    public function update(Request $request, $id)
    {
        $session = FacebookLiveSession::findOrFail($id);
        $validated = $request->validate($this->rules());
        $validated['is_featured'] = $request->boolean('is_featured');

        if ($request->hasFile('image')) {
            if ($session->image) {
                Storage::disk('public')->delete($session->image);
            }
            $validated['image'] = $request->file('image')->store('facebook-live/images', 'public');
        } else {
            unset($validated['image']);
        }

        DB::transaction(function () use ($session, $validated) {
            if ($validated['is_featured']) {
                FacebookLiveSession::where('is_featured', true)
                    ->where('id', '!=', $session->id)
                    ->update(['is_featured' => false]);
            }
            $session->update($validated);
        });

        return redirect()->back()->with('success', 'Session updated successfully.');
    }
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `php artisan test --filter=FacebookLiveControllerTest`
Expected: 8 passing.

---

## Task 5: Destroy with image cleanup

**Files:**
- Modify: `app/Http/Controllers/FacebookLiveController.php`
- Modify: `routes/web.php`
- Modify: `tests/Feature/FacebookLiveControllerTest.php`

- [ ] **Step 1: Add the destroy route**

In `routes/web.php`:

```php
    Route::delete('/admin/facebook-live/{id}', [App\Http\Controllers\FacebookLiveController::class, 'destroy']);
```

- [ ] **Step 2: Write the failing test**

Append inside `FacebookLiveControllerTest`:

```php
    public function test_admin_can_delete_session_and_image(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('facebook-live/images/x.jpg', 'fake');
        $session = FacebookLiveSession::create($this->payload(['image' => 'facebook-live/images/x.jpg']));

        $response = $this->actingAs($this->admin())->delete('/admin/facebook-live/'.$session->id);

        $response->assertRedirect();
        $this->assertDatabaseMissing('facebook_live_sessions', ['id' => $session->id]);
        Storage::disk('public')->assertMissing('facebook-live/images/x.jpg');
    }
```

- [ ] **Step 3: Run the test to confirm it fails**

Run: `php artisan test --filter=FacebookLiveControllerTest::test_admin_can_delete_session_and_image`
Expected: fails (no `destroy` method).

- [ ] **Step 4: Implement `destroy`**

Add to `FacebookLiveController`:

```php
    public function destroy($id)
    {
        $session = FacebookLiveSession::findOrFail($id);

        if ($session->image) {
            Storage::disk('public')->delete($session->image);
        }

        $session->delete();

        return redirect()->back()->with('success', 'Session deleted successfully.');
    }
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `php artisan test --filter=FacebookLiveControllerTest`
Expected: 9 passing.

---

## Task 6: Single-featured invariant tests

**Files:**
- Modify: `tests/Feature/FacebookLiveControllerTest.php`

The store/update logic already enforces this. We add tests to lock it in.

- [ ] **Step 1: Write the failing tests**

Append inside `FacebookLiveControllerTest`:

```php
    public function test_only_one_session_can_be_featured_on_create(): void
    {
        $existing = FacebookLiveSession::create($this->payload(['is_featured' => true]));

        $this->actingAs($this->admin())
            ->post('/admin/facebook-live', $this->payload([
                'title'       => 'New featured',
                'is_featured' => true,
            ]));

        $existing->refresh();
        $this->assertFalse($existing->is_featured);
        $this->assertSame(1, FacebookLiveSession::where('is_featured', true)->count());
    }

    public function test_only_one_session_can_be_featured_on_update(): void
    {
        $a = FacebookLiveSession::create($this->payload(['title' => 'A', 'is_featured' => true]));
        $b = FacebookLiveSession::create($this->payload(['title' => 'B', 'is_featured' => false]));

        $this->actingAs($this->admin())
            ->post('/admin/facebook-live/'.$b->id, $this->payload([
                'title'       => 'B',
                'is_featured' => true,
            ]));

        $a->refresh();
        $b->refresh();
        $this->assertFalse($a->is_featured);
        $this->assertTrue($b->is_featured);
    }
```

- [ ] **Step 2: Run tests to confirm they pass**

Run: `php artisan test --filter=FacebookLiveControllerTest`
Expected: 11 passing. (The invariant logic is already implemented in store/update — these tests confirm it works.)

---

## Task 7: Wire FB Live data into `EventController@activities`

**Files:**
- Modify: `app/Http/Controllers/EventController.php:242-257`
- Modify: `tests/Feature/FacebookLiveControllerTest.php`

- [ ] **Step 1: Write the failing tests**

Append inside `FacebookLiveControllerTest`:

```php
    public function test_activities_page_separates_past_and_upcoming_sessions(): void
    {
        FacebookLiveSession::create($this->payload([
            'title'        => 'Past session',
            'session_date' => now()->subWeek()->toDateString(),
        ]));
        FacebookLiveSession::create($this->payload([
            'title'        => 'Future session',
            'session_date' => now()->addWeek()->toDateString(),
        ]));

        $response = $this->get('/activities');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Activities')
            ->has('pastSessions', 1)
            ->where('pastSessions.0.title', 'Past session')
            ->where('featuredSession.title', 'Future session')
        );
    }

    public function test_activities_page_prefers_explicitly_featured_upcoming(): void
    {
        FacebookLiveSession::create($this->payload([
            'title'        => 'Earlier upcoming',
            'session_date' => now()->addDay()->toDateString(),
            'is_featured'  => false,
        ]));
        FacebookLiveSession::create($this->payload([
            'title'        => 'Later but featured',
            'session_date' => now()->addMonth()->toDateString(),
            'is_featured'  => true,
        ]));

        $response = $this->get('/activities');

        $response->assertInertia(fn ($page) => $page
            ->where('featuredSession.title', 'Later but featured')
        );
    }

    public function test_activities_page_returns_null_featured_when_no_upcoming(): void
    {
        FacebookLiveSession::create($this->payload([
            'session_date' => now()->subDay()->toDateString(),
        ]));

        $response = $this->get('/activities');

        $response->assertInertia(fn ($page) => $page
            ->where('featuredSession', null)
        );
    }
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `php artisan test --filter=FacebookLiveControllerTest`
Expected: 3 new tests fail — `pastSessions` / `featuredSession` props missing on the Activities page.

- [ ] **Step 3: Update `EventController::activities`**

In `app/Http/Controllers/EventController.php`, locate the `activities()` method (around line 242). Add the import at the top of the file if not present:

```php
use App\Models\FacebookLiveSession;
```

Replace the body of `activities()` with:

```php
    public function activities()
    {
        $events = Event::with('sessions')
            ->whereIn('status', ['upcoming', 'ongoing'])
            ->latest()
            ->get();

        $events->each(function ($event) {
            $event->registration_url = url('/register/' . $event->event_code);
        });

        $today = today()->toDateString();

        $pastSessions = FacebookLiveSession::whereDate('session_date', '<', $today)
            ->orderBy('session_date', 'desc')
            ->get();

        $featuredSession = FacebookLiveSession::whereDate('session_date', '>=', $today)
            ->orderBy('is_featured', 'desc')
            ->orderBy('session_date', 'asc')
            ->first();

        return inertia('Activities', [
            'events'          => $events,
            'pastSessions'    => $pastSessions,
            'featuredSession' => $featuredSession,
        ]);
    }
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `php artisan test --filter=FacebookLiveControllerTest`
Expected: 14 passing total.

---

## Task 8: Add admin sidebar nav entry

**Files:**
- Modify: `resources/js/components/AdminLayout.jsx:1-19`

- [ ] **Step 1: Update the imports**

In `resources/js/components/AdminLayout.jsx`, replace the lucide-react import (currently lines 3-6) with:

```jsx
import {
    Menu, X, Search, Bell, Settings, HelpCircle, LogOut,
    Home, Users, Calendar as CalendarIcon, BookOpen, ChevronDown, GraduationCap, Video
} from "lucide-react";
```

- [ ] **Step 2: Add the nav entry**

Replace the `navItems` array (currently lines 13-19) with:

```jsx
    const navItems = [
        { name: "Dashboard", href: "/admin/dashboard", icon: <Home size={20} /> },
        { name: "Leads", href: "/admin/leads", icon: <Users size={20} /> },
        { name: "Events", href: "/admin/events", icon: <CalendarIcon size={20} /> },
        { name: "Bookings", href: "/admin/booking", icon: <BookOpen size={20} /> },
        { name: "Programs", href: "/admin/programs", icon: <GraduationCap size={20} /> },
        { name: "Facebook Live", href: "/admin/facebook-live", icon: <Video size={20} /> },
    ];
```

---

## Task 9: Build the admin React page

**Files:**
- Create: `resources/js/pages/Admin/FacebookLive.jsx`

This is a single self-contained page. UI patterns mirror `Admin/Programs.jsx` (modal form, `useForm`, image preview).

- [ ] **Step 1: Create the page**

`resources/js/pages/Admin/FacebookLive.jsx`:

```jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Edit2, Trash2, X, Star, Calendar, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
};

const isUpcoming = (iso) => {
    if (!iso) return false;
    return iso >= todayISO();
};

function Label({ children, required }) {
    return (
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            {children}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
    );
}

function Input(props) {
    return (
        <input
            {...props}
            className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all placeholder-gray-400 ${props.className || ''}`}
        />
    );
}

function Textarea(props) {
    return (
        <textarea
            rows={4}
            {...props}
            className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all placeholder-gray-400 resize-y min-h-[100px] ${props.className || ''}`}
        />
    );
}

const blank = () => ({
    title: '',
    description: '',
    fb_link: '',
    image: null,
    session_date: '',
    is_featured: false,
});

function SessionModal({ open, onClose, editing }) {
    const isEdit = !!editing;

    const buildInitial = () => {
        if (!editing) return blank();
        return {
            title: editing.title ?? '',
            description: editing.description ?? '',
            fb_link: editing.fb_link ?? '',
            image: null,
            session_date: editing.session_date
                ? String(editing.session_date).slice(0, 10)
                : '',
            is_featured: !!editing.is_featured,
        };
    };

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm(buildInitial());

    useEffect(() => {
        if (open) {
            reset();
            clearErrors();
            const initial = buildInitial();
            Object.entries(initial).forEach(([k, v]) => setData(k, v));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editing?.id]);

    if (!open) return null;

    const showFeaturedToggle = isUpcoming(data.session_date);

    const submit = (e) => {
        e.preventDefault();
        const url = isEdit ? `/admin/facebook-live/${editing.id}` : '/admin/facebook-live';
        post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {isEdit ? 'Edit session' : 'Add session'}
                    </h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={submit} className="px-6 py-5 space-y-4">
                    <div>
                        <Label required>Title</Label>
                        <Input
                            type="text"
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            placeholder="Visa interview tips"
                        />
                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                    </div>

                    <div>
                        <Label required>Description</Label>
                        <Textarea
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            placeholder="What this session is about..."
                        />
                        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                    </div>

                    <div>
                        <Label required>Facebook link</Label>
                        <Input
                            type="url"
                            value={data.fb_link}
                            onChange={e => setData('fb_link', e.target.value)}
                            placeholder="https://www.facebook.com/share/v/..."
                        />
                        {errors.fb_link && <p className="text-xs text-red-500 mt-1">{errors.fb_link}</p>}
                    </div>

                    <div>
                        <Label required>Session date</Label>
                        <Input
                            type="date"
                            value={data.session_date}
                            onChange={e => setData('session_date', e.target.value)}
                        />
                        {errors.session_date && <p className="text-xs text-red-500 mt-1">{errors.session_date}</p>}
                    </div>

                    <div>
                        <Label>Picture</Label>
                        {isEdit && editing?.image_url && (
                            <img
                                src={editing.image_url}
                                alt={editing.title}
                                className="mb-2 w-32 h-20 object-cover rounded-lg border border-gray-200"
                            />
                        )}
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            onChange={e => setData('image', e.target.files?.[0] ?? null)}
                            className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-900 file:text-white file:text-xs file:font-semibold hover:file:bg-gray-700"
                        />
                        {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image}</p>}
                    </div>

                    {showFeaturedToggle ? (
                        <label className="flex items-center gap-2 select-none cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!data.is_featured}
                                onChange={e => setData('is_featured', e.target.checked)}
                                className="w-4 h-4 accent-gray-900"
                            />
                            <span className="text-sm text-gray-700">Mark as featured (shown in hero card)</span>
                        </label>
                    ) : (
                        <p className="text-[11px] text-gray-400 italic">
                            Featured flag is only available for upcoming sessions.
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-xl disabled:opacity-60"
                        >
                            {processing ? 'Saving...' : (isEdit ? 'Save changes' : 'Create session')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ConfirmDeleteModal({ open, target, onClose, onConfirm }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="text-red-500" size={22} />
                    <h2 className="text-lg font-semibold text-gray-900">Delete session?</h2>
                </div>
                <p className="text-sm text-gray-600 mb-5">
                    Permanently remove <span className="font-semibold">{target?.title}</span>? This can't be undone.
                </p>
                <div className="flex items-center justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

function SessionCard({ session, onEdit, onDelete }) {
    const upcoming = isUpcoming(String(session.session_date).slice(0, 10));
    return (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm">
            <div className="aspect-[16/10] bg-gray-100 relative">
                {session.image_url ? (
                    <img src={session.image_url} alt={session.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No image</div>
                )}
                {upcoming && session.is_featured && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-semibold rounded-full">
                        <Star size={11} /> Featured
                    </span>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 mb-2">
                    <Calendar size={11} /> {formatDate(session.session_date)}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{session.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">{session.description}</p>
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                    <a
                        href={session.fb_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-gray-900 truncate max-w-[60%]"
                    >
                        {session.fb_link}
                    </a>
                    <div className="flex items-center gap-1">
                        <button onClick={() => onEdit(session)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Edit">
                            <Edit2 size={15} />
                        </button>
                        <button onClick={() => onDelete(session)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function FacebookLiveAdmin({ sessions = [] }) {
    const [tab, setTab] = useState('upcoming');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { upcoming, past } = useMemo(() => {
        const u = []; const p = [];
        sessions.forEach(s => {
            const d = String(s.session_date).slice(0, 10);
            (isUpcoming(d) ? u : p).push(s);
        });
        u.sort((a, b) => String(a.session_date).localeCompare(String(b.session_date)));
        p.sort((a, b) => String(b.session_date).localeCompare(String(a.session_date)));
        return { upcoming: u, past: p };
    }, [sessions]);

    const visible = tab === 'upcoming' ? upcoming : past;

    const openCreate = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (s) => { setEditing(s); setModalOpen(true); };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/admin/facebook-live/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    };

    return (
        <AdminLayout>
            <Head title="Facebook Live — Admin" />
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Facebook Live sessions</h2>
                        <p className="text-sm text-gray-500">Manage past and upcoming live sessions shown on the Activities page.</p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-xl shadow-sm"
                    >
                        <Plus size={16} /> Add session
                    </button>
                </div>

                <div className="inline-flex p-1 bg-white border border-gray-100 rounded-xl mb-6">
                    {['upcoming', 'past'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition ${
                                tab === t ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {t} ({t === 'upcoming' ? upcoming.length : past.length})
                        </button>
                    ))}
                </div>

                {visible.length === 0 ? (
                    <div className="text-center py-16 text-sm text-gray-500 bg-white border border-dashed border-gray-200 rounded-2xl">
                        No {tab} sessions yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {visible.map(s => (
                            <SessionCard key={s.id} session={s} onEdit={openEdit} onDelete={setDeleteTarget} />
                        ))}
                    </div>
                )}
            </div>

            <SessionModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                editing={editing}
            />
            <ConfirmDeleteModal
                open={!!deleteTarget}
                target={deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
            />
        </AdminLayout>
    );
}
```

- [ ] **Step 2: Build the frontend**

Run: `npm run build`
Expected: Vite build completes without errors. (Or use `npm run dev` and hot-reload.)

- [ ] **Step 3: Manual smoke test**

1. Run `composer dev` (or `php artisan serve` + `npm run dev`).
2. Log in as an admin user.
3. Navigate to `/admin/facebook-live`.
4. Verify: empty state shows, "Add session" opens modal.
5. Create one upcoming + one past session (use file upload).
6. Verify: tabs show correct counts; thumbnails load; "Featured" badge shows when set on an upcoming session.
7. Edit a session, change image, save — old image replaced.
8. Mark a different upcoming session as featured — previous loses badge.
9. Delete a session — disappears, file removed.

---

## Task 10: Refactor public `FacebookLive` component to props-driven

**Files:**
- Modify: `resources/js/components/FacebookLive.jsx` (full rewrite)

- [ ] **Step 1: Replace the component**

Overwrite `resources/js/components/FacebookLive.jsx` with:

```jsx
import React from 'react';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop';

const formatSessionDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
};

const FacebookLive = ({ pastSessions = [], featuredSession = null }) => {
    return (
        <div className="font-urbanist max-w-7xl mx-auto px-6">
            {/* Header Section */}
            <div className="flex flex-col items-start mb-16">
                <span className="text-gray-900 text-sm font-bold tracking-wider mb-4 uppercase">
                    Weekly
                </span>
                <h2 className="text-5xl font-medium text-gray-900 mb-6 tracking-tight">
                    Saturday live sessions
                </h2>
                <p className="text-gray-600 text-lg font-light">
                    Join us every Saturday for candid conversations about studying and living abroad.
                </p>
            </div>

            {/* Featured Session Card */}
            {featuredSession && (
                <div className="bg-gray-50 rounded-sm overflow-hidden flex flex-col md:flex-row mb-32 border border-gray-100">
                    <div className="md:w-1/2 relative aspect-video md:aspect-auto min-h-[300px] bg-gray-200">
                        <img
                            src={featuredSession.image_url || FALLBACK_IMAGE}
                            className="w-full h-full object-cover opacity-90"
                            alt={featuredSession.title}
                        />
                        <span className="absolute top-6 left-6 px-3 py-1 bg-gray-200 text-[10px] font-bold text-gray-600 uppercase rounded-sm">
                            Webinar
                        </span>
                    </div>
                    <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-center items-start">
                        <div className="flex flex-wrap gap-6 mb-8 text-gray-500 text-xs font-medium uppercase tracking-wider">
                            <span className="flex items-center gap-2"><Calendar size={14} /> {formatSessionDate(featuredSession.session_date)}</span>
                            <span className="flex items-center gap-2"><MapPin size={14} /> Online</span>
                        </div>
                        <h3 className="text-3xl font-medium text-gray-900 mb-8">{featuredSession.title}</h3>

                        <div className="mb-8">
                            <span className="block text-gray-900 font-bold text-xs uppercase tracking-widest mb-2">Host</span>
                            <p className="text-gray-600 font-light">ePathways team</p>
                        </div>

                        <div className="mb-12">
                            <span className="block text-gray-900 font-bold text-xs uppercase tracking-widest mb-2">Details</span>
                            <p className="text-gray-600 font-light leading-relaxed">
                                {featuredSession.description}
                            </p>
                        </div>

                        <a
                            href={featuredSession.fb_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-3 border border-gray-200 text-gray-900 font-medium hover:bg-white transition-all rounded-sm text-sm"
                        >
                            Watch replay
                        </a>
                    </div>
                </div>
            )}

            {/* Past Sessions Grid */}
            {pastSessions.length > 0 && (
                <div>
                    <h3 className="text-2xl font-medium text-gray-900 mb-12">Past sessions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {pastSessions.map((session) => (
                            <div key={session.id} className="group cursor-pointer bg-gray-50 rounded-sm overflow-hidden flex flex-col border border-transparent hover:border-gray-100 transition-all">
                                <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
                                    <img
                                        src={session.image_url || FALLBACK_IMAGE}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                                        alt={session.title}
                                    />
                                    <span className="absolute top-4 left-4 px-2 py-1 bg-gray-200 text-[8px] font-bold text-gray-600 uppercase rounded-sm">
                                        Webinar
                                    </span>
                                </div>
                                <div className="p-8 flex flex-col items-start flex-grow">
                                    <div className="flex flex-wrap gap-4 mb-4 text-gray-500 text-[10px] font-medium uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {formatSessionDate(session.session_date)}</span>
                                        <span className="flex items-center gap-1.5"><MapPin size={12} /> Online</span>
                                    </div>
                                    <h4 className="text-xl font-medium text-gray-900 mb-4">{session.title}</h4>
                                    <p className="text-gray-500 text-sm font-light mb-8 leading-relaxed line-clamp-2">
                                        {session.description}
                                    </p>
                                    <a
                                        href={session.fb_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-auto text-gray-900 font-medium text-sm flex items-center gap-2 group/btn"
                                    >
                                        Watch now <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacebookLive;
```

---

## Task 11: Wire Activities page to pass FB Live props

**Files:**
- Modify: `resources/js/pages/Activities.jsx`

- [ ] **Step 1: Update the prop signature and pass to `<FacebookLive />`**

In `resources/js/pages/Activities.jsx`, locate the function signature (around line 22):

```jsx
export default function Activities({ events }) {
```

Change to:

```jsx
export default function Activities({ events, pastSessions = [], featuredSession = null }) {
```

Then locate `<FacebookLive />` usage and replace with:

```jsx
<FacebookLive pastSessions={pastSessions} featuredSession={featuredSession} />
```

(Use the Edit tool with sufficient context — there should be exactly one usage, since it's imported at the top.)

- [ ] **Step 2: Build the frontend**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Manual smoke test**

1. With seeded data from Task 9, open `/activities` as a logged-out visitor.
2. Featured upcoming session shows in hero card with admin-entered title, description, image, FB link.
3. Past sessions grid renders all past entries.
4. Delete the only upcoming session in admin → hero card disappears entirely.
5. Delete all past sessions → "Past sessions" section disappears entirely.

- [ ] **Step 4: Run the full backend test suite**

Run: `php artisan test`
Expected: all tests pass (existing + the 14 new FB Live tests).

---

## Self-review notes

- **Spec coverage:** every section of the design doc maps to one or more tasks (data model → T1; controller + validation → T2-6; routing → T2-5; activities prop wiring → T7; admin nav → T8; admin page → T9; public refactor → T10-11). ✓
- **Single-featured invariant:** enforced in T3/T4 implementation, locked in by T6 tests. ✓
- **Featured fallback to earliest upcoming:** implemented in T7 via `orderBy('is_featured', 'desc')->orderBy('session_date', 'asc')->first()`, covered by `test_activities_page_separates_past_and_upcoming_sessions` (no featured set yet still picks the upcoming one). ✓
- **Image lifecycle:** create (T3), replace + delete old (T4), destroy (T5) — each has a dedicated test. ✓
- **No JS test framework:** frontend changes are verified manually in T9 step 3 and T11 step 3. Acceptable given project state.
- **Type/name consistency:** props (`pastSessions`, `featuredSession`), DB columns (`session_date`, `is_featured`, `fb_link`, `image`, `image_url` accessor), and route names match across all tasks.
