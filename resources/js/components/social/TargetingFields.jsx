import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, Search, Target, Loader2, X } from 'lucide-react';
import { social } from '@/services/social';
import { COUNTRIES, COUNTRY_NAME } from '@/data/countries';

const inp = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-300';
const lbl = 'text-xs font-semibold text-gray-600';
const GEO_TYPES = ['country', 'region', 'city', 'metro', 'zip'];
const INCOME_TIERS = [['', 'No income filter'], ['top_5', 'Top 5%'], ['top_10', 'Top 10%'], ['top_10_25', 'Top 10–25%'], ['top_25_50', 'Top 25–50%']];

/**
 * A debounced async-search box with a results dropdown + selected chips.
 * `search(q)` returns a Promise of [{ value, label, sub }]; `selected` is the
 * current chip list [{ value, label }]; surfaces empty/error states clearly so
 * "nothing happens" is never ambiguous.
 */
function SearchPicker({ placeholder, disabled, search, selected, onAdd, onRemove }) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState(null); // null = idle, [] = no results
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const seq = useRef(0);

    useEffect(() => {
        if (!q.trim() || disabled) { setResults(null); setErr(''); return; }
        setBusy(true);
        const mine = ++seq.current;
        const t = setTimeout(() => {
            Promise.resolve(search(q.trim()))
                .then((r) => { if (mine === seq.current) { setResults(r || []); setErr(''); } },
                    (e) => { if (mine === seq.current) { setResults([]); setErr(e?.message || 'Search failed'); } })
                .finally(() => { if (mine === seq.current) setBusy(false); });
        }, 350);
        return () => clearTimeout(t);
    }, [q, disabled]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div>
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {selected.map((s) => (
                        <span key={s.value} className="text-xs bg-blue-50 text-blue-700 rounded-full pl-2.5 pr-1 py-1 flex items-center gap-1">
                            {s.label}
                            <button type="button" onClick={() => onRemove(s.value)} className="hover:text-blue-900"><X size={11} /></button>
                        </span>
                    ))}
                </div>
            )}
            <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className={inp + ' pl-8'} value={q} onChange={(e) => setQ(e.target.value)} placeholder={disabled ? 'Pick an ad account first' : placeholder} disabled={disabled} />
                {q.trim() && !disabled && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                        {busy ? (
                            <div className="px-3 py-2 text-xs text-gray-400">Searching…</div>
                        ) : err ? (
                            <div className="px-3 py-2 text-xs text-red-500">{err}</div>
                        ) : (results && results.length === 0) ? (
                            <div className="px-3 py-2 text-xs text-gray-400">No matches</div>
                        ) : (results || []).map((r) => (
                            <button key={r.value} type="button"
                                onClick={() => { onAdd(r); setQ(''); setResults(null); }}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center justify-between gap-2">
                                <span className="truncate">{r.label}{r.sub ? <span className="text-gray-400"> · {r.sub}</span> : null}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Shared audience-targeting editor (locations by country/region/city/metro/zip,
 * age, gender, household income, interests, behaviors, Meta Advantage+, AI
 * suggest, save/load presets). `value` carries the full targeting spec;
 * `onChange` receives the next value. `aiContext` { content, goal, platform }
 * drives the AI suggestion; `accountId` is the social account ads hang off.
 */
export default function TargetingFields({ accountId, platform, value, onChange, aiContext }) {
    const t = value;
    const patch = (p) => onChange({ ...t, ...p });
    const list = (k) => t[k] || [];

    const [aiBusy, setAiBusy] = useState(false);
    const [rationale, setRationale] = useState('');
    const [presets, setPresets] = useState([]);
    const [geoType, setGeoType] = useState('country');

    useEffect(() => {
        if (!accountId) { setPresets([]); return; }
        social.adAudiences({ accountId, adAccountId: accountId, platform })
            .then((r) => setPresets(r?.presets || []), () => setPresets([]));
    }, [accountId, platform]);

    // ── Location search (country = offline list; others = Zernio geo search) ──
    const geoBucket = { country: 'countries', region: 'regions', city: 'cities', metro: 'metros', zip: 'zips' };
    const searchGeo = (q) => {
        if (geoType === 'country') {
            return COUNTRIES.filter(([code, name]) => name.toLowerCase().includes(q.toLowerCase()) || code.toLowerCase() === q.toLowerCase())
                .slice(0, 40).map(([code, name]) => ({ value: code, label: name }));
        }
        return social.targetingSearch({ q, accountId, dimension: 'geo', geoType })
            .then((r) => (r?.results || []).map((x) => ({ value: x.id, label: x.name, sub: (x.path || []).join(' / ') })));
    };
    const addGeo = (r) => {
        const bucket = geoBucket[geoType];
        if (geoType === 'country') {
            if (!list('countries').includes(r.value)) patch({ countries: [...list('countries'), r.value] });
        } else if (!list(bucket).some((g) => g.key === r.value)) {
            patch({ [bucket]: [...list(bucket), { key: r.value, name: r.label }] });
        }
    };
    // Flatten every selected location into one chip list for display.
    const geoSelected = [
        ...list('countries').map((c) => ({ value: `c:${c}`, label: COUNTRY_NAME[c] || c })),
        ...list('regions').map((g) => ({ value: `r:${g.key}`, label: g.name })),
        ...list('cities').map((g) => ({ value: `t:${g.key}`, label: g.name })),
        ...list('metros').map((g) => ({ value: `m:${g.key}`, label: g.name })),
        ...list('zips').map((g) => ({ value: `z:${g.key}`, label: g.name })),
    ];
    const removeGeo = (val) => {
        const [kind, id] = [val[0], val.slice(2)];
        if (kind === 'c') patch({ countries: list('countries').filter((c) => c !== id) });
        else patch({ [{ r: 'regions', t: 'cities', m: 'metros', z: 'zips' }[kind]]: list({ r: 'regions', t: 'cities', m: 'metros', z: 'zips' }[kind]).filter((g) => g.key !== id) });
    };

    // ── Interest / behavior search ──
    const searchEntity = (dimension) => (q) =>
        social.targetingSearch({ q, accountId, dimension })
            .then((r) => (r?.results || []).map((x) => ({ value: x.id, label: x.name, sub: x.size ? Number(x.size).toLocaleString() : '' })));
    const addEntity = (kind) => (r) => { if (!list(kind).some((e) => e.id === r.value)) patch({ [kind]: [...list(kind), { id: r.value, name: r.label }] }); };
    const removeEntity = (kind) => (id) => patch({ [kind]: list(kind).filter((e) => e.id !== id) });

    const runAi = async () => {
        if (!accountId) { toast.error('Pick an ad account first.'); return; }
        if (!aiContext?.content?.trim()) { toast.error('Write or generate the ad copy first for AI targeting.'); return; }
        setAiBusy(true);
        try {
            const r = await social.aiTargeting({ content: aiContext.content.trim(), accountId, goal: aiContext.goal, platform: aiContext.platform });
            patch({
                ageMin: r.ageMin ?? t.ageMin,
                ageMax: r.ageMax ?? t.ageMax,
                countries: Array.from(new Set([...list('countries'), ...(r.countries || [])])),
                interests: [...list('interests'), ...(r.interests || []).filter((ri) => !list('interests').some((i) => i.id === ri.id))],
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

    const applyPreset = (p) => { onChange({ ...t, ...(p?.spec || {}) }); toast.success(`Loaded "${p.name}"`); };
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

            {/* Locations */}
            <div>
                <span className={lbl}>Locations</span>
                <div className="flex gap-1 my-1">
                    {GEO_TYPES.map((g) => (
                        <button key={g} type="button" onClick={() => setGeoType(g)}
                            className={`text-[11px] capitalize px-2 py-1 rounded-md border ${geoType === g ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                            {g}
                        </button>
                    ))}
                </div>
                <SearchPicker
                    key={geoType}
                    placeholder={`Search ${geoType === 'zip' ? 'ZIP/postal' : geoType}…`}
                    disabled={geoType !== 'country' && !accountId}
                    search={searchGeo}
                    selected={geoSelected}
                    onAdd={addGeo}
                    onRemove={removeGeo}
                />
            </div>

            {/* Age + Gender */}
            <div className="grid grid-cols-3 gap-3">
                <label className="block"><span className={lbl}>Age min</span><input type="number" min="13" max="65" className={inp} value={t.ageMin} onChange={(e) => patch({ ageMin: e.target.value })} /></label>
                <label className="block"><span className={lbl}>Age max</span><input type="number" min="13" max="65" className={inp} value={t.ageMax} onChange={(e) => patch({ ageMax: e.target.value })} /></label>
                <label className="block"><span className={lbl}>Gender</span>
                    <select className={inp} value={t.gender || 'all'} onChange={(e) => patch({ gender: e.target.value })}>
                        <option value="all">All</option><option value="male">Male</option><option value="female">Female</option>
                    </select>
                </label>
            </div>

            {/* Household income */}
            <label className="block"><span className={lbl}>Household income</span>
                <select className={inp} value={t.incomeTier || ''} onChange={(e) => patch({ incomeTier: e.target.value })}>
                    {INCOME_TIERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
            </label>

            {/* Interests */}
            <div>
                <span className={lbl}>Interests</span>
                <SearchPicker placeholder="Search interests…" disabled={!accountId} search={searchEntity('interest')}
                    selected={list('interests').map((e) => ({ value: e.id, label: e.name }))}
                    onAdd={addEntity('interests')} onRemove={removeEntity('interests')} />
            </div>

            {/* Behaviors */}
            <div>
                <span className={lbl}>Behaviors</span>
                <SearchPicker placeholder="Search behaviors…" disabled={!accountId} search={searchEntity('behavior')}
                    selected={list('behaviors').map((e) => ({ value: e.id, label: e.name }))}
                    onAdd={addEntity('behaviors')} onRemove={removeEntity('behaviors')} />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!t.advantageAudience} onChange={(e) => patch({ advantageAudience: e.target.checked })} className="rounded" />
                <span className="text-xs text-gray-600">Let Meta's AI expand the audience (Advantage+)</span>
            </label>
        </div>
    );
}
