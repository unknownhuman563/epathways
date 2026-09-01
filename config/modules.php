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
    ],

];
