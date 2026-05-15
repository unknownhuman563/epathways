<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\ResidentIntake;
use App\Models\UserReview;
use Illuminate\Support\Facades\Log;

class ImmigrationController extends Controller
{
    /** Immigration overview: resident intakes, user reviews, recent activity. */
    public function dashboard()
    {
        try {
            $now = now();
            $monthStart = $now->copy()->startOfMonth();

            $intakeStats = [
                'total' => ResidentIntake::count(),
                'new' => ResidentIntake::where('status', 'New')->count(),
                'this_month' => ResidentIntake::where('created_at', '>=', $monthStart)->count(),
                'in_progress' => ResidentIntake::whereNotIn('status', ['New', 'Closed', 'Rejected'])->count(),
            ];

            $reviewStats = [
                'total' => UserReview::count(),
                'new' => UserReview::where('status', 'New')->count(),
                'this_month' => UserReview::where('created_at', '>=', $monthStart)->count(),
            ];

            $recentIntakes = ResidentIntake::latest()->limit(8)->get(['id', 'intake_id', 'first_name', 'last_name', 'email', 'status', 'created_at']);
            $recentReviews = UserReview::latest()->limit(6)->get(['id', 'review_id', 'name', 'status', 'created_at']);

            return inertia('portal/immigration/Dashboard', [
                'intakeStats' => $intakeStats,
                'reviewStats' => $reviewStats,
                'recentIntakes' => $recentIntakes,
                'recentReviews' => $recentReviews,
            ]);
        } catch (\Throwable $e) {
            Log::error('Immigration dashboard failed', ['error' => $e->getMessage()]);

            return inertia('portal/immigration/Dashboard', [
                'intakeStats' => array_fill_keys(['total', 'new', 'this_month', 'in_progress'], 0),
                'reviewStats' => array_fill_keys(['total', 'new', 'this_month'], 0),
                'recentIntakes' => collect(),
                'recentReviews' => collect(),
            ]);
        }
    }
}
