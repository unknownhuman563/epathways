import { useEffect, useRef, useState } from "react";
import { Search, User, Loader2, X, Check, Briefcase, Globe, GraduationCap } from "lucide-react";

/**
 * Debounced person picker for the Visa Approval form.
 *
 * Types → 300ms → hits /admin/visa-approvals/people-search which returns
 * matching Leads (with kind flag: lead / case / student). User can:
 *   - Pick a matched row (fills name + lead_id + suggested country)
 *   - Type a name that isn't in the CRM and hit "Use as custom name"
 *     to store display_name only (lead_id stays null)
 *
 * value shape: { lead_id: int|null, name: string, country?: string }
 */
const KIND_META = {
    lead:    { label: 'Lead',    tone: 'bg-blue-50 text-blue-700 border-blue-100',       icon: User },
    case:    { label: 'Case',    tone: 'bg-purple-50 text-purple-700 border-purple-100', icon: Globe },
    student: { label: 'Student', tone: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: GraduationCap },
};

export default function PersonCombobox({ value, onChange }) {
    const [query, setQuery] = useState(value?.name || "");
    const [open, setOpen]   = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const abortRef  = useRef(null);
    const debounceRef = useRef(null);
    const wrapperRef  = useRef(null);

    // Debounced search
    useEffect(() => {
        if (! open) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (abortRef.current) abortRef.current.abort();
        const q = query.trim();
        if (q.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            const controller = new AbortController();
            abortRef.current = controller;
            try {
                const res = await fetch(`/admin/visa-approvals/people-search?q=${encodeURIComponent(q)}`, {
                    credentials: 'same-origin',
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    signal: controller.signal,
                });
                if (! res.ok) throw new Error();
                const data = await res.json();
                setResults(data.results || []);
            } catch (e) {
                if (e.name !== 'AbortError') setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [query, open]);

    // Click-outside → close
    useEffect(() => {
        if (! open) return;
        const onDoc = (e) => {
            if (! wrapperRef.current?.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const pickRow = (row) => {
        onChange({ lead_id: row.id, name: row.name, country: row.country || null });
        setQuery(row.name);
        setOpen(false);
    };

    const useAsCustom = () => {
        const trimmed = query.trim();
        if (! trimmed) return;
        onChange({ lead_id: null, name: trimmed, country: null });
        setOpen(false);
    };

    const clear = () => {
        onChange({ lead_id: null, name: '', country: null });
        setQuery('');
        setOpen(true);
    };

    // Show "Use as custom name" option when the typed query doesn't exactly
    // match any returned row's name (so free-form entries always have a
    // clear commit action).
    const trimmedQ = query.trim();
    const showUseAsCustom = trimmedQ.length >= 2 && ! results.some((r) => r.name.toLowerCase() === trimmedQ.toLowerCase());

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder="Search leads, cases, students… or type a name"
                    className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-500"
                />
                {(value?.lead_id || value?.name) && (
                    <button
                        type="button"
                        onClick={clear}
                        title="Clear"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* Selection chip when a person is picked (badge shows the source) */}
            {value?.lead_id && (
                <p className="mt-1.5 text-[11px] text-gray-500 inline-flex items-center gap-1.5">
                    <Check size={11} className="text-emerald-600" />
                    Linked to <span className="font-semibold text-gray-800">{value.name}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-500">Lead #{value.lead_id}</span>
                </p>
            )}
            {value && value.lead_id === null && value.name && (
                <p className="mt-1.5 text-[11px] text-gray-500 inline-flex items-center gap-1.5">
                    <Check size={11} className="text-emerald-600" />
                    Custom name: <span className="font-semibold text-gray-800">{value.name}</span>
                </p>
            )}

            {/* Dropdown */}
            {open && (query.trim().length >= 2 || results.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-72 overflow-y-auto">
                    {loading && (
                        <div className="px-4 py-3 flex items-center gap-2 text-xs text-gray-500">
                            <Loader2 size={12} className="animate-spin" /> Searching…
                        </div>
                    )}
                    {! loading && results.map((r) => {
                        const meta = KIND_META[r.kind] || KIND_META.lead;
                        const Icon = meta.icon;
                        return (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => pickRow(r)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-start gap-2.5 border-b border-gray-50 last:border-b-0"
                            >
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 mt-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${meta.tone}`}>
                                    <Icon size={9} strokeWidth={2.5} /> {meta.label}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <p className="text-[13px] font-semibold text-gray-900 truncate">{r.name}</p>
                                    <p className="text-[11px] text-gray-500 truncate">
                                        {r.email || (r.lead_id ? `Lead ${r.lead_id}` : '')}
                                        {r.country && <> · {r.country}</>}
                                    </p>
                                </span>
                            </button>
                        );
                    })}
                    {! loading && results.length === 0 && query.trim().length >= 2 && (
                        <div className="px-3 py-2 text-[11px] text-gray-400 italic">No matches in the CRM.</div>
                    )}
                    {showUseAsCustom && ! loading && (
                        <button
                            type="button"
                            onClick={useAsCustom}
                            className="w-full text-left px-3 py-2.5 hover:bg-amber-50 border-t border-gray-200 text-[13px] flex items-center gap-2"
                        >
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                                <Briefcase size={9} strokeWidth={2.5} /> Custom
                            </span>
                            Use <span className="font-semibold text-gray-900">"{trimmedQ}"</span> as a custom name
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
