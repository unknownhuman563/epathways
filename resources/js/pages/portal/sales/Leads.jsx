import { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    Search, KeyRound, Clock, Check, Mail, ShieldOff, FileText, Phone,
    Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
    MoreHorizontal, ChevronDown, ExternalLink, UserCheck,
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

            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leads</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Pipeline · {filtered.length} {filtered.length === 1 ? "opportunity" : "opportunities"}
                    </p>
                </div>
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
                                    <td colSpan={7} className="px-6 py-20 text-center">
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

                                return (
                                    <tr
                                        key={l.id}
                                        className={`group transition-colors ${isSelected ? "bg-amber-50/30" : "hover:bg-gray-50/50"}`}
                                    >
                                        <td className="pl-4 pr-2 py-2.5">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(l.id)}
                                                className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-400 cursor-pointer"
                                            />
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
