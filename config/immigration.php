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

];
