<?php

namespace App\Http\Controllers;

use App\Models\UserReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserReviewController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => 'nullable|email|max:255',
            'mode'      => 'required|in:questions,paragraph',
            'answer_1'  => 'nullable|required_if:mode,questions|string',
            'answer_2'  => 'nullable|required_if:mode,questions|string',
            'answer_3'  => 'nullable|required_if:mode,questions|string',
            'paragraph' => 'nullable|required_if:mode,paragraph|string',
        ]);

        try {
            DB::beginTransaction();

            $review = UserReview::create(array_merge($validated, [
                'review_id' => 'UR-' . strtoupper(uniqid()),
                'status'    => 'New',
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

    public function adminIndex()
    {
        $reviews = UserReview::latest()->get();
        return inertia('admin/Immigration/UserReviews', [
            'reviews' => $reviews,
        ]);
    }

    public function adminShow($id)
    {
        $review = UserReview::findOrFail($id);
        return inertia('admin/Immigration/UserReviewDetails', [
            'review' => $review,
        ]);
    }
}
