<?php

/*
|--------------------------------------------------------------------------
| DTR public holidays
|--------------------------------------------------------------------------
| Curated per-country holiday lists shown on the DTR calendar. Proclaimed
| dates shift a little each year (esp. movable/Islamic feasts), so update
| this once a year. Keyed by ISO date → label.
*/

return [
    'PH' => [
        // ── 2026 ──
        '2026-01-01' => "New Year's Day",
        '2026-02-17' => 'Chinese New Year',
        '2026-04-02' => 'Maundy Thursday',
        '2026-04-03' => 'Good Friday',
        '2026-04-04' => 'Black Saturday',
        '2026-04-09' => 'Araw ng Kagitingan',
        '2026-05-01' => 'Labor Day',
        '2026-06-12' => 'Independence Day',
        '2026-08-21' => 'Ninoy Aquino Day',
        '2026-08-31' => 'National Heroes Day',
        '2026-11-01' => "All Saints' Day",
        '2026-11-30' => 'Bonifacio Day',
        '2026-12-08' => 'Immaculate Conception',
        '2026-12-24' => 'Christmas Eve',
        '2026-12-25' => 'Christmas Day',
        '2026-12-30' => 'Rizal Day',
        '2026-12-31' => "New Year's Eve",
        // ── 2027 (fixed-date anchors; add movable feasts when proclaimed) ──
        '2027-01-01' => "New Year's Day",
        '2027-04-09' => 'Araw ng Kagitingan',
        '2027-05-01' => 'Labor Day',
        '2027-06-12' => 'Independence Day',
        '2027-11-30' => 'Bonifacio Day',
        '2027-12-25' => 'Christmas Day',
        '2027-12-30' => 'Rizal Day',
    ],

    'NZ' => [
        // ── 2026 ──
        '2026-01-01' => "New Year's Day",
        '2026-01-02' => 'Day after New Year',
        '2026-02-06' => 'Waitangi Day',
        '2026-04-03' => 'Good Friday',
        '2026-04-06' => 'Easter Monday',
        '2026-04-27' => 'Anzac Day (obs.)',
        '2026-06-01' => "King's Birthday",
        '2026-07-10' => 'Matariki',
        '2026-10-26' => 'Labour Day',
        '2026-12-25' => 'Christmas Day',
        '2026-12-28' => 'Boxing Day (obs.)',
        // ── 2027 ──
        '2027-01-01' => "New Year's Day",
        '2027-02-06' => 'Waitangi Day',
        '2027-12-25' => 'Christmas Day',
    ],
];
