<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\User;
use App\Services\AIService;
use App\Services\CaseAnalysisService;
use Illuminate\Http\Request;

/**
 * Immigration-case "procedural health" analysis endpoints powering the
 * CaseHealthBadge. Cases are Lead records (is_immigration_case = true).
 *
 * STRICT role gate: only admins/super-admins and immigration staff
 * (consultant / manager / adviser) may access. Sales, education, English and
 * accommodation staff are denied — a case is sensitive immigration data and a
 * cross-department leak here carries legal weight.
 */
class AiCaseAnalysisController extends Controller
{
    public function __construct(
        protected CaseAnalysisService $caseAnalysisService,
        protected AIService $ai,
    ) {}

    /** GET /api/ai/cases/{case}/analysis — cached read (analyses on first open). */
    public function show(Request $request, Lead $case)
    {
        if (! $this->ai->isEnabled()) {
            return response()->json(['ai_disabled' => true]);
        }

        $this->ensureCanAnalyseCases($request->user());

        $analysis = $this->caseAnalysisService->analyze($case);

        return response()->json([
            'analysis' => $analysis,
            'is_fresh' => $analysis->isFresh(),
        ]);
    }

    /** POST /api/ai/cases/{case}/analysis/refresh — force a re-analysis. */
    public function refresh(Request $request, Lead $case)
    {
        if (! $this->ai->isEnabled()) {
            return response()->json(['ai_disabled' => true], 403);
        }

        $this->ensureCanAnalyseCases($request->user());

        $analysis = $this->caseAnalysisService->analyze($case, forceRefresh: true);

        return response()->json(['analysis' => $analysis]);
    }

    private function ensureCanAnalyseCases(User $user): void
    {
        abort_unless(
            $this->canAnalyseCases($user),
            403,
            'Only immigration consultants can access case analysis.'
        );
    }

    /** Admins/super-admins, or any immigration-family role. Everyone else denied. */
    private function canAnalyseCases(User $user): bool
    {
        return $user->isAdmin()
            || in_array($user->role, [
                'immigration',
                User::ROLE_IMMIGRATION_MANAGER,
                User::ROLE_IMMIGRATION_ADVISER,
            ], true);
    }
}
