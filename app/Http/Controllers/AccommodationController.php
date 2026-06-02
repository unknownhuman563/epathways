<?php

namespace App\Http\Controllers;

use App\Models\Property;

class AccommodationController extends Controller
{
    public function index()
    {
        $properties = Property::with('images')
            ->where('status', 'available')
            ->latest()
            ->get();

        return inertia('accommodation/AccommodationPage', ['properties' => $properties]);
    }

    public function show($id)
    {
        $property = Property::with('images')
            ->where('status', 'available')
            ->findOrFail($id);

        return inertia('accommodation/PropertyDetails', ['property' => $property]);
    }
}
