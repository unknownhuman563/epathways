<?php

namespace App\Contracts;

use App\Models\Agreement;
use Illuminate\Http\Request;

/**
 * Build 11.D Phase 3 — Pluggable e-signature seam.
 *
 * StubSignatureProvider (the bound default) captures in-CRM signing:
 * typed legal name + canvas PNG + IP + user-agent + timestamp. This is
 * good enough for internal use and pilot but is NOT a legally
 * authoritative e-signature on its own.
 *
 * Build 11.E will bind a real provider (HelloSign / DocuSign) in place
 * of the stub. Controllers and views talk to this interface only — the
 * swap is a service-provider one-liner.
 */
interface SignatureProvider
{
    /**
     * Build the URL the client visits to sign. Must use the agreement's
     * tracker_signing_token (random 48-char string) — never expose
     * internal IDs to clients.
     */
    public function createSigningSession(Agreement $agreement): string;

    /**
     * Validate + record a signature submission. Implementations are
     * responsible for stamping the Agreement's signer_* fields and
     * generating the signed PDF. Returns true on success, false on
     * validation failure (controller returns 422).
     */
    public function recordSignature(Agreement $agreement, array $payload, Request $request): bool;
}
