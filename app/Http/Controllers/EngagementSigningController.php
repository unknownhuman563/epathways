<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Services\Immigration\EngagementDocumentGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Standalone engagement-signing surface. The client reaches it from the
 * "engagement documents ready" email via a per-lead bearer token
 * (leads.engagement_signing_token). Unlike the public tracker it is NOT
 * excluded for immigration cases — but the token grants access to ONLY that
 * lead's engagement-pack documents (source_variant "engagement:*"), nothing
 * else on the case. The client views the pack and e-signs the Written
 * Agreement here; every other file is view/download only.
 */
class EngagementSigningController extends Controller
{
    /** Resolve the lead by its engagement token (the bearer credential). */
    private function resolveByToken(string $token): ?Lead
    {
        $token = trim($token);
        if ($token === '') {
            return null;
        }

        return Lead::where('engagement_signing_token', $token)->first();
    }

    /** Only the engagement-pack documents for this lead. */
    private function packQuery(Lead $lead)
    {
        return $lead->documents()->where('source_variant', 'like', 'engagement:%');
    }

    /** The standalone page: the engagement pack + the agreement to sign. */
    public function show(string $token)
    {
        $lead = $this->resolveByToken($token);
        abort_unless($lead, 404);

        $labels = EngagementDocumentGenerator::DOCS;

        $documents = $this->packQuery($lead)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (LeadDocument $d) use ($token, $labels) {
                $type = str_replace('engagement:', '', (string) $d->source_variant);
                $isWrittenAgreement = $type === 'written_agreement';
                $title = isset($labels[$type]) ? $labels[$type]['label'] : $d->original_name;

                return [
                    'id' => $d->id,
                    'title' => $title,
                    'original_name' => $d->original_name,
                    'size' => $d->size,
                    'view_url' => "/engagement/{$token}/documents/{$d->id}/download?inline=1",
                    'download_url' => "/engagement/{$token}/documents/{$d->id}/download",
                    // Live HTML preview (only for the signable agreement) — the
                    // drawn/uploaded signature is injected into it in real time.
                    'preview_url' => $isWrittenAgreement ? "/engagement/{$token}/documents/{$d->id}/preview" : null,
                    'signable' => $isWrittenAgreement,
                    'signed' => (bool) $d->client_signed_at,
                    'signed_at' => optional($d->client_signed_at)->toIso8601String(),
                    'signer_name' => $d->client_signer_name,
                    'sign_url' => $isWrittenAgreement ? "/engagement/{$token}/documents/{$d->id}/sign" : null,
                ];
            })
            ->values();

        return inertia('track/EngagementPack', [
            'token' => $token,
            'client' => [
                'name' => trim("{$lead->first_name} {$lead->last_name}") ?: 'Client',
                'first_name' => $lead->first_name,
            ],
            'documents' => $documents,
        ]);
    }

    /** Stream an engagement-pack document (inline preview or download). */
    public function download(Request $request, string $token, $docId)
    {
        $lead = $this->resolveByToken($token);
        abort_unless($lead, 404);

        $doc = $this->packQuery($lead)->where('id', $docId)->firstOrFail();
        abort_unless($doc->file_path && Storage::disk('local')->exists($doc->file_path), 404);

        if ($request->boolean('inline')) {
            return response()->file(Storage::disk('local')->path($doc->file_path), [
                'Content-Type' => $doc->mime ?: 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$doc->original_name.'"',
            ]);
        }

        return Storage::disk('local')->download($doc->file_path, $doc->original_name);
    }

    /**
     * Live HTML preview of the Written Agreement. Its blade listens for the
     * applicant signature via postMessage and drops it into the signature slot,
     * so the client sees their signature on the document as they draw/upload it.
     */
    public function preview(EngagementDocumentGenerator $generator, string $token, $docId)
    {
        $lead = $this->resolveByToken($token);
        abort_unless($lead, 404);

        $doc = $this->packQuery($lead)->where('id', $docId)->firstOrFail();
        abort_unless($doc->source_variant === 'engagement:written_agreement', 403);

        // Any already-stored signature, so a re-open shows what was signed.
        $clientSig = null;
        if ($doc->client_signature_path && Storage::disk('local')->exists($doc->client_signature_path)) {
            $ext = strtolower(pathinfo($doc->client_signature_path, PATHINFO_EXTENSION));
            $mime = in_array($ext, ['jpg', 'jpeg'], true) ? 'image/jpeg' : 'image/png';
            $clientSig = "data:{$mime};base64,".base64_encode(Storage::disk('local')->get($doc->client_signature_path));
        }

        $overrides = ['signer_id' => $doc->engagement_signer_id];
        if ($clientSig) {
            $overrides['client_signature'] = $clientSig;
        }

        $html = $generator->renderHtml($lead, 'written_agreement', $overrides);

        return response($html)->header('Content-Type', 'text/html; charset=utf-8');
    }

    /** Client e-signs the Written Agreement — bakes the signature into the PDF. */
    public function sign(Request $request, EngagementDocumentGenerator $generator, string $token, $docId)
    {
        $lead = $this->resolveByToken($token);
        abort_unless($lead, 404);

        $doc = $this->packQuery($lead)->where('id', $docId)->firstOrFail();
        abort_unless($doc->source_variant === 'engagement:written_agreement', 403);

        $request->validate([
            'signature_data' => 'nullable|string',
            'signature_image' => 'nullable|image|mimes:png,jpg,jpeg|max:2048',
            'signer_name' => 'required|string|max:120',
        ]);

        [$binary, $ext] = $this->decodeSignature($request) ?? [null, null];
        abort_if($binary === null, 422, 'No signature provided.');

        if ($doc->client_signature_path) {
            Storage::disk('local')->delete($doc->client_signature_path);
        }
        $sigPath = "signatures/client-doc-{$doc->id}-".Str::random(8).".{$ext}";
        Storage::disk('local')->put($sigPath, $binary);

        $clientSig = 'data:image/'.($ext === 'jpeg' ? 'jpeg' : 'png').';base64,'.base64_encode($binary);

        // Re-render the Written Agreement with the applicant signature baked in.
        $pdf = $generator->pdfBinary($lead, 'written_agreement', [
            'signer_id' => $doc->engagement_signer_id,
            'client_signature' => $clientSig,
        ]);
        Storage::disk('local')->put($doc->file_path, $pdf);

        $doc->forceFill([
            'size' => strlen($pdf),
            'client_signature_path' => $sigPath,
            'client_signed_at' => now(),
            'client_signer_name' => $request->input('signer_name'),
        ])->save();

        $lead->recordStaffActivity('Client signed the Written Agreement');

        return back()->with('success', 'Thank you — your agreement has been signed.');
    }

    /** Decode a drawn-canvas data URL or an uploaded image into [binary, ext]. */
    private function decodeSignature(Request $request): ?array
    {
        $data = $request->input('signature_data');
        if (is_string($data) && str_starts_with($data, 'data:image')) {
            $parts = explode(',', $data, 2);
            if (count($parts) === 2) {
                $ext = (str_contains($parts[0], 'jpeg') || str_contains($parts[0], 'jpg')) ? 'jpeg' : 'png';
                $bin = base64_decode($parts[1], true);

                return $bin ? [$bin, $ext] : null;
            }
        }

        if ($request->hasFile('signature_image')) {
            $f = $request->file('signature_image');
            $ext = strtolower($f->getClientOriginalExtension());

            return [file_get_contents($f->getRealPath()), $ext === 'jpg' ? 'jpeg' : ($ext ?: 'png')];
        }

        return null;
    }
}
