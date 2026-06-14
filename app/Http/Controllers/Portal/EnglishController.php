<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadStudyPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EnglishController extends Controller
{
    /**
     * English overview. No dedicated English-language tables yet, so we
     * surface IELTS/PTE-flagged study plans as the proxy "learners" cohort.
     */
    public function dashboard()
    {
        try {
            $now = now();
            $monthStart = $now->copy()->startOfMonth();

            $learnerStats = [
                'total' => LeadStudyPlan::where('english_test_taken', true)->count(),
                'this_month' => LeadStudyPlan::where('english_test_taken', true)
                    ->where('created_at', '>=', $monthStart)->count(),
                'ielts' => LeadStudyPlan::where('english_test_type', 'IELTS')->count(),
                'pte' => LeadStudyPlan::where('english_test_type', 'PTE')->count(),
            ];

            $recentLearners = LeadStudyPlan::with('lead')
                ->where('english_test_taken', true)
                ->latest()
                ->limit(8)
                ->get()
                ->map(function ($sp) {
                    $lead = $sp->lead;

                    return [
                        'id' => $sp->id,
                        'lead_id' => optional($lead)->lead_id,
                        'name' => $lead ? trim("{$lead->first_name} {$lead->last_name}") : 'Unknown',
                        'email' => optional($lead)->email,
                        'test_type' => $sp->english_test_type,
                        'test_score' => $sp->score_overall,
                        'test_date' => $sp->english_test_date,
                        'created_at' => $sp->created_at,
                    ];
                });

            return inertia('portal/english/Dashboard', [
                'learnerStats' => $learnerStats,
                'recentLearners' => $recentLearners,
            ]);
        } catch (\Throwable $e) {
            Log::error('English dashboard failed', ['error' => $e->getMessage()]);

            return inertia('portal/english/Dashboard', [
                'learnerStats' => array_fill_keys(['total', 'this_month', 'ielts', 'pte'], 0),
                'recentLearners' => collect(),
            ]);
        }
    }

    /**
     * Learners list — every lead flagged is_english_student. Supports a
     * stage filter (Lead::ENGLISH_STAGES) and a free-text search across
     * name / email / phone / lead_id. Paginated server-side.
     */
    public function learners(Request $request)
    {
        $stage  = $request->query('stage');
        $search = trim((string) $request->query('search', ''));

        $learners = Lead::query()
            ->where('is_english_student', true)
            ->when($stage, fn ($q) => $q->where('english_stage', $stage))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('lead_id', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('english_converted_at')
            ->orderByDesc('updated_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Lead $l) => [
                'id'            => $l->id,
                'lead_id'       => $l->lead_id,
                'name'          => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                'email'         => $l->email,
                'phone'         => $l->phone,
                'english_stage' => $l->english_stage,
                'converted_at'  => optional($l->english_converted_at)?->toIso8601String(),
                'last_activity' => optional($l->updated_at)?->toIso8601String(),
            ]);

        return inertia('portal/english/Learners', [
            'portal'   => 'english',
            'learners' => $learners,
            'stages'   => Lead::ENGLISH_STAGES,
            'filters'  => ['stage' => $stage, 'search' => $search],
        ]);
    }
}
