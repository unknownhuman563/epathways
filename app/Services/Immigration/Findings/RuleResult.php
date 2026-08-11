<?php

namespace App\Services\Immigration\Findings;

/**
 * What a single rule returns: zero or more findings, plus zero or more
 * "couldn't verify" notes for anything the rule was unable to check (missing
 * data, or a capability that doesn't exist yet). The couldn't-verify notes are
 * required output — the panel must never read as "clean" when it means "nothing
 * found in what I could read".
 */
class RuleResult
{
    /**
     * @param  array<int, array<string, mixed>>  $findings
     * @param  array<int, string>  $couldntVerify
     */
    public function __construct(
        public array $findings = [],
        public array $couldntVerify = [],
    ) {}

    public static function empty(): self
    {
        return new self;
    }

    /** A rule that could only report what it couldn't check. */
    public static function couldntVerify(string ...$notes): self
    {
        return new self([], array_values($notes));
    }
}
