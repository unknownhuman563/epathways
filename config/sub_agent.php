<?php

/**
 * Sub-agent portal tuning — the follow-up cadence, the call scripts shown on
 * the Follow-ups screen, and the country → timezone map behind its "time zones
 * now" rail. All three are copy/policy, not logic: change them here rather than
 * at the call sites in Portal\SubAgentController.
 */
return [

    /*
    |--------------------------------------------------------------------------
    | Follow-up cadence
    |--------------------------------------------------------------------------
    | `offsets` are days after a referral lands. The first entry is rendered as
    | hours when it is under a day ("24 h"). `max_attempts` is how many logged
    | call attempts happen before a lead is marked unresponsive and released.
    */
    'cadence' => [
        'offsets' => [1, 3, 7, 14],
        'max_attempts' => 4,
        'rule' => 'Call within :first of a referral arriving, then :rest. After :attempts attempts with no reply, mark unresponsive and release.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Referral value
    |--------------------------------------------------------------------------
    | What a sub-agent is paid when a referral converts, shown on the lead's
    | Overview tab. There is no per-lead commission model in the database, so
    | this is a flat policy figure — leave `amount` null and the card reads
    | "not set" rather than inventing a number.
    */
    'referral_value' => [
        'amount' => env('SUB_AGENT_REFERRAL_VALUE'),
        'currency' => 'NZD',
        'caption' => 'paid on conversion',
    ],

    /*
    |--------------------------------------------------------------------------
    | Extra documents
    |--------------------------------------------------------------------------
    | One-click presets on the Documents tab for files beyond the four required
    | ones. Anything not listed here can still be added under a custom name.
    */
    'extra_documents' => [
        'Police certificate',
        'Medical certificate',
        'Bank statement',
        'Job offer',
        'IELTS / English test',
    ],

    /*
    |--------------------------------------------------------------------------
    | Call scripts
    |--------------------------------------------------------------------------
    | `[name]` and `[source]` are filled client-side from the lead the script is
    | opened against. The first entry is the default opener on the rail.
    */
    'scripts' => [
        [
            'key' => 'first_contact',
            'label' => 'First contact',
            'body' => 'Hi [name], I\'m calling from ePathways about the enquiry you made at [source]. I help gather the paperwork before our licensed adviser looks at your case — is now a good time for five minutes?',
        ],
        [
            'key' => 'no_answer',
            'label' => 'No answer / voicemail',
            'body' => 'Hi [name], this is [me] from ePathways about your [source] enquiry. I\'ll try again in a couple of days — or reply to the email I\'ve just sent and we\'ll book a time that suits you.',
        ],
        [
            'key' => 'chasing_documents',
            'label' => 'Chasing documents',
            'body' => 'Hi [name], we\'re just waiting on a few documents before your file can go to our adviser. Could you send your passport, CV, diploma and transcript through the link I emailed? It takes about ten minutes.',
        ],
        [
            'key' => 'hand_over',
            'label' => 'Handing over to the adviser',
            'body' => 'Hi [name], good news — your file is complete, so I\'m handing it to our licensed immigration adviser. They\'ll be in touch with the advice itself; I stay on as your point of contact for paperwork.',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Country → IANA timezone
    |--------------------------------------------------------------------------
    | Keys are lowercased `leads.residence_country` values. Only the countries
    | listed here appear on the Follow-ups "time zones now" rail — an unmapped
    | country is skipped rather than guessed at. Auckland is always shown first
    | as the office clock.
    */
    'office_timezone' => 'Pacific/Auckland',
    'timezones' => [
        'new zealand' => 'Pacific/Auckland',
        'australia' => 'Australia/Sydney',
        'philippines' => 'Asia/Manila',
        'india' => 'Asia/Kolkata',
        'south korea' => 'Asia/Seoul',
        'korea' => 'Asia/Seoul',
        'japan' => 'Asia/Tokyo',
        'china' => 'Asia/Shanghai',
        'vietnam' => 'Asia/Ho_Chi_Minh',
        'thailand' => 'Asia/Bangkok',
        'indonesia' => 'Asia/Jakarta',
        'malaysia' => 'Asia/Kuala_Lumpur',
        'singapore' => 'Asia/Singapore',
        'nepal' => 'Asia/Kathmandu',
        'sri lanka' => 'Asia/Colombo',
        'bangladesh' => 'Asia/Dhaka',
        'pakistan' => 'Asia/Karachi',
        'afghanistan' => 'Asia/Kabul',
        'iran' => 'Asia/Tehran',
        'united arab emirates' => 'Asia/Dubai',
        'saudi arabia' => 'Asia/Riyadh',
        'italy' => 'Europe/Rome',
        'germany' => 'Europe/Berlin',
        'france' => 'Europe/Paris',
        'spain' => 'Europe/Madrid',
        'netherlands' => 'Europe/Amsterdam',
        'united kingdom' => 'Europe/London',
        'ireland' => 'Europe/Dublin',
        'south africa' => 'Africa/Johannesburg',
        'brazil' => 'America/Sao_Paulo',
        'chile' => 'America/Santiago',
        'colombia' => 'America/Bogota',
        'united states' => 'America/New_York',
        'canada' => 'America/Toronto',
        'fiji' => 'Pacific/Fiji',
        'samoa' => 'Pacific/Apia',
        'tonga' => 'Pacific/Tongatapu',
    ],
];
