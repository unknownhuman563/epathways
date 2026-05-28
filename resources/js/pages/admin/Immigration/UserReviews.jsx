import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Filter, Eye, MessageCircle, FileText, Globe, ChevronRight, Mail, Star, Check, X } from 'lucide-react';

export default function UserReviews({ reviews = [], department = 'immigration' }) {
    const [query, setQuery] = useState('');
    const [modeFilter, setModeFilter] = useState('');
    const [savingId, setSavingId] = useState(null);

    // Both departments share the same admin page; the URL prefix swaps so
    // the toggle hits the right named route. Same controller method on the
    // backend (UserReviewController::adminUpdate is dept-agnostic).
    const basePath = `/admin/${department}/user-reviews`;
    const deptLabel = department.charAt(0).toUpperCase() + department.slice(1);

    const toggle = (review, field, nextValue) => {
        setSavingId(`${review.id}:${field}`);
        router.post(
            `${basePath}/${review.id}`,
            { [field]: nextValue },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setSavingId(null),
            }
        );
    };

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

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
            <Head title="User Reviews" />

            <div className="hidden lg:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Globe size={14} />
                        <span>{deptLabel}</span>
                        <ChevronRight size={12} />
                        <span className="text-gray-900 font-semibold">User Reviews</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Reviews</h1>
                    <p className="text-sm text-gray-600 mt-1">Public reviews submitted from the {department === 'education' ? 'education journey' : 'immigration'} page.</p>
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

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50/80 border-b border-gray-100">
                            <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Rating</th>
                                <th className="px-6 py-4">Share Mode</th>
                                <th className="px-6 py-4">Submitted</th>
                                <th className="px-6 py-4 text-center">Published</th>
                                <th className="px-6 py-4 text-center">Featured</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                                                <MessageCircle size={24} />
                                            </div>
                                            <p className="text-sm font-medium">
                                                {reviews.length === 0
                                                    ? 'No reviews yet. Submissions will appear here.'
                                                    : 'No reviews match your filters.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {filtered.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00A693] to-[#008c7c] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                                                {(r.name?.[0] || 'U').toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-gray-900 truncate">{r.name}</div>
                                                <div className="text-[11px] text-gray-500 truncate">{r.review_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {r.rating ? (
                                            <div className="flex items-center gap-1">
                                                {[1,2,3,4,5].map((n) => (
                                                    <Star
                                                        key={n}
                                                        size={13}
                                                        strokeWidth={1.5}
                                                        className={n <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-gray-200'}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-300">No rating</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-[#00A693] bg-[#00A693]/10 whitespace-nowrap">
                                            {r.mode === 'paragraph'
                                                ? <><MessageCircle size={11} /> Paragraph</>
                                                : <><FileText size={11} /> 3 Questions</>}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-xs whitespace-nowrap">{formatDate(r.created_at)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            type="button"
                                            disabled={savingId === `${r.id}:is_published`}
                                            onClick={() => toggle(r, 'is_published', !r.is_published)}
                                            title={r.is_published ? 'Click to unpublish (hide from public page)' : 'Click to publish (show on public page)'}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.12em] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                                r.is_published
                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                        >
                                            {r.is_published ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                                            {r.is_published ? 'Live' : 'Hidden'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            type="button"
                                            disabled={savingId === `${r.id}:is_featured` || !r.is_published}
                                            onClick={() => toggle(r, 'is_featured', !r.is_featured)}
                                            title={!r.is_published ? 'Publish the review first' : (r.is_featured ? 'Remove from Featured Stories' : 'Promote to Featured Stories')}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.12em] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                                r.is_featured
                                                    ? 'bg-amber-400 text-amber-900 hover:bg-amber-500'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                        >
                                            <Star size={12} strokeWidth={2.5} className={r.is_featured ? 'fill-amber-900' : ''} />
                                            {r.is_featured ? 'Featured' : 'Feature'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`${basePath}/${r.id}`}
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
