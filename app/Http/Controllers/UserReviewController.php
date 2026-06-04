<?php

namespace App\Http\Controllers;

use App\Models\UserReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class UserReviewController extends Controller
{
    /**
     * Public submission endpoint. Reviews are stored as `is_published = false`
     * and only appear on the corresponding department page after an admin
     * flips the publish toggle in the admin Reviews list.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'nullable|email|max:255',
            'mode'       => 'required|in:questions,paragraph',
            'rating'     => 'nullable|integer|min:1|max:5',
            'answer_1'   => 'nullable|required_if:mode,questions|string|max:5000',
            'answer_2'   => 'nullable|required_if:mode,questions|string|max:5000',
            'answer_3'   => 'nullable|required_if:mode,questions|string|max:5000',
            'paragraph'  => 'nullable|required_if:mode,paragraph|string|max:5000',
            // 'immigration' default keeps the existing behaviour for the
            // immigration page that hasn't been updated to pass it explicitly.
            'department' => ['nullable', Rule::in(UserReview::DEPARTMENTS)],
            // Visa category (immigration side) and programme level
            // (education side). Both optional — a cross-dept review (the
            // client used services from both teams) fills both.
            'visa_type'    => 'nullable|string|max:120',
            'program_type' => 'nullable|string|max:120',
            // Optional headshot. Capped at 4MB — anything bigger is almost
            // certainly an un-resized phone photo and would slow the page.
            'photo'        => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        try {
            DB::beginTransaction();

            // Strip the file off the validated array before persisting —
            // the DB column is photo_path, not photo.
            $photoFile = $request->file('photo');
            unset($validated['photo']);

            $payload = array_merge($validated, [
                'review_id'    => 'UR-' . strtoupper(uniqid()),
                'status'       => 'New',
                'is_published' => false,
                'department'   => $validated['department'] ?? UserReview::DEPT_IMMIGRATION,
            ]);

            if ($photoFile) {
                $payload['photo_path'] = $photoFile->store('user-reviews/photos', 'public');
            }

            $review = UserReview::create($payload);

            DB::commit();

            return redirect()->back()->with([
                'review_success' => true,
                'review_id'      => $review->review_id,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('User review storage failed', ['error' => $e->getMessage()]);
            return redirect()->back()->withErrors([
                'error' => 'Failed to submit review. Please try again.',
            ]);
        }
    }

    /**
     * Reviews + aggregate stats for a single department's public page.
     * Pass null to get every published review across all departments
     * (used by the homepage showcase).
     *
     * @return array{reviews: \Illuminate\Support\Collection, stats: array}
     */
    public static function publicPayload(?string $department = UserReview::DEPT_IMMIGRATION): array
    {
        // department() scope already widens an immigration/education query
        // to also include rows tagged 'both' — see UserReview::scopeDepartment.
        $base = UserReview::where('is_published', true)
            ->when($department, fn ($q) => $q->department($department));

        $reviews = (clone $base)
            ->orderByDesc('is_featured')
            ->orderByDesc('created_at')
            ->limit(60)
            ->get()
            ->map(fn (UserReview $r) => [
                'id'           => $r->id,
                'review_id'    => $r->review_id,
                'name'         => $r->name,
                'mode'         => $r->mode,
                'answer_1'     => $r->answer_1,
                'answer_2'     => $r->answer_2,
                'answer_3'     => $r->answer_3,
                'paragraph'    => $r->paragraph,
                'rating'       => $r->rating,
                'visa_type'    => $r->visa_type,
                'program_type' => $r->program_type,
                'department'   => $r->department,
                'photo_url'    => $r->photo_url,
                'is_featured'  => $r->is_featured,
                'created_at'   => $r->created_at,
            ]);

        $stats = [
            'count'   => (int) (clone $base)->count(),
            'average' => round(
                (float) (clone $base)->whereNotNull('rating')->avg('rating'),
                1
            ),
        ];

        return ['reviews' => $reviews, 'stats' => $stats];
    }

    /**
     * Convenience helper for the homepage — merges immigration + education
     * reviews into one feed so the showcase reflects every department.
     */
    public static function homePayload(): array
    {
        return self::publicPayload(null);
    }

    /**
     * Page resolver — under /admin chrome for admins, otherwise under the
     * relevant department portal. Both share the same React component
     * (re-exported at portal/<dept>/UserReviews + UserReviewDetails).
     */
    private function deptPagePath(string $department, string $page): string
    {
        $isAdmin = auth()->user()?->isAdmin();
        $folder = $department === UserReview::DEPT_EDUCATION ? 'Education' : 'Immigration';
        $portal = $department === UserReview::DEPT_EDUCATION ? 'education' : 'immigration';

        return $isAdmin
            ? "admin/{$folder}/{$page}"
            : "portal/{$portal}/{$page}";
    }

    public function adminIndex(string $department = UserReview::DEPT_IMMIGRATION)
    {
        $reviews = UserReview::department($department)->latest()->get();
        return inertia($this->deptPagePath($department, 'UserReviews'), [
            'reviews'    => $reviews,
            'department' => $department,
        ]);
    }

    /**
     * Unified moderation page — returns every review (immigration +
     * education + cross-dept 'both'). The React page tabs between
     * departments client-side so staff doesn't have to bounce between two
     * sidebar links.
     *
     * The page path is picked so the correct portal chrome wraps the same
     * React component — admins land in AdminLayout, education staff in
     * EducationLayout, immigration staff in ImmigrationLayout (via the
     * thin re-export files in those portal/ directories).
     */
    public function adminUnifiedIndex()
    {
        $user = auth()->user();

        // Department-scoped staff (education / immigration) only see their
        // own + cross-department ('both') reviews; admins see everything.
        $restrict = null;
        $page     = 'admin/UserReviewsAll';
        if ($user && !$user->isAdmin()) {
            if ($user->role === 'education') {
                $page     = 'portal/education/UserReviewsAll';
                $restrict = 'education';
            }
            if ($user->role === 'immigration') {
                $page     = 'portal/immigration/UserReviewsAll';
                $restrict = 'immigration';
            }
        }

        $reviews = UserReview::query()
            ->when($restrict, fn ($q) => $q->whereIn('department', [$restrict, 'both']))
            ->latest()
            ->get();

        return inertia($page, [
            'reviews'              => $reviews,
            'restrictedDepartment' => $restrict,
        ]);
    }

    public function adminShow($id, string $department = UserReview::DEPT_IMMIGRATION)
    {
        $review = UserReview::department($department)->findOrFail($id);
        return inertia($this->deptPagePath($department, 'UserReviewDetails'), [
            'review'     => $review,
            'department' => $department,
        ]);
    }

    /**
     * Admin toggle endpoint — flips publish + feature + status flags
     * inline from the admin Reviews table. Whitelisted attributes only.
     */
    public function adminUpdate(Request $request, $id)
    {
        $validated = $request->validate([
            'is_published' => 'sometimes|boolean',
            'is_featured'  => 'sometimes|boolean',
            'status'       => ['sometimes', Rule::in(['New', 'Reviewing', 'Approved', 'Rejected'])],
            'visa_type'    => 'sometimes|nullable|string|max:120',
            'program_type' => 'sometimes|nullable|string|max:120',
            'department'   => ['sometimes', Rule::in(UserReview::DEPARTMENTS)],
        ]);

        try {
            $review = UserReview::findOrFail($id);
            $review->update($validated);

            return back()->with('success', "Review {$review->review_id} updated.");
        } catch (\Throwable $e) {
            Log::error('User review admin update failed', ['id' => $id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Could not update that review. Please try again.');
        }
    }
}
