import React, { useEffect, useState } from 'react';
import { social } from '@/services/social';
import StatsStrip from '@/components/social/StatsStrip';

// Shared chrome for every /social/* sub-page. Renders the dark-eyebrow
// header + stats strip once and slots the sub-route's content underneath.
// AdminLayout is already applied by app.jsx since these pages live under
// pages/admin/, so this is purely a section-level wrapper — not a full layout.
export default function SocialLayout({ children }) {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        let alive = true;
        social.stats()
            .then((s) => { if (alive) setStats(s); })
            .catch(() => { if (alive) setStats(undefined); }); // distinguish from "still loading"
        return () => { alive = false; };
    }, []);

    return (
        <div className="max-w-[1500px] mx-auto pb-12 space-y-8">
            <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-[0.22em] rounded-full mb-3">
                    Social · MVP
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Campaign control room</h1>
                <p className="text-sm text-gray-700 mt-1.5 max-w-2xl">
                    Generate platform-ready ad variants, review them, schedule them. Posts only go live after staff approval — no direct publish.
                </p>
            </div>

            <StatsStrip data={stats} />

            {children}
        </div>
    );
}
