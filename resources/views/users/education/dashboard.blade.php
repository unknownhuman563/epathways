@extends('layouts.dashboard')

@section('title', 'Education Dashboard')

@section('content')
<div class="space-y-6 max-w-7xl">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        @foreach (['Active students', 'Applications', 'Offers issued', 'Enrolments'] as $label)
            <div class="p-6 rounded-3xl bg-white border border-gray-50 shadow-sm">
                <p class="text-sm text-gray-500">{{ $label }}</p>
                <p class="mt-2 text-3xl font-bold text-gray-900 tracking-tight">—</p>
            </div>
        @endforeach
    </div>
    <div class="bg-white rounded-3xl border border-gray-50 shadow-sm p-8">
        <h2 class="text-lg font-bold text-gray-900">Education portal</h2>
        <p class="mt-2 text-sm text-gray-500 max-w-2xl">Scaffold for the education team — wire up programmes, student applications, offers and enrolments here.</p>
        <p class="mt-4 text-xs text-gray-400">resources/views/users/education/dashboard.blade.php</p>
    </div>
</div>
@endsection
