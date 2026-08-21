import { useEffect, useMemo, useState, Fragment } from "react";
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    BadgeCheck, ShieldCheck, ShieldAlert, Eye, Download, FileText,
    CheckCircle2, XCircle, Globe, Clock, X, Loader2, SearchCheck, ChevronRight, ChevronLeft, MoreHorizontal,
} from "lucide-react";

// Adviser verification queue. Documents a manager marked "Checked" (referred to
// the LIA) land here, grouped per client as a table. "Review" opens a modal with
// a tab-list of that client's Checked documents — the adviser works through them
// one at a time (document on the left, remarks + final verdict on the right).

export default function Verification({ documents = [], decided = [], licence = {} }) {
    const openReview = (g) => router.visit(`/portal/immigration-adviser/verification/review/${g.case.id}`);

    // Group the checked documents by client/case.
    const groups = useMemo(() => {
        const m = new Map();
        for (const d of documents) {
            const k = d.case.id;
            if (!m.has(k)) m.set(k, { case: d.case, docs: [] });
            m.get(k).docs.push(d);
        }
        return Array.from(m.values()).sort((a, b) => b.docs.length - a.docs.length);
    }, [documents]);

    const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—");

    const [tab, setTab] = useState("verify");

    // Enrich each client group with its longest wait, manager-flagged count and
    // the referring manager, then order oldest-wait-first.
    const enriched = useMemo(() => groups
        .map((g) => {
            const earliest = g.docs.map((d) => d.checked_at).filter(Boolean).sort()[0] || null;
            return {
                ...g,
                earliest,
                flagged: g.docs.filter((d) => d.note).length,
                referrer: g.docs.map((d) => d.referred_by).find(Boolean) || null,
            };
        })
        .sort((a, b) => (a.earliest || "").localeCompare(b.earliest || "")), [groups]);

    const flaggedGroups = enriched.filter((g) => g.flagged > 0);
    const nextUp = enriched[0] || null;
    const shown = tab === "flagged" ? flaggedGroups : enriched;
    const buckets = [
        { key: "old", label: "Waiting more than 2 days", tone: "text-red-500 bg-red-50/50", rows: shown.filter((g) => waitDays(g.earliest) > 2) },
        { key: "week", label: "This week", tone: "text-gray-400 bg-gray-50/70", rows: shown.filter((g) => waitDays(g.earliest) <= 2) },
    ];

    return (
        <div className="max-w-[1400px] mx-auto pb-14 space-y-6">
            <Head title="Verification" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Verification queue</h1>
                    <p className="text-sm text-gray-500 mt-1 max-w-xl">Documents your managers checked and referred to you. Your decision is what the client sees.</p>
                </div>
                <LicenceChip licence={licence} />
            </div>

            {groups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-center py-16">
                    <BadgeCheck size={28} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm font-semibold text-gray-700">Nothing to verify</p>
                    <p className="text-xs text-gray-500 mt-1">When a manager marks a document as checked, it appears here.</p>
                </div>
            ) : (
                <>
                    {/* Next up — the client who has waited longest. */}
                    {nextUp && (
                        <div className="rounded-2xl bg-gray-900 text-white px-5 py-4 flex items-center gap-4 flex-wrap">
                            <span className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-[13px] font-bold flex-shrink-0">{initials(nextUp.case.name)}</span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4fd1c5]">Next up · oldest wait</p>
                                <p className="text-[15px] font-bold mt-0.5 truncate">
                                    {nextUp.case.name} — {nextUp.docs.length} document{nextUp.docs.length === 1 ? "" : "s"}{nextUp.flagged > 0 ? `, ${nextUp.flagged} flagged by manager` : ""}
                                </p>
                                <p className="text-[12px] text-white/60 mt-0.5 truncate">
                                    Waiting {relWait(nextUp.earliest)} · {nextUp.case.visa || "No visa type"}{nextUp.referrer ? ` · referred by ${nextUp.referrer}` : ""}
                                </p>
                            </div>
                            <button type="button" onClick={() => openReview(nextUp)}
                                className="px-4 py-2.5 rounded-xl bg-[#009688] text-white text-[13px] font-bold hover:bg-[#00796b] flex-shrink-0">
                                Start review
                            </button>
                        </div>
                    )}

                    {/* Filter tabs */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <TabBtn active={tab === "verify"} onClick={() => setTab("verify")} label="To verify" count={enriched.length} />
                        <TabBtn active={tab === "flagged"} onClick={() => setTab("flagged")} label="Flagged by manager" count={flaggedGroups.length} />
                        <span className="ml-auto text-[12px] text-gray-400">Sorted by longest wait</span>
                    </div>

                    {/* Queue table, bucketed by how long they've waited. */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        <th className="px-5 py-3">Client</th>
                                        <th className="px-4 py-3">Visa</th>
                                        <th className="px-4 py-3">To verify</th>
                                        <th className="px-4 py-3">Waiting</th>
                                        <th className="px-4 py-3 text-right pr-5">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shown.length === 0 && (
                                        <tr><td colSpan={5} className="px-5 py-10 text-center text-[13px] text-gray-400">Nothing in this view.</td></tr>
                                    )}
                                    {buckets.map((bucket) => bucket.rows.length > 0 && (
                                        <Fragment key={bucket.key}>
                                            <tr>
                                                <td colSpan={5} className={`px-5 py-2 text-[10px] font-bold uppercase tracking-wider ${bucket.tone}`}>{bucket.label}</td>
                                            </tr>
                                            {bucket.rows.map((g) => <QueueRow key={g.case.id} g={g} onReview={() => openReview(g)} />)}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-500 flex-wrap gap-2">
                            <span>{groups.length} client{groups.length === 1 ? "" : "s"} waiting · {documents.length} document{documents.length === 1 ? "" : "s"}</span>
                            <span className="text-gray-400">Your decision is recorded against your licence</span>
                        </div>
                    </div>
                </>
            )}

            {/* Recent verdicts — the adviser's decision history. */}
            {decided.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Your recent verdicts</h2>
                        <span className="text-[12px] text-gray-400">{decided.length} recorded</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                        {decided.map((d) => (
                            <div key={d.id} className="px-5 py-3 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full inline-flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 bg-gray-400">{initials(d.case.name)}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-semibold text-gray-900 truncate">{d.case.name} <span className="text-gray-400 font-normal">· {docLabel(d)}</span></p>
                                    {d.note && <p className="text-[11px] text-gray-400 truncate">{d.note}</p>}
                                </div>
                                {d.status === "Approved"
                                    ? <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 flex-shrink-0">Accepted</span>
                                    : <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 flex-shrink-0">Requires attention</span>}
                                <span className="text-[11px] text-gray-400 tabular-nums w-24 text-right flex-shrink-0">{d.reviewed_at ? relWait(d.reviewed_at) + " ago" : ""}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function LicenceChip({ licence }) {
    const ok = licence?.current;
    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-semibold ${ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
            {ok ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
            {ok ? `Licence current${licence.number ? ` · ${licence.number}` : ""}` : "Licence not current"}
        </span>
    );
}

const initials = (n = "") => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "—";

// How long a document has waited, as a coarse relative label.
const waitDays = (iso) => (iso ? (Date.now() - new Date(iso).getTime()) / 86400000 : 0);
const relWait = (iso) => {
    if (!iso) return "—";
    const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
    if (h < 1) return "just now";
    if (h < 24) return `${h} hour${h === 1 ? "" : "s"}`;
    const d = Math.floor(h / 24);
    return `${d} day${d === 1 ? "" : "s"}`;
};

// A friendly document label — the checklist key, else the filename sans extension.
const docLabel = (d) => (d.checklist_key
    ? d.checklist_key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : (d.original_name || "Document").replace(/\.[^.]+$/, ""));

function TabBtn({ active, onClick, label, count }) {
    return (
        <button type="button" onClick={onClick}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors ${active ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {label}
            <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{count}</span>
        </button>
    );
}

// One client's row in the queue — chips for each document to verify (amber when
// the manager flagged it), how long they've waited, and the Review action.
function QueueRow({ g, onReview }) {
    const late = waitDays(g.earliest) > 2;
    return (
        <tr className="border-t border-gray-50 hover:bg-gray-50/40 align-middle">
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-full inline-flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 bg-[#009688]">{initials(g.case.name)}</span>
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{g.case.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono truncate">{g.case.lead_id}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3.5 text-[12.5px] text-gray-700">{g.case.visa || "No visa type"}</td>
            <td className="px-4 py-3.5">
                <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                    {g.docs.map((d) => (
                        <span key={d.id} title={d.note || ""}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${d.note ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${d.note ? "bg-amber-500" : "bg-gray-400"}`} />
                            {docLabel(d)}
                        </span>
                    ))}
                </div>
            </td>
            <td className="px-4 py-3.5">
                <p className={`text-[12.5px] font-semibold tabular-nums ${late ? "text-red-600" : "text-gray-700"}`}>{relWait(g.earliest)}</p>
                {g.referrer && <p className="text-[11px] text-gray-400">by {g.referrer}</p>}
            </td>
            <td className="px-4 py-3.5 pr-5 text-right whitespace-nowrap">
                <div className="inline-flex items-center gap-1.5">
                    <button type="button" onClick={onReview}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-semibold hover:bg-gray-800">
                        <SearchCheck size={14} /> Review
                    </button>
                    <span className="w-8 h-8 rounded-lg border border-gray-200 inline-flex items-center justify-center text-gray-300"><MoreHorizontal size={15} /></span>
                </div>
            </td>
        </tr>
    );
}
