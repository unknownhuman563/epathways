import React, { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Search, Filter, Eye, Mail, Phone, Briefcase, Globe, ChevronRight, FileText } from 'lucide-react';

export default function ResidentIntakes({ intakes = [] }) {
    const [query, setQuery] = useState('');
    const [visaFilter, setVisaFilter] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return intakes.filter((i) => {
            if (visaFilter && i.current_visa_type !== visaFilter) return false;
            if (!q) return true;
            const haystack = [
                i.first_name, i.last_name, i.email, i.phone, i.intake_id,
                i.job_title, i.nationality, i.passport_number,
            ].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }, [intakes, query, visaFilter]);

    const formatDate = (d) => {
        if (!d) return '—';
        const date = new Date(d);
        return isNaN(date) ? '—' : date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const statusStyle = (s) => {
        switch (s) {
            case 'New': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'In Review': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Engaged': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Archived': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const visaTypes = Array.from(new Set(intakes.map((i) => i.current_visa_type).filter(Boolean)));

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
            <Head title="Resident Visa Intakes" />

            {/* Header */}
            <div className="hidden lg:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Globe size={14} />
                        <span>Immigration</span>
                        <ChevronRight size={12} />
                        <span className="text-gray-900 font-semibold">Resident Visa Intake</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Resident Visa Intake Submissions</h1>
                    <p className="text-sm text-gray-600 mt-1">Skilled Migrant Category client interest — pre-engagement records.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</span>
                    <span className="text-2xl font-black text-gray-900">{intakes.length}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center gap-4">
                <div className="w-full lg:w-96 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                        placeholder="Search name, email, phone, passport..."
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:ml-auto">
                    <select
                        value={visaFilter}
                        onChange={(e) => setVisaFilter(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl block p-2.5 outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <option value="">Visa: All</option>
                        {visaTypes.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold shadow-sm transition-colors">
                        <Filter size={16} />
                        More filters
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50/80 border-b border-gray-100">
                            <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Applicant</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Current Visa</th>
                                <th className="px-6 py-4">Job Title</th>
                                <th className="px-6 py-4">NZ Experience</th>
                                <th className="px-6 py-4">Submitted</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                                                <FileText size={24} />
                                            </div>
                                            <p className="text-sm font-medium">
                                                {intakes.length === 0
                                                    ? 'No resident visa intakes yet. Submissions will appear here.'
                                                    : 'No intakes match your filters.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {filtered.map((i) => (
                                <tr key={i.id} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00A693] to-[#008c7c] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                                {(i.first_name?.[0] || '').toUpperCase()}{(i.last_name?.[0] || '').toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-gray-900 truncate">{i.first_name} {i.last_name}</div>
                                                <div className="text-xs text-gray-500 truncate">{i.intake_id} · {i.nationality}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                                            <span className="inline-flex items-center gap-1.5"><Mail size={12} className="text-gray-400" /> {i.email}</span>
                                            <span className="inline-flex items-center gap-1.5"><Phone size={12} className="text-gray-400" /> {i.phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#00A693]/10 text-[#00A693] text-xs font-bold uppercase tracking-wide">
                                            {i.current_visa_type}
                                        </span>
                                        <div className="text-[11px] text-gray-500 mt-1">Exp {formatDate(i.current_visa_expiry)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Briefcase size={13} className="text-gray-400" />
                                            <span className="truncate max-w-[160px]">{i.job_title}</span>
                                        </div>
                                        <div className="text-[11px] text-gray-500 mt-0.5">${Number(i.hourly_rate).toFixed(2)}/hr</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-gray-900">{Number(i.nz_skilled_years)} yrs NZ</div>
                                        <div className="text-[11px] text-gray-500">{Number(i.total_skilled_years)} yrs total</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-xs">{formatDate(i.created_at)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${statusStyle(i.status)}`}>
                                            {i.status || 'New'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/immigration/resident-intakes/${i.id}`}
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors"
                                        >
                                            <Eye size={13} />
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
