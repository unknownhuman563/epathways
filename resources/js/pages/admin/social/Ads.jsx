import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { toast } from 'sonner';
import { Megaphone, RefreshCw, BarChart3, Rocket, Loader2, X, Sparkles, Search, Target } from 'lucide-react';
import SocialLayout from '@/pages/admin/social/SocialLayout';
import { social } from '@/services/social';
import { Skeleton, PlatformIcon, EmptyState } from '@/components/social/atoms';

const inp = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-300';
const STATUS_CHIP = {
    active: 'bg-emerald-50 text-emerald-700', paused: 'bg-amber-50 text-amber-700',
    completed: 'bg-gray-100 text-gray-600', pending: 'bg-blue-50 text-blue-700',
};
// Zernio boost goals + platforms.
const BOOST_GOALS = ['traffic', 'engagement', 'awareness', 'video_views', 'lead_generation', 'conversions'];
const BOOST_PLATFORMS = ['facebook', 'instagram', 'tiktok', 'linkedin', 'google'];
// Common ePathways source + onshore markets (ISO 3166-1 alpha-2).
const COMMON_COUNTRIES = [
    ['NZ', 'New Zealand'], ['IN', 'India'], ['PH', 'Philippines'], ['NP', 'Nepal'],
    ['LK', 'Sri Lanka'], ['PK', 'Pakistan'], ['BD', 'Bangladesh'], ['VN', 'Vietnam'],
    ['CN', 'China'], ['ID', 'Indonesia'], ['TH', 'Thailand'], ['MM', 'Myanmar'],
    ['FJ', 'Fiji'], ['MY', 'Malaysia'], ['AU', 'Australia'], ['US', 'United States'], ['GB', 'United Kingdom'],
];
// Group platforms so a Meta ad account matches Facebook + Instagram posts, etc.
const PLATFORM_GROUP = {
    facebook: 'meta', instagram: 'meta', metaads: 'meta',
    tiktok: 'tiktok', tiktokads: 'tiktok',
    linkedin: 'linkedin', linkedinads: 'linkedin',
    google: 'google', googleads: 'google',
    pinterest: 'pinterest', twitter: 'x', xads: 'x',
};
const groupOf = (p) => { const k = String(p || '').toLowerCase(); return PLATFORM_GROUP[k] || k; };

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
    const [form, setForm] = useState({
        name: '', postId: '', adAccountId: '', platform: 'facebook', goal: 'traffic',
        budgetAmount: '20', budgetType: 'daily', content: '',
        ageMin: 18, ageMax: 45, countries: [], interests: [], advantageAudience: false,
    });
    const [busy, setBusy] = useState(false);
    const [aiBusy, setAiBusy] = useState(false);
    const [rationale, setRationale] = useState('');
    const [iq, setIq] = useState('');
    const [iResults, setIResults] = useState([]);
    const [iSearching, setISearching] = useState(false);
    const [presets, setPresets] = useState([]);
    const [posts, setPosts] = useState(null);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    // Ad accounts hang off a social account: the selected ad account carries the
    // social accountId (used for search / AI / audiences / the boost) + platform.
    const acct = (adAccounts || []).find((a) => a.id === form.adAccountId) || null;
    const accountId = acct?.accountId || '';
    const acctPlatform = () => acct?.platform || form.platform;
    // Only show posts in the chosen ad account's platform family (a Meta ad
    // account boosts Facebook/Instagram posts, etc.).
    const visiblePosts = (posts || []).filter((p) => acct && groupOf(p.platform) === groupOf(acct.platform));

    useEffect(() => {
        social.adAccounts().then((r) => setAdAccounts(r?.adAccounts || []), () => setAdAccounts([]));
        social.publishedPosts().then((r) => setPosts(r?.posts || []), () => setPosts([]));
    }, []);

    // Pick a published post to boost: set its id, infer the platform, and seed
    // the AI-targeting box with the post's own copy (unless already typed).
    const selectPost = (id) => {
        const p = posts?.find((x) => x.id === id);
        setForm((f) => ({
            ...f,
            postId: id,
            platform: p && BOOST_PLATFORMS.includes(p.platform) ? p.platform : f.platform,
            content: f.content?.trim() ? f.content : (p?.content || ''),
        }));
    };

    // Saved-targeting presets for the chosen ad account.
    useEffect(() => {
        if (!accountId) { setPresets([]); return; }
        social.adAudiences({ accountId, adAccountId: accountId, platform: acctPlatform() })
            .then((r) => setPresets(r?.presets || []), () => setPresets([]));
    }, [accountId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounced interest search.
    useEffect(() => {
        if (!iq.trim() || !accountId) { setIResults([]); return; }
        setISearching(true);
        const t = setTimeout(() => {
            social.targetingSearch({ q: iq.trim(), accountId, dimension: 'interest' })
                .then((r) => setIResults(r?.results || []), () => setIResults([]))
                .finally(() => setISearching(false));
        }, 350);
        return () => clearTimeout(t);
    }, [iq, accountId]);

    const addInterest = (r) => {
        if (form.interests.some((i) => i.id === r.id)) return;
        set('interests', [...form.interests, { id: r.id, name: r.name }]);
        setIq(''); setIResults([]);
    };
    const removeInterest = (id) => set('interests', form.interests.filter((i) => i.id !== id));
    const toggleCountry = (code) => set('countries', form.countries.includes(code)
        ? form.countries.filter((c) => c !== code) : [...form.countries, code]);

    const targetingSpec = () => ({
        ageMin: Number(form.ageMin), ageMax: Number(form.ageMax),
        countries: form.countries, interests: form.interests, advantageAudience: form.advantageAudience,
    });

    const runAiTargeting = async () => {
        if (!accountId) { toast.error('Pick an ad account first.'); return; }
        if (!form.content.trim()) { toast.error('Add a short description of the ad for AI targeting.'); return; }
        setAiBusy(true);
        try {
            const r = await social.aiTargeting({ content: form.content.trim(), accountId, goal: form.goal, platform: form.platform });
            setForm((f) => ({
                ...f,
                ageMin: r.ageMin ?? f.ageMin,
                ageMax: r.ageMax ?? f.ageMax,
                countries: Array.from(new Set([...f.countries, ...(r.countries || [])])),
                interests: [...f.interests, ...(r.interests || []).filter((ri) => !f.interests.some((i) => i.id === ri.id))],
            }));
            setRationale(r.rationale || '');
            if (r.unresolved?.length) toast.message('Search these interests manually', { description: r.unresolved.join(', ') });
            else toast.success('AI targeting applied');
        } catch (err) {
            toast.error(err?.message || 'AI targeting failed');
        } finally {
            setAiBusy(false);
        }
    };

    const applyPreset = (p) => {
        const s = p?.spec || {};
        setForm((f) => ({
            ...f,
            ageMin: s.ageMin ?? f.ageMin, ageMax: s.ageMax ?? f.ageMax,
            countries: Array.isArray(s.countries) ? s.countries : f.countries,
            interests: Array.isArray(s.interests) ? s.interests : f.interests,
            advantageAudience: !!s.advantageAudience,
        }));
        toast.success(`Loaded "${p.name}"`);
    };

    const savePreset = async () => {
        if (!accountId) { toast.error('Pick an ad account first.'); return; }
        const name = window.prompt('Save this audience as:');
        if (!name) return;
        try {
            await social.saveAudience({ accountId, name, spec: targetingSpec() });
            toast.success('Audience saved');
            social.adAudiences({ accountId, adAccountId: accountId, platform: acctPlatform() })
                .then((r) => setPresets(r?.presets || []), () => {});
        } catch (err) {
            toast.error(err?.message || 'Could not save audience');
        }
    };

    const submit = async () => {
        if (!form.name || !form.postId || !form.adAccountId) { toast.error('Fill name, post ID and ad account.'); return; }
        setBusy(true);
        try {
            await social.boostPost({
                name: form.name, postId: form.postId, adAccountId: form.adAccountId, accountId,
                platform: form.platform, goal: form.goal,
                budgetAmount: Number(form.budgetAmount), budgetType: form.budgetType,
                targeting: targetingSpec(),
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

    const lbl = 'text-xs font-semibold text-gray-600';

    return (
        <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
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
                        <label className="block"><span className={lbl}>Campaign name</span><input className={inp} value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
                        <label className="block"><span className={lbl}>Ad account</span>
                            <select className={inp} value={form.adAccountId} onChange={(e) => { set('adAccountId', e.target.value); set('postId', ''); }}>
                                <option value="">Select…</option>
                                {adAccounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.platform}{a.currency ? `, ${a.currency}` : ''})</option>)}
                            </select>
                        </label>
                        <label className="block">
                            <span className={lbl}>Post to boost {acct ? <span className="text-gray-400 font-normal">· {acct.platform} posts</span> : null}</span>
                            {posts === null ? (
                                <div className={inp + ' text-gray-400'}>Loading published posts…</div>
                            ) : !acct ? (
                                <div className={inp + ' text-gray-400'}>Pick an ad account first</div>
                            ) : visiblePosts.length > 0 ? (
                                <select className={inp} value={form.postId} onChange={(e) => selectPost(e.target.value)}>
                                    <option value="">Select a published post…</option>
                                    {visiblePosts.map((p) => <option key={p.id} value={p.id}>{(p.account ? p.account + ' · ' : '') + p.preview}</option>)}
                                </select>
                            ) : (
                                <input className={inp} value={form.postId} onChange={(e) => set('postId', e.target.value)} placeholder={`No published ${acct.platform} posts — paste a post ID`} />
                            )}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block"><span className={lbl}>Goal</span>
                                <select className={inp} value={form.goal} onChange={(e) => set('goal', e.target.value)}>
                                    {BOOST_GOALS.map((g) => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
                                </select>
                            </label>
                            <label className="block"><span className={lbl}>Platform</span>
                                <select className={inp} value={form.platform} onChange={(e) => set('platform', e.target.value)}>
                                    {BOOST_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </label>
                            <label className="block"><span className={lbl}>Budget {acct?.currency ? <span className="text-gray-400 font-normal">({acct.currency})</span> : null}</span><input type="number" min="1" className={inp} value={form.budgetAmount} onChange={(e) => set('budgetAmount', e.target.value)} /></label>
                            <label className="block"><span className={lbl}>Budget type</span>
                                <select className={inp} value={form.budgetType} onChange={(e) => set('budgetType', e.target.value)}>
                                    <option value="daily">daily</option><option value="lifetime">lifetime</option>
                                </select>
                            </label>
                        </div>
                        {acct?.currency && <p className="text-[11px] text-gray-400 leading-snug -mt-1">Meta enforces a minimum daily budget in {acct.currency}. If the boost says the budget is too low, raise it.</p>}

                        {/* ── Audience targeting ─────────────────────────────── */}
                        <div className="rounded-xl border border-gray-200 p-3 space-y-3">
                            <div className="flex items-center gap-2">
                                <Target size={14} className="text-gray-700" />
                                <span className="text-xs font-bold text-gray-900">Audience</span>
                                {presets.length > 0 && (
                                    <select className="ml-auto text-xs px-2 py-1 rounded-lg border border-gray-200 outline-none" defaultValue=""
                                        onChange={(e) => { const p = presets.find((x) => x.id === e.target.value); if (p) applyPreset(p); e.target.value = ''; }}>
                                        <option value="">Load preset…</option>
                                        {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                )}
                                <button type="button" onClick={savePreset} className={`text-xs font-semibold text-blue-600 hover:text-blue-700 ${presets.length > 0 ? '' : 'ml-auto'}`}>Save preset</button>
                            </div>

                            {/* AI targeting */}
                            <label className="block"><span className={lbl}>What's the ad about? <span className="text-gray-400 font-normal">(for AI targeting)</span></span>
                                <textarea className={inp + ' h-16 resize-none'} value={form.content} onChange={(e) => set('content', e.target.value)} placeholder="Paste the post copy or describe the offer…" />
                            </label>
                            <button type="button" onClick={runAiTargeting} disabled={aiBusy}
                                className="w-full px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2">
                                {aiBusy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Suggest audience with AI
                            </button>
                            {rationale && <p className="text-xs text-indigo-700 bg-indigo-50/60 rounded-lg px-3 py-2 leading-relaxed">{rationale}</p>}

                            {/* Age */}
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block"><span className={lbl}>Age min</span><input type="number" min="13" max="65" className={inp} value={form.ageMin} onChange={(e) => set('ageMin', e.target.value)} /></label>
                                <label className="block"><span className={lbl}>Age max</span><input type="number" min="13" max="65" className={inp} value={form.ageMax} onChange={(e) => set('ageMax', e.target.value)} /></label>
                            </div>

                            {/* Locations */}
                            <div>
                                <span className={lbl}>Locations</span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {COMMON_COUNTRIES.map(([code, name]) => (
                                        <button key={code} type="button" onClick={() => toggleCountry(code)} title={name}
                                            className={`text-xs px-2 py-1 rounded-full border ${form.countries.includes(code) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                                            {code}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Interests */}
                            <div>
                                <span className={lbl}>Interests</span>
                                <div className="relative mt-1">
                                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input className={inp + ' pl-8'} value={iq} onChange={(e) => setIq(e.target.value)} placeholder={accountId ? 'Search interests…' : 'Pick an ad account first'} disabled={!accountId} />
                                    {(iSearching || iResults.length > 0) && (
                                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {iSearching ? <div className="px-3 py-2 text-xs text-gray-400">Searching…</div> : iResults.map((r) => (
                                                <button key={r.id} type="button" onClick={() => addInterest(r)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center justify-between gap-2">
                                                    <span className="truncate">{r.name}{r.path?.length ? <span className="text-gray-400"> · {r.path.join(' / ')}</span> : null}</span>
                                                    {r.size ? <span className="text-gray-400 shrink-0">{Number(r.size).toLocaleString()}</span> : null}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {form.interests.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {form.interests.map((i) => (
                                            <span key={i.id} className="text-xs bg-blue-50 text-blue-700 rounded-full pl-2.5 pr-1 py-1 flex items-center gap-1">
                                                {i.name}
                                                <button type="button" onClick={() => removeInterest(i.id)} className="hover:text-blue-900"><X size={11} /></button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Meta Advantage AI audience */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.advantageAudience} onChange={(e) => set('advantageAudience', e.target.checked)} className="rounded" />
                                <span className="text-xs text-gray-600">Let Meta's AI expand the audience (Advantage+)</span>
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
