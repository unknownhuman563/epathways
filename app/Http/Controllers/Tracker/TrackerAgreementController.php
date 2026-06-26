<?php

namespace App\Http\Controllers\Tracker;

use App\Contracts\SignatureProvider;
use App\Http\Controllers\Controller;
use App\Models\Agreement;
use App\Models\Lead;
use App\Models\User;
use App\Notifications\AgreementSignedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

/**
 * Build 11.D Phase 3 — Public, tracker-authenticated agreement endpoints.
 *
 * Auth model: the tracker_code in the URL is the bearer credential for
 * the lead, and the agreement's tracker_signing_token is the bearer
 * credential for the agreement. The two must match (agreement.lead_id
 * must equal the lead resolved from the code) or we 404. No internal
 * IDs in URLs.
 *
 * Rate limiting: routes are mounted under throttle:tracker (30 req/min
 * per code+IP) — same limiter LeadTrackingController uses.
 *
 * Privacy / audit: signer IP comes from $request->ip(). In production
 * behind a reverse proxy (nginx / Cloudflare), TrustedProxies MUST be
 * configured in bootstrap/app.php for ip() to return the real client.
 * Without it, every signing audit row will show the proxy's IP — still
 * non-empty, but not useful. This is a deploy-config concern, not a
 * code concern.
 */
class TrackerAgreementController extends Controller
{
    public function __construct(protected SignatureProvider $signer)
    {
    }

    /** GET /track/{code}/agreements/{token}/sign — render signing UI. */
    public function showSigning(Request $request, string $code, string $token)
    {
        [$lead, $agreement] = $this->resolveLeadAndAgreement($code, $token);

        // First-view marks the agreement viewed (sent → viewed). Idempotent
        // against repeat opens — subsequent renders leave viewed_at alone.
        if ($agreement->status === Agreement::STATUS_SENT) {
            $agreement->status    = Agreement::STATUS_VIEWED;
            $agreement->viewed_at = now();
            $agreement->save();
        }

        return inertia('track/SignAgreement', [
            'code'      => $code,
            'lead'      => $this->publicLead($lead),
            'agreement' => $this->publicAgreement($agreement),
        ]);
    }

    /** POST /track/{code}/agreements/{token}/sign — accept signature. */
    public function sign(Request $request, string $code, string $token)
    {
        // 5 MB cap on signature_data — base64-encoded canvas PNGs are
        // small (~10-40 KB typically), but we protect the DB column from
        // a malicious / oversized blob. signer_name capped at 200 chars
        // (matches schema). terms_accepted required + must be truthy.
        $request->validate([
            'signer_name'     => ['required', 'string', 'max:200'],
            'signature_data'  => ['required', 'string', 'max:5000000'],
            'terms_accepted'  => ['required', 'accepted'],
        ]);

        [$lead, $agreement] = $this->resolveLeadAndAgreement($code, $token);

        // Idempotency / state guard. The whereIn was the natural fence:
        // once the first POST flips status to 'signed', a double-click
        // POST resolves a different status and 404s here. Tests cover
        // both the in-flight double-click case and the "client refreshes
        // confirmation page and re-POSTs from cached form" case.
        abort_unless(
            in_array($agreement->status, [Agreement::STATUS_SENT, Agreement::STATUS_VIEWED], true),
            404,
            'This agreement is not available for signing.'
        );

        $ok = $this->signer->recordSignature(
            $agreement,
            $request->only(['signer_name', 'signature_data']),
            $request,
        );
        abort_unless($ok, 422, 'Signature could not be recorded.');

        $this->notifyStaff($lead, $agreement);

        return redirect("/track/{$code}/agreements/{$token}/signed");
    }

