import { useState, useMemo } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import {
    Inbox, FolderOpen, Search, FileText, Clock, AlertTriangle,
    XCircle, CheckCircle2, ChevronRight, User, Hash, Filter,
} from "lucide-react";

const BUCKET_META = {
    pending:  { label: "Pending my review",                    icon: <Clock size={13} />,         chip: "bg-amber-100 text-amber-700 border-amber-200", header: "text-amber-700" },
    stale:    { label: "Under review longer than 7 days",      icon: <AlertTriangle size={13} />, chip: "bg-orange-100 text-orange-700 border-orange-200", header: "text-orange-700" },
    rejected: { label: "Recently rejected — awaiting resubmission", icon: <XCircle size={13} />, chip: "bg-rose-100 text-rose-700 border-rose-200", header: "text-rose-700" },
};

const fmtRel = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 60)   return `${mins} min ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)} hr${mins >= 120 ? 's' : ''} ago`;
    return `${Math.floor(mins / 1440)} day${mins >= 2880 ? 's' : ''} ago`;
};

export default function EducationDocuments({
    pending = [], stale = [], rejected = [], folders = [],
}) {
    const [view, setView] = useState("queue"); // queue | folders
    const totalAttention = pending.length + stale.length + rejected.length;
    // Derive the portal base from the current URL so Immigration can re-export
    // this page and the lead-detail links land in the right portal.
    const url = usePage().url || '';
    const portalBase = url.startsWith('/portal/immigration') ? '/portal/immigration' : '/portal/education';

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
            <Head title="Documents — Education" />

            {/* Header */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Documents</h1>
                    <p className="text-sm text-gray-500 mt-1.5">
                        {view === "queue"
                            ? `What needs your attention across all students — ${totalAttention} item${totalAttention === 1 ? '' : 's'}.`
                            : `Folder per student. Click a folder to see their categorised documents.`}
                    </p>
                </div>

                {/* View toggle */}
                <div className="inline-flex items-center bg-white rounded-xl border border-gray-200 p-1">
                    <button type="button" onClick={() => setView("queue")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${view === "queue" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                        <Inbox size={12} /> Queue
                    </button>
                    <button type="button" onClick={() => setView("folders")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${view === "folders" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                        <FolderOpen size={12} /> Folders
                    </button>
                </div>
            </div>

            {view === "queue"
                ? <QueueView pending={pending} stale={stale} rejected={rejected} portalBase={portalBase} />
                : <FoldersView folders={folders} portalBase={portalBase} />
            }
        </div>
    );
}

// ── Queue view ─────────────────────────────────────────────────────────────

function QueueView({ pending, stale, rejected, portalBase = "/portal/education" }) {
    const buckets = [
        { key: 'pending',  rows: pending },
        { key: 'stale',    rows: stale },
        { key: 'rejected', rows: rejected },
    ].filter(b => b.rows.length > 0);

    if (buckets.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
                    <CheckCircle2 size={22} />
                </div>
                <p className="text-base font-semibold text-gray-800">All caught up</p>
                <p className="text-sm text-gray-500 mt-1">No documents currently need your attention.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* KPI strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiTile label="Pending review"  value={pending.length}  tone="warning" icon={<Clock size={14} />} />
                <KpiTile label="Over 7 days"     value={stale.length}    tone="orange"  icon={<AlertTriangle size={14} />} />
                <KpiTile label="Rejected recently" value={rejected.length} tone="danger" icon={<XCircle size={14} />} />
            </div>

            {/* Bucket sections */}
            {buckets.map((b) => (
                <QueueBucket key={b.key} meta={BUCKET_META[b.key]} rows={b.rows} portalBase={portalBase} />
            ))}
        </div>
    );
}

function KpiTile({ label, value, tone, icon }) {
    const TONES = {
        warning: { ring: "border-amber-200",  glyph: "bg-amber-100 text-amber-700",   num: "text-amber-700" },
        orange:  { ring: "border-orange-200", glyph: "bg-orange-100 text-orange-700", num: "text-orange-700" },
        danger:  { ring: "border-rose-200",   glyph: "bg-rose-100 text-rose-700",     num: "text-rose-700" },
    };
    const t = TONES[tone];
    return (
        <div className={`bg-white rounded-2xl border ${t.ring} p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.glyph}`}>{icon}</div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">{label}</p>
                <p className={`text-2xl font-bold tabular-nums ${t.num}`}>{value}</p>
            </div>
        </div>
    );
}

function QueueBucket({ meta, rows, portalBase = "/portal/education" }) {
    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded ${meta.chip.split(' ').slice(0,2).join(' ')}`}>{meta.icon}</span>
                <h3 className={`text-[12px] font-bold uppercase tracking-[0.18em] ${meta.header}`}>{meta.label}</h3>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-gray-400 tabular-nums">
                    {rows.length}
                </span>
            </div>
            <ul className="divide-y divide-gray-100">
                {rows.map((d) => (
                    <li key={d.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50/50 group">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileText size={14} className="text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap text-sm">
                                    <span className="font-semibold text-gray-900">{d.lead?.name || 'Unknown'}</span>
                                    <span className="text-gray-400">/</span>
                                    <span className="text-gray-700">{d.original_name}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                                    {d.lead?.lead_id && (
                                        <span className="font-mono text-gray-400 inline-flex items-center gap-0.5">
                                            <Hash size={9} />{d.lead.lead_id}
                                        </span>
                                    )}
                                    <span>
                                        {d.bucket === 'rejected'
                                            ? `rejected ${fmtRel(d.reviewed_at)}`
                                            : `uploaded ${fmtRel(d.created_at)}`}
                                    </span>
                                    {d.checklist_key && <span className="font-mono text-gray-300">· {d.checklist_key}</span>}
                                </div>
                                {d.note && (
                                    <p className="text-[11px] italic text-rose-700 mt-1">"{d.note}"</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <a
                                href={`/admin/documents/${d.id}/download`}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Download"
                            >
                                <FileText size={13} />
                            </a>
                            {d.lead?.id && (
                                <Link
                                    href={`${portalBase}/leads/${d.lead.id}?tab=documents`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                >
                                    Open lead <ChevronRight size={10} />
                                </Link>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

// ── Folders view ───────────────────────────────────────────────────────────

function FoldersView({ folders, portalBase = "/portal/education" }) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return folders.filter((f) => {
            const hay = `${f.name || ''} ${f.lead_id || ''}`.toLowerCase();
            const matchSearch = !q || hay.includes(q);
            const matchStatus =
                statusFilter === "All" ||
                (statusFilter === "Needs attention" && (f.pending > 0 || f.rejected > 0)) ||
                (statusFilter === "Complete"        && f.total > 0 && f.approved === f.total) ||
                (statusFilter === "In progress"     && f.total > 0 && f.approved < f.total && f.pending === 0 && f.rejected === 0);
            return matchSearch && matchStatus;
        });
    }, [folders, search, statusFilter]);

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search students…"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter size={12} className="text-gray-400" />
                    {["All", "Needs attention", "In progress", "Complete"].map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                                statusFilter === s ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Folder list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="p-14 text-center text-gray-400">
                        <FolderOpen size={28} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">No students match your filters.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {filtered.map((f) => (
                            <FolderRow key={f.id} folder={f} portalBase={portalBase} />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function FolderRow({ folder, portalBase = "/portal/education" }) {
    const pct = folder.total > 0 ? Math.round((folder.approved / folder.total) * 100) : 0;
    const needsAttention = folder.pending > 0 || folder.rejected > 0;

    return (
        <Link
            href={`${portalBase}/leads/${folder.id}?tab=documents`}
            className="block px-5 py-4 hover:bg-gray-50/50 group"
        >
            <div className="flex items-center gap-4 flex-wrap">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <FolderOpen size={18} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{folder.name}</p>
                        <span className="text-[10px] font-mono text-gray-400">{folder.lead_id}</span>
                        {needsAttention && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-rose-100 text-rose-700 border border-rose-200">
                                <AlertTriangle size={9} /> Needs attention
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                        <span className="tabular-nums">{folder.approved} / {folder.total} approved</span>
                        {folder.pending > 0  && <span className="text-amber-700">{folder.pending} pending</span>}
                        {folder.rejected > 0 && <span className="text-rose-700">{folder.rejected} rejected</span>}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-40 hidden sm:block">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 tabular-nums mt-1 text-right">{pct}%</p>
                </div>

                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
            </div>
        </Link>
    );
}
