<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\VisaType;
use App\Models\VisaTypePriceHistory;
use Illuminate\Database\Seeder;

class VisaTypePriceHistorySeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->whereIn('role', [User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN])
            ->orderBy('id')->first();

        VisaType::query()->each(function (VisaType $type) use ($admin) {
            $exists = VisaTypePriceHistory::query()->where('visa_type_id', $type->id)->exists();
            if ($exists) return;

            VisaTypePriceHistory::create([
                'visa_type_id'       => $type->id,
                'old_price_nzd'      => null,
                'new_price_nzd'      => $type->consultation_price_nzd,
                'changed_by_user_id' => $admin?->id,
                'reason'             => 'Initial price set during system setup.',
                'changed_at'         => $type->created_at ?? now(),
            ]);
        });
    }
}
