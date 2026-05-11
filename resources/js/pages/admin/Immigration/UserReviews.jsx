import React, { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Search, Filter, Eye, MessageCircle, FileText, Globe, ChevronRight, Mail, Star } from 'lucide-react';

export default function UserReviews({ reviews = [] }) {
    const [query, setQuery] = useState('');
    const [modeFilter, setModeFilter] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return reviews.filter((r) => {
            if (modeFilter && r.mode !== modeFilter) return false;
            if (!q) return true;
            const haystack = [r.name, r.email, r.review_id, r.paragraph, r.answer_1, r.answer_2, r.answer_3]
                .filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }, [reviews, query, modeFilter]);

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    const statusStyle = (s) => {
        switch (s) {
            case 'New': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Hidden': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const renderExcerpt = (r) => {
        if (r.mode === 'paragraph') return r.paragraph;
        return [r.answer_1, r.answer_2, r.answer_3].filter(Boolean).join(' · ');
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
            <Head title="User Reviews" />

            <div className="hidden lg:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Globe size={14} />
                        <span>Immigration</span>
                        <ChevronRight size={12} />
                        <span className="text-gray-900 font-semibold">User Reviews</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Reviews</h1>
                    <p className="text-sm text-gray-600 mt-1">Public reviews submitted from the immigration page.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</span>
                    <span className="text-2xl font-black text-gray-900">{reviews.length}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center gap-4">
                <div className="w-full lg:w-96 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                        placeholder="Search name, email, content..."
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:ml-auto">
                    <select
                        value={modeFilter}
                        onChange={(e) => setModeFilter(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl block p-2.5 outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <option value="">Type: All</option>
                        <option value="questions">3 Questions</option>
                        <option value="paragraph">Paragraph</option>
                    </select>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold shadow-sm transition-colors">
                        <Filter size={16} />
                        More filters
                    </button>
                </div>
            </div>

            {/* Cards grid */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-400">
                        <MessageCircle size={24} />
                    </div>
                    <p className="text-sm font-medium text-gray-400">
                        {reviews.length === 0
                            ? 'No reviews yet. Submissions will appear here.'
                            : 'No reviews match your filters.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map((r) => (
                        <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-gray-200 transition-all flex flex-col">
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00A693] to-[#008c7c] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                                        {(r.name?.[0] || 'U').toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-semibold text-gray-900 truncate">{r.name}</div>
                                        <div className="text-[11px] text-gray-500 truncate">{r.review_id}</div>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border ${statusStyle(r.status)}`}>
                                    {r.status || 'New'}
                                </span>
                            </div>

                            <div className="mb-4">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#00A693] bg-[#00A693]/10 px-2.5 py-1 rounded-md">
                                    {r.mode === 'paragraph'
                                        ? <><MessageCircle size={11} /> Paragraph</>
                                        : <><FileText size={11} /> 3 Questions</>}
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-4 flex-1">
                                {renderExcerpt(r) || '—'}
                            </p>

                            <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                                <div className="text-[11px] text-gray-400">
                                    {r.email && (
                                        <span className="inline-flex items-center gap-1.5"><Mail size={11} /> {r.email}</span>
                                    )}
                                    {!r.email && formatDate(r.created_at)}
                                </div>
                                <Link
                                    href={`/admin/immigration/user-reviews/${r.id}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[11px] font-semibold hover:bg-gray-800 transition-colors"
                                >
                                    <Eye size={12} />
                                    View
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
