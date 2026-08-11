<?php

namespace App\Exceptions;

/**
 * Thrown when a user without a current IAA licence attempts to write an
 * advice-bearing attestation (Build 12 phase 5). The controller gates first and
 * returns 403; this is the defense-in-depth backstop so no code path can create
 * a case_attestations row without passing the licence gate.
 */
class AdviceGateException extends \DomainException
{
    public function __construct(string $message = 'Only a current licensed adviser may record this advice-bearing attestation.')
    {
        parent::__construct($message);
    }
}
