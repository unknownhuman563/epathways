import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Rocket, X, Loader2, Search, Image as ImageIcon } from 'lucide-react';
import { social } from '@/services/social';
import { Skeleton, PlatformIcon } from '@/components/social/atoms';
import { COUNTRIES, COUNTRY_NAME } from '@/data/countries';

const inp = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-300';
const lbl = 'text-xs font-semibold text-gray-600';
const BOOST_GOALS = [
    ['engagement', 'Engagement'], ['traffic', 'Traffic'], ['awareness', 'Awareness'], ['video_views', 'Video Views'],
    ['lead_generation', 'Lead Generation'], ['conversions', 'Conversions'], ['app_promotion', 'App Promotion'],
];
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; } };

export default function BoostModal({ onClose, onBoosted }) {
    const [adAccounts, setAdAccounts] = useState(null);
    const [posts, setPosts] = useState(null);
    const [form, setForm] = useState({ adAccountId: '', name: '', goal: 'engagement', budgetAmount: '100', budgetType: 'daily', postId: '' });
    const [targeting, setTargeting] = useState({ ageMin: 18, ageMax: 65, gender: 'all', countries: [] });
    const [cq, setCq] = useState('');
    const [busy, setBusy] = useState(false);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const acct = (adAccounts || []).find((a) => a.id === form.adAccountId) || null;
    const accountId = acct?.accountId || '';
    const post = (posts || []).find((p) => p.id === form.postId) || null;
    const visiblePosts = posts || [];
    const countryMatches = cq.trim()
        ? COUNTRIES.filter(([code, name]) => name.toLowerCase().includes(cq.toLowerCase()) || code.toLowerCase() === cq.toLowerCase()).slice(0, 40)
        : [];

    useEffect(() => {
        social.adAccounts().then((r) => setAdAccounts(r?.adAccounts || []), () => setAdAccounts([]));
    }, []);

    // Fetch the selected account's published posts (scoped server-side so the
    // list mirrors Zernio — only this account's posts, not the whole workspace).
    useEffect(() => {
        if (!accountId) { setPosts(null); return; }
        setPosts(null);
        social.publishedPosts({ accountId }).then((r) => setPosts(r?.posts || []), () => setPosts([]));
    }, [accountId]);

    const addCountry = (c) => { if (!targeting.countries.includes(c)) setTargeting((t) => ({ ...t, countries: [...t.countries, c] })); setCq(''); };
    const removeCountry = (c) => setTargeting((t) => ({ ...t, countries: t.countries.filter((x) => x !== c) }));

    const submit = async () => {
        if (!form.adAccountId || !form.postId || !form.name) { toast.error('Pick an ad account, a post, and an ad name.'); return; }
        setBusy(true);
        try {
            await social.boostPost({
                name: form.name, postId: form.postId, adAccountId: form.adAccountId, accountId,
                platform: post?.platform || acct?.platform || 'facebook',
                goal: form.goal, budgetAmount: Number(form.budgetAmount), budgetType: form.budgetType,
                targeting: { ageMin: Number(targeting.ageMin), ageMax: Number(targeting.ageMax), gender: targeting.gender, countries: targeting.countries },
            });
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-1">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Rocket size={16} /> Boost Post</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Turn an existing post into a paid ad.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
                </div>

                {adAccounts === null ? (
                    <Skeleton className="h-40 w-full rounded-xl mt-4" />
                ) : adAccounts.length === 0 ? (
                    <p className="text-sm text-gray-600 leading-relaxed mt-4">No ad account is linked yet. Link a Meta/Google ad account inside Zernio (Connections → Ads), then you can boost posts from here.</p>
                ) : (
                    <div className="grid md:grid-cols-2 gap-5 mt-4">
                        {/* Published post list */}
                        <div>
                            <span className={lbl}>Published post</span>
                            <div className="mt-1 space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                                {!accountId ? (
                                    <p className="text-xs text-gray-400 py-6 text-center">Pick an ad account to see its posts.</p>
                                ) : posts === null ? (
                                    [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                                ) : visiblePosts.length === 0 ? (
                                    <p className="text-xs text-gray-400 py-6 text-center">No published posts for this account.</p>
                                ) : visiblePosts.map((p) => (
                                    <button key={p.id} type="button" onClick={() => set('postId', p.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl border transition-colors ${form.postId === p.id ? 'border-blue-500 bg-blue-50/40' : 'border-gray-100 hover:bg-gray-50'}`}>
                                        <span className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 overflow-hidden grid place-items-center">
                                            {p.thumbnail ? <img src={p.thumbnail} alt="" className="w-full h-full object-cover" /> : <PlatformIcon id={p.platform} size={18} />}
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-sm font-semibold text-gray-900 truncate">{p.preview}</span>
                                            <span className="block text-xs text-gray-400">{fmtDate(p.published_at)}{p.media_count ? ` · ${p.media_count} media` : ''}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Config */}
                        <div className="space-y-3">
                            <label className="block"><span className={lbl}>Ad account</span>
                                <select className={inp} value={form.adAccountId} onChange={(e) => { set('adAccountId', e.target.value); set('postId', ''); }}>
                                    <option value="">Select…</option>
                                    {adAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </label>

                            <label className="block"><span className={lbl}>Ad name</span><input className={inp} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="My Boosted Post" /></label>

                            <div>
                                <span className={lbl}>Goal</span>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    {BOOST_GOALS.map(([g, label]) => (
                                        <button key={g} type="button" onClick={() => set('goal', g)}
                                            className={`text-xs font-semibold px-3 py-2 rounded-lg border ${form.goal === g ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className={lbl}>Budget {acct?.currency ? <span className="text-gray-400 font-normal">({acct.currency})</span> : null}</span>
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <input type="number" min="1" className={inp} value={form.budgetAmount} onChange={(e) => set('budgetAmount', e.target.value)} />
                                    <select className={inp} value={form.budgetType} onChange={(e) => set('budgetType', e.target.value)}>
                                        <option value="daily">per day</option><option value="lifetime">total</option>
                                    </select>
                                </div>
                                {acct?.currency && <p className="text-[11px] text-gray-400 leading-snug mt-1">Amount is in <b>{acct.currency}</b> (your ad account's currency), not USD. Meta enforces a minimum daily budget — raise it if the ad won't deliver.</p>}
                            </div>

                            {/* Targeting (boost supports countries / age / gender) */}
                            <div className="rounded-xl border border-gray-200 p-3 space-y-3">
                                <span className="text-xs font-bold text-gray-900">Targeting</span>
                                <div>
                                    <span className={lbl}>Countries</span>
                                    {targeting.countries.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-1 mb-1.5">
                                            {targeting.countries.map((c) => (
                                                <span key={c} className="text-xs bg-gray-900 text-white rounded-full pl-2.5 pr-1 py-1 flex items-center gap-1">
                                                    {COUNTRY_NAME[c] || c}
                                                    <button type="button" onClick={() => removeCountry(c)} className="hover:text-gray-300"><X size={11} /></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="relative mt-1">
                                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input className={inp + ' pl-8'} value={cq} onChange={(e) => setCq(e.target.value)} placeholder="Type a country…" />
                                        {cq.trim() && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                                {countryMatches.length === 0 ? <div className="px-3 py-2 text-xs text-gray-400">No match</div> : countryMatches.map(([code, name]) => (
                                                    <button key={code} type="button" onClick={() => addCountry(code)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center justify-between gap-2">
                                                        <span className="truncate">{name}</span><span className="text-gray-300">{code}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <label className="block"><span className={lbl}>Age min</span><input type="number" min="13" max="65" className={inp} value={targeting.ageMin} onChange={(e) => setTargeting((t) => ({ ...t, ageMin: e.target.value }))} /></label>
                                    <label className="block"><span className={lbl}>Age max</span><input type="number" min="13" max="65" className={inp} value={targeting.ageMax} onChange={(e) => setTargeting((t) => ({ ...t, ageMax: e.target.value }))} /></label>
                                    <label className="block"><span className={lbl}>Gender</span>
                                        <select className={inp} value={targeting.gender} onChange={(e) => setTargeting((t) => ({ ...t, gender: e.target.value }))}>
                                            <option value="all">All</option><option value="male">Male</option><option value="female">Female</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex items-center justify-end gap-2">
                            <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
                            <button onClick={submit} disabled={busy} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                {busy ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />} Boost post
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
