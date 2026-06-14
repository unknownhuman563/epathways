import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { router } from "@inertiajs/react";
import {
    Search, Loader2, ArrowRight, CornerDownLeft,
    Users, Home, Building2, GraduationCap, School, Languages, ClipboardCheck, FileText, CalendarClock,
} from "lucide-react";

const ICONS = { Users, Home, Building2, GraduationCap, School, Languages, ClipboardCheck, FileText, CalendarClock, Search };
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export default function GlobalSearchBar() {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(0);

    const inputRef = useRef(null);
    const panelRef = useRef(null);
    const abortRef = useRef(null);

    // Flat list (across groups) backing arrow-key navigation.
    const flat = useMemo(
        () => groups.flatMap((g) => g.items.map((it) => ({ ...it, _type: g.type }))),
        [groups]
    );

    // Global Cmd/Ctrl+K toggles the palette.
    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Reset + focus on open/close.
    useEffect(() => {
        if (open) {
            const t = setTimeout(() => inputRef.current?.focus(), 20);
            return () => clearTimeout(t);
        }
        setQ("");
        setGroups([]);
        setActive(0);
    }, [open]);

    // Debounced query (300ms after typing stops).
    useEffect(() => {
        if (!open) return;
        const term = q.trim();
        if (term.length < 2) {
            setGroups([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const t = setTimeout(() => {
            abortRef.current?.abort();
            const ctrl = new AbortController();
            abortRef.current = ctrl;
            fetch(`/api/search?q=${encodeURIComponent(term)}`, {
                headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
                credentials: "same-origin",
                signal: ctrl.signal,
            })
                .then((r) => (r.ok ? r.json() : { groups: [] }))
                .then((d) => {
                    setGroups(d.groups ?? []);
                    setActive(0);
                })
                .catch(() => {})
                .finally(() => setLoading(false));
        }, 300);
        return () => clearTimeout(t);
    }, [q, open]);

    // Close on outside click.
    useEffect(() => {
        if (!open) return;
        const onClick = (e) => panelRef.current && !panelRef.current.contains(e.target) && setOpen(false);
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [open]);

    const navigate = useCallback((it, e) => {
        if (!it?.url) return;
        if (e && (e.metaKey || e.ctrlKey)) {
            window.open(it.url, "_blank");
            return;
        }
        setOpen(false);
        router.visit(it.url);
    }, []);

    const onKeyDown = (e) => {
        if (e.key === "Escape") return setOpen(false);
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, flat.length - 1));
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
        }
        if (e.key === "Enter") {
            e.preventDefault();
            navigate(flat[active], e);
        }
    };

    const term = q.trim();
    let flatIndex = -1; // running index to align rendered rows with `active`

    return (
        <>
            {/* Closed trigger — mirrors the old topbar search affordance. */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="hidden md:flex items-center gap-2 bg-white border border-gray-100 rounded-full px-4 py-1.5 shadow-sm hover:shadow transition-shadow text-gray-400"
            >
                <Search size={16} className="text-gray-500" />
                <span className="text-sm">Search...</span>
                <kbd className="ml-6 text-[10px] font-semibold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">{isMac ? "⌘K" : "Ctrl K"}</kbd>
            </button>
            {/* Mobile: icon only. */}
            <button type="button" onClick={() => setOpen(true)} className="md:hidden p-1.5 text-gray-600 hover:bg-white hover:shadow-sm rounded-full" aria-label="Search">
                <Search size={18} />
            </button>

            {open && (
                <div className="fixed inset-0 z-[60] bg-black/30 flex items-start justify-center pt-[12vh] px-4" onKeyDown={onKeyDown}>
                    <div ref={panelRef} className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        {/* Input row */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                            {loading ? <Loader2 size={18} className="text-gray-400 animate-spin" /> : <Search size={18} className="text-gray-400" />}
                            <input
                                ref={inputRef}
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search leads, properties, programs…"
                                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                            />
                            <kbd className="text-[10px] font-semibold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">Esc</kbd>
                        </div>

                        {/* Body */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            {term.length < 2 ? (
                                <p className="px-4 py-10 text-center text-sm text-gray-400">
                                    {term.length === 0 ? "Type to search across leads, properties, programs…" : "Type at least 2 characters"}
                                </p>
                            ) : loading && groups.length === 0 ? (
                                <p className="px-4 py-10 text-center text-sm text-gray-400">Searching…</p>
                            ) : groups.length === 0 ? (
                                <p className="px-4 py-10 text-center text-sm text-gray-400">No results for “{term}”</p>
                            ) : (
                                groups.map((g) => {
                                    const Icon = ICONS[g.icon] || Search;
                                    return (
                                        <div key={g.type} className="py-1.5">
                                            <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                {g.label} ({g.total})
                                            </p>
                                            {g.items.map((it) => {
                                                flatIndex += 1;
                                                const idx = flatIndex;
                                                const isActive = idx === active;
                                                return (
                                                    <button
                                                        key={`${g.type}-${it.id}`}
                                                        type="button"
                                                        onMouseEnter={() => setActive(idx)}
                                                        onClick={(e) => navigate(it, e)}
                                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${isActive ? "bg-gray-100" : "hover:bg-gray-50"}`}
                                                    >
                                                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 shrink-0">
                                                            <Icon size={15} />
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block text-sm font-medium text-gray-900 truncate">{it.label}</span>
                                                            {it.sublabel && <span className="block text-xs text-gray-400 truncate">{it.sublabel}</span>}
                                                        </span>
                                                        {it.badge && <span className="text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 shrink-0">{it.badge}</span>}
                                                        {isActive && <CornerDownLeft size={13} className="text-gray-300 shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                            {g.see_all_url && (
                                                <a
                                                    href={g.see_all_url}
                                                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800"
                                                >
                                                    See all {g.total} {g.label.toLowerCase()} <ArrowRight size={12} />
                                                </a>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
