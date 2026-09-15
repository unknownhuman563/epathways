import { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    ClipboardCheck, GraduationCap, ChevronRight, ChevronLeft, Search,
    Mail, Phone, Clock, Download, Settings, SlidersHorizontal, Bell, MoreHorizontal,
} from "lucide-react";

// Education / Sales Assessments queue. Tabbed: Eligibility (Free Assessment
// leads) vs Enrolment (Education Enrolment leads). Stat cards up top, status
// filter chips, and a review table with a Draft → Submitted → Completed
// progress bar and an AI-analysis verdict line.

const TABS = [
    { key: "eligibility", label: "Eligibility", source: "/free-assessment" },
    { key: "enrolment",   label: "Enrolment",   source: "/education-enrolment" },
];

const SUBMITTED_STATUSES = new Set(["Submitted", "submitted"]);
const COMPLETED_STATUSES = new Set(["Completed", "Engaged", "Converted", "Closed", "Enrolled", "completed", "engaged", "converted"]);

const isCompleted = (r) => COMPLETED_STATUSES.has(r.status);
const isSubmitted = (r) => SUBMITTED_STATUSES.has(r.status);
const isDraft     = (r) => ! isSubmitted(r) && ! isCompleted(r);

const stageOf = (r) => (isCompleted(r) ? "completed" : isDraft(r) ? "draft" : "submitted");

