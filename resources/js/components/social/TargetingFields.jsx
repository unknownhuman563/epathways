import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, Search, Target, Loader2 } from 'lucide-react';
import { social } from '@/services/social';
import { COUNTRIES, COUNTRY_NAME } from '@/data/countries';

const inp = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-300';
const lbl = 'text-xs font-semibold text-gray-600';

/**
 * Shared audience-targeting controls (age / locations / interests / Meta
 * Advantage+ / AI suggest / save-load presets) used by the Boost and Create-Ad
 * flows. `value` is { ageMin, ageMax, countries, interests, advantageAudience };
 * `onChange` receives the next value. `aiContext` { content, goal, platform }
 * drives the AI suggestion. `accountId` is the social account ads hang off.
 */
export default function TargetingFields({ accountId, platform, value, onChange, aiContext }) {
    const t = value;
    const patch = (p) => onChange({ ...t, ...p });

    const [aiBusy, setAiBusy] = useState(false);
    const [rationale, setRationale] = useState('');
    const [iq, setIq] = useState('');
    const [iResults, setIResults] = useState([]);
    const [iSearching, setISearching] = useState(false);
    const [presets, setPresets] = useState([]);
    const [cq, setCq] = useState('');

    useEffect(() => {
        if (!accountId) { setPresets([]); return; }
        social.adAudiences({ accountId, adAccountId: accountId, platform })
            .then((r) => setPresets(r?.presets || []), () => setPresets([]));
    }, [accountId, platform]);

    useEffect(() => {
        if (!iq.trim() || !accountId) { setIResults([]); return; }
        setISearching(true);
        const id = setTimeout(() => {
            social.targetingSearch({ q: iq.trim(), accountId, dimension: 'interest' })
                .then((r) => setIResults(r?.results || []), () => setIResults([]))
                .finally(() => setISearching(false));
        }, 350);
        return () => clearTimeout(id);
    }, [iq, accountId]);

    const addInterest = (r) => {
        if ((t.interests || []).some((i) => i.id === r.id)) return;
        patch({ interests: [...(t.interests || []), { id: r.id, name: r.name }] });
        setIq(''); setIResults([]);
    };
    const removeInterest = (id) => patch({ interests: (t.interests || []).filter((i) => i.id !== id) });
    const addCountry = (code) => { if (!(t.countries || []).includes(code)) patch({ countries: [...(t.countries || []), code] }); setCq(''); };
    const removeCountry = (code) => patch({ countries: (t.countries || []).filter((x) => x !== code) });
    const countryMatches = cq.trim()
        ? COUNTRIES.filter(([code, name]) => name.toLowerCase().includes(cq.trim().toLowerCase()) || code.toLowerCase() === cq.trim().toLowerCase()).slice(0, 40)
        : [];

    const runAi = async () => {
        if (!accountId) { toast.error('Pick an ad account first.'); return; }
        if (!aiContext?.content?.trim()) { toast.error('Write or generate the ad copy first for AI targeting.'); return; }
        setAiBusy(true);
        try {
            const r = await social.aiTargeting({ content: aiContext.content.trim(), accountId, goal: aiContext.goal, platform: aiContext.platform });
            patch({
                ageMin: r.ageMin ?? t.ageMin,
                ageMax: r.ageMax ?? t.ageMax,
                countries: Array.from(new Set([...(t.countries || []), ...(r.countries || [])])),
                interests: [...(t.interests || []), ...(r.interests || []).filter((ri) => !(t.interests || []).some((i) => i.id === ri.id))],
            });
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
        patch({
            ageMin: s.ageMin ?? t.ageMin, ageMax: s.ageMax ?? t.ageMax,
            countries: Array.isArray(s.countries) ? s.countries : t.countries,
            interests: Array.isArray(s.interests) ? s.interests : t.interests,
            advantageAudience: !!s.advantageAudience,
        });
        toast.success(`Loaded "${p.name}"`);
    };
    const savePreset = async () => {
        if (!accountId) { toast.error('Pick an ad account first.'); return; }
        const name = window.prompt('Save this audience as:');
        if (!name) return;
        try {
            await social.saveAudience({ accountId, name, spec: t });
            toast.success('Audience saved');
            social.adAudiences({ accountId, adAccountId: accountId, platform }).then((r) => setPresets(r?.presets || []), () => {});
        } catch (err) {
            toast.error(err?.message || 'Could not save audience');
        }
    };

    return (
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

            <button type="button" onClick={runAi} disabled={aiBusy}
                className="w-full px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2">
                {aiBusy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Suggest audience with AI
            </button>
            {rationale && <p className="text-xs text-indigo-700 bg-indigo-50/60 rounded-lg px-3 py-2 leading-relaxed">{rationale}</p>}

            <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className={lbl}>Age min</span><input type="number" min="13" max="65" className={inp} value={t.ageMin} onChange={(e) => patch({ ageMin: e.target.value })} /></label>
                <label className="block"><span className={lbl}>Age max</span><input type="number" min="13" max="65" className={inp} value={t.ageMax} onChange={(e) => patch({ ageMax: e.target.value })} /></label>
            </div>

            <div>
                <span className={lbl}>Locations</span>
                {(t.countries || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1 mb-1.5">
                        {(t.countries || []).map((c) => (
                            <span key={c} className="text-xs bg-gray-900 text-white rounded-full pl-2.5 pr-1 py-1 flex items-center gap-1">
                                {COUNTRY_NAME[c] || c}
                                <button type="button" onClick={() => removeCountry(c)} className="hover:text-gray-300">×</button>
                            </span>
                        ))}
                    </div>
                )}
                <div className="relative mt-1">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className={inp + ' pl-8'} value={cq} onChange={(e) => setCq(e.target.value)} placeholder="Type a country…" />
                    {cq.trim() && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                            {countryMatches.length === 0 ? (
                                <div className="px-3 py-2 text-xs text-gray-400">No match</div>
                            ) : countryMatches.map(([code, name]) => (
                                <button key={code} type="button" onClick={() => addCountry(code)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center justify-between gap-2">
                                    <span className="truncate">{name}</span>
                                    {(t.countries || []).includes(code) ? <span className="text-emerald-600">✓</span> : <span className="text-gray-300">{code}</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

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
                {(t.interests || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {t.interests.map((i) => (
                            <span key={i.id} className="text-xs bg-blue-50 text-blue-700 rounded-full pl-2.5 pr-1 py-1 flex items-center gap-1">
                                {i.name}
                                <button type="button" onClick={() => removeInterest(i.id)} className="hover:text-blue-900">×</button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!t.advantageAudience} onChange={(e) => patch({ advantageAudience: e.target.checked })} className="rounded" />
                <span className="text-xs text-gray-600">Let Meta's AI expand the audience (Advantage+)</span>
            </label>
        </div>
    );
}
