import React, { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Search, KeyRound, Clock, Check, Mail, ShieldOff, FileText, Phone,
    Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
    MoreHorizontal, ChevronDown, ChevronRight as ChevronRightIcon, ExternalLink, UserCheck,
    Upload, Loader,
} from "lucide-react";

// ── Stage colour map ───────────────────────────────────────────────────────
// One palette entry per pipeline stage. Tones intentionally match the colour
// chips in the source pipeline diagram. Anything not listed falls through to
// the neutral grey style.

const STAGE_STYLES = {
    "New Leads":                      "bg-rose-100 text-rose-800 border-rose-200",
    "Contact Attempted":              "bg-orange-100 text-orange-800 border-orange-200",
    "Contacted for Booking":          "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Booking Confirmation with Bryll":"bg-cyan-100 text-cyan-800 border-cyan-200",
    "Missed the Meeting":             "bg-pink-100 text-pink-800 border-pink-200",
    "Qualified but Not Ready":        "bg-slate-100 text-slate-700 border-slate-200",
    "Qualified but No Funds":         "bg-slate-100 text-slate-700 border-slate-200",
    "Qualified":                      "bg-amber-100 text-amber-800 border-amber-200",
    "Booked Consultation":            "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Did Not Book Consultation":      "bg-stone-100 text-stone-700 border-stone-200",
    "No Show":                        "bg-teal-100 text-teal-800 border-teal-200",
    "Consultation Done":              "bg-purple-100 text-purple-800 border-purple-200",
    "Proposal Sent":                  "bg-sky-100 text-sky-800 border-sky-200",
    "Consultancy Agreement":          "bg-indigo-100 text-indigo-800 border-indigo-200",
    "English Pro":                    "bg-emerald-50 text-emerald-700 border-emerald-200",
    "School Enrollment":              "bg-green-100 text-green-800 border-green-200",
    "Visa Process":                   "bg-lime-100 text-lime-800 border-lime-200",
    "Not Qualified":                  "bg-red-100 text-red-700 border-red-200",
    "Work Pathway / Other":           "bg-blue-100 text-blue-800 border-blue-200",
    // Legacy fallback values from the old enum
    "New":        "bg-rose-100 text-rose-800 border-rose-200",
    "Contacted":  "bg-orange-100 text-orange-800 border-orange-200",
    "Processing": "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Closed":     "bg-green-100 text-green-800 border-green-200",
};
const stageClass = (s) => STAGE_STYLES[s] || "bg-gray-100 text-gray-700 border-gray-200";

// Goal-setting status colours — kept in sync with LeadDetails.jsx so the
// pill reads the same wherever it appears.
const GOAL_STATUS_STYLE = {
    "Consultation Done": "bg-purple-100 text-purple-800 border-purple-200",
    "For Proposal":      "bg-amber-100 text-amber-800 border-amber-200",
    "Proposal Sent":     "bg-sky-100 text-sky-800 border-sky-200",
    "No Show":           "bg-red-100 text-red-700 border-red-200",
};

const PORTAL_BADGE = {
    none:     null,
    pending:  { label: "Awaiting admin",  chip: "bg-amber-100 text-amber-700 border-amber-200",       icon: Clock },
    sent:     { label: "Invitation sent", chip: "bg-blue-100 text-blue-700 border-blue-200",          icon: Mail },
    accepted: { label: "Portal active",   chip: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Check },
    revoked:  { label: "Revoked",         chip: "bg-gray-100 text-gray-500 border-gray-200",          icon: ShieldOff },
};

// Presence dot for the avatar — green = recently online, gray = has portal
// but not active, blue = invitation sent (not accepted yet). Returns null
// when the lead has no portal interaction at all.
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const presenceDot = (status, lastLoginAt) => {
    if (status === "accepted") {
        const last = lastLoginAt ? new Date(lastLoginAt).getTime() : 0;
        const online = last && Date.now() - last <= ONLINE_THRESHOLD_MS;
        return online
            ? { color: "bg-emerald-500", label: "Online" }
            : { color: "bg-gray-400",    label: "Offline" };
    }
    if (status === "sent")    return { color: "bg-blue-500",  label: "Invitation sent" };
    if (status === "pending") return { color: "bg-amber-500", label: "Awaiting admin approval" };
    return null;
};

