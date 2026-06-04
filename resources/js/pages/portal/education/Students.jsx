import { Head, Link, router } from "@inertiajs/react";
import React, { useMemo, useState } from "react";
import {
    BookOpen, ChevronRight, ChevronLeft, Clock, FileCheck, FolderOpen,
    GraduationCap, Search, Users, Mail, Phone, MapPin, Calendar, School,
    CreditCard, FileText, ExternalLink, Languages, ClipboardList,
    Save, Edit2, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";

const PAGE_SIZE = 25;

// Per-user palette for the colored avatar — same hash always picks the
// same colour so the eye learns the student.
const AVATAR_PALETTE = [
    "bg-blue-500", "bg-pink-500", "bg-orange-500", "bg-teal-500",
    "bg-purple-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500",
    "bg-indigo-500", "bg-fuchsia-500",
];
const avatarColor = (key) => {
    const str = String(key || "");
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};
const initials = (name = "") =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();

// Stage chip colours mirror the Leads palette so a student's stage reads
// the same here as it does on the lead detail screen.
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
};
const stageClass = (s) => STAGE_STYLES[s] || "bg-gray-100 text-gray-700 border-gray-200";

const fmtPct = (a, t) => (t > 0 ? Math.round((a / t) * 100) : 0);

const fmtDate = (iso) => {
    if (!iso) return "";
    try {
        return new Date(iso).toLocaleDateString("en-NZ", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return ""; }
};

export default function EducationStudents({ students = [] }) {
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [sortKey, setSortKey] = useState("date_engaged");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);

    const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

    const toggleSort = (key) => {
        if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("desc"); }
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const rows = students.filter((s) => {
            if (!q) return true;
            const hay = `${s.name || ""} ${s.email || ""} ${s.lead_id || ""} ${s.phone || ""} ${s.program || ""} ${s.school || ""} ${s.location || ""} ${s.status || ""}`.toLowerCase();
            return hay.includes(q);
        });

        const dir = sortDir === "asc" ? 1 : -1;
        return [...rows].sort((a, b) => {
            const av = a[sortKey] ?? "";
            const bv = b[sortKey] ?? "";
            if (av < bv) return -1 * dir;
            if (av > bv) return 1 * dir;
            return 0;
        });
    }, [students, search, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const toggleSelect = (id) => {
        const next = new Set(selectedIds);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedIds(next);
    };
    const toggleSelectAll = () => {
        if (selectedIds.size === paged.length && paged.length > 0) setSelectedIds(new Set());
        else setSelectedIds(new Set(paged.map((s) => s.id)));
    };

    const stats = useMemo(() => {
        const total       = students.length;
        const withPlan    = students.filter((s) => !! s.program).length;
        const pendingDocs = students.filter((s) => (s.docs_total || 0) > 0 && (s.docs_approved || 0) < s.docs_total).length;
        return { total, withPlan, pendingDocs };
    }, [students]);

    return (
        <div className="space-y-4 max-w-[1600px] mx-auto">
            <Head title="Students — Education" />

            {/* Header */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Students</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Pipeline · {filtered.length} {filtered.length === 1 ? "student" : "students"}
                    </p>
                </div>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatTile label="Total students"     value={stats.total}       icon={<GraduationCap size={16} />} tone="indigo"  />
                <StatTile label="With study plan"    value={stats.withPlan}    icon={<BookOpen size={16} />}      tone="emerald" />
                <StatTile label="Pending documents"  value={stats.pendingDocs} icon={<Clock size={16} />}         tone="amber"   />
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between p-4 sm:p-5">
                    <div className="flex items-center gap-2 flex-1 max-w-xl bg-gray-50 rounded-xl border border-gray-200 px-3 py-2">
                        <Search size={14} className="text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search by name, program, school, location, stage, or LP-ID…"
                            className="flex-1 outline-none text-sm placeholder:text-gray-400 bg-transparent"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="text-gray-400 hover:text-gray-700 text-[11px] font-bold uppercase tracking-wider"
                            >
                                Clear
                            </button>
                        )}
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
                                <th className="pr-2 py-3 w-6" />
                                <SortableTh label="Student"   sortKey="name"         current={sortKey} dir={sortDir} onSort={toggleSort} />
                                <SortableTh label="Status"    sortKey="status"       current={sortKey} dir={sortDir} onSort={toggleSort} />
                                <SortableTh label="Location"  sortKey="location"     current={sortKey} dir={sortDir} onSort={toggleSort} />
                                <SortableTh label="Program"   sortKey="program"      current={sortKey} dir={sortDir} onSort={toggleSort} />
                                <SortableTh label="School"    sortKey="school"       current={sortKey} dir={sortDir} onSort={toggleSort} />
                                <SortableTh label="Intake"    sortKey="intake"       current={sortKey} dir={sortDir} onSort={toggleSort} />
                                <SortableTh label="Engaged"   sortKey="date_engaged" current={sortKey} dir={sortDir} onSort={toggleSort} />
                                <th className="px-3 py-3">Docs</th>
                                <th className="px-3 py-3 text-right pr-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paged.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Users size={22} />
                                            <p className="text-sm font-medium">
                                                {students.length === 0 ? "No students yet." : "No students match your search."}
                                            </p>
                                            {students.length === 0 && (
                                                <p className="text-[11px]">Leads who sign their consultancy agreement appear here automatically.</p>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : paged.map((s) => {
                                const isSelected = selectedIds.has(s.id);
                                const isExpanded = expandedId === s.id;
                                const pct      = fmtPct(s.docs_approved, s.docs_total);
                                const hasDocs  = (s.docs_total || 0) > 0;
                                const docsDone = hasDocs && s.docs_approved >= s.docs_total;
                                const barColor = docsDone ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-gray-400";

                                return (
                                    <React.Fragment key={s.id}>
                                        <tr
                                            className={`group transition-colors ${
                                                isExpanded ? "bg-indigo-50/30" : isSelected ? "bg-amber-50/30" : "hover:bg-gray-50/50"
                                            }`}
                                        >
                                            <td className="pl-4 pr-2 py-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(s.id)}
                                                    className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-400 cursor-pointer"
                                                />
                                            </td>

                                            {/* Expand toggle */}
                                            <td className="pr-2 py-2.5">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpand(s.id)}
                                                    className="inline-flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                                    title={isExpanded ? "Collapse details" : "Expand details"}
                                                >
                                                    <ChevronRight
                                                        size={14}
                                                        className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                                    />
                                                </button>
                                            </td>

                                            {/* Student */}
                                            <td className="px-3 py-2.5">
                                                <Link
                                                    href={`/portal/education/leads/${s.id}`}
                                                    className="flex items-center gap-2.5 min-w-[180px] group/student"
                                                >
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${avatarColor(s.id)}`}>
                                                        {initials(s.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-gray-900 text-xs truncate group-hover/student:text-indigo-600 transition-colors">
                                                            {s.name}
                                                        </div>
                                                        {s.lead_id && (
                                                            <div className="text-[10px] text-gray-400 font-mono truncate">{s.lead_id}</div>
                                                        )}
                                                    </div>
                                                </Link>
                                            </td>

                                            {/* Status */}
                                            <td className="px-3 py-2.5">
                                                {s.status ? (
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${stageClass(s.status)}`}>
                                                        {s.status}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>

                                            {/* Location */}
                                            <td className="px-3 py-2.5">
                                                {s.location ? (
                                                    <span className="inline-flex items-center gap-1 text-gray-600">
                                                        <MapPin size={11} className="text-gray-300" /> {s.location}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>

                                            {/* Program */}
                                            <td className="px-3 py-2.5">
                                                {s.program ? (
                                                    <span className="text-gray-700 truncate block max-w-[200px]" title={s.program}>
                                                        {s.program}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>

                                            {/* School */}
                                            <td className="px-3 py-2.5">
                                                {s.school ? (
                                                    <span className="text-gray-700 truncate block max-w-[180px]" title={s.school}>
                                                        {s.school}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>

                                            {/* Intake */}
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                {s.intake ? <span className="text-gray-700">{s.intake}</span> : <span className="text-gray-300">—</span>}
                                            </td>

                                            {/* Engaged */}
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                {s.date_engaged ? (
                                                    <div className="text-gray-600">{fmtDate(s.date_engaged)}</div>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>

                                            {/* Docs */}
                                            <td className="px-3 py-2.5">
                                                {hasDocs ? (
                                                    <div className="flex items-center gap-2 min-w-[100px]">
                                                        <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                                                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 tabular-nums whitespace-nowrap">
                                                            {s.docs_approved}/{s.docs_total}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-3 py-2.5 pr-4 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <a
                                                        href={`/portal/education/leads/${s.id}/documents`}
                                                        title="Open documents"
                                                        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                                    >
                                                        <FileText size={12} />
                                                    </a>
                                                    {s.gdrive_link && (
                                                        <a
                                                            href={s.gdrive_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Open GDrive"
                                                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                                        >
                                                            <ExternalLink size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expander — full Students-Dashboard schema */}
                                        {isExpanded && (
                                            <tr className="bg-indigo-50/20 border-t border-indigo-100/60">
                                                <td colSpan={11} className="px-6 py-4">
                                                    <StudentDashboardPanel student={s} />
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

// ─── Expander panel — Students Dashboard mirror ───────────────────────────
function StudentDashboardPanel({ student: s }) {
    const pct       = fmtPct(s.docs_approved, s.docs_total);
    const hasDocs   = (s.docs_total || 0) > 0;
    const docsDone  = hasDocs && s.docs_approved >= s.docs_total;
    const barColor  = docsDone ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-gray-400";

    return (
        <div className="space-y-5">
            {/* 1 — Identity / contact / engagement */}
            <section>
                <PanelTitle>Profile</PanelTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <ReadOnlyField icon={Calendar}  label="Date engaged"   value={fmtDate(s.date_engaged)} />
                    <ReadOnlyField icon={MapPin}    label="Location"       value={s.location} />
                    <ReadOnlyField icon={Phone}     label="Contact number" value={s.phone}    href={s.phone ? `tel:${s.phone}` : null} />
                    <ReadOnlyField icon={Mail}      label="Email"          value={s.email}    href={s.email ? `mailto:${s.email}` : null} truncate />
                </div>
            </section>

            {/* 2 — Study plan */}
            <section>
                <PanelTitle>Study plan</PanelTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <ReadOnlyField icon={BookOpen}  label="Program"      value={s.program ? `${s.program}${s.level ? ` · ${s.level}` : ""}` : null} />
                    <ReadOnlyField icon={School}    label="School"       value={s.school} />
                    <ReadOnlyField icon={Calendar}  label="Intake"       value={s.intake} />
                    <ReadOnlyField
                        icon={Languages}
                        label="PTE / IELTS"
                        value={s.english_test ? `${s.english_test}${s.english_test_score ? ` · ${s.english_test_score}` : ""}${s.english_test_taken ? "" : " · pending"}` : null}
                    />
                </div>
            </section>

            {/* 3 — Payment / COOP / OOP / School override */}
            <section>
                <PanelTitle>Status & offers</PanelTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <EditableField leadId={s.id} fieldKey="payment" icon={CreditCard} label="Payment"          value={s.payment} placeholder="e.g. PhP 150,000" />
                    <EditableField leadId={s.id} fieldKey="coop"    icon={FileCheck}  label="COOP"             value={s.coop}    placeholder="Yes / No / Date" />
                    <EditableField leadId={s.id} fieldKey="oop"     icon={FileCheck}  label="OOP"              value={s.oop}     placeholder="Yes / No / Date" />
                    <EditableField leadId={s.id} fieldKey="school"  icon={School}     label="School (override)" value={s.school} placeholder="Institution name" />
                </div>
            </section>

            {/* 4 — Comments + GDrive */}
            <section>
                <PanelTitle>Notes & references</PanelTitle>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="lg:col-span-2">
                        <EditableField
                            leadId={s.id}
                            fieldKey="comments"
                            icon={ClipboardList}
                            label="Comments"
                            value={s.comments}
                            placeholder="Latest update / next action…"
                            multiline
                        />
                    </div>
                    <EditableField
                        leadId={s.id}
                        fieldKey="gdrive_link"
                        icon={ExternalLink}
                        label="GDrive link"
                        value={s.gdrive_link}
                        placeholder="https://drive.google.com/…"
                        isLink
                    />
                </div>
            </section>

            {/* 5 — Documents */}
            <section>
                <PanelTitle>Documents</PanelTitle>
                <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                        <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-gray-500">
                            <FileCheck size={10} /> Documents
                        </span>
                        <span className="tabular-nums font-semibold text-gray-700">
                            {s.docs_approved || 0} / {s.docs_total || 0}
                            {hasDocs && <span className="ml-1 text-gray-400">· {pct}%</span>}
                        </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                </div>
            </section>

            {/* 6 — Quick actions */}
            <section className="flex flex-wrap gap-2">
                <Link
                    href={`/portal/education/leads/${s.id}?tab=documents`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                >
                    <FolderOpen size={12} /> Open profile
                </Link>
                <Link
                    href={`/portal/education/leads/${s.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <FileText size={12} /> Lead detail
                </Link>
                {s.email && (
                    <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                        <Mail size={12} /> Send email
                    </a>
                )}
                {s.phone && (
                    <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                        <Phone size={12} /> Call
                    </a>
                )}
                {s.gdrive_link && (
                    <a href={s.gdrive_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                        <ExternalLink size={12} /> Open GDrive
                    </a>
                )}
            </section>
        </div>
    );
}

// ─── Small UI helpers ──────────────────────────────────────────────────────
function PanelTitle({ children }) {
    return <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-2.5">{children}</h4>;
}

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

function ReadOnlyField({ icon: Icon, label, value, href = null, truncate = false }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                {Icon && <Icon size={11} className="text-gray-400" />}
                {label}
            </div>
            {value ? (
                href ? (
                    <a href={href} className={`text-xs font-semibold text-gray-900 hover:text-indigo-600 ${truncate ? "block truncate" : ""}`}>
                        {value}
                    </a>
                ) : (
                    <p className={`text-xs font-semibold text-gray-900 ${truncate ? "truncate" : ""}`}>{value}</p>
                )
            ) : (
                <span className="text-xs text-gray-300 italic">—</span>
            )}
        </div>
    );
}

// Inline-editable cell — click value to switch into an input, Save posts to
// /portal/education/students/{id}/dashboard-field and refreshes the page so
// the latest props come back from the server.
function EditableField({ leadId, fieldKey, icon: Icon, label, value, placeholder, multiline = false, isLink = false }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft]     = useState(value || "");
    const [saving, setSaving]   = useState(false);

    const save = () => {
        setSaving(true);
        router.post(
            `/portal/education/students/${leadId}/dashboard-field`,
            { [fieldKey]: draft || null },
            {
                preserveScroll: true,
                onFinish: () => { setSaving(false); setEditing(false); },
            }
        );
    };

    const cancel = () => { setDraft(value || ""); setEditing(false); };

    return (
        <div className="bg-white rounded-lg border border-gray-200 px-3 py-2 group">
            <div className="flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {Icon && <Icon size={11} className="text-gray-400" />}
                    {label}
                </div>
                {!editing && (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="text-gray-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit"
                    >
                        <Edit2 size={11} />
                    </button>
                )}
            </div>

            {editing ? (
                <div className="space-y-1.5">
                    {multiline ? (
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder={placeholder}
                            rows={3}
                            className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y"
                            autoFocus
                        />
                    ) : (
                        <input
                            type={isLink ? "url" : "text"}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder={placeholder}
                            className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); save(); }
                                if (e.key === "Escape") { e.preventDefault(); cancel(); }
                            }}
                        />
                    )}
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={save}
                            disabled={saving}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Save size={10} /> {saving ? "Saving" : "Save"}
                        </button>
                        <button
                            type="button"
                            onClick={cancel}
                            className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : value ? (
                isLink ? (
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-indigo-600 hover:underline truncate block"
                    >
                        {value}
                    </a>
                ) : (
                    <p className={`text-xs text-gray-900 ${multiline ? "whitespace-pre-wrap leading-relaxed" : "font-semibold truncate"}`}>
                        {value}
                    </p>
                )
            ) : (
                <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-xs text-gray-300 italic hover:text-indigo-600"
                >
                    {placeholder || "—"}
                </button>
            )}
        </div>
    );
}

function StatTile({ label, value, icon, tone = "indigo" }) {
    const TONES = {
        indigo:  { bg: "bg-indigo-50",  glyph: "bg-indigo-100 text-indigo-700",   num: "text-indigo-900" },
        emerald: { bg: "bg-emerald-50", glyph: "bg-emerald-100 text-emerald-700", num: "text-emerald-900" },
        amber:   { bg: "bg-amber-50",   glyph: "bg-amber-100 text-amber-700",     num: "text-amber-900" },
    };
    const t = TONES[tone] || TONES.indigo;
    return (
        <div className={`${t.bg} rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${t.glyph}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">{label}</p>
                <p className={`text-2xl font-bold tabular-nums ${t.num}`}>{value}</p>
            </div>
        </div>
    );
}
