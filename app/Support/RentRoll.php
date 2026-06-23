<?php

namespace App\Support;

use Illuminate\Support\Carbon;

/**
 * Pure helpers for the rent roll: Monday-anchored week math and the payment
 * status string. Kept free of Eloquent so it can be unit-tested in isolation.
 */
class RentRoll
{
    public static function snapToMonday(Carbon $date): Carbon
    {
        return $date->copy()->startOfWeek(Carbon::MONDAY)->startOfDay();
    }

    /** @return array<int, array{start: string, label: string}> */
    public static function weekColumns(Carbon $start, int $weeks): array
    {
        $monday = self::snapToMonday($start);
        $cols = [];

        for ($i = 0; $i < $weeks; $i++) {
            $d = $monday->copy()->addWeeks($i);
            $cols[] = ['start' => $d->toDateString(), 'label' => 'WK '.$d->format('d M')];
        }

        return $cols;
    }

    public static function status(float $due, float $paid): string
    {
        $due = round($due, 2);

        if ($due <= 0.0) {
            return 'Set weekly rent & utilities';
        }

        $diff = round($paid - $due, 2);

        if ($diff === 0.0) {
            return 'Paid up';
        }

        if ($diff < 0.0) {
            return 'Underpaid — short $'.number_format(abs($diff), 2);
        }

        return 'Overpaid — credit $'.number_format($diff, 2);
    }
}
