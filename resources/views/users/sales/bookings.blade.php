@extends('layouts.dashboard')

@section('title', 'Bookings')
@section('heading', 'Consultation Bookings')
@section('subheading', 'Schedule appointments and update booking status inline')

@section('content')
@php
    $bookingClass = fn ($s) => [
        'Pending' => 'bg-amber-100 text-amber-700 border-amber-200',
        'Confirmed' => 'bg-blue-100 text-blue-700 border-blue-200',
        'Completed' => 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Cancelled' => 'bg-red-100 text-red-700 border-red-200',
    ][$s] ?? 'bg-gray-100 text-gray-700 border-gray-200';
@endphp

<div class="space-y-5 max-w-7xl">
    {{-- Toolbar --}}
    <div class="bg-white rounded-2xl border border-gray-50 shadow-sm p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input type="text" id="bookingSearch" placeholder="Search client, email or service…" oninput="filterBookings()"
               class="w-full lg:w-80 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
        <div class="flex flex-wrap gap-1.5">
            <button type="button" data-filter="All" onclick="setBookingFilter(this)" class="booking-chip px-3.5 py-1.5 rounded-xl text-xs font-bold border bg-gray-900 text-white border-gray-900 shadow-sm">All</button>
            @foreach ($statuses as $s)
                <button type="button" data-filter="{{ $s }}" onclick="setBookingFilter(this)" class="booking-chip px-3.5 py-1.5 rounded-xl text-xs font-bold border bg-white text-gray-600 border-gray-200 hover:bg-gray-50">{{ $s }}</button>
            @endforeach
        </div>
    </div>

    {{-- Table --}}
    <div class="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th class="px-6 py-3">Client</th>
                        <th class="px-6 py-3">Service</th>
                        <th class="px-6 py-3">Schedule &amp; consultant</th>
                        <th class="px-6 py-3">Status</th>
                        <th class="px-6 py-3 text-right pr-6">Save</th>
                    </tr>
                </thead>
                <tbody id="bookingRows" class="divide-y divide-gray-50">
                    @forelse ($bookings as $b)
                        @php $fid = 'bk'.$b['id']; @endphp
                        <tr class="booking-row align-top hover:bg-gray-50/40"
                            data-status="{{ $b['status'] }}"
                            data-search="{{ strtolower(($b['name'] ?? '').' '.($b['email'] ?? '').' '.($b['service_type'] ?? '').' '.($b['consultant_name'] ?? '').' '.($b['lead_ref'] ?? '')) }}">
                            <td class="px-6 py-3">
                                <div class="font-semibold text-gray-900 text-sm">{{ $b['name'] }}</div>
                                <div class="text-xs text-gray-400">{{ $b['email'] ?? '—' }}{{ $b['phone'] ? ' · '.$b['phone'] : '' }}</div>
                                @if ($b['lead_ref'])<div class="text-[11px] text-gray-300 font-mono">{{ $b['lead_ref'] }}</div>@endif
                            </td>
                            <td class="px-6 py-3 text-sm text-gray-600">
                                {{ $b['service_type'] ?? '—' }}
                                @if ($b['platform'])<div class="text-xs text-gray-400">{{ $b['platform'] }}</div>@endif
                            </td>
                            <td class="px-6 py-3">
                                <div class="flex flex-wrap items-center gap-2">
                                    <input form="{{ $fid }}" type="date" name="appointment_date" value="{{ $b['appointment_date'] }}"
                                           class="text-xs rounded-lg border border-gray-200 bg-white py-1.5 px-2 outline-none focus:ring-2 focus:ring-blue-500">
                                    <input form="{{ $fid }}" type="text" name="appointment_time" value="{{ $b['appointment_time'] }}" placeholder="e.g. 2:00 PM"
                                           class="text-xs w-24 rounded-lg border border-gray-200 bg-white py-1.5 px-2 outline-none focus:ring-2 focus:ring-blue-500">
                                    <input form="{{ $fid }}" type="text" name="consultant_name" value="{{ $b['consultant_name'] }}" placeholder="Consultant"
                                           class="text-xs w-28 rounded-lg border border-gray-200 bg-white py-1.5 px-2 outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                            </td>
                            <td class="px-6 py-3">
                                <div class="flex flex-col gap-1.5">
                                    <span class="inline-flex w-fit px-2.5 py-1 rounded-full text-xs font-bold border {{ $bookingClass($b['status']) }}">{{ $b['status'] }}</span>
                                    <select form="{{ $fid }}" name="status"
                                            class="text-xs rounded-lg border border-gray-200 bg-white py-1.5 pl-2 pr-7 outline-none hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 cursor-pointer">
                                        @foreach ($statuses as $s)
                                            <option value="{{ $s }}" @selected($s === $b['status'])>{{ $s }}</option>
                                        @endforeach
                                    </select>
                                </div>
                            </td>
                            <td class="px-6 py-3 text-right pr-6">
                                <form id="{{ $fid }}" method="POST" action="{{ url('/portal/sales/bookings/'.$b['id']) }}">@csrf</form>
                                <button type="submit" form="{{ $fid }}" class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">Save</button>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="5" class="px-6 py-16 text-center text-gray-400 text-sm">No bookings yet.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div id="bookingEmpty" class="hidden px-6 py-12 text-center text-gray-400 text-sm">No bookings match your filters.</div>
    </div>
</div>

<script>
    let bookingFilter = 'All';
    function setBookingFilter(btn) {
        bookingFilter = btn.dataset.filter;
        document.querySelectorAll('.booking-chip').forEach(c => {
            const on = c === btn;
            c.classList.toggle('bg-gray-900', on);
            c.classList.toggle('text-white', on);
            c.classList.toggle('border-gray-900', on);
            c.classList.toggle('shadow-sm', on);
            c.classList.toggle('bg-white', !on);
            c.classList.toggle('text-gray-600', !on);
            c.classList.toggle('border-gray-200', !on);
        });
        filterBookings();
    }
    function filterBookings() {
        const q = (document.getElementById('bookingSearch').value || '').toLowerCase().trim();
        let visible = 0;
        document.querySelectorAll('.booking-row').forEach(row => {
            const matchText = !q || (row.dataset.search || '').includes(q);
            const matchStatus = bookingFilter === 'All' || row.dataset.status === bookingFilter;
            const show = matchText && matchStatus;
            row.classList.toggle('hidden', !show);
            if (show) visible++;
        });
        const empty = document.getElementById('bookingEmpty');
        if (empty) empty.classList.toggle('hidden', visible > 0 || !document.querySelector('.booking-row'));
    }
</script>
@endsection
