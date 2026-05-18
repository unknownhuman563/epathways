<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\ResidentIntake;
use App\Models\UserReview;

class ImmigrationController extends Controller
{
    /**
     * Immigration-portal dashboard — counts, monthly trend, recent activity.
     * Accessible to admins and 'immigration'-role staff.
     */
    public function dashboard()
    {
        $now = now();
        $startOfWeek = $now->copy()->startOfWeek();
        $startOfMonth = $now->copy()->startOfMonth();

        // Status breakdown — keep the order stable for the UI.
        $statusOrder = ['New', 'In Review', 'Engaged', 'Archived'];
        $statusCounts = ResidentIntake::selectRaw('COALESCE(status, "New") as status, COUNT(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status')
            ->all();
        $statusBreakdown = collect($statusOrder)
            ->map(fn ($s) => ['status' => $s, 'count' => (int) ($statusCounts[$s] ?? 0)])
            ->all();

        // 6-month monthly trend (oldest → newest).
        $monthly = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = $now->copy()->subMonths($i)->startOfMonth();
            $monthEnd = $now->copy()->subMonths($i)->endOfMonth();
            $monthly[] = [
                'label' => $monthStart->format('M'),
                'intakes' => ResidentIntake::whereBetween('created_at', [$monthStart, $monthEnd])->count(),
            ];
        }

        $intakesWithFiles = ResidentIntake::whereNotNull('document_files')
            ->where('document_files', '!=', '[]')
            ->where('document_files', '!=', '{}')
            ->count();

        return inertia('portal/immigration/Dashboard', [
            'stats' => [
                'total_intakes'      => ResidentIntake::count(),
                'intakes_this_week'  => ResidentIntake::where('created_at', '>=', $startOfWeek)->count(),
                'intakes_this_month' => ResidentIntake::where('created_at', '>=', $startOfMonth)->count(),
                'intakes_with_files' => $intakesWithFiles,
                'total_reviews'      => UserReview::count(),
                'reviews_this_month' => UserReview::where('created_at', '>=', $startOfMonth)->count(),
            ],
            'status_breakdown' => $statusBreakdown,
            'monthly'          => $monthly,
            'recent_intakes'   => ResidentIntake::latest()->take(6)->get([
                'id', 'intake_id', 'first_name', 'last_name', 'email',
                'current_visa_type', 'job_title', 'status', 'created_at',
            ]),
            'recent_reviews'   => UserReview::latest()->take(5)->get([
                'id', 'review_id', 'name', 'email', 'mode', 'status', 'created_at',
            ]),
        ]);
    }
}
