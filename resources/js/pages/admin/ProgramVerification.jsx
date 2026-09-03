import { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    BadgeCheck, CheckCircle2, ShieldCheck, GraduationCap, Mail, Clock, Loader2,
    Pencil, ExternalLink, Search, X, Check,
} from "lucide-react";

// Program Verification — Dinah (and super admins) review submitted study
// proposals: edit the shortlist if needed, then Verify → Approve. Only on
// approval does the proposal reach the client's tracker and the email fire.
export default function ProgramVerification({ proposals = [], programs = [], leadBase = "/admin" }) {
    const [busy, setBusy] = useState(null); // `${id}:${action}`
    const [editing, setEditing] = useState(null); // proposal row being edited

    const act = (leadId, action) => {
        setBusy(`${leadId}:${action}`);
        router.post(`/program-verification/${leadId}/${action}`, {}, {
            preserveScroll: true,
            onFinish: () => setBusy(null),
        });
    };

    const fmt = (iso) => iso
        ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "—";

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Program Verification" />

            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400 mb-1">Module</p>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <BadgeCheck size={22} /> Program Verification
                </h1>
                <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                    Study proposals submitted by staff. Edit the programs if needed, verify, then approve — the client
                    sees the programs on their tracker (and gets emailed) only once approved.
                </p>
            </div>

            {proposals.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
                    <ShieldCheck size={26} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium">Nothing to review</p>
                    <p className="text-xs mt-1">Submitted proposals awaiting verification will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {proposals.map((p) => (
                        <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-gray-900 truncate">{p.name}</h2>
                                        <StatusPill status={p.status} />
                                    </div>
                                    <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap">
                                        <span className="font-mono">{p.lead_id}</span>
                                        {p.email && <span className="inline-flex items-center gap-1"><Mail size={11} /> {p.email}</span>}
                                        <span className="inline-flex items-center gap-1"><Clock size={11} /> Submitted {fmt(p.submitted_at)}</span>
                                        <Link href={`${leadBase}/leads/${p.id}`} className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800">
                                            <ExternalLink size={11} /> View lead profile
                                        </Link>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditing(p)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-[12px] font-semibold hover:bg-gray-50"
                                    >
                                        <Pencil size={13} /> Edit programs
                                    </button>
                                    {p.status === "pending" && (
                                        <button
                                            type="button"
                                            onClick={() => act(p.id, "verify")}
                                            disabled={busy === `${p.id}:verify`}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-[12px] font-semibold hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            {busy === `${p.id}:verify` ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Verify
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => act(p.id, "approve")}
                                        disabled={busy === `${p.id}:approve` || p.status === "pending"}
                                        title={p.status === "pending" ? "Verify first" : "Approve — sends to the client"}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-bold hover:bg-black disabled:opacity-40 transition-colors"
                                    >
                                        {busy === `${p.id}:approve` ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Approve
                                    </button>
                                </div>
                            </div>

                            {/* Programs + reasons */}
                            <div className="p-6 space-y-3">
                                {p.programs.map((prog) => (
                                    <div key={prog.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                                                Level {prog.level}
                                            </span>
                                            <GraduationCap size={13} className="text-gray-400" />
                                            <span className="text-[14px] font-semibold text-gray-900">{prog.title}</span>
                                            {prog.location && <span className="text-[11px] text-gray-400">· {prog.location}</span>}
                                            {prog.price_text && <span className="text-[11px] font-semibold text-gray-600">· {prog.price_text}</span>}
                                        </div>
                                        {prog.reason ? (
                                            <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-0.5">Why this program</p>
                                                <p className="text-[12px] text-emerald-900 leading-relaxed">{prog.reason}</p>
                                            </div>
                                        ) : (
                                            <p className="mt-2 text-[11px] text-gray-400 italic">No reason provided.</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editing && (
                <EditProgramsModal
                    proposal={editing}
                    catalogue={programs}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}

function StatusPill({ status }) {
    const map = {
        pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" },
        verified: { label: "Verified", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    };
    const m = map[status] || map.pending;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${m.cls}`}>
            {m.label}
        </span>
    );
}

const MAX = 5;

// Edit the shortlist — swap programs, change how many (1–5), and edit reasons.
function EditProgramsModal({ proposal, catalogue, onClose }) {
    const [picked, setPicked] = useState(() => proposal.programs.map((p) => p.id));
    const [reasons, setReasons] = useState(() => {
        const r = {};
        proposal.programs.forEach((p) => { if (p.reason) r[p.id] = p.reason; });
        return r;
    });
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);

    const byId = useMemo(() => new Map(catalogue.map((p) => [p.id, p])), [catalogue]);
    const pickedSet = new Set(picked);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (! q) return catalogue.slice(0, 100);
        return catalogue.filter((p) =>
            (p.title || "").toLowerCase().includes(q)
            || (p.location || "").toLowerCase().includes(q)
            || String(p.level ?? "").includes(q)
        ).slice(0, 100);
    }, [catalogue, search]);

    const toggle = (id) => {
        setPicked((prev) => {
            if (prev.includes(id)) {
                setReasons((r) => { const n = { ...r }; delete n[id]; return n; });
                return prev.filter((x) => x !== id);
            }
            if (prev.length >= MAX) return prev; // hard cap — no auto-drop here
            return [...prev, id];
        });
    };

    const save = () => {
        if (picked.length === 0) return;
        setSaving(true);
        router.post(`/program-verification/${proposal.id}/programs`, {
            program_ids: picked,
            reasons: Object.fromEntries(picked.filter((id) => (reasons[id] || "").trim()).map((id) => [id, reasons[id].trim()])),
        }, {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onFinish: () => setSaving(false),
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl h-[88vh] flex flex-col overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-[15px] font-bold text-gray-900">Edit programs — {proposal.name}</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">Tick up to {MAX}. Add a reason the client sees on their tracker.</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Selected with reasons */}
                    {picked.length > 0 && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">Selected · {picked.length} / {MAX}</p>
                            <div className="space-y-2">
                                {picked.map((id) => {
                                    const p = byId.get(id);
                                    return (
                                        <div key={id} className="rounded-md bg-white border border-emerald-200 shadow-sm p-2">
                                            <div className="flex items-center gap-1.5">
                                                {p ? (
                                                    <>
                                                        <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 shrink-0">L{p.level}</span>
                                                        <span className="text-[12px] font-semibold text-gray-800 truncate" title={p.title}>{p.title}</span>
                                                    </>
                                                ) : <span className="text-[12px] text-gray-500">Program #{id}</span>}
                                                <button type="button" onClick={() => toggle(id)} className="ml-auto w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-600 shrink-0"><X size={12} /></button>
                                            </div>
                                            <textarea
                                                rows={2}
                                                value={reasons[id] ?? ""}
                                                onChange={(e) => setReasons((r) => ({ ...r, [id]: e.target.value }))}
                                                placeholder="Why this program? (the client sees this)"
                                                maxLength={1000}
                                                className="w-full mt-1.5 px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 resize-y"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Search + catalogue */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, location or level…" className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-gray-900" />
                    </div>
                    <div className="space-y-1.5">
                        {filtered.map((p) => {
                            const on = pickedSet.has(p.id);
                            const full = ! on && picked.length >= MAX;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => toggle(p.id)}
                                    disabled={full}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${on ? "border-gray-900 bg-gray-900 text-white" : full ? "border-gray-100 opacity-40 cursor-not-allowed" : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${on ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>Level {p.level}</span>
                                                {p.category && <span className={`text-[10px] font-medium capitalize ${on ? "text-gray-300" : "text-gray-500"}`}>{p.category}</span>}
                                            </div>
                                            <p className="text-sm font-semibold truncate">{p.title}</p>
                                            <div className={`flex items-center gap-2 mt-1 text-[11px] ${on ? "text-gray-300" : "text-gray-500"}`}>
                                                {p.location && <span>{p.location}</span>}
                                                {p.price_text && <span>· {p.price_text}</span>}
                                            </div>
                                        </div>
                                        {on && <Check size={14} className="text-white mt-1 shrink-0" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-white">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
                    <button type="button" onClick={save} disabled={saving || picked.length === 0} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-black disabled:opacity-50">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save programs
                    </button>
                </div>
            </div>
        </div>
    );
}
