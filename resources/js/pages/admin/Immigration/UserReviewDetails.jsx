import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Mail, MessageCircle, FileText, Calendar } from 'lucide-react';

export default function UserReviewDetails({ review }) {
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    const questions = [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit?',
        'Sed do eiusmod tempor incididunt ut labore et dolore magna?',
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco?',
    ];

    return (
        <div className="space-y-6 max-w-[1100px] mx-auto pb-12">
            <Head title={`Review — ${review.name}`} />

            <div className="hidden lg:flex items-start justify-between gap-4 mb-2">
                <div>
                    <Link
                        href="/admin/immigration/user-reviews"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Back to User Reviews
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00A693] to-[#008c7c] text-white flex items-center justify-center font-black text-lg shadow-lg">
                            {(review.name?.[0] || 'U').toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{review.name}</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {review.review_id} · {formatDate(review.created_at)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 pt-12">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wide">
                        {review.status || 'New'}
                    </span>
                </div>
            </div>

            {/* Top meta strip */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Email</div>
                    <div className="text-sm font-semibold text-gray-900 flex items-center gap-2 truncate">
                        <Mail size={14} className="text-gray-400" />
                        {review.email || <span className="text-gray-400 font-normal">Not provided</span>}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Submitted</div>
                    <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(review.created_at)}
                    </div>
                </div>
            </div>

            {/* Mode badge */}
            <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00A693]/10 text-[#00A693] text-[11px] font-bold uppercase tracking-wide">
                    {review.mode === 'paragraph'
                        ? <><MessageCircle size={12} /> Paragraph</>
                        : <><FileText size={12} /> 3 Questions</>}
                </span>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                        {review.mode === 'paragraph' ? 'Review' : 'Answers'}
                    </h3>
                </div>
                <div className="px-6 py-6 space-y-6">
                    {review.mode === 'paragraph' ? (
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {review.paragraph || '—'}
                        </p>
                    ) : (
                        questions.map((q, idx) => {
                            const ans = review[`answer_${idx + 1}`];
                            return (
                                <div key={idx} className="space-y-2">
                                    <div className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-[#00A693] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">{idx + 1}</span>
                                        <p className="text-sm font-semibold text-[#282728]">{q}</p>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed pl-9 whitespace-pre-wrap">
                                        {ans || <span className="text-gray-400">No answer</span>}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
