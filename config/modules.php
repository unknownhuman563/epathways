<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Restricted modules
    |--------------------------------------------------------------------------
    |
    | Modules listed here are HIDDEN by default and must be granted per-user by
    | a super admin from Module Management. Super admins always see them.
    |
    | Every module that already exists in the app is GRANDFATHERED — it is NOT
    | listed here, so it stays visible exactly as it is today (role-based). Only
    | add a module here when it should ship hidden-by-default until granted.
    |
    | Keyed by a stable module key (used on the users.module_permissions array
    | and on the frontend nav item's `module` field).
    |
    | A module may expose `features` — grantable SUB-PARTS. A grant may then be
    | the whole module key (`dtr`, implies every feature) or a dotted feature
    | key (`dtr.reports`). `admin_default: true` marks a module admins + super
    | admins always see (it was historically an admin surface); such a module is
    | additionally grantable to non-admin staff. Without it, only super admins
    | see the module until granted (agents, program_verification).
    |
    */
    'restricted' => [
        'agents' => [
            'label' => 'Agents',
            'description' => 'Manage referral agents — their leads, profiles, and agreements.',
        ],
        'program_verification' => [
            'label' => 'Program Verification',
            'description' => 'Verify and approve study proposals before they reach the client.',
        ],
        'dtr' => [
            'label' => 'DTR',
            'description' => 'Daily Time Record admin — grant the whole module or specific parts.',
            'admin_default' => true,
            'features' => [
                'reports' => [
                    'label' => 'Team Daily Reports',
                    'description' => 'See who submitted their end-of-day report and read each report.',
                ],
                'manage' => [
                    'label' => 'Setup Manager',
                    'description' => 'Configure staff schedules, timezones and hours; archive staff.',
                ],
                'summary' => [
                    'label' => 'Summary / Analytics',
                    'description' => 'Team DTR summary and analytics.',
                ],
            ],
        ],
        'portal_invitation' => [
            'label' => 'Portal Invitations',
            'description' => 'Approve/reject/revoke client portal invitations and generate credentials.',
            'admin_default' => true,
        ],
    ],

];
