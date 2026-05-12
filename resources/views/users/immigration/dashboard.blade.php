@extends('layouts.dashboard')

@section('title', 'Immigration Dashboard')

@section('content')
<div class="space-y-6 max-w-7xl">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        @foreach (['Open cases', 'Resident intakes', 'Awaiting documents', 'Approved'] as $label)
            <div class="p-6 rounded-3xl bg-white border border-gray-50 shadow-sm">
                <p class="text-sm text-gray-500">{{ $label }}</p>
                <p class="mt-2 text-3xl font-bold text-gray-900 tracking-tight">—</p>
            </div>
        @endforeach
    </div>
    <div class="bg-white rounded-3xl border border-gray-50 shadow-sm p-8">
        <h2 class="text-lg font-bold text-gray-900">Immigration portal</h2>
        <p class="mt-2 text-sm text-gray-500 max-w-2xl">Scaffold for the immigration team — wire up visa cases, resident intakes, document tracking and approvals here.</p>
        <p class="mt-4 text-xs text-gray-400">resources/views/users/immigration/dashboard.blade.php</p>
    </div>
</div>
@endsection
