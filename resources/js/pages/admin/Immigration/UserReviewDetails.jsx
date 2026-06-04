import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Mail, MessageCircle, FileText, Calendar, Phone, Star, Tag } from 'lucide-react';

export default function UserReviewDetails({ review, department = 'immigration' }) {
    const backHref = `/admin/${department}/user-reviews`;
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    // Keep in sync with QUESTIONS in resources/js/components/ui/ReviewModal.jsx
    // — those are the prompts the public review form actually shows; the admin
    // page used to ship with the original Lorem ipsum placeholders.
    const questions = [
        'What made you choose ePathways?',
        'How was your overall experience working with ePathways?',
        'Would you recommend us to friends and family — and why?',
    ];

    return (
        <div className="space-y-6 max-w-[1100px] mx-auto pb-12">
            <Head title={`Review — ${review.name}`} />

            <div className="hidden lg:flex items-start justify-between gap-4 mb-2">
                <div>
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Back to User Reviews
                    </Link>
                    <div className="flex items-center gap-4">
                        {review.photo_url ? (
                            <img
                                src={review.photo_url}
                                alt={review.name}
                                className="w-14 h-14 rounded-2xl object-cover shadow-lg ring-2 ring-white"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00A693] to-[#008c7c] text-white flex items-center justify-center font-black text-lg shadow-lg">
                                {(review.name?.[0] || 'U').toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{review.name}</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {review.review_id} · {formatDate(review.created_at)}
                            </p>
                            {review.rating ? (
                                <div className="flex items-center gap-1 mt-1.5">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <Star
                                            key={n}
                                            size={13}
                                            className={n <= Math.round(Number(review.rating)) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                                        />
                                    ))}
                                    <span className="text-xs font-bold text-gray-700 tabular-nums ml-1">
                                        {Number(review.rating).toFixed(1)}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 pt-12">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wide">
                        {review.status || 'New'}
                    </span>
                </div>
            </div>

            {/* Top meta strip — surfaces every field the public review form
                captures so staff can verify identity at a glance. */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Email</div>
                    <div className="text-sm font-semibold text-gray-900 flex items-center gap-2 truncate">
                        <Mail size={14} className="text-gray-500" />
                        {review.email || <span className="text-gray-500 font-normal">Not provided</span>}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Phone</div>
                    <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Phone size={14} className="text-gray-500" />
                        {review.phone || <span className="text-gray-500 font-normal">Not provided</span>}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                        {department === 'education' ? 'Programme' : 'Visa type'}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 flex items-center gap-2 truncate">
                        <Tag size={14} className="text-gray-500" />
                        {(department === 'education' ? review.program_type : review.visa_type)
                            || <span className="text-gray-500 font-normal">Not specified</span>}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Submitted</div>
                    <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar size={14} className="text-gray-500" />
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
