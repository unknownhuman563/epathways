@extends('layouts.dashboard')

@section('title', 'Sales Dashboard')
@section('heading', 'Sales Dashboard')
@section('subheading', 'Leads pipeline & consultation bookings')

@section('content')
@php
    $delta = ($leadStats['this_month'] ?? 0) - ($leadStats['last_month'] ?? 0);
    $statusClass = fn ($s) => [
        'New' => 'bg-blue-100 text-blue-700 border-blue-200',
        'Contacted' => 'bg-amber-100 text-amber-700 border-amber-200',
        'Qualified' => 'bg-purple-100 text-purple-700 border-purple-200',
        'Processing' => 'bg-indigo-100 text-indigo-700 border-indigo-200',
        'Closed' => 'bg-emerald-100 text-emerald-700 border-emerald-200',
    ][$s] ?? 'bg-gray-100 text-gray-700 border-gray-200';
    $bookingClass = fn ($s) => [
        'Pending' => 'bg-amber-100 text-amber-700 border-amber-200',
        'Confirmed' => 'bg-blue-100 text-blue-700 border-blue-200',
        'Completed' => 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Cancelled' => 'bg-red-100 text-red-700 border-red-200',
    ][$s] ?? 'bg-gray-100 text-gray-700 border-gray-200';
    $scoreClass = fn ($n) => $n >= 70 ? 'bg-emerald-100 text-emerald-700' : ($n >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700');
    $maxMonth = max(1, ...array_map(fn ($m) => $m['count'], $leadsByMonth ?: [['count' => 0]]));
@endphp

<div class="space-y-6 max-w-7xl">
    {{-- Stat cards --}}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-6 rounded-3xl bg-gray-900 text-white shadow-lg">
            <p class="text-sm text-gray-300">Total leads</p>
            <p class="mt-2 text-3xl font-bold tracking-tight">{{ $leadStats['total'] }}</p>
            <p class="mt-2 text-xs font-semibold {{ $delta >= 0 ? 'text-emerald-400' : 'text-red-400' }}">
                {{ $delta >= 0 ? '+'.$delta : $delta }} vs last month
            </p>
        </div>
        <div class="p-6 rounded-3xl bg-white border border-gray-50 shadow-sm">
            <p class="text-sm text-gray-500">New leads</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 tracking-tight">{{ $leadStats['new'] }}</p>
            <p class="mt-2 text-xs text-gray-400">awaiting first contact</p>
        </div>
        <div class="p-6 rounded-3xl bg-white border border-gray-50 shadow-sm">
            <p class="text-sm text-gray-500">Qualified / processing</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 tracking-tight">{{ $leadStats['qualified'] }}</p>
            <p class="mt-2 text-xs text-gray-400">{{ $leadStats['closed'] }} closed</p>
        </div>
        <div class="p-6 rounded-3xl bg-white border border-gray-50 shadow-sm">
            <p class="text-sm text-gray-500">Upcoming consultations</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 tracking-tight">{{ $bookingStats['upcoming'] }}</p>
            <p class="mt-2 text-xs text-gray-400">{{ $bookingStats['pending'] }} pending confirmation</p>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {{-- Leads per month --}}
        <div class="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
            <h2 class="text-lg font-bold text-gray-900 mb-6">Leads — last 6 months</h2>
            <div class="h-56 flex items-end gap-3">
                @forelse ($leadsByMonth as $m)
                    <div class="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                        <span class="text-xs font-semibold text-gray-600">{{ $m['count'] }}</span>
                        <div class="w-full rounded-t-xl bg-gray-900" style="height: {{ max(4, round($m['count'] / $maxMonth * 100)) }}%"></div>
                        <span class="text-xs text-gray-400">{{ $m['label'] }}</span>
                    </div>
                @empty
                    <p class="text-sm text-gray-400">No data yet.</p>
                @endforelse
            </div>
        </div>

        {{-- AI assessments --}}
        <div class="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex flex-col">
            <h2 class="text-lg font-bold text-gray-900 mb-4">AI assessments</h2>
            <div class="space-y-3 text-sm">
                <div class="flex items-center justify-between">
                    <span class="text-gray-500">Completed</span>
                    <span class="font-bold text-gray-900">{{ $leadStats['ai_done'] }}</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-gray-500">Processing</span>
                    <span class="font-bold text-gray-900">{{ $leadStats['ai_pending'] }}</span>
                </div>
            </div>
            <a href="{{ url('/portal/sales/leads') }}" class="mt-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                View all leads
            </a>
        </div>
    </div>

    {{-- Recent leads --}}
    <div class="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
        <div class="px-6 py-5 flex items-center justify-between">
            <h2 class="text-lg font-bold text-gray-900">Recent leads</h2>
            <a href="{{ url('/portal/sales/leads') }}" class="text-sm font-semibold text-blue-600 hover:text-blue-800">All leads →</a>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th class="px-6 py-3">Lead</th>
                        <th class="px-6 py-3">Course</th>
                        <th class="px-6 py-3">AI score</th>
                        <th class="px-6 py-3">Status</th>
                        <th class="px-6 py-3">Created</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    @forelse ($recentLeads as $lead)
                        <tr class="hover:bg-gray-50/40">
                            <td class="px-6 py-3">
                                <div class="font-semibold text-gray-900 text-sm">{{ $lead['name'] }}</div>
                                <div class="text-xs text-gray-400">{{ $lead['email'] ?? '—' }}</div>
                            </td>
                            <td class="px-6 py-3 text-sm text-gray-600">{{ $lead['course'] ?? '—' }}</td>
                            <td class="px-6 py-3">
                                @if (! is_null($lead['ai_score']))
                                    <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-bold {{ $scoreClass($lead['ai_score']) }}">{{ $lead['ai_score'] }}/100</span>
                                @else
                                    <span class="text-xs text-gray-400">{{ $lead['ai_status'] === 'processing' ? 'analyzing…' : '—' }}</span>
                                @endif
                            </td>
                            <td class="px-6 py-3"><span class="inline-flex px-2.5 py-1 rounded-full text-xs font-bold border {{ $statusClass($lead['status']) }}">{{ $lead['status'] }}</span></td>
                            <td class="px-6 py-3 text-sm text-gray-500">{{ \Illuminate\Support\Carbon::parse($lead['created_at'])->format('d M Y') }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="5" class="px-6 py-12 text-center text-gray-400 text-sm">No leads yet.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    {{-- Upcoming consultations --}}
    <div class="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
        <div class="px-6 py-5 flex items-center justify-between">
            <h2 class="text-lg font-bold text-gray-900">Upcoming consultations</h2>
            <a href="{{ url('/portal/sales/bookings') }}" class="text-sm font-semibold text-blue-600 hover:text-blue-800">All bookings →</a>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th class="px-6 py-3">Client</th>
                        <th class="px-6 py-3">Service</th>
                        <th class="px-6 py-3">When</th>
                        <th class="px-6 py-3">Consultant</th>
                        <th class="px-6 py-3">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    @forelse ($upcomingBookings as $b)
                        <tr class="hover:bg-gray-50/40">
                            <td class="px-6 py-3">
                                <div class="font-semibold text-gray-900 text-sm">{{ $b['name'] }}</div>
                                <div class="text-xs text-gray-400">{{ $b['email'] ?? '—' }}</div>
                            </td>
                            <td class="px-6 py-3 text-sm text-gray-600">{{ $b['service_type'] ?? '—' }}</td>
                            <td class="px-6 py-3 text-sm text-gray-600">
                                {{ $b['appointment_date'] ? \Illuminate\Support\Carbon::parse($b['appointment_date'])->format('d M Y') : 'TBD' }}{{ $b['appointment_time'] ? ' · '.$b['appointment_time'] : '' }}
                            </td>
                            <td class="px-6 py-3 text-sm text-gray-600">{{ $b['consultant_name'] ?? '—' }}</td>
                            <td class="px-6 py-3"><span class="inline-flex px-2.5 py-1 rounded-full text-xs font-bold border {{ $bookingClass($b['status']) }}">{{ $b['status'] }}</span></td>
                        </tr>
                    @empty
                        <tr><td colspan="5" class="px-6 py-12 text-center text-gray-400 text-sm">No upcoming consultations.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
