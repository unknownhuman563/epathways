<?php

namespace App\Services;

/**
 * Lead Journey Phases — collapses the 19 internal pipeline stages into 4
 * lead-facing phases. The lead portal renders a roadmap off this so
 * applicants see a coherent path; staff edits to internal stages only
 * "show up" on the lead's side when the phase boundary is crossed.
 *
 * Phase order is the canonical Sales → Education/Immigration → Outcome flow.
 * Stages that don't fit a phase fall back to "Discovery".
 */
class LeadPhaseService
{
    /**
     * The lead portal is gated to engaged (paying) clients only, so the
     * roadmap here is the ENGAGE flow — what happens after they've signed
     * the consultancy agreement and paid. Pre-engagement (PROCESS) is
     * staff-only territory and never surfaces on the portal.
     */
    public const PHASES = [
        [
            'key'         => 'agreement',
            'label'       => 'Agreement & Payment',
            'department'  => 'Sales',
            'description' => 'Sign your consultancy agreement and complete payment.',
            'lead_copy'   => "Welcome aboard. Sign your consultancy agreement and complete your initial payment with Bryll. Once received, we'll kick off your application.",
            'stages'      => [
                'Proposal Sent',
                'Consultancy Agreement',
            ],
        ],
        [
            'key'         => 'enrolment',
            'label'       => 'Enrolment',
            'department'  => 'Education',
            'description' => 'Applications to NZ institutions, English prep, Offer of Place.',
            'lead_copy'   => "Emma is preparing your application to your chosen New Zealand institution. You'll receive a Conditional (CoOP) or Unconditional Offer of Place.",
            'stages'      => [
                'English Pro',
                'School Enrollment',
            ],
        ],
        [
            'key'         => 'visa',
            'label'       => 'Visa Process',
            'department'  => 'Immigration',
            'description' => 'Engagement agreement, document checklist, INZ lodgement.',
            'lead_copy'   => "Your Immigration adviser is guiding you through the engagement agreement, your document checklist, and visa application — right through to lodgement with Immigration New Zealand.",
            'stages'      => [
                'Visa Process',
            ],
        ],
        [
            'key'         => 'outcome',
            'label'       => 'Outcome',
            'department'  => null,
            'description' => 'Pathway conclusion or alternative recommendation.',
            'lead_copy'   => 'Your ePathways journey has reached a conclusion. See the details below for next steps.',
            'stages'      => [
                'Not Qualified',
                'Work Pathway / Other',
            ],
        ],
    ];

    /**
     * Stages that mean the lead is still in pre-engagement / PROCESS. If a
     * portal account exists while the lead sits here (shouldn't normally
     * happen), the frontend renders an "engagement is being set up" notice
     * instead of pretending they're already in phase 1.
     */
    public const PRE_ENGAGEMENT_STAGES = [
        'New Leads',
        'Contact Attempted',
        'Contacted for Booking',
        'Booking Confirmation with Bryll',
        'Missed the Meeting',
        'Qualified but Not Ready',
        'Qualified but No Funds',
        'Qualified',
        'Booked Consultation',
        'Did Not Book Consultation',
        'No Show',
        'Consultation Done',
    ];

    public static function isPreEngagement(?string $stage): bool
    {
        return in_array((string) $stage, self::PRE_ENGAGEMENT_STAGES, true);
    }

    /** The phase a given stage belongs to. Defaults to Discovery. */
    public static function phaseFor(?string $stage): array
    {
        $stage = (string) $stage;
        foreach (self::PHASES as $i => $phase) {
            if (in_array($stage, $phase['stages'], true)) {
                return array_merge(['index' => $i], $phase);
            }
        }
        return array_merge(['index' => 0], self::PHASES[0]);
    }

    /**
     * Build the roadmap for a stage — every phase tagged with state
     * (done / current / upcoming) so the frontend can render the stepper.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function roadmap(?string $stage): array
    {
        $current = self::phaseFor($stage);
        $idx = $current['index'];

        $out = [];
        foreach (self::PHASES as $i => $phase) {
            $out[] = [
                'key'         => $phase['key'],
                'label'       => $phase['label'],
                'department'  => $phase['department'],
                'description' => $phase['description'],
                'lead_copy'   => $phase['lead_copy'],
                'state'       => $i < $idx ? 'done' : ($i === $idx ? 'current' : 'upcoming'),
            ];
        }
        return $out;
    }
}
