<?php

namespace App\Services\Immigration;

use App\Contracts\SignatureProvider;
use App\Models\Agreement;
use App\Services\PdfGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Str;

/**
 * Build 11.D Phase 3 — In-CRM stub e-signature provider.
 *
 * Captures: typed legal name, base64 PNG from a canvas pad, IP,
 * user-agent, and timestamp. Stamps these onto the Agreement and
 * regenerates the PDF with the signature image embedded.
 *
 * Intentional limitations (NOT shipping legally bulletproof e-sign):
 *   - No identity verification (no SMS / email OTP)
 *   - No certificate-of-completion / tamper-evident seal
 *   - No signer-identity assertion (anyone holding the tracker token
 *     can sign; the token IS the bearer credential)
 *   - IP audit trail value depends on TrustedProxies being configured
 *     correctly in production (see bootstrap/app.php). Without it,
 *     $request->ip() returns the reverse-proxy IP, not the client's.
 *
 * Build 11.E will swap this out for HelloSign / DocuSign via service
 * provider rebinding. The SignatureProvider interface is the seam.
 */
class StubSignatureProvider implements SignatureProvider
{
    public function __construct(protected PdfGenerator $pdf)
    {
    }

    public function createSigningSession(Agreement $agreement): string
    {
        $code = $agreement->lead->tracking_code;
        $token = $agreement->tracker_signing_token;
        if (! $code || ! $token) {
            // Caller error — agreement wasn't sent (no token) or the lead
            // doesn't have a tracking_code yet. Tests cover both branches.
            return '';
        }
        return url("/track/{$code}/agreements/{$token}/sign");
    }

    /**
     * Apply the signature to the Agreement. Caller (the controller) is
     * responsible for the status precondition (only sent/viewed accept
     * signatures) and the cross-lead guard.
     */
    public function recordSignature(Agreement $agreement, array $payload, Request $request): bool
    {
        $name = trim((string) ($payload['signer_name'] ?? ''));
        $signatureData = (string) ($payload['signature_data'] ?? '');

        if ($name === '' || $signatureData === '') {
            return false;
        }

        $agreement->status            = Agreement::STATUS_SIGNED;
        $agreement->signer_name       = $name;
        $agreement->signature_data    = $signatureData;
        $agreement->signed_at         = now();
        $agreement->signer_ip         = $request->ip();
        $agreement->signer_user_agent = $request->userAgent();
        $agreement->save();

        $agreement->signed_pdf_path = $this->generateSignedPdf($agreement);
        $agreement->save();

        return true;
    }

    /**
     * Re-render the agreement with the signature block + audit footer
     * embedded. Stored to a separate path so the original draft PDF
     * remains intact for comparison.
     */
    protected function generateSignedPdf(Agreement $agreement): string
    {
        $html = View::make('agreements.signed-pdf-shell', [
            'title'         => $agreement->title,
            'content'       => $agreement->content_rendered,
            'signer_name'   => $agreement->signer_name,
            'signed_at'     => $agreement->signed_at,
            'signer_ip'     => $agreement->signer_ip,
            'signer_ua'     => $agreement->signer_user_agent,
            'signature_src' => $agreement->signature_data, // base64 data URL
        ])->render();

        $relativePath = "agreements/{$agreement->lead_id}/signed-{$agreement->id}-" . Str::random(6) . '.pdf';
        return $this->pdf->renderToFile($html, $relativePath);
    }
}
