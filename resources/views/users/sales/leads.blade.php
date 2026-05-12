@extends('layouts.dashboard')

@section('title', 'Leads')
@section('heading', 'Leads')
@section('subheading', 'Pipeline — update a lead\'s status inline')

@section('content')
@php
    $statusClass = fn ($s) => [
        'New' => 'bg-blue-100 text-blue-700 border-blue-200',
        'Contacted' => 'bg-amber-100 text-amber-700 border-amber-200',
        'Qualified' => 'bg-purple-100 text-purple-700 border-purple-200',
        'Processing' => 'bg-indigo-100 text-indigo-700 border-indigo-200',
        'Closed' => 'bg-emerald-100 text-emerald-700 border-emerald-200',
    ][$s] ?? 'bg-gray-100 text-gray-700 border-gray-200';
    $scoreClass = fn ($n) => $n >= 70 ? 'bg-emerald-100 text-emerald-700' : ($n >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700');
@endphp

<div class="space-y-5 max-w-7xl">
    {{-- Toolbar --}}
    <div class="bg-white rounded-2xl border border-gray-50 shadow-sm p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input type="text" id="leadSearch" placeholder="Search name, email or ID…" oninput="filterLeads()"
               class="w-full lg:w-80 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
        <div class="flex flex-wrap gap-1.5">
            <button type="button" data-filter="All" onclick="setLeadFilter(this)" class="lead-chip px-3.5 py-1.5 rounded-xl text-xs font-bold border bg-gray-900 text-white border-gray-900 shadow-sm">All</button>
            @foreach ($statuses as $s)
                <button type="button" data-filter="{{ $s }}" onclick="setLeadFilter(this)" class="lead-chip px-3.5 py-1.5 rounded-xl text-xs font-bold border bg-white text-gray-600 border-gray-200 hover:bg-gray-50">{{ $s }}</button>
            @endforeach
        </div>
    </div>

    {{-- Table --}}
    <div class="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th class="px-6 py-3">Lead</th>
                        <th class="px-6 py-3">Source</th>
                        <th class="px-6 py-3">Course</th>
                        <th class="px-6 py-3">AI score</th>
                        <th class="px-6 py-3">Status</th>
                        <th class="px-6 py-3">Created</th>
                        <th class="px-6 py-3 text-right pr-6">Update</th>
                    </tr>
                </thead>
                <tbody id="leadRows" class="divide-y divide-gray-50">
                    @forelse ($leads as $lead)
                        <tr class="lead-row hover:bg-gray-50/40"
                            data-status="{{ $lead['status'] }}"
                            data-search="{{ strtolower(($lead['name'] ?? '').' '.($lead['email'] ?? '').' '.($lead['lead_id'] ?? '').' '.($lead['phone'] ?? '')) }}">
                            <td class="px-6 py-3">
                                <div class="font-semibold text-gray-900 text-sm">{{ $lead['name'] }}</div>
                                <div class="text-xs text-gray-400">{{ $lead['email'] ?? '—' }}{{ $lead['phone'] ? ' · '.$lead['phone'] : '' }}</div>
                                <div class="text-[11px] text-gray-300 font-mono">{{ $lead['lead_id'] ?? '' }}</div>
                            </td>
                            <td class="px-6 py-3 text-sm text-gray-600">{{ $lead['source'] ?? '—' }}</td>
                            <td class="px-6 py-3 text-sm text-gray-600">{{ $lead['course'] ?? '—' }}</td>
                            <td class="px-6 py-3">
                                @if (! is_null($lead['ai_score']))
                                    <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-bold {{ $scoreClass($lead['ai_score']) }}" title="{{ $lead['ai_pathway'] ?? '' }}">{{ $lead['ai_score'] }}/100</span>
                                @else
                                    <span class="text-xs text-gray-400">{{ $lead['ai_status'] === 'processing' ? 'analyzing…' : '—' }}</span>
                                @endif
                            </td>
                            <td class="px-6 py-3"><span class="inline-flex px-2.5 py-1 rounded-full text-xs font-bold border {{ $statusClass($lead['status']) }}">{{ $lead['status'] }}</span></td>
                            <td class="px-6 py-3 text-sm text-gray-500">{{ \Illuminate\Support\Carbon::parse($lead['created_at'])->format('d M Y') }}</td>
                            <td class="px-6 py-3 text-right pr-6">
                                <form method="POST" action="{{ url('/portal/sales/leads/'.$lead['id']) }}" class="inline-flex items-center gap-2 justify-end">
                                    @csrf
                                    <select name="status" onchange="this.form.submit()"
                                            class="text-xs rounded-lg border border-gray-200 bg-white py-1.5 pl-2 pr-7 outline-none hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 cursor-pointer">
                                        @foreach ($statuses as $s)
                                            <option value="{{ $s }}" @selected($s === $lead['status'])>{{ $s }}</option>
                                        @endforeach
                                    </select>
                                    <noscript><button type="submit" class="text-xs font-semibold text-blue-600">Save</button></noscript>
                                </form>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="7" class="px-6 py-16 text-center text-gray-400 text-sm">No leads yet.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div id="leadEmpty" class="hidden px-6 py-12 text-center text-gray-400 text-sm">No leads match your filters.</div>
    </div>
</div>

<script>
    let leadFilter = 'All';
    function setLeadFilter(btn) {
        leadFilter = btn.dataset.filter;
        document.querySelectorAll('.lead-chip').forEach(c => {
            const on = c === btn;
            c.classList.toggle('bg-gray-900', on);
            c.classList.toggle('text-white', on);
            c.classList.toggle('border-gray-900', on);
            c.classList.toggle('shadow-sm', on);
            c.classList.toggle('bg-white', !on);
            c.classList.toggle('text-gray-600', !on);
            c.classList.toggle('border-gray-200', !on);
        });
        filterLeads();
    }
    function filterLeads() {
        const q = (document.getElementById('leadSearch').value || '').toLowerCase().trim();
        let visible = 0;
        document.querySelectorAll('.lead-row').forEach(row => {
            const matchText = !q || (row.dataset.search || '').includes(q);
            const matchStatus = leadFilter === 'All' || row.dataset.status === leadFilter;
            const show = matchText && matchStatus;
            row.classList.toggle('hidden', !show);
            if (show) visible++;
        });
        const empty = document.getElementById('leadEmpty');
        if (empty) empty.classList.toggle('hidden', visible > 0 || !document.querySelector('.lead-row'));
    }
</script>
@endsection
