<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Immigration\CaseProfileController;
use App\Models\CaseAttestation;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\User;
use App\Services\Immigration\CaseChecklistService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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

    /** All immigration cases — the exact manager "List of Cases" UI/UX, under the
     *  adviser chrome. Reuses the manager's payload builder so nothing drifts. */
    public function cases()
    {
        return inertia('portal/immigration-adviser/Cases', array_merge(
            app(\App\Http\Controllers\Portal\ImmigrationController::class)->casesPayload(),
            ['pageTitle' => 'Cases', 'pageSubtitle' => 'Every immigration case']
        ));
    }

    /** Visa Assessment — the same manager Assessments UI, under adviser chrome. */
    public function assessments()
    {
        return inertia('portal/immigration-adviser/Assessments',
            app(\App\Http\Controllers\Portal\ImmigrationController::class)->assessmentsPayload()
        );
    }

    /** Cases referred to (owned by) this adviser — same UI, scoped to their book. */
    public function myCases(Request $request)
    {
        $user = $request->user();
        $scope = $user->isAdmin() ? null : fn ($q) => $q->where('current_owner_id', $user->id);

        return inertia('portal/immigration-adviser/Cases', array_merge(
            app(\App\Http\Controllers\Portal\ImmigrationController::class)->casesPayload($scope),
            ['pageTitle' => 'My Cases', 'pageSubtitle' => 'Cases referred to you']
        ));
    }

    /** Reuse the full case profile under the adviser's chrome. The LIA may open
     *  any immigration case (they verify advice-bearing content across the book). */
    public function showCase(Lead $lead, CaseChecklistService $checklist)
    {
        $user = auth()->user();
        abort_unless($user instanceof User, 403);
        abort_unless($lead->is_immigration_case, 404);

        return app(CaseProfileController::class)->show($lead, $checklist, 'portal/immigration-adviser/CaseProfile');
    }

    /** Engagement workspace — reuses the manager builder under adviser chrome. */
    public function engagement()
    {
        return app(ImmigrationController::class)->engagement('portal/immigration-adviser/Engagement');
    }

    /** Invoice workspace — reuses the manager builder under adviser chrome. */
    public function invoice()
    {
        return app(ImmigrationController::class)->invoice('portal/immigration-adviser/Invoice');
    }

    /** INZ Forms workspace — reuses the manager builder under adviser chrome. */
    public function inzForms()
    {
        return app(ImmigrationController::class)->inzForms('portal/immigration-adviser/InzForms');
    }

    /**
     * Verification queue — documents a manager has marked "Checked" (referred to
     * the adviser). The LIA makes the final Approve/Reject call, which is what the
     * client sees. The manager's "Checked" is never shown to the client.
     */
    public function verification(Request $request)
    {
        $docs = LeadDocument::where('status', LeadDocument::STATUS_CHECKED)
            ->whereHas('lead', fn ($q) => $q->immigrationCase())
            ->with('lead:id,lead_id,first_name,last_name,inz_visa_type')
            ->orderBy('reviewed_at')
            ->get()
            ->map(fn (LeadDocument $d) => [
                'id' => $d->id,
                'original_name' => $d->original_name,
                'checklist_key' => $d->checklist_key,
                'note' => $d->note,
                'mime' => $d->mime,
                'size' => $d->size,
                'checked_at' => optional($d->reviewed_at)->toIso8601String(),
                'view_url' => "/admin/documents/{$d->id}/download?inline=1",
                'download_url' => "/admin/documents/{$d->id}/download",
                'case' => [
                    'id' => $d->lead->id,
                    'lead_id' => $d->lead->lead_id,
                    'name' => trim("{$d->lead->first_name} {$d->lead->last_name}") ?: ($d->lead->lead_id ?: 'Case'),
                    'visa' => $d->lead->inz_visa_type,
                ],
            ])->values();

        return inertia('portal/immigration-adviser/Verification', [
            'documents' => $docs,
            'licence' => $this->licence($request->user()),
        ]);
    }

    /** The adviser's final Approve/Reject on a checked document. */
    public function verifyDocument(Request $request, LeadDocument $document)
    {
        $user = $request->user();
        abort_unless($document->lead && $document->lead->is_immigration_case, 404);

        $data = $request->validate([
            'action' => ['required', Rule::in(['approve', 'reject'])],
            'note' => 'nullable|string|max:500',
        ]);

        $status = $data['action'] === 'approve'
            ? LeadDocument::STATUS_APPROVED
            : LeadDocument::STATUS_REJECTED;

        $document->forceFill([
            'status' => $status,
            'note' => $data['note'] ?: $document->note,
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
        ])->save();

        if ($status === LeadDocument::STATUS_APPROVED
            && \App\Services\GoogleDriveService::isConfigured()) {
            \App\Jobs\PushApprovedDocumentToDrive::dispatch($document->id);
        }

        $document->lead?->recordStaffActivity($status.' '.($document->original_name ?: 'file'));

        return back()->with('success', $status === LeadDocument::STATUS_APPROVED ? 'Document approved.' : 'Document rejected.');
    }

    /** Adviser reports — verification throughput + casework at a glance. */
    public function reports(Request $request)
    {
        $user = $request->user();
        $myIds = (clone $this->caseScope($user))->pluck('id');

        $verified = LeadDocument::whereIn('status', [LeadDocument::STATUS_APPROVED, LeadDocument::STATUS_REJECTED])
            ->where('reviewed_by', $user->id);

        return inertia('portal/immigration-adviser/Reports', [
            'stats' => [
                'total_cases' => Lead::immigrationCase()->count(),
                'my_cases' => $myIds->count(),
                'pending_verification' => LeadDocument::where('status', LeadDocument::STATUS_CHECKED)
                    ->whereHas('lead', fn ($q) => $q->immigrationCase())->count(),
                'approved_by_me' => (clone $verified)->where('status', LeadDocument::STATUS_APPROVED)->count(),
                'rejected_by_me' => (clone $verified)->where('status', LeadDocument::STATUS_REJECTED)->count(),
            ],
            'byStage' => Lead::immigrationCase()
                ->selectRaw('immigration_stage as stage, count(*) as total')
                ->groupBy('immigration_stage')
                ->get()
                ->map(fn ($r) => ['stage' => $r->stage ?: 'Unassigned', 'total' => (int) $r->total])
                ->values(),
            'licence' => $this->licence($user),
        ]);
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
            // The adviser's e-signature — drawn or uploaded, rendered onto the
            // documents they sign. Saved via the shared staff-signature endpoint.
            'signature' => [
                'data_uri' => $user->signatureDataUri(),
                'updated_at' => optional($user->signature_updated_at)?->toIso8601String(),
            ],
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
            'verified' => optional($user->iaa_licence_verified_at)->toDateString(),
            'current' => $user->holdsCurrentLicence(),
        ];
    }
}
