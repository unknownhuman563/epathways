import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { toast } from 'sonner';
import { Megaphone, RefreshCw, BarChart3, Rocket, Loader2, X } from 'lucide-react';
import SocialLayout from '@/pages/admin/social/SocialLayout';
import { social } from '@/services/social';
import { Skeleton, PlatformIcon, EmptyState } from '@/components/social/atoms';

const inp = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-300';
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

function BoostModal({ onClose, onBoosted }) {
    const [adAccounts, setAdAccounts] = useState(null);
    const [form, setForm] = useState({ name: '', postId: '', adAccountId: '', platform: 'facebook', goal: 'traffic', budgetAmount: '20', budgetType: 'daily' });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        social.adAccounts().then((r) => setAdAccounts(r?.adAccounts || []), () => setAdAccounts([]));
    }, []);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = async () => {
        if (!form.name || !form.postId || !form.adAccountId) { toast.error('Fill name, post ID and ad account.'); return; }
        setBusy(true);
        try {
            const acct = adAccounts.find((a) => a.id === form.adAccountId);
            await social.boostPost({ ...form, accountId: acct?.id || form.adAccountId, budgetAmount: Number(form.budgetAmount) });
            toast.success('Boost submitted');
            onBoosted();
            onClose();
        } catch (err) {
            toast.error(err?.message || 'Boost failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Rocket size={16} /> Boost a post</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
                </div>

                {adAccounts === null ? (
                    <Skeleton className="h-32 w-full rounded-xl" />
                ) : adAccounts.length === 0 ? (
                    <p className="text-sm text-gray-600 leading-relaxed">No ad account is linked yet. Link a Meta/Google ad account inside Zernio (Connections → Ads), then you can boost posts from here.</p>
                ) : (
                    <div className="space-y-3">
                        <label className="block"><span className="text-xs font-semibold text-gray-600">Campaign name</span><input className={inp} value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
                        <label className="block"><span className="text-xs font-semibold text-gray-600">Published post ID (Zernio)</span><input className={inp} value={form.postId} onChange={(e) => set('postId', e.target.value)} placeholder="from a published post" /></label>
                        <label className="block"><span className="text-xs font-semibold text-gray-600">Ad account</span>
                            <select className={inp} value={form.adAccountId} onChange={(e) => set('adAccountId', e.target.value)}>
                                <option value="">Select…</option>
                                {adAccounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.platform})</option>)}
                            </select>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block"><span className="text-xs font-semibold text-gray-600">Goal</span>
                                <select className={inp} value={form.goal} onChange={(e) => set('goal', e.target.value)}>
                                    {['traffic', 'engagement', 'awareness', 'conversions', 'leads'].map((g) => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </label>
                            <label className="block"><span className="text-xs font-semibold text-gray-600">Platform</span>
                                <select className={inp} value={form.platform} onChange={(e) => set('platform', e.target.value)}>
                                    {['facebook', 'instagram', 'tiktok', 'linkedin', 'google'].map((p) => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </label>
                            <label className="block"><span className="text-xs font-semibold text-gray-600">Budget</span><input type="number" min="1" className={inp} value={form.budgetAmount} onChange={(e) => set('budgetAmount', e.target.value)} /></label>
                            <label className="block"><span className="text-xs font-semibold text-gray-600">Budget type</span>
                                <select className={inp} value={form.budgetType} onChange={(e) => set('budgetType', e.target.value)}>
                                    <option value="daily">daily</option><option value="lifetime">lifetime</option>
                                </select>
                            </label>
                        </div>
                        <button onClick={submit} disabled={busy} className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                            {busy ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />} Boost
                        </button>
                    </div>
                )}
            </div>
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
