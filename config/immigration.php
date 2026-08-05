<?php

return [

    /*
    |--------------------------------------------------------------------------
    | IAA licence expiry warnings
    |--------------------------------------------------------------------------
    |
    | Days-before-expiry at which a licensed adviser (and the admins) are
    | actively notified that their IAA licence is approaching its cliff. Build
    | 12 §2 made the licence load-bearing — an expired/absent expiry silently
    | closes AdviceBearingPolicy, so nobody could record a verdict on a Monday.
    | The `immigration:licence-expiry-check` command reads this list.
    |
    | The dashboard IaaComplianceCard is the always-on passive backstop; these
    | thresholds drive the active push notification.
    |
    */
    'licence_warning_days' => [30, 14],

    /*
    |--------------------------------------------------------------------------
    | Case custody ageing (Build 12 phase 2)
    |--------------------------------------------------------------------------
    |
    | The Cases board colours a case by how long it has been STUCK — days since
    | `last_activity_at` — not by how long the current owner has held it. A case
    | someone is actively working for twelve days is not a problem; a case
    | untouched for ten is. The "With" column shows the ownership duration as
    | plain text; these thresholds drive the colour.
    |
    | amber = getting stale, red = stuck. Days, on last_activity_at. Starting
    | values, not a decision (Build 12 §14.3) — tune from real dwell times.
    |
    */
    'custody_stale_amber_days' => 6,
    'custody_stale_red_days' => 10,

    /*
    |--------------------------------------------------------------------------
    | Case assist — findings rules (Build 12 phase 3)
    |--------------------------------------------------------------------------
    |
    | Thresholds the rules engine reads. Kept here (not hardcoded) because rule
    | noise is the failure mode: if a typical case surfaces a wall of findings,
    | staff stop reading the panel. Tune from the dismissal rate per finding_key.
    |
    */
    'findings' => [
        'doc_request_unanswered_days' => 5,
        'no_contact_days' => 14,
        'passport_expiry_months' => 6,
        // Grace before an invoiced-but-unpaid case is flagged (Build 12 phase
        // 4.5 — the invoice-overdue rule graduated off "couldn't verify" once
        // case_payments exists).
        'payment_overdue_days' => 7,
    ],

    /*
    |--------------------------------------------------------------------------
    | Process chain — step ownership resolver (Build 12 phase 4.5)
    |--------------------------------------------------------------------------
    |
    | Maps a template owner_role (a process function) to a user id. Env-specific;
    | leave null and a human assigns via handoff. `adviser` also falls back to
    | the sole licensed adviser when unset. Set these per deployment.
    |
    */
    'step_owners' => [
        'coordinator' => null,
        'qc' => null,
        'ops' => null,
        'adviser' => null,
    ],

];
