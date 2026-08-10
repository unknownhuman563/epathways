<?php

return [
    // Seconds to wait before sending. A small buffer so a mis-clicked stage
    // change that is corrected quickly does not email the client — the job
    // re-checks the lead's current stage before sending (see the Job).
    'delay_seconds' => (int) env('STAGE_EMAIL_DELAY_SECONDS', 3),

    // Pipeline stage (a Lead::STAGES value, stored in leads.status) => the
    // immutable MessageTemplate key to send when a lead MOVES INTO that stage.
    //
    // Only stages listed here trigger an automatic email. The template must
    // exist (in any folder) with this key on the shared set; a missing key is
    // a harmless no-op (CommunicationService logs a warning and sends nothing).
    'map' => [
        'New Leads' => 'fresh_leads',
        'Contact Attempted' => 'missed_the_call_1',
        'Contacted for Booking' => 'contacted_for_booking_1',
        'Qualified but Not Ready' => 'qualified_but_not_ready',
        'Qualified but No Funds' => 'qualified_but_no_funds',
        'Consultation Done' => 'consultation_done',
        'Not Qualified' => 'not_qualified',
    ],
];
