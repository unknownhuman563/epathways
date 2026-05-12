@extends('layouts.dashboard')

@section('title', 'Accommodation Dashboard')

@section('content')
<div class="space-y-6 max-w-7xl">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        @foreach (['Listings', 'Pending placements', 'Move-ins this month', 'Occupancy'] as $label)
            <div class="p-6 rounded-3xl bg-white border border-gray-50 shadow-sm">
                <p class="text-sm text-gray-500">{{ $label }}</p>
                <p class="mt-2 text-3xl font-bold text-gray-900 tracking-tight">—</p>
            </div>
        @endforeach
    </div>
    <div class="bg-white rounded-3xl border border-gray-50 shadow-sm p-8">
        <h2 class="text-lg font-bold text-gray-900">Accommodation portal</h2>
        <p class="mt-2 text-sm text-gray-500 max-w-2xl">Scaffold for the accommodation team — wire up listings, placements, move-ins and occupancy here.</p>
        <p class="mt-4 text-xs text-gray-400">resources/views/users/accommodation/dashboard.blade.php</p>
    </div>
</div>
@endsection
