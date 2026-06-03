<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\EoiSubmission;
use App\Models\Property;
use Illuminate\Support\Facades\Log;

class AccommodationController extends Controller
{
    /**
     * Accommodation overview — property listings + Expression of Interest stats.
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
                'applicationStats' => [
                    'total' => EoiSubmission::count(),
                    'new' => EoiSubmission::where('status', 'new')->count(),
                    'hot' => EoiSubmission::where('form_type', 'hot')->count(),
                    'cold' => EoiSubmission::where('form_type', 'cold')->count(),
                ],
                'recentProperties' => Property::with('images')->latest()->take(5)->get(),
                'recentApplications' => EoiSubmission::latest()->take(5)->get(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Accommodation dashboard failed', ['error' => $e->getMessage()]);

            return inertia('portal/accommodation/Dashboard', [
                'propertyStats' => array_fill_keys(['total', 'available', 'unavailable'], 0),
                'applicationStats' => array_fill_keys(['total', 'new', 'hot', 'cold'], 0),
                'recentProperties' => collect(),
                'recentApplications' => collect(),
            ]);
        }
    }
}
