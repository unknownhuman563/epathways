<?php

namespace App\Http\Controllers\Portal\Accommodation;

use App\Http\Controllers\Controller;
use App\Models\Property;

class PaymentScheduleController extends Controller
{
    public function index()
    {
        $properties = Property::where('is_active', true)
            ->orderByRaw('code IS NULL, CAST(code AS UNSIGNED)')
            ->get()
            ->map(fn (Property $p) => [
                'id' => $p->id,
                'code' => $p->code,
                'address' => $p->address ?: $p->name,
                'manager_name' => $p->property_manager_name,
                'manager_phone' => $p->property_manager_phone,
                'manager_email' => $p->property_manager_email,
                'payment_schedule' => $p->pm_payment_schedule,
            ])
            ->all();

        return inertia('portal/accommodation/PaymentSchedule', [
            'properties' => $properties,
        ]);
    }
}
