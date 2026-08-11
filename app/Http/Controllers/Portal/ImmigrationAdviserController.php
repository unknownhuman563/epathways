<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Immigration\CaseProfileController;
use App\Models\CaseAttestation;
use App\Models\Lead;
use App\Models\User;
use App\Services\Immigration\CaseChecklistService;
use Illuminate\Http\Request;

/**
 * The Licensed Immigration Adviser's portal. Separate from the manager's full
 * immigration portal — scoped to the LIA's own casework: their assigned cases,
 * the sign-off / approval queue (verdict + lodgement, licence-gated), and their
 * profile. Case reads are ROW-SCOPED to the adviser (admins see all).
 */
class ImmigrationAdviserController extends Controller
{
    /** Adviser's own immigration cases (admins see all — for oversight/testing). */
    private function caseScope(User $user)
    {
        $q = Lead::immigrationCase();

        return $user->isAdmin() ? $q : $q->where('current_owner_id', $user->id);
    }

    public function dashboard(Request $request)
    {
        $user = $request->user();

        $cases = (clone $this->caseScope($user))
            ->orderByDesc('updated_at')
            ->limit(8)
            ->get(['id', 'lead_id', 'first_name', 'last_name', 'inz_visa_type', 'inz_status', 'immigration_stage', 'updated_at']);

        $myCaseIds = (clone $this->caseScope($user))->pluck('id');

        // Awaiting the adviser's attestation = a case with no current verdict.
        $awaitingVerdict = $myCaseIds->filter(fn ($id) => CaseAttestation::currentVerdict($id) === null)->count();
        $awaitingLodgement = $myCaseIds->filter(fn ($id) => ! CaseAttestation::hasLodgementSignoff($id))->count();

        return inertia('portal/immigration-adviser/Dashboard', [
            'stats' => [
                'my_cases' => $myCaseIds->count(),
                'awaiting_verdict' => $awaitingVerdict,
                'awaiting_lodgement' => $awaitingLodgement,
                'lodged' => (clone $this->caseScope($user))->whereIn('inz_status', ['Lodged', 'Decision Pending', 'Info Requested'])->count(),
            ],
            'recentCases' => $cases->map(fn ($l) => $this->caseRow($l))->values(),
            'licence' => $this->licence($user),
        ]);
    }

    public function cases(Request $request)
    {
        $user = $request->user();

        $cases = (clone $this->caseScope($user))
            ->orderByDesc('updated_at')
            ->limit(300)
            ->get(['id', 'lead_id', 'first_name', 'last_name', 'inz_visa_type', 'inz_status', 'immigration_stage', 'updated_at']);

        return inertia('portal/immigration-adviser/Cases', [
            'cases' => $cases->map(fn ($l) => $this->caseRow($l))->values(),
        ]);
    }

    /** Reuse the full case profile under the adviser's chrome + ownership guard. */
    public function showCase(Lead $lead, CaseChecklistService $checklist)
    {
        $user = auth()->user();
        abort_unless($user instanceof User, 403);
        abort_unless($user->isAdmin() || $lead->current_owner_id === $user->id, 404);

        return app(CaseProfileController::class)->show($lead, $checklist, 'portal/immigration-adviser/CaseProfile');
    }

    /** Cases awaiting the adviser's verdict or lodgement sign-off. */
    public function signOff(Request $request)
    {
        $user = $request->user();

        $cases = (clone $this->caseScope($user))
            ->orderByDesc('updated_at')
            ->limit(300)
            ->get(['id', 'lead_id', 'first_name', 'last_name', 'inz_visa_type', 'inz_status', 'immigration_stage', 'updated_at']);

        $rows = $cases->map(function ($l) {
            $verdict = CaseAttestation::currentVerdict($l->id);

            return array_merge($this->caseRow($l), [
                'verdict' => $verdict?->verdict,
                'has_lodgement_signoff' => CaseAttestation::hasLodgementSignoff($l->id),
                'needs_verdict' => $verdict === null,
            ]);
        })
            // Only those needing something from the adviser.
            ->filter(fn ($r) => $r['needs_verdict'] || ! $r['has_lodgement_signoff'])
            ->values();

        return inertia('portal/immigration-adviser/SignOff', ['cases' => $rows]);
    }

    public function profile(Request $request)
    {
        $user = $request->user();

        return inertia('portal/immigration-adviser/Profile', [
            'adviser' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
            'licence' => $this->licence($user),
        ]);
    }

    /** @return array<string, mixed> */
    private function caseRow(Lead $l): array
    {
        return [
            'id' => $l->id,
            'lead_id' => $l->lead_id,
            'name' => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
            'visa_type' => $l->inz_visa_type,
            'inz_status' => $l->inz_status,
            'stage' => $l->immigration_stage,
            'updated_at' => optional($l->updated_at)->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    private function licence(User $user): array
    {
        return [
            'number' => $user->iaa_licence_number,
            'type' => $user->iaa_licence_type,
            'expiry' => optional($user->iaa_licence_expiry)->toDateString(),
            'current' => $user->holdsCurrentLicence(),
        ];
    }
}
