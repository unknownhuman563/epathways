<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\VisaApproval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * CRUD for the "Visa Approved" marketing showcase. Reachable by any
 * staff role that has access to the admin sidebar (super_admin,
 * admin, immigration, sales, education) — the route group in
 * routes/web.php enforces that gate.
 *
 * Public read is handled elsewhere: HomeController::index passes the
 * featured + latest few approvals into the home-page Showcase, and
 * the /visa-approved public gallery reads the full published list.
 */
class VisaApprovalController extends Controller
{
    /** GET /admin/visa-approvals — list + inline management. */
    public function index()
    {
        $items = VisaApproval::with(['lead:id,first_name,last_name,email', 'creator:id,name'])
            ->orderByDesc('is_featured')
            ->orderByDesc('approved_at')
            ->orderByDesc('id')
            ->get()
            ->map(function (VisaApproval $v) {
                $arr = $v->toPublicArray();
                $arr['lead']         = $v->lead ? ['id' => $v->lead->id, 'name' => trim(($v->lead->first_name ?? '').' '.($v->lead->last_name ?? '')), 'email' => $v->lead->email] : null;
                $arr['created_by']   = $v->creator?->name;
                $arr['created_at']   = $v->created_at?->toIso8601String();
                return $arr;
            });

        return Inertia::render('admin/VisaApprovals', [
            'items' => $items,
        ]);
    }

    /** POST /admin/visa-approvals — create. */
    public function store(Request $request)
    {
        $data = $this->validated($request);
        $approval = new VisaApproval();
        $this->fill($approval, $data, $request);
        $approval->created_by = Auth::id();
        $approval->save();

        if ($data['is_featured'] ?? false) {
            $this->enforceSingleFeatured($approval->id);
        }

        return back()->with('success', 'Approval added.');
    }

    /** POST /admin/visa-approvals/{id} — update. */
    public function update(Request $request, $id)
    {
        $approval = VisaApproval::findOrFail($id);
        $data = $this->validated($request);
        $this->fill($approval, $data, $request);
        $approval->save();

        if ($data['is_featured'] ?? false) {
            $this->enforceSingleFeatured($approval->id);
        }

        return back()->with('success', 'Approval updated.');
    }

    /** DELETE /admin/visa-approvals/{id}. Also removes the image file. */
    public function destroy($id)
    {
        $approval = VisaApproval::findOrFail($id);
        if ($approval->image_path && Storage::disk('public')->exists($approval->image_path)) {
            try { Storage::disk('public')->delete($approval->image_path); } catch (\Throwable $e) { /* noop */ }
        }
        $approval->delete();

        return back()->with('success', 'Approval removed.');
    }

    /**
     * GET /admin/visa-approvals/people-search?q=xxx
     *
     * Combobox source — searches leads by name / email / lead_id. Cases
     * + students are Leads too (is_immigration_case / is_student flags)
     * so a single query covers all three; the `kind` field lets the UI
     * badge each row appropriately.
     */
    public function peopleSearch(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        if (mb_strlen($q) < 2) {
            return response()->json(['results' => []]);
        }

        $rows = Lead::query()
            ->select('id', 'first_name', 'last_name', 'email', 'lead_id', 'citizenship', 'country_of_birth', 'is_immigration_case', 'is_student')
            ->where(function ($w) use ($q) {
                $w->where('first_name', 'like', "%{$q}%")
                  ->orWhere('last_name', 'like', "%{$q}%")
                  ->orWhere('email', 'like', "%{$q}%")
                  ->orWhere('lead_id', 'like', "%{$q}%");
            })
            ->orderByDesc('id')
            ->limit(12)
            ->get();

        return response()->json([
            'results' => $rows->map(function (Lead $l) {
                $kind = $l->is_immigration_case ? 'case' : ($l->is_student ? 'student' : 'lead');
                return [
                    'id'      => $l->id,
                    'name'    => trim(($l->first_name ?? '').' '.($l->last_name ?? '')) ?: ($l->lead_id ?? 'Unnamed'),
                    'email'   => $l->email,
                    'lead_id' => $l->lead_id,
                    'kind'    => $kind,
                    // Suggested origin country — the admin can override.
                    'country' => $l->citizenship ?: $l->country_of_birth,
                ];
            }),
        ]);
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private function validated(Request $request): array
    {
        return $request->validate([
            'lead_id'      => ['nullable', 'integer', Rule::exists('leads', 'id')],
            'display_name' => ['required', 'string', 'max:180'],
            'country'      => ['nullable', 'string', 'max:100'],
            // month + year come in as two integers from the form; we assemble
            // into a first-of-month date in fill(). Both optional so an
            // approval without an exact date still saves.
            'approved_month' => ['nullable', 'integer', 'between:1,12'],
            'approved_year'  => ['nullable', 'integer', 'between:2000,2100'],
            'caption'      => ['nullable', 'string', 'max:500'],
            'is_featured'  => ['sometimes', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],
            'image'        => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'], // 5MB
            'remove_image' => ['sometimes', 'boolean'],
        ]);
    }

    private function fill(VisaApproval $approval, array $data, Request $request): void
    {
        $approval->lead_id      = $data['lead_id']      ?? null;
        $approval->display_name = $data['display_name'];
        $approval->country      = $data['country']      ?? null;
        $approval->caption      = $data['caption']      ?? null;
        $approval->is_featured  = (bool) ($data['is_featured']  ?? false);
        $approval->is_published = (bool) ($data['is_published'] ?? true);

        if (! empty($data['approved_month']) && ! empty($data['approved_year'])) {
            $approval->approved_at = sprintf('%04d-%02d-01', $data['approved_year'], $data['approved_month']);
        } elseif (array_key_exists('approved_month', $data) && array_key_exists('approved_year', $data)) {
            // Both explicitly null — clear the date.
            $approval->approved_at = null;
        }

        // Handle image upload / removal.
        if ($request->hasFile('image')) {
            // Delete previous file so we don't accumulate orphans.
            if ($approval->image_path && Storage::disk('public')->exists($approval->image_path)) {
                try { Storage::disk('public')->delete($approval->image_path); } catch (\Throwable $e) { /* noop */ }
            }
            $approval->image_path = $request->file('image')->store('visa-approvals', 'public');
        } elseif (! empty($data['remove_image']) && $approval->image_path) {
            try { Storage::disk('public')->delete($approval->image_path); } catch (\Throwable $e) { /* noop */ }
            $approval->image_path = null;
        }
    }

    /**
     * "One featured at a time" invariant — set on save, unset on any
     * other row so the home page always highlights exactly one.
     */
    private function enforceSingleFeatured(int $keepId): void
    {
        VisaApproval::where('id', '!=', $keepId)
            ->where('is_featured', true)
            ->update(['is_featured' => false]);
    }
}
