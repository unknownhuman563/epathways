<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\ResidentIntake;
use App\Models\UserReview;
use App\Traits\BuildsLeadRow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class ImmigrationController extends Controller
{
    use BuildsLeadRow;

    private const LEAD_STATUSES = Lead::STAGES;

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

    /**
     * Leads queue for the Immigration portal — same shape as Sales so the
     * shared Leads.jsx renders identically. Immigration staff use this to
     * track leads moving into visa-process / consultancy stages.
     */
    public function leads()
    {
        try {
            return inertia('portal/immigration/Leads', [
                'portal'   => 'immigration',
                'statuses' => self::LEAD_STATUSES,
                'leads'    => Lead::with(['studyPlans', 'event', 'portalUser:id,lead_id,last_login_at'])->latest()->get()->map(fn ($l) => $this->leadRow($l)),
            ]);
        } catch (\Throwable $e) {
            Log::error('Immigration leads list failed', ['error' => $e->getMessage()]);

            return inertia('portal/immigration/Leads', [
                'portal'   => 'immigration',
                'statuses' => self::LEAD_STATUSES,
                'leads'    => collect(),
            ]);
        }
    }

    public function updateLead(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(self::LEAD_STATUSES)],
        ]);

        try {
            $lead = Lead::findOrFail($id);
            $lead->status = $validated['status'];
            $lead->save();

            return back()->with('success', "Lead {$lead->lead_id} updated.");
        } catch (\Throwable $e) {
            Log::error('Immigration lead update failed', ['id' => $id, 'error' => $e->getMessage()]);

            return back()->with('error', 'Could not update that lead. Please try again.');
        }
    }
}
