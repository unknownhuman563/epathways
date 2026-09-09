<?php

namespace App\Support;

/**
 * Shared facts about in-progress visa-intake drafts.
 *
 * These live in a plain class rather than on the SavesIntakeDraft trait because
 * PHP forbids reading a trait constant through the trait name — the Assessments
 * controller needs the source map without using the trait, and doing it the
 * other way silently emptied the whole page.
 */
final class VisaIntakeDraft
{
    /**
     * `leads.source` value per visa type. Mirrors the existing
     * 'free-assessment' / 'education-enrolment' convention so the Assessments
     * query picks drafts up and reads the visa type straight back off it.
     */
    public const SOURCES = [
        'resident' => 'resident-interest',
        'work' => 'work-interest',
        'student' => 'student-interest',
        'visitor' => 'visitor-interest',
        'family' => 'family-interest',
    ];

    /** Visa type behind a draft lead's source, or null when it isn't one. */
    public static function visaTypeForSource(?string $source): ?string
    {
        $key = array_search($source, self::SOURCES, true);

        return $key === false ? null : $key;
    }

    /**
     * How much of the saved form is filled in, counting scalar leaves so a
     * nested answer block doesn't count as a single field.
     *
     * Measures COMPLETENESS only — how far through the form they are. It is
     * never an eligibility or outcome signal; that assessment belongs to the
     * licensed adviser.
     *
     * @return array{0:int,1:int,2:int} [filled, total, percent]
     */
    public static function readiness(?array $payload): array
    {
        $total = 0;
        $filled = 0;

        $walk = function ($value) use (&$walk, &$total, &$filled) {
            if (is_array($value)) {
                foreach ($value as $item) {
                    $walk($item);
                }

                return;
            }
            $total++;
            if ($value !== null && $value !== '' && $value !== false) {
                $filled++;
            }
        };
        $walk($payload ?? []);

        return [$filled, $total, $total > 0 ? (int) round($filled / $total * 100) : 0];
    }
}
