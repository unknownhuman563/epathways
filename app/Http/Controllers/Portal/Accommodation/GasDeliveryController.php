<?php

namespace App\Http\Controllers\Portal\Accommodation;

use App\Http\Controllers\Controller;
use App\Models\Property;

class GasDeliveryController extends Controller
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
                'uses_bottled_gas' => (bool) $p->uses_bottled_gas,
                'last_gas_purchase' => optional($p->last_gas_purchase)->toDateString(),
            ])
            ->all();

        return inertia('portal/accommodation/GasDelivery', [
            'properties' => $properties,
        ]);
    }
}
