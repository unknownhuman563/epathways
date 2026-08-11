<?php

namespace App\Exceptions;

/**
 * Thrown when step 12 (Upload to INZ / lodgement) is completed without an
 * adviser lodgement sign-off on record (Build 12 phase 5). Dev may operate the
 * mechanical upload, but the step's completion derives from the licensed
 * adviser's sign-off — not the upload — so the two never collapse into one act.
 */
class LodgementSignoffRequiredException extends \DomainException
{
    public function __construct(string $message = 'Lodgement requires an adviser sign-off — the upload alone does not complete step 12.')
    {
        parent::__construct($message);
    }
}
