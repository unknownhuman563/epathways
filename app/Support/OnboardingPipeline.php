<?php

namespace App\Support;

/**
 * The onboarding state machine for EOI submissions. Single source of truth for
 * the ordered pipeline stages, the terminal failure states, and the allowed
 * transitions between them. The legacy flat statuses (new / reviewed /
 * shortlisted / declined) remain valid — they're the first stages here.
 */
class OnboardingPipeline
{
    /** Ordered, in-pipeline stages (index = stage order). */
    public const STAGES = [
        'new',
        'reviewed',
        'shortlisted',
        'viewing_email_sent',
        'viewing_booked',
        'viewing_completed',
        'post_viewing_followup',
        'pre_tenancy_form_sent',
        'pre_tenancy_form_completed',
        'agreement_sent',
        'agreement_signed',
        'invoice_sent',
        'payment_confirmed',
        'moved_in',
    ];

    /** Off-pipeline terminal failure states. */
    public const TERMINALS = ['declined', 'not_proceeding'];

    /** Stages considered "done" / no longer needing pipeline attention. */
    public const OFF_PIPELINE = ['declined', 'not_proceeding', 'moved_in'];

    /** from => [allowed destinations]. */
    public const TRANSITIONS = [
        'new' => ['reviewed', 'declined'],
        'reviewed' => ['shortlisted', 'declined'],
        'shortlisted' => ['viewing_email_sent', 'declined'],
        'viewing_email_sent' => ['viewing_booked', 'declined'],
        'viewing_booked' => ['viewing_completed', 'not_proceeding'],
        'viewing_completed' => ['post_viewing_followup', 'not_proceeding', 'declined'],
        'post_viewing_followup' => ['pre_tenancy_form_sent', 'not_proceeding', 'declined'],
        'pre_tenancy_form_sent' => ['pre_tenancy_form_completed', 'not_proceeding'],
        'pre_tenancy_form_completed' => ['agreement_sent', 'declined'],
        'agreement_sent' => ['agreement_signed', 'not_proceeding'],
        'agreement_signed' => ['invoice_sent'],
        'invoice_sent' => ['payment_confirmed', 'not_proceeding'],
        'payment_confirmed' => ['moved_in'],
        'moved_in' => [],
        // Terminal states can be re-opened back to reviewed.
        'declined' => ['reviewed'],
        'not_proceeding' => ['reviewed'],
    ];

    /**
     * Target stage => timestamp column auto-set to now() on entry. Stages whose
     * timestamp is supplied by staff (viewing_booked → viewing_scheduled_at,
     * moved_in → move_in_date) are intentionally absent.
     */
    public const AUTO_TIMESTAMP = [
        'viewing_email_sent' => 'viewing_email_sent_at',
        'viewing_completed' => 'viewing_completed_at',
        'post_viewing_followup' => 'post_viewing_followup_at',
        'pre_tenancy_form_sent' => 'pre_tenancy_form_sent_at',
        'pre_tenancy_form_completed' => 'pre_tenancy_form_completed_at',
        'agreement_sent' => 'tenancy_agreement_sent_at',
        'agreement_signed' => 'tenancy_agreement_signed_at',
        'invoice_sent' => 'invoice_sent_at',
        'payment_confirmed' => 'payment_confirmed_at',
    ];

    /** Every valid status value (pipeline + terminals). */
    public static function allStatuses(): array
    {
        return array_merge(self::STAGES, self::TERMINALS);
    }

    public static function isValidStatus(string $status): bool
    {
        return in_array($status, self::allStatuses(), true);
    }

    public static function canTransition(string $from, string $to): bool
    {
        return in_array($to, self::TRANSITIONS[$from] ?? [], true);
    }

    public static function allowedFrom(string $from): array
    {
        return self::TRANSITIONS[$from] ?? [];
    }

    /** Position in the pipeline (for sorting); terminals sort last. */
    public static function stageOrder(string $status): int
    {
        $i = array_search($status, self::STAGES, true);

        return $i === false ? 999 : $i;
    }

    public static function isTerminal(string $status): bool
    {
        return in_array($status, self::TERMINALS, true);
    }
}
