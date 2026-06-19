<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\User;
use App\Services\AIService;
use App\Services\LeadAnalysisService;
use Illuminate\Http\Request;

/**
 * Lead "health" analysis endpoints powering the LeadHealthBadge. The
 * role-scoped visibility gate here is CRITICAL — sales staff must never see
 * an immigration case's analysis (or vice versa). There is no Lead policy in
 * this app, so the gate is enforced inline.
 */
class AiLeadAnalysisController extends Controller
{
    public function __construct(
        protected LeadAnalysisService $analysisService,
        protected AIService $ai,
    ) {}

    /** GET /api/ai/leads/{lead}/analysis — cached read (analyses on first open). */
    public function show(Request $request, Lead $lead)
    {
        if (! $this->ai->isEnabled()) {
            return response()->json(['ai_disabled' => true]);
        }

        $this->ensureCanView($request->user(), $lead);

        $analysis = $this->analysisService->analyze($lead);

        return response()->json([
            'analysis' => $analysis,
            'is_fresh' => $analysis->isFresh(),
        ]);
    }

    /** POST /api/ai/leads/{lead}/analysis/refresh — force a re-analysis. */
    public function refresh(Request $request, Lead $lead)
    {
        if (! $this->ai->isEnabled()) {
            return response()->json(['ai_disabled' => true], 403);
        }

        $this->ensureCanView($request->user(), $lead);

        $analysis = $this->analysisService->analyze($lead, forceRefresh: true);

        return response()->json(['analysis' => $analysis]);
    }

    private function ensureCanView(User $user, Lead $lead): void
    {
        abort_unless($this->canViewLead($user, $lead), 403, 'You do not have access to this lead.');
    }

    /**
     * Department-scoped lead visibility:
     * - admin / super-admin: everything
     * - sales: only leads still in the pipeline (no conversion flags)
     * - each department: only its own converted records
     */
    private function canViewLead(User $user, Lead $lead): bool
    {
        if (in_array($user->role, [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN], true)) {
            return true;
        }

        return match ($user->role) {
            'sales' => ! $lead->is_student
                && ! $lead->is_immigration_case
                && ! $lead->is_english_student
                && ! $lead->is_accommodation_client,
            'education'     => (bool) $lead->is_student,
            'english'       => (bool) $lead->is_english_student,
            'immigration', User::ROLE_IMMIGRATION_MANAGER, User::ROLE_IMMIGRATION_ADVISER => (bool) $lead->is_immigration_case,
            'accommodation' => (bool) $lead->is_accommodation_client,
            default         => false,
        };
    }
}
