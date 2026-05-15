<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadStudyPlan;
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
}
