import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { toast } from 'sonner';
import { Megaphone, RefreshCw, BarChart3, Rocket } from 'lucide-react';
import SocialLayout from '@/pages/admin/social/SocialLayout';
import { social } from '@/services/social';
import { Skeleton, PlatformIcon, EmptyState } from '@/components/social/atoms';
import BoostModal from '@/pages/admin/social/BoostModal';

const STATUS_CHIP = {
    active: 'bg-emerald-50 text-emerald-700', paused: 'bg-amber-50 text-amber-700',
    completed: 'bg-gray-100 text-gray-600', pending: 'bg-blue-50 text-blue-700',
};

function Metric({ label, value }) {
    return (
        <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5 tabular-nums">{value}</p>
        </div>
    );
}

function AdRow({ ad }) {
    const [open, setOpen] = useState(false);
    const [analytics, setAnalytics] = useState(null);

    const toggle = () => {
        const next = !open;
        setOpen(next);
        if (next && analytics === null) {
            social.adAnalytics(ad.id).then(setAnalytics, () => { setAnalytics({}); toast.error('Could not load analytics'); });
        }
    };

    return (
        <div className="px-5 py-3">
            <button onClick={toggle} className="w-full flex items-center gap-3 text-left">
                <PlatformIcon id={ad.platform} size={16} />
                <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-900 truncate">{ad.name}</span>
                    <span className="block text-xs text-gray-400">{ad.objective || '—'}</span>
                </span>
                {ad.status && <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 capitalize ${STATUS_CHIP[ad.status] || 'bg-gray-100 text-gray-500'}`}>{ad.status}</span>}
                <BarChart3 size={15} className="text-gray-400" />
            </button>
            {open && (
                <div className="mt-3">
                    {analytics === null ? (
                        <div className="grid grid-cols-3 gap-2">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            <Metric label="Spend" value={`$${analytics.spend ?? 0}`} />
                            <Metric label="Impressions" value={analytics.impressions ?? 0} />
                            <Metric label="Clicks" value={analytics.clicks ?? 0} />
                            <Metric label="CTR" value={`${analytics.ctr ?? 0}%`} />
                            <Metric label="CPC" value={`$${analytics.cpc ?? 0}`} />
                            <Metric label="CPM" value={`$${analytics.cpm ?? 0}`} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function AdsPage() {
    const [ads, setAds] = useState(null);
    const [boostOpen, setBoostOpen] = useState(false);

    const load = () => {
        setAds(null);
        social.adsList().then((r) => setAds(r?.ads || []), () => { setAds([]); toast.error('Could not load ads'); });
    };
    useEffect(load, []);

    return (
        <SocialLayout>
            <Head title="Ads · Social" />
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                    <Megaphone size={16} className="text-gray-700" />
                    <h2 className="text-sm font-bold text-gray-900">Ad campaigns</h2>
                    <button onClick={load} className="text-gray-400 hover:text-gray-700 ml-1" title="Refresh"><RefreshCw size={14} /></button>
                    <button onClick={() => setBoostOpen(true)} className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl">
                        <Rocket size={14} /> Boost a post
                    </button>
                </div>

                {ads === null ? (
                    <div className="p-5 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
                ) : ads.length === 0 ? (
                    <EmptyState icon={<Megaphone size={20} className="text-gray-500" />} title="No ad campaigns yet" body="Boost a published post or create a campaign to see it here with live analytics." />
                ) : (
                    <div className="divide-y divide-gray-50">
                        {ads.map((ad) => <AdRow key={ad.id} ad={ad} />)}
                    </div>
                )}
            </section>

            {boostOpen && <BoostModal onClose={() => setBoostOpen(false)} onBoosted={load} />}
        </SocialLayout>
    );
}
