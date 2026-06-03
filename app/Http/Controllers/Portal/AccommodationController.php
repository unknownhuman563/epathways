<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Property;
use Illuminate\Support\Facades\Log;

class AccommodationController extends Controller
{
    /**
     * Accommodation overview — real stats from the property listings that power
     * the public accommodation page.
     */
    public function dashboard()
    {
        try {
            return inertia('portal/accommodation/Dashboard', [
                'propertyStats' => [
                    'total' => Property::count(),
                    'available' => Property::where('status', 'available')->count(),
                    'unavailable' => Property::where('status', 'unavailable')->count(),
                ],
                'recentProperties' => Property::with('images')->latest()->take(5)->get(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Accommodation dashboard failed', ['error' => $e->getMessage()]);

            return inertia('portal/accommodation/Dashboard', [
                'propertyStats' => array_fill_keys(['total', 'available', 'unavailable'], 0),
                'recentProperties' => collect(),
            ]);
        }
    }
}
