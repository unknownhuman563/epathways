import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Globe, GraduationCap, Plus, X, Star } from 'lucide-react';
import UserReviews from '@/pages/admin/Immigration/UserReviews';

// Interim "Import a Google review" modal — until the Business Profile API
// access is approved, staff can paste a Google review by hand. It flows through
// the same moderation queue + carousel (source=google), so nothing is wasted
// when the automatic sync goes live.
function ImportGoogleModal({ onClose, defaultDept }) {
    const [f, setF] = useState({
        name: '', rating: 5, paragraph: '', department: defaultDept || 'immigration',
        review_date: '', external_photo_url: '', publish: true,
    });
    const [saving, setSaving] = useState(false);
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    const submit = () => {
        setSaving(true);
        router.post('/admin/user-reviews/google', f, {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onFinish: () => setSaving(false),
        });
    };

    const input = 'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30 focus:border-[#436235]';
    const canSave = f.name.trim() && f.paragraph.trim() && !saving;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-8" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-gradient-to-br from-gray-50 to-white">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400 mb-1">Import Google review</p>
                        <h2 className="text-lg font-bold text-gray-900">Add a review by hand</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Goes through the same moderation queue as everything else.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18} /></button>
                </div>

                <div className="p-6 space-y-4">
                    <label className="block">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Reviewer name</span>
                        <input className={input} value={f.name} onChange={set('name')} placeholder="e.g. John Humphrey" />
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Rating</span>
                            <div className="flex items-center gap-1 h-[38px]">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button key={n} type="button" onClick={() => setF((p) => ({ ...p, rating: n }))}>
                                        <Star size={22} className={n <= f.rating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-gray-300'} />
                                    </button>
                                ))}
                            </div>
                        </label>
                        <label className="block">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Review date</span>
                            <input type="date" className={input} value={f.review_date} onChange={set('review_date')} />
                        </label>
                    </div>

                    <label className="block">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Review text</span>
                        <textarea rows={4} className={`${input} resize-y`} value={f.paragraph} onChange={set('paragraph')} placeholder="Paste the review from Google…" />
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Department</span>
                            <select className={input} value={f.department} onChange={set('department')}>
                                <option value="immigration">Immigration</option>
                                <option value="education">Education</option>
                                <option value="both">Both</option>
                            </select>
                        </label>
                        <label className="block">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Avatar URL (optional)</span>
                            <input className={input} value={f.external_photo_url} onChange={set('external_photo_url')} placeholder="https://…" />
                        </label>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={f.publish} onChange={set('publish')} className="accent-[#436235] w-4 h-4" />
                        <span className="text-sm text-gray-700">Publish immediately (uncheck to leave it in the queue for review)</span>
                    </label>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-100">Cancel</button>
                    <button onClick={submit} disabled={!canSave} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#436235] text-white text-sm font-bold rounded-xl hover:bg-[#375029] disabled:opacity-60">
                        <Plus size={15} /> {saving ? 'Importing…' : 'Import review'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Unified admin page — single sidebar entry. Tabs between Immigration and
// Education reviews client-side. The shared UserReviews table component
// stays untouched; this page just slices the data + flips the department
// prop based on which tab is active.
//
// When `restrictedDepartment` is set, the page is being viewed by a
// department-scoped staff user (education or immigration). The other tab
// is hidden and the visible tab is locked to their department.
export default function UserReviewsAll({ reviews = [], restrictedDepartment = null }) {
    const [tab, setTab] = useState(restrictedDepartment || 'immigration');
    const [importOpen, setImportOpen] = useState(false);

    const counts = useMemo(() => ({
        immigration: reviews.filter((r) => r.department === 'immigration' || r.department === 'both').length,
        education:   reviews.filter((r) => r.department === 'education' || r.department === 'both').length,
    }), [reviews]);

    // Same filter rule as the public-payload scope() — 'both' reviews show
    // up in both tabs since they apply to both departments.
    const scoped = useMemo(() => (
        reviews.filter((r) => r.department === tab || r.department === 'both')
    ), [reviews, tab]);

    const allTabs = [
        { key: 'immigration', label: 'Immigration', icon: <Globe size={14} />, count: counts.immigration },
        { key: 'education',   label: 'Education',   icon: <GraduationCap size={14} />, count: counts.education },
    ];
    const tabs = restrictedDepartment
        ? allTabs.filter((t) => t.key === restrictedDepartment)
        : allTabs;

    return (
        <div className="max-w-[1600px] mx-auto pb-12">
            {/* Tab strip — sits above the existing UserReviews component so
                staff can switch the moderation queue without leaving the page. */}
            <div className="border-b border-gray-200 mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                    {tabs.map((t) => {
                        const active = t.key === tab;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setTab(t.key)}
                                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors border-b-2 -mb-px ${
                                    active
                                        ? 'border-[#1a1a1a] text-[#1a1a1a]'
                                        : 'border-transparent text-gray-700 hover:text-[#1a1a1a]'
                                }`}
                            >
                                {t.icon}
                                {t.label}
                                <span className={`inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full text-[10px] font-bold tabular-nums ${
                                    active ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {t.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <button
                    type="button"
                    onClick={() => setImportOpen(true)}
                    className="inline-flex items-center gap-1.5 mb-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#436235] text-white hover:bg-[#375029] transition-colors shrink-0"
                >
                    <Plus size={14} /> Import Google review
                </button>
            </div>

            {importOpen && <ImportGoogleModal onClose={() => setImportOpen(false)} defaultDept={tab} />}

            {/* Re-renders the existing UserReviews table component with the
                scoped subset + the department-aware basePath / share link.
                The key forces a fresh mount per tab so internal filter
                state (search, mode) resets when switching. */}
            <UserReviews key={tab} reviews={scoped} department={tab} />
        </div>
    );
}