const STAGE = {
    draft:     { label: "Draft",     step: 1, fill: "bg-amber-500",   pill: "bg-amber-50 text-amber-700 border-amber-200" },
    submitted: { label: "Submitted", step: 2, fill: "bg-blue-500",    pill: "bg-blue-50 text-blue-700 border-blue-200" },
    completed: { label: "Completed", step: 3, fill: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const PAGE_SIZE = 25;

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—";

const daysAgo = (iso) => {
    if (! iso) return null;
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return d < 0 ? 0 : d;
};

const initials = (name = "") =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "—";

export default function EducationAssessments({ eligibility = [], enrolment = [] }) {
    const [tab, setTab] = useState("eligibility");
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const rowsByTab = { eligibility, enrolment };
    const rows = rowsByTab[tab];

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => {
            if (statusFilter === "draft" && ! isDraft(r)) return false;
            if (statusFilter === "submitted" && ! isSubmitted(r)) return false;
            if (statusFilter === "completed" && ! isCompleted(r)) return false;
            if (q) {
                const hay = `${r.name} ${r.email || ""} ${r.phone || ""} ${r.programme || ""} ${r.lead_id || ""}`.toLowerCase();
                if (! hay.includes(q)) return false;
            }
            return true;
        });
    }, [rows, statusFilter, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const tabCounts = { eligibility: eligibility.length, enrolment: enrolment.length };

    const statusCounts = useMemo(() => ({
        all:       rows.length,
        draft:     rows.filter(isDraft).length,
        submitted: rows.filter(isSubmitted).length,
        completed: rows.filter(isCompleted).length,
    }), [rows]);

    // Stat cards — computed off the active tab's rows.
    const stats = useMemo(() => {
        const submitted = rows.filter(isSubmitted);
        const drafts = rows.filter(isDraft);
        const oldestSubmitted = submitted.reduce((m, r) => {
            const d = daysAgo(r.created_at);
            return d != null && d > m ? d : m;
        }, 0);
        const draftStale = drafts.reduce((m, r) => {
            const d = daysAgo(r.updated_at);
            return d != null && d > m ? d : m;
        }, 0);
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
        const completedThisMonth = rows.filter((r) => isCompleted(r) && new Date(r.updated_at || r.created_at || 0).getTime() >= monthStart).length;
        return {
            awaiting: submitted.length,
            oldestSubmitted,
            drafts: drafts.length,
            draftStale,
            completedThisMonth,
        };
    }, [rows]);

    const exportCsv = () => {
        const headers = ["Name", "Reference", "Email", "Phone", "Programme", "Status", "Submitted"];
        const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const lines = [headers.map(esc).join(",")];
        filtered.forEach((r) => {
            lines.push([r.name, r.lead_id, r.email, r.phone, r.programme, STAGE[stageOf(r)].label, fmtDate(r.created_at)].map(esc).join(","));
        });
        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `assessments-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const activeTab = TABS.find((t) => t.key === tab);

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
            <Head title="Assessments — Education" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Work / Assessments</p>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">Assessments</h1>
                    <p className="text-sm text-gray-500 mt-1 max-w-xl">
                        Public submissions from the marketing site — eligibility checks and enrolment forms.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={exportCsv}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Download size={15} /> Export CSV
                    </button>
                    <a
                        href={activeTab?.source || "/free-assessment"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#14532d] text-white text-sm font-semibold hover:bg-[#0f3d21] transition-colors"
                    >
                        <Settings size={15} /> Form settings
                    </a>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    value={stats.awaiting}
                    dot="bg-blue-500"
                    label="Awaiting review"
                    sub={stats.awaiting ? `Oldest waiting ${stats.oldestSubmitted} day${stats.oldestSubmitted === 1 ? "" : "s"}` : "Nothing waiting"}
                />
                <StatCard
                    value={stats.drafts}
                    dot="bg-amber-500"
                    label="Draft, stalled"
                    sub={stats.drafts ? `33% complete · no activity ${stats.draftStale} day${stats.draftStale === 1 ? "" : "s"}` : "No drafts"}
                />
                <StatCard
                    value={stats.completedThisMonth}
                    dot="bg-gray-300"
                    label="Completed this month"
                    sub={stats.completedThisMonth ? `${stats.completedThisMonth} converted` : "No conversions yet"}
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                {/* Tabs + status chips + search */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => { setTab(t.key); setStatusFilter("all"); setPage(1); }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors ${
                                    tab === t.key
                                        ? "bg-[#14532d] text-white border-[#14532d]"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                {t.key === "eligibility" ? <ClipboardCheck size={13} /> : <GraduationCap size={13} />}
                                {t.label}
                                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums ${
                                    tab === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                                }`}>
                                    {tabCounts[t.key]}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 flex-1 lg:justify-end">
                        <div className="flex items-center gap-2 flex-1 lg:max-w-sm rounded-lg border border-gray-200 px-3 py-2">
                            <Search size={14} className="text-gray-400 flex-shrink-0" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Search name, email, reference"
                                className="flex-1 min-w-0 outline-none text-[13px] text-gray-900 placeholder:text-gray-400 bg-transparent"
                            />
                        </div>
                        <button type="button" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-[12px] font-semibold text-gray-600 hover:bg-gray-50">
                            <SlidersHorizontal size={13} /> Filters
                        </button>
                    </div>
                </div>

                {/* Status filter chips */}
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-100 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusPill active={statusFilter === "all"}       onClick={() => { setStatusFilter("all"); setPage(1); }}       label="All"       count={statusCounts.all}       tone="green" />
                        <StatusPill active={statusFilter === "draft"}     onClick={() => { setStatusFilter("draft"); setPage(1); }}     label="Draft"     count={statusCounts.draft}     tone="amber" />
                        <StatusPill active={statusFilter === "submitted"} onClick={() => { setStatusFilter("submitted"); setPage(1); }} label="Submitted" count={statusCounts.submitted} tone="blue" />
                        <StatusPill active={statusFilter === "completed"} onClick={() => { setStatusFilter("completed"); setPage(1); }} label="Completed" count={statusCounts.completed} tone="emerald" />
                    </div>
                    <span className="text-[11px] text-gray-400">Sorted by <span className="font-semibold text-gray-500">oldest unreviewed</span></span>
                </div>

                {/* Table */}
                {paged.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 mb-3">
                            <ClipboardCheck size={20} />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                            {rows.length === 0 ? "No submissions yet." : "No submissions match your filters."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="px-5 py-3">Applicant</th>
                                    <th className="px-4 py-3">Programme</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3 w-[240px]">Progress</th>
                                    <th className="px-4 py-3">Submitted</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paged.map((r) => {
                                    const stage = STAGE[stageOf(r)];
                                    const d = daysAgo(r.created_at);
                                    return (
                                        <tr key={r.id} className="text-sm hover:bg-gray-50/40 transition-colors">
                                            {/* Applicant */}
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 bg-[#14532d]">
                                                        {initials(r.name)}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-semibold text-gray-900 truncate">{r.name}</p>
                                                        {r.lead_id && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{r.lead_id}</p>}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Programme */}
                                            <td className="px-4 py-3 align-middle">
                                                <p className={`text-[12px] truncate max-w-[220px] ${r.programme ? "font-semibold text-gray-800" : "text-gray-400 italic"}`}>
                                                    {r.programme || "Not specified"}
                                                </p>
                                                <p className={`text-[11px] mt-0.5 ${r.intake ? "text-gray-500" : "text-gray-400 italic"}`}>
                                                    {r.intake || "No intake selected"}
                                                </p>
                                            </td>

                                            {/* Contact */}
                                            <td className="px-4 py-3 align-middle">
                                                {r.email && (
                                                    <p className="text-[12px] text-gray-700 truncate max-w-[220px] inline-flex items-center gap-1">
                                                        <Mail size={11} className="text-gray-400" /> {r.email}
                                                    </p>
                                                )}
                                                {r.phone && (
                                                    <p className="text-[11px] text-gray-500 truncate max-w-[220px] inline-flex items-center gap-1 mt-0.5">
                                                        <Phone size={10} className="text-gray-400" /> {r.phone}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Progress */}
                                            <td className="px-4 py-3 align-middle">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${stage.pill}`}>
                                                        {stage.label}
                                                    </span>
                                                    <span className="text-[10px] tabular-nums text-gray-400">{stage.step} of 3 steps</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${stage.fill}`} style={{ width: `${(stage.step / 3) * 100}%` }} />
                                                </div>
                                                <p className="text-[10px] mt-1 text-gray-400">
                                                    {r.analysis_done ? `AI analysed${r.ai_verdict ? ` · ${r.ai_verdict}` : ""}` : "Not analysed yet"}
                                                </p>
                                            </td>

                                            {/* Submitted */}
                                            <td className="px-4 py-3 align-middle whitespace-nowrap">
                                                <p className="text-[12px] text-gray-700 tabular-nums">{fmtDate(r.created_at)}</p>
                                                {d != null && <p className="text-[10px] text-gray-400 mt-0.5">{d} day{d === 1 ? "" : "s"} ago</p>}
                                            </td>

                                            {/* Action */}
                                            <td className="px-4 py-3 align-middle">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {isDraft(r) ? (
                                                        <a
                                                            href={r.email ? `mailto:${r.email}?subject=${encodeURIComponent("Finish your ePathways assessment")}&body=${encodeURIComponent(`Hi ${r.name},\n\nWe noticed you started an assessment with ePathways but haven't finished it yet. Reply to this email if you'd like a hand completing it.\n\nNgā mihi,\nePathways`)}` : undefined}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors ${r.email ? "" : "opacity-40 pointer-events-none"}`}
                                                        >
                                                            <Bell size={12} /> Send nudge
                                                        </a>
                                                    ) : (
                                                        <Link
                                                            href={r.detail_url}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14532d] text-white text-[11px] font-bold hover:bg-[#0f3d21] transition-colors"
                                                        >
                                                            Review
                                                        </Link>
                                                    )}
                                                    <Link
                                                        href={r.detail_url}
                                                        title="Open lead"
                                                        className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                                    >
                                                        <MoreHorizontal size={15} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer */}
                {filtered.length > 0 && (
                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
                        <span>Showing {paged.length} of {filtered.length} submissions</span>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">Rows per page {PAGE_SIZE}</span>
                            <button
                                type="button"
                                disabled={safePage <= 1}
                                onClick={() => setPage(safePage - 1)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                            >
                                <ChevronLeft size={12} /> Prev
                            </button>
                            <button
                                type="button"
                                disabled={safePage >= totalPages}
                                onClick={() => setPage(safePage + 1)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                            >
                                Next <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ value, dot, label, sub }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900 tabular-nums">{value}</span>
                <span className={`w-2 h-2 rounded-full ${dot}`} />
            </div>
            <p className="text-[13px] font-semibold text-gray-800 mt-1">{label}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
        </div>
    );
}

function StatusPill({ active, onClick, label, count, tone = "green" }) {
    const activeClass = {
        green:   "bg-[#14532d] text-white border-[#14532d]",
        blue:    "bg-blue-600 text-white border-blue-600",
        amber:   "bg-amber-600 text-white border-amber-600",
        emerald: "bg-emerald-600 text-white border-emerald-600",
    }[tone];

    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
                active ? activeClass : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
        >
            {label}
            <span className={`inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold tabular-nums ${
                active ? "bg-white/20" : "bg-gray-100 text-gray-500"
            }`}>
                {count}
            </span>
        </button>
    );
}