    /**
     * GET /track/{code}/agreements/{token}/view — stream the PDF inline.
     *
     * Prefers the signed PDF (with embedded signature audit block) when
     * present, falls back to the draft PDF otherwise. Bearer-credentialed
     * by the same code+token pair as the signing flow; draft/voided/
     * expired agreements never resolve here.
     */
    public function viewPdf(string $code, string $token)
    {
        [, $agreement] = $this->resolveLeadAndAgreement($code, $token);

        $path = $agreement->signed_pdf_path ?: $agreement->pdf_path;
        abort_unless($path && Storage::disk('local')->exists($path), 404, 'PDF not found.');

        $safeTitle = preg_replace('/[^A-Za-z0-9]+/', '_', (string) $agreement->title) ?: 'agreement';
        $suffix    = $agreement->signed_pdf_path ? '-signed' : '';

        return response()->file(Storage::disk('local')->path($path), [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $safeTitle . $suffix . '.pdf"',
        ]);
    }

    /** GET /track/{code}/agreements/{token}/signed — confirmation. */
    public function signedConfirmation(string $code, string $token)
    {
        [$lead, $agreement] = $this->resolveLeadAndAgreement($code, $token);
        abort_unless($agreement->status === Agreement::STATUS_SIGNED, 404);

        return inertia('track/AgreementSigned', [
            'code'      => $code,
            'lead'      => $this->publicLead($lead),
            'agreement' => $this->publicAgreement($agreement),
        ]);
    }

    /**
     * Resolve the lead + agreement by tracker code + token. Both must
     * exist and the agreement must belong to the lead.
     *
     * @return array{0: Lead, 1: Agreement}
     */
    private function resolveLeadAndAgreement(string $code, string $token): array
    {
        $lead = Lead::where('tracking_code', strtoupper(trim($code)))->first();
        abort_unless($lead, 404, 'Tracking code not found.');

        $agreement = Agreement::where('tracker_signing_token', $token)
            ->where('lead_id', $lead->id)
            ->first();
        abort_unless($agreement, 404, 'Agreement not found for this tracking code.');

        // Draft / voided / expired agreements MUST NOT surface — a draft
        // agreement leaked to a client would be wrong. The signing flow
        // and the confirmation page each enforce their own narrower
        // status checks on top of this baseline gate.
        abort_if(
            in_array($agreement->status, [
                Agreement::STATUS_DRAFT,
                Agreement::STATUS_VOIDED,
                Agreement::STATUS_EXPIRED,
            ], true),
            404,
            'Agreement not available.',
        );

        return [$lead, $agreement];
    }

    /**
     * Recipient routing for AgreementSignedNotification:
     *   1. The case's assignee (if any) is the primary recipient.
     *   2. Fallback: all admin + immigration_manager users — so a signed
     *      agreement on an unassigned case is still seen.
     * Database channel only — no emails fired here.
     */
    private function notifyStaff(Lead $lead, Agreement $agreement): void
    {
        $lead->loadMissing('assignee');

        if ($lead->assignee) {
            $lead->assignee->notify(new AgreementSignedNotification($agreement));
            return;
        }

        $fallback = User::query()
            ->whereIn('role', [User::ROLE_ADMIN, User::ROLE_IMMIGRATION_MANAGER])
            ->get();

        if ($fallback->isNotEmpty()) {
            Notification::send($fallback, new AgreementSignedNotification($agreement));
        }
    }

    private function publicLead(Lead $lead): array
    {
        return [
            'first_name' => $lead->first_name,
            'last_name'  => $lead->last_name,
            'email'      => $lead->email,
        ];
    }

    /**
     * What the client sees about their own agreement. Includes the
     * rendered body so they can read what they're signing. Omits internal
     * fields (PDF paths, generated_by_user_id, etc.).
     */
    private function publicAgreement(Agreement $agreement): array
    {
        return [
            'id'               => $agreement->id,
            'title'            => $agreement->title,
            'status'           => $agreement->status,
            'content_rendered' => $agreement->content_rendered,
            'sent_at'          => $agreement->sent_at,
            'viewed_at'        => $agreement->viewed_at,
            'signed_at'        => $agreement->signed_at,
            'signer_name'      => $agreement->signer_name,
        ];
    }
}
