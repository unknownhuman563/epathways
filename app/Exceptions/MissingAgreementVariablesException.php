<?php

namespace App\Exceptions;

/**
 * Thrown by AgreementService::generate when one or more required template
 * variables haven't been filled (neither auto-resolved from the lead nor
 * supplied as extras). The controller catches this and returns 422 with
 * the missing list so the modal can highlight the fields.
 */
class MissingAgreementVariablesException extends \DomainException
{
    /** @var array<int, string> */
    public array $missing;

    public function __construct(array $missing)
    {
        $this->missing = array_values($missing);
        parent::__construct('Missing required agreement variables: ' . implode(', ', $this->missing));
    }
}
