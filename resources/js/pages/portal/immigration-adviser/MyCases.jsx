import { Head, Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import {
    UserCheck, Globe, ArrowRight, AlertTriangle, MessageSquare, FileCheck2, Inbox, ArrowUpDown,
} from "lucide-react";

// Adviser "My Cases" — a focused TABLE of the cases referred to this adviser,
// distinct from the full "Cases" board's tooling. Case · Stage/Visa · Country ·
// Docs · Actions, with the ones needing action sorted to the top. Opens the
// ADVISER case profile so the sidebar chrome stays on the adviser portal.

const ACCENT = "#009688";

const PRIORITY = {
    urgent: { label: "Urgent", cls: "bg-rose-50 text-rose-700 border-rose-200" },
    high:   { label: "High",   cls: "bg-orange-50 text-orange-700 border-orange-200" },
    medium: { label: "Medium", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    low:    { label: "Low",    cls: "bg-sky-50 text-sky-700 border-sky-200" },
    done:   { label: "Done",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const initials = (n = "") => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "—";
const needsAttention = (c) => (c.awaiting_my_answer > 0) || c.custody_stale === "red" || (c.docs_pending > 0);

const SORTS = [
    { key: "attention", label: "Attention" },
    { key: "priority", label: "Priority" },
    { key: "recent", label: "Recent" },
];

export default function MyCases({ cases = [] }) {
    const [sort, setSort] = useState("attention");

    const stats = useMemo(() => ({
        total: cases.length,
        attention: cases.filter(needsAttention).length,
        questions: cases.reduce((n, c) => n + (c.awaiting_my_answer || 0), 0),
        docs: cases.reduce((n, c) => n + (c.docs_pending || 0), 0),
    }), [cases]);

    const sorted = useMemo(() => {
        const rank = { urgent: 0, high: 1, medium: 2, low: 3, done: 5 };
        const byPriority = (a, b) => (rank[a.immigration_priority] ?? 4) - (rank[b.immigration_priority] ?? 4);
        const list = [...cases];
        if (sort === "priority") {
            // Priority first (urgent → low), attention breaks ties.
            list.sort((a, b) => byPriority(a, b) || (needsAttention(b) - needsAttention(a)));
        } else if (sort === "recent") {
            list.sort((a, b) => String(b.converted_at || "").localeCompare(String(a.converted_at || "")));
        } else {
            // Attention-first, then by priority rank.
            list.sort((a, b) => (needsAttention(b) - needsAttention(a)) || byPriority(a, b));
        }
        return list;
    }, [cases, sort]);

    return (
        <div className="max-w-6xl mx-auto pb-14 space-y-6">
            <Head title="My Cases" />

            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#009688] mb-1.5">Your book</p>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">My Cases</h1>
                <p className="text-sm text-gray-500 mt-1">The cases referred to you for licensed review — the ones needing action are at the top.</p>
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat icon={<UserCheck size={16} />} label="Assigned to you" value={stats.total} tone="teal" />
                <Stat icon={<AlertTriangle size={16} />} label="Need attention" value={stats.attention} tone={stats.attention ? "amber" : "gray"} />
                <Stat icon={<MessageSquare size={16} />} label="Open questions" value={stats.questions} tone={stats.questions ? "indigo" : "gray"} />
                <Stat icon={<FileCheck2 size={16} />} label="Docs to review" value={stats.docs} tone={stats.docs ? "rose" : "gray"} />
            </div>

            {cases.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-center py-16">
                    <Inbox size={28} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm font-semibold text-gray-700">No cases assigned to you yet</p>
                    <p className="text-xs text-gray-500 mt-1">When a case is referred to you, it appears here.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Sort control */}
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-100 flex-wrap">
                        <p className="text-[11px] text-gray-400 font-medium inline-flex items-center gap-1.5"><ArrowUpDown size={12} /> Sort</p>
                        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                            {SORTS.map((s) => (
                                <button key={s.key} type="button" onClick={() => setSort(s.key)}
                                    className={`px-3 py-1 rounded-md text-[12px] font-semibold transition-colors ${sort === s.key ? "bg-white text-[#00796b] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3">Case</th>
                                    <th className="px-4 py-3">Stage / Visa</th>
                                    <th className="px-4 py-3">Country</th>
                                    <th className="px-4 py-3 w-[200px]">Docs</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sorted.map((c) => <CaseRow key={c.id} c={c} />)}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function Stat({ icon, label, value, tone }) {
    const T = {
        teal:   "bg-[#009688]/10 text-[#00796b]",
        amber:  "bg-amber-50 text-amber-600",
        indigo: "bg-indigo-50 text-indigo-600",
        rose:   "bg-rose-50 text-rose-600",
        gray:   "bg-gray-100 text-gray-400",
    }[tone];
    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-3.5 flex items-center gap-3">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${T}`}>{icon}</span>
            <div className="min-w-0">
                <p className="text-lg font-bold text-gray-900 leading-none tabular-nums">{value}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">{label}</p>
            </div>
        </div>
    );
}

function CaseRow({ c }) {
    const pr = PRIORITY[c.immigration_priority] || null;
    const pct = c.checklist_total > 0 ? Math.round((c.checklist_submitted / c.checklist_total) * 100) : 0;
    const attention = needsAttention(c);
    const href = `/portal/immigration-adviser/cases/${c.id}`;

    return (
        <tr className="hover:bg-gray-50/50 align-middle">
            {/* Case */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                    {attention && <span title="Needs your attention" className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />}
                    <span className="w-9 h-9 rounded-full inline-flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 bg-[#009688]">
                        {initials(c.name)}
                    </span>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <Link href={href} className="text-[13px] font-semibold text-gray-900 truncate hover:text-[#00796b]">{c.name}</Link>
                            {pr && <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${pr.cls}`}>{pr.label}</span>}
                        </div>
                        {c.awaiting_my_answer > 0 && (
                            <p className="text-[10.5px] text-indigo-600 font-semibold mt-0.5 inline-flex items-center gap-1">
                                <MessageSquare size={10} /> {c.awaiting_my_answer} question{c.awaiting_my_answer > 1 ? "s" : ""} for you
                            </p>
                        )}
                    </div>
                </div>
            </td>

            {/* Stage / Visa */}
            <td className="px-4 py-3">
                <p className="text-[12px] font-medium text-gray-700 inline-flex items-center gap-1.5">
                    <Globe size={12} className="text-gray-400" /> {c.inz_visa_type || "No visa set"}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{c.immigration_stage || "Unassigned"}</p>
            </td>

            {/* Country */}
            <td className="px-4 py-3">
                {c.country ? <span className="text-[12px] text-gray-700">{c.country}</span> : <span className="text-gray-300">—</span>}
            </td>

            {/* Docs */}
            <td className="px-4 py-3">
                {c.checklist_total > 0 ? (
                    <div>
                        <div className="flex items-center justify-between text-[10.5px] text-gray-500 mb-1">
                            <span className="tabular-nums">{c.checklist_submitted}/{c.checklist_total}</span>
                            {c.docs_pending > 0 && <span className="text-rose-600 font-semibold">{c.docs_pending} to review</span>}
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: ACCENT }} />
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-300 text-[12px]">—</span>
                )}
            </td>

            {/* Actions */}
            <td className="px-4 py-3 text-right">
                <Link href={href} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#00796b] bg-[#009688]/10 hover:bg-[#009688]/20 transition-colors">
                    Open <ArrowRight size={13} />
                </Link>
            </td>
        </tr>
    );
}
