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
     * and only appear on the immigration page after an admin flips the
     * publish toggle in the admin Reviews list.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => 'nullable|email|max:255',
            'mode'      => 'required|in:questions,paragraph',
            'rating'    => 'nullable|integer|min:1|max:5',
            'answer_1'  => 'nullable|required_if:mode,questions|string|max:5000',
            'answer_2'  => 'nullable|required_if:mode,questions|string|max:5000',
            'answer_3'  => 'nullable|required_if:mode,questions|string|max:5000',
            'paragraph' => 'nullable|required_if:mode,paragraph|string|max:5000',
        ]);

        try {
            DB::beginTransaction();

            $review = UserReview::create(array_merge($validated, [
                'review_id'    => 'UR-' . strtoupper(uniqid()),
                'status'       => 'New',
                'is_published' => false,
            ]));

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
     * Returns the list of published reviews + aggregate rating stats that
     * the public immigration page renders. Kept here so the controller is
     * the single source of truth on what "public" means.
     *
     * @return array{reviews: \Illuminate\Support\Collection, stats: array}
     */
    public static function publicPayload(): array
    {
        $reviews = UserReview::where('is_published', true)
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
                'is_featured'  => $r->is_featured,
                'created_at'   => $r->created_at,
            ]);

        $stats = [
            'count'   => (int) UserReview::where('is_published', true)->count(),
            'average' => round(
                (float) UserReview::where('is_published', true)
                    ->whereNotNull('rating')
                    ->avg('rating'),
                1
            ),
        ];

        return ['reviews' => $reviews, 'stats' => $stats];
    }

    /**
     * Render under /admin chrome for admins; under the immigration portal for
     * immigration-role staff. Both share the same React component (re-exported
     * at portal/immigration/* — see resources/js/pages/portal/immigration/).
     */
    private function immigrationPagePath(string $page): string
    {
        return auth()->user()?->isAdmin()
            ? "admin/Immigration/{$page}"
            : "portal/immigration/{$page}";
    }

    public function adminIndex()
    {
        $reviews = UserReview::latest()->get();
        return inertia($this->immigrationPagePath('UserReviews'), [
            'reviews' => $reviews,
        ]);
    }

    public function adminShow($id)
    {
        $review = UserReview::findOrFail($id);
        return inertia($this->immigrationPagePath('UserReviewDetails'), [
            'review' => $review,
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
