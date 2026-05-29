import { useMemo, useState } from 'react';
import { Globe, GraduationCap } from 'lucide-react';
import UserReviews from '@/pages/admin/Immigration/UserReviews';

// Unified admin page — single sidebar entry. Tabs between Immigration and
// Education reviews client-side. The shared UserReviews table component
// stays untouched; this page just slices the data + flips the department
// prop based on which tab is active.
export default function UserReviewsAll({ reviews = [] }) {
    const [tab, setTab] = useState('immigration');

    const counts = useMemo(() => ({
        immigration: reviews.filter((r) => r.department === 'immigration' || r.department === 'both').length,
        education:   reviews.filter((r) => r.department === 'education' || r.department === 'both').length,
    }), [reviews]);

    // Same filter rule as the public-payload scope() — 'both' reviews show
    // up in both tabs since they apply to both departments.
    const scoped = useMemo(() => (
        reviews.filter((r) => r.department === tab || r.department === 'both')
    ), [reviews, tab]);

    const tabs = [
        { key: 'immigration', label: 'Immigration', icon: <Globe size={14} />, count: counts.immigration },
        { key: 'education',   label: 'Education',   icon: <GraduationCap size={14} />, count: counts.education },
    ];

    return (
        <div className="max-w-[1600px] mx-auto pb-12">
            {/* Tab strip — sits above the existing UserReviews component so
                staff can switch the moderation queue without leaving the page. */}
            <div className="border-b border-gray-200 mb-6">
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
            </div>

            {/* Re-renders the existing UserReviews table component with the
                scoped subset + the department-aware basePath / share link.
                The key forces a fresh mount per tab so internal filter
                state (search, mode) resets when switching. */}
            <UserReviews key={tab} reviews={scoped} department={tab} />
        </div>
    );
}
