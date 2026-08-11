<?php

namespace App\Exceptions;

use App\Models\User;

/**
 * Thrown when an engagement pack would be generated under a signing adviser
 * whose IAA licence is not current (Build 12 fast-follow). The signer's number
 * and signature print on a client-facing legal document, so a lapsed licence
 * must block generation rather than issue written advice under a dead licence.
 *
 * The controller catches this and returns a clear, named error — no stack
 * trace, no 500 — so staff see exactly which adviser and which expiry.
 */
class StaleSignerLicenceException extends \DomainException
{
    public function __construct(public readonly User $signer)
    {
        $expiry = optional($signer->iaa_licence_expiry)->toFormattedDateString();
        $reason = $signer->iaa_licence_expiry
            ? "expired {$expiry}"
            : 'no expiry on record';

        parent::__construct(
            "Cannot generate — {$signer->name}'s IAA licence is not current ({$reason}). "
            .'A pack cannot be signed under a lapsed licence. Choose a currently-licensed adviser, '
            .'or ask an administrator to update the licence record.'
        );
    }
}