// Deterministic avatar colour per lead.
const AVATAR_PALETTE = [
    "bg-purple-100 text-purple-700",
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
    "bg-indigo-100 text-indigo-700",
    "bg-fuchsia-100 text-fuchsia-700",
];
const avatarColor = (id) => AVATAR_PALETTE[(Number(id) || 0) % AVATAR_PALETTE.length];
const initials = (name) =>
    (name || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "—";

const fmtDateShort = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtTime = (iso) =>
    iso ? new Date(iso).toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" }) : "";

const PAGE_SIZE = 20;

// ── Component ──────────────────────────────────────────────────────────────

// Each portal hits its own /portal/{role}/leads endpoints (status update,
// portal-invitation request). Default to sales for backwards compat when the
// prop is missing.
const PORTAL_LABEL = { sales: "Sales", education: "Education", immigration: "Immigration" };

export default function SalesLeads({ leads = [], statuses = [], portal = "sales" }) {
    const portalBase = `/portal/${portal}`;
    const portalLabel = PORTAL_LABEL[portal] || "Sales";
    // Sales, Education, and Immigration can all request portal invitations
    // for a lead; admin still approves before the invite email is sent.
    const canRequestInvite = ["sales", "education", "immigration"].includes(portal);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [savingId, setSavingId] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [sortKey, setSortKey] = useState("created_at");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);
    const [openStageMenuId, setOpenStageMenuId] = useState(null);
    const [openRowMenuId, setOpenRowMenuId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        const rows = leads.filter((l) => {
            const hay = `${l.name || ""} ${l.email || ""} ${l.lead_id || ""} ${l.phone || ""} ${l.source || ""}`.toLowerCase();
            const matchSearch = !q || hay.includes(q);
            const matchStatus = statusFilter === "All" || l.status === statusFilter;
            return matchSearch && matchStatus;
        });

        const dir = sortDir === "asc" ? 1 : -1;
        return [...rows].sort((a, b) => {
            const av = a[sortKey] ?? "";
            const bv = b[sortKey] ?? "";
            if (av < bv) return -1 * dir;
            if (av > bv) return 1 * dir;
            return 0;
        });
    }, [leads, search, statusFilter, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const changeStatus = (lead, status) => {
        setOpenStageMenuId(null);
        if (status === lead.status) return;
        setSavingId(lead.id);
        router.post(`${portalBase}/leads/${lead.id}`, { status }, {
            preserveScroll: true,
            onFinish: () => setSavingId(null),
        });
    };

    const requestPortal = (lead) => {
        if (!confirm(`Request Lead Portal access for ${lead.name}? Admin will review and approve.`)) return;
        setSavingId(lead.id);
        router.post(`${portalBase}/leads/${lead.id}/portal-invitation/request`, {}, {
            preserveScroll: true,
            onFinish: () => setSavingId(null),
        });
    };

    const toggleSort = (key) => {
        if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("desc"); }
    };

    const toggleSelect = (id) => {
        const next = new Set(selectedIds);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedIds(next);
    };
    const toggleSelectAll = () => {
        if (selectedIds.size === paged.length && paged.length > 0) setSelectedIds(new Set());
        else setSelectedIds(new Set(paged.map((l) => l.id)));
    };

    return (
        <div className="space-y-4 max-w-[1600px] mx-auto">
            <Head title={`Leads — ${portalLabel} Portal`} />

            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leads</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Pipeline · {filtered.length} {filtered.length === 1 ? "opportunity" : "opportunities"}
                    </p>
                </div>
                <ImportLeadsButton />
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center border-b border-gray-100 px-4 sm:px-5">
                    <div className="flex items-center gap-1">
                        <button className="px-3 py-3 text-xs font-bold text-gray-900 border-b-2 border-gray-900 -mb-px">
                            Open opportunities
                        </button>
                        <button className="px-3 py-3 text-xs font-medium text-gray-400 hover:text-gray-700">
                            + List
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-wrap gap-1.5 max-w-3xl">
                            <button
                                type="button"
                                onClick={() => { setStatusFilter("All"); setPage(1); }}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                                    statusFilter === "All"
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                All
                            </button>
                            {/* Surface 6 most pipeline-critical filters; the rest are reachable via the per-row dropdown */}
                            {["New Leads", "Contact Attempted", "Qualified", "Booked Consultation", "Consultancy Agreement", "Visa Process"].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => { setStatusFilter(s); setPage(1); }}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                                        statusFilter === s
                                            ? "bg-gray-900 text-white border-gray-900"
                                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                            title="Advanced filters (coming soon)"
                        >
                            <Filter size={12} />
                            Filters
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleSort(sortKey)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                        >
                            <ArrowUpDown size={12} />
                            Sort: {sortDir === "asc" ? "Oldest" : "Newest"}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Search Opportunities"
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-xs placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible">
                <div className="overflow-x-auto overflow-y-visible">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="pl-4 pr-2 py-3 w-8">
                                    <input
                                        type="checkbox"
                                        checked={paged.length > 0 && selectedIds.size === paged.length}
                                        onChange={toggleSelectAll}
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-400 cursor-pointer"
                                    />
                                </th>
                                {/* Expand toggle — narrow, no label. */}
                                <th className="pr-2 py-3 w-6" />
                                <SortableTh label="Lead" sortKey="name" current={sortKey} dir={sortDir} onSort={toggleSort} />
                                <SortableTh label="Stage" sortKey="status" current={sortKey} dir={sortDir} onSort={toggleSort} />
                                <th className="px-3 py-3">Email</th>
                                <th className="px-3 py-3">Phone</th>
                                <SortableTh label="Created" sortKey="created_at" current={sortKey} dir={sortDir} onSort={toggleSort} />
                                <th className="px-3 py-3 text-right pr-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paged.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Search size={22} />
                                            <p className="text-sm font-medium">No leads match your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paged.map((l) => {
                                const portalStatus = l.portal_invitation_status || "none";
                                const badge = PORTAL_BADGE[portalStatus];
                                const presence = presenceDot(portalStatus, l.portal_last_login_at);
                                const isSaving = savingId === l.id;
                                const isSelected = selectedIds.has(l.id);
                                const goalChipClass = l.goal_setting_status && GOAL_STATUS_STYLE[l.goal_setting_status]
                                    ? GOAL_STATUS_STYLE[l.goal_setting_status]
                                    : "bg-gray-100 text-gray-600 border-gray-200";

                                const isExpanded = expandedId === l.id;

                                return (
                                    <React.Fragment key={l.id}>
                                    <tr
                                        className={`group transition-colors ${
                                            isExpanded ? "bg-blue-50/30" : isSelected ? "bg-amber-50/30" : "hover:bg-gray-50/50"
                                        }`}
                                    >
                                        <td className="pl-4 pr-2 py-2.5">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(l.id)}
                                                className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-400 cursor-pointer"
                                            />
                                        </td>

                                        {/* Expand toggle — chevron rotates when open. */}
                                        <td className="pr-2 py-2.5">
                                            <button
                                                type="button"
                                                onClick={() => toggleExpand(l.id)}
                                                className="inline-flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                                title={isExpanded ? "Collapse details" : "Expand details"}
                                            >
                                                <ChevronRightIcon
                                                    size={14}
                                                    className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                                />
                                            </button>
                                        </td>

                                        <td className="px-3 py-2.5">
                                            <Link
                                                href={`${portalBase}/leads/${l.id}`}
                                                className="flex items-center gap-2.5 min-w-[180px] group/lead"
                                            >
                                                <div className="relative flex-shrink-0">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${avatarColor(l.id)}`}>
                                                        {initials(l.name)}
                                                    </div>
                                                    {/* Presence dot — green online, gray has-portal-offline,
                                                        blue invitation-sent. Nothing when lead has no portal. */}
                                                    {presence && (
                                                        <span
                                                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${presence.color}`}
                                                            title={`Lead Portal: ${presence.label}`}
                                                        />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-gray-900 text-xs truncate group-hover/lead:text-blue-600 transition-colors">
                                                        {l.name}
                                                    </div>
                                                    {l.lead_id && (
                                                        <div className="text-[10px] text-gray-400 font-mono truncate">{l.lead_id}</div>
                                                    )}
                                                </div>
                                            </Link>
                                        </td>

                                        {/* STAGE — clickable pill, opens stage picker */}
                                        <td className="px-3 py-2.5 relative">
                                            <StagePicker
                                                lead={l}
                                                stages={statuses}
                                                open={openStageMenuId === l.id}
                                                onToggle={() => setOpenStageMenuId(openStageMenuId === l.id ? null : l.id)}
                                                onClose={() => setOpenStageMenuId(null)}
                                                onSelect={(stage) => changeStatus(l, stage)}
                                                isSaving={isSaving}
                                            />
                                        </td>

                                        <td className="px-3 py-2.5">
                                            <div className="inline-flex items-center gap-1.5 text-gray-600">
                                                <Mail size={11} className="text-gray-300 flex-shrink-0" />
                                                <span className="truncate max-w-[180px]">{l.email || "—"}</span>
                                            </div>
                                        </td>

                                        <td className="px-3 py-2.5">
                                            {l.phone ? (
                                                <div className="inline-flex items-center gap-1.5 text-gray-600 whitespace-nowrap">
                                                    <Phone size={11} className="text-gray-300" />
                                                    <span>{l.phone}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>

                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <div className="text-gray-600">{fmtDateShort(l.created_at)}</div>
                                            <div className="text-[10px] text-gray-400">{fmtTime(l.created_at)}</div>
                                        </td>

                                        <td className="px-3 py-2.5 pr-4 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <a
                                                    href={`${portalBase}/leads/${l.id}/documents`}
                                                    title="Open documents"
                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                                >
                                                    <FileText size={12} />
                                                </a>
                                                <RowMenu
                                                    lead={l}
                                                    open={openRowMenuId === l.id}
                                                    onToggle={() => setOpenRowMenuId(openRowMenuId === l.id ? null : l.id)}
                                                    onClose={() => setOpenRowMenuId(null)}
                                                    onRequestPortal={() => { setOpenRowMenuId(null); requestPortal(l); }}
                                                    isSaving={isSaving}
                                                    portalBase={portalBase}
                                                    canRequestInvite={canRequestInvite}
                                                />
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expander row — all 9 dashboard-mirror fields
                                        live here so the table itself stays compact. */}
                                    {isExpanded && (
                                        <tr className="bg-blue-50/20 border-t border-blue-100/60">
                                            <td colSpan={8} className="px-6 py-4">
                                                <LeadDashboardPanel lead={l} goalChipClass={goalChipClass} />
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filtered.length > 0 && (
                    <div className="border-t border-gray-100 px-4 sm:px-5 py-3 flex items-center justify-between text-xs text-gray-500">
                        <div>
                            Page {safePage} of {totalPages}
                            {selectedIds.size > 0 && (
                                <span className="ml-3 text-gray-900 font-semibold">· {selectedIds.size} selected</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-gray-400 mr-2">{PAGE_SIZE} / page</span>
                            <button
                                type="button"
                                disabled={safePage <= 1}
                                onClick={() => setPage(safePage - 1)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                            >
                                <ChevronLeft size={12} /> Previous
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

// ── Import Leads from CSV ─────────────────────────────────────────────────

function ImportLeadsButton() {
    const fileRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const summary = usePage().props?.flash?.import_summary;

    const trigger = () => fileRef.current?.click();

    const onChoose = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!confirm(
            `Import leads from "${f.name}"?\n\n`
            + `• Existing leads will be matched by email or (name + phone).\n`
            + `• Matched leads will only have empty fields backfilled — nothing overwritten.\n`
            + `• Unknown columns go into the lead's family_info / work_info JSON.\n`
            + `• Call Notes become real lead notes.\n\n`
            + `Proceed?`
        )) {
            e.target.value = '';
            return;
        }

        const fd = new FormData();
        fd.append('file', f);
        setUploading(true);
        setShowDetail(false);
        router.post('/admin/leads/import', fd, {
            preserveScroll: true,
            preserveState: true,
            forceFormData: true,
            onSuccess: () => setShowDetail(true),
            onFinish: () => {
                setUploading(false);
                if (fileRef.current) fileRef.current.value = '';
            },
        });
    };

    const total = summary ? (summary.created || 0) + (summary.updated || 0) + (summary.skipped || 0) : 0;

    return (
        <div className="flex flex-col items-end gap-2">
            <div className="inline-flex items-center gap-2">
                <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={onChoose}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={trigger}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                    {uploading ? <Loader size={13} className="animate-spin" /> : <Upload size={13} />}
                    {uploading ? 'Importing…' : 'Import CSV'}
                </button>
            </div>

            {/* Detailed result card — shows exactly where the rows went so
                "only 79 of 346 imported" isn't a mystery (most are likely
                dedupe-matches, which is expected). */}
            {summary && showDetail && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 w-[420px] max-w-full text-left space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">Import result</p>
                        <button
                            type="button"
                            onClick={() => setShowDetail(false)}
                            className="text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-gray-700"
                        >
                            Dismiss
                        </button>
                    </div>
                    <p className="text-sm text-gray-700">
                        Processed <span className="font-bold tabular-nums">{total}</span> row{total === 1 ? '' : 's'}.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-700">New</p>
                            <p className="text-2xl font-bold text-emerald-700 tabular-nums">{summary.created || 0}</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-blue-700">Updated</p>
                            <p className="text-2xl font-bold text-blue-700 tabular-nums">{summary.updated || 0}</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-amber-700">Skipped</p>
                            <p className="text-2xl font-bold text-amber-700 tabular-nums">{summary.skipped || 0}</p>
                        </div>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                        <span className="font-semibold text-gray-700">Updated</span> means the row matched an existing lead by email or (name + phone) — empty fields were backfilled, nothing overwritten.
                    </p>
                    {(summary.errors || []).length > 0 && (
                        <div className="border-t border-gray-100 pt-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700 mb-1">Skip reasons (first {summary.errors.length})</p>
                            <ul className="space-y-0.5 max-h-32 overflow-y-auto text-[11px] text-gray-600 leading-snug">
                                {summary.errors.map((e, i) => (
                                    <li key={i} className="font-mono">{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Row "More" menu — portal invitation actions live here ────────────────

function RowMenu({ lead, open, onToggle, onClose, onRequestPortal, isSaving, portalBase = "/portal/sales", canRequestInvite = true }) {
    const menuRef = useRef(null);
    const triggerRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
            if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
            onClose();
        };
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    const portalStatus = lead.portal_invitation_status || "none";
    const badge = PORTAL_BADGE[portalStatus];
    const StatusIcon = badge?.icon;
    const canRequest = portalStatus === "none" || portalStatus === "revoked";

    return (
        <div className="relative inline-block">
            <button
                ref={triggerRef}
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                aria-haspopup="menu"
                title="More actions"
                className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors ${open ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`}
            >
                <MoreHorizontal size={12} />
            </button>

            {open && (
                <div
                    ref={menuRef}
                    role="menu"
                    className="absolute z-30 top-full right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 w-[260px] text-left"
                >
                    {/* Section: Lead actions */}
                    <p className="px-3 pb-1 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Lead</p>
                    <Link
                        href={`${portalBase}/leads/${lead.id}`}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                        <ExternalLink size={12} className="text-gray-400" />
                        View lead details
                    </Link>
                    <a
                        href={`${portalBase}/leads/${lead.id}/documents`}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                        <FileText size={12} className="text-gray-400" />
                        Documents
                    </a>

                    {/* Section: Portal invitation — only sales staff can initiate
                        a Lead-Portal invitation (admin approves). Other portals
                        see no invite controls. */}
                    {canRequestInvite && (<>
                    <div className="border-t border-gray-100 my-1.5"></div>
                    <p className="px-3 pb-1 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Lead Portal</p>

                    {/* Current status display */}
                    {badge && (
                        <div className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${badge.chip}`}>
                                <StatusIcon size={10} strokeWidth={2.5} />
                                {badge.label}
                            </span>
                        </div>
                    )}

                    {/* Conditional actions */}
                    {canRequest && (
                        <button
                            type="button"
                            disabled={isSaving || !lead.email}
                            onClick={onRequestPortal}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            title={lead.email ? "" : "This lead has no email on file"}
                        >
                            <KeyRound size={12} className="text-gray-400" />
                            {portalStatus === "revoked" ? "Re-request access" : "Request portal access"}
                        </button>
                    )}

                    {portalStatus === "pending" && (
                        <a
                            href="/admin/portal-invitations"
                            className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                        >
                            <Clock size={12} className="text-amber-500" />
                            View in invitations queue
                        </a>
                    )}

                    {(portalStatus === "sent" || portalStatus === "accepted") && (
                        <a
                            href="/admin/portal-invitations"
                            className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                        >
                            <UserCheck size={12} className="text-gray-400" />
                            Manage invitation
                        </a>
                    )}

                    {!lead.email && canRequest && (
                        <p className="px-3 py-1.5 text-[10px] text-amber-700 bg-amber-50 mx-2 rounded mt-1">
                            Add an email before requesting access.
                        </p>
                    )}
                    </>)}
                </div>
            )}
        </div>
    );
}

// ── Expander panel — sales-dashboard mirror ───────────────────────────────
// Renders all 9 fields from the team's Sales Dashboard sheet inside the
// collapsed row so the table itself stays compact and scannable.

function LeadDashboardPanel({ lead, goalChipClass }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <DashField label="Pre-screened by">
                {lead.pre_screened_by
                    ? <span className="inline-flex items-center gap-1 text-gray-800 font-medium"><UserCheck size={11} className="text-gray-400" />{lead.pre_screened_by}</span>
                    : <span className="text-gray-300">—</span>}
            </DashField>

            <DashField label="Goal-setting by">
                {lead.goal_setting_by
                    ? <span className="text-gray-800 font-medium">{lead.goal_setting_by}</span>
                    : <span className="text-gray-300">—</span>}
            </DashField>

            <DashField label="Goal-setting status">
                {lead.goal_setting_status
                    ? <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${goalChipClass}`}>{lead.goal_setting_status}</span>
                    : <span className="text-gray-300">—</span>}
            </DashField>

            <DashField label="Program offered">
                {lead.program_offered
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold uppercase tracking-wider">{lead.program_offered}</span>
                    : <span className="text-gray-300">—</span>}
            </DashField>

            <DashField label="Calendar">
                {lead.calendar_date
                    ? <span className="inline-flex items-center gap-1 text-gray-800"><Clock size={11} className="text-gray-400" />{fmtDateShort(lead.calendar_date)}</span>
                    : <span className="text-gray-300">—</span>}
            </DashField>

            <DashField label="Pre-screening notes" wide>
                {lead.pre_screening_notes
                    ? <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{lead.pre_screening_notes}</p>
                    : <span className="text-gray-300">—</span>}
            </DashField>

            <DashField label="Goal-setting notes" wide>
                {lead.goal_setting_notes
                    ? <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{lead.goal_setting_notes}</p>
                    : <span className="text-gray-300">—</span>}
            </DashField>

            <DashField label="Client info link">
                {lead.client_info_link
                    ? <a href={lead.client_info_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"><ExternalLink size={11} /> Open</a>
                    : <span className="text-gray-300">—</span>}
            </DashField>

            <DashField label="Call update form">
                {lead.call_update_form_link
                    ? <a href={lead.call_update_form_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"><ExternalLink size={11} /> Open</a>
                    : <span className="text-gray-300">—</span>}
            </DashField>
        </div>
    );
}

function DashField({ label, wide = false, children }) {
    return (
        <div className={wide ? "md:col-span-2 lg:col-span-2 xl:col-span-2" : ""}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-1">{label}</p>
            <div className="text-xs">{children}</div>
        </div>
    );
}

// ── Sortable header cell ───────────────────────────────────────────────────

function SortableTh({ label, sortKey, current, dir, onSort }) {
    const active = current === sortKey;
    const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
    return (
        <th className="px-3 py-3">
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className={`inline-flex items-center gap-1 hover:text-gray-900 transition-colors ${active ? "text-gray-900" : "text-gray-500"}`}
            >
                {label}
                <Icon size={10} strokeWidth={2.5} className={active ? "opacity-100" : "opacity-30"} />
            </button>
        </th>
    );
}

// ── Stage picker — clickable pill with popover menu ────────────────────────

function StagePicker({ lead, stages, open, onToggle, onClose, onSelect, isSaving }) {
    const menuRef = useRef(null);
    const triggerRef = useRef(null);

    // Close on outside click + ESC
    useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
            if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
            onClose();
        };
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    const current = lead.status || "New Leads";

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                disabled={isSaving}
                onClick={onToggle}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap uppercase hover:shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${stageClass(current)}`}
            >
                <span className="truncate max-w-[180px]">{current}</span>
                <ChevronDown size={10} strokeWidth={2.5} className="flex-shrink-0 opacity-60" />
            </button>

            {open && (
                <div
                    ref={menuRef}
                    role="listbox"
                    className="absolute z-30 top-full left-3 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 w-[280px] max-h-[420px] overflow-y-auto"
                >
                    <p className="px-3 pt-2 pb-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        Move to stage
                    </p>
                    {stages.map((s) => {
                        const active = s === current;
                        return (
                            <button
                                key={s}
                                type="button"
                                role="option"
                                aria-selected={active}
                                onClick={() => onSelect(s)}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left hover:bg-gray-50 transition-colors ${active ? "bg-gray-50/60" : ""}`}
                            >
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${stageClass(s)}`}>
                                    {s}
                                </span>
                                {active && <Check size={12} className="text-gray-900 flex-shrink-0" strokeWidth={3} />}
                            </button>
                        );
                    })}
                </div>
            )}
        </>
    );
}
