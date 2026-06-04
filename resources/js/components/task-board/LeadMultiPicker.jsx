import { useEffect, useRef, useState } from "react";
import { X, Search, ChevronDown, Hash } from "lucide-react";

// Multi-select lead picker sourced from /api/tasks/related-records. Opens
// immediately on click with the most recent leads pre-populated; typing
// in the search box filters by name / email / lead id. Selected leads
// appear as removable chips above the input. Used by NewTaskModal and
// TaskDetailModal so the create + edit experiences stay identical.

export default function LeadMultiPicker({
    value = [],          // [{id, lead_id, name, email, record_type}]
    onChange,            // (next[]) => void
    placeholder = "Pick one or more leads, students, cases or clients…",
}) {
    const [q, setQ]             = useState("");
    const [open, setOpen]       = useState(false);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const containerRef          = useRef(null);
    const searchInputRef        = useRef(null);
    const debounceRef           = useRef(null);

    // Close on outside click.
    useEffect(() => {
        const onDoc = (e) => {
            if (containerRef.current && ! containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    // Fetch on open & when query changes.
    useEffect(() => {
        if (! open) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setLoading(true);
        debounceRef.current = setTimeout(() => {
            fetch(`/api/tasks/related-records?q=${encodeURIComponent(q)}`, {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            })
                .then((r) => r.ok ? r.json() : { records: [] })
                .then((d) => setResults(d.records || []))
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, q.trim() === "" ? 0 : 250);
        return () => debounceRef.current && clearTimeout(debounceRef.current);
    }, [q, open]);

    const openAndFocus = () => {
        setOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
    };

    const selectedIds = value.map((v) => String(v.id));
    const filtered    = results.filter((r) => ! selectedIds.includes(String(r.id)));

    const toggle = (record) => {
        if (selectedIds.includes(String(record.id))) {
            onChange(value.filter((v) => String(v.id) !== String(record.id)));
        } else {
            onChange([...value, record]);
        }
    };
    const remove = (id) =>
        onChange(value.filter((v) => String(v.id) !== String(id)));

    return (
        <div ref={containerRef} className="relative">
            {/* Closed / chip-bearing box. Clicking anywhere opens the
                dropdown so users can browse + filter. */}
            <div
                onClick={openAndFocus}
                className={`min-h-[42px] w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white flex flex-wrap gap-1.5 items-center cursor-pointer ${open ? "ring-2 ring-gray-900/10" : ""}`}
            >
                {value.length === 0 && (
                    <span className="text-sm text-gray-400 px-1.5 select-none truncate flex-1">
                        {placeholder}
                    </span>
                )}
                {value.map((r) => (
                    <span
                        key={r.id}
                        className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-800 max-w-full"
                    >
                        <RecordIcon type={r.record_type} />
                        <span className="truncate">{r.name}</span>
                        <span className="font-mono opacity-60 text-[10px]">#{r.lead_id}</span>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); remove(r.id); }}
                            className="ml-0.5 w-4 h-4 inline-flex items-center justify-center rounded-full hover:bg-black/10"
                            aria-label={`Remove ${r.name}`}
                        >
                            <X size={9} />
                        </button>
                    </span>
                ))}
                <span className="ml-auto pr-1 text-gray-400 flex-shrink-0">
                    <ChevronDown size={14} />
                </span>
            </div>

            {open && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {/* Search bar in the dropdown header. */}
                    <div className="relative border-b border-gray-100">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search by name, email or lead id…"
                            className="w-full pl-8 pr-3 py-2 text-sm outline-none"
                        />
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                        {loading && (
                            <div className="px-3 py-2 text-[11px] text-gray-500">Loading…</div>
                        )}
                        {! loading && filtered.length === 0 && (
                            <div className="px-3 py-3 text-[12px] text-gray-500 text-center">
                                {q.trim()
                                    ? "No matches."
                                    : value.length > 0 && results.length > 0
                                        ? "Every visible record is already selected."
                                        : "No records found."}
                            </div>
                        )}
                        {! loading && q.trim() === "" && filtered.length > 0 && (
                            <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/60">
                                Recent
                            </div>
                        )}
                        {filtered.map((r) => (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => toggle(r)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                            >
                                <input type="checkbox" checked={false} readOnly className="rounded" />
                                <RecordIcon type={r.record_type} />
                                <span className="font-medium text-gray-900 truncate">{r.name}</span>
                                <span className="font-mono text-[10px] text-gray-500 inline-flex items-center">
                                    <Hash size={9} />{r.lead_id}
                                </span>
                                <span className="ml-auto text-[9px] uppercase tracking-wider text-gray-400">
                                    {r.record_type}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function RecordIcon({ type }) {
    return (
        <span className="w-5 h-5 rounded bg-white text-gray-600 border border-gray-200 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {type === "student" ? "S" : type === "case" ? "C" : type === "client" ? "A" : "L"}
        </span>
    );
}
