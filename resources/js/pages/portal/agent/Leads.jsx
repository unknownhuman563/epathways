import { useState, useMemo, useEffect, useRef } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import { createPortal } from "react-dom";
import {
    Plus, Search, X, Users as UsersIcon, Mail, Phone, MapPin,
    GraduationCap, Pencil, AlertCircle, Info, Upload, FileText, Stamp,
    ChevronUp, ChevronDown, ChevronsUpDown, Filter, Check,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";

// ─── Recruiting Agent · My Leads ─────────────────────────────────────────
// Agents only ever see the leads they added. They can ADD a lead and EDIT
// its info — but stage/status is read-only here (pipeline actions belong to
// sales/admin). Deliberately lean vs. the full Sales Leads screen.

const STATUS_TONE = {
    "New Leads": "bg-blue-50 text-blue-700 border-blue-200",
    "Attempted to Contact": "bg-amber-50 text-amber-700 border-amber-200",
    "Contacted": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "For Assessment": "bg-violet-50 text-violet-700 border-violet-200",
    "Consultation Booked": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "Consultation Done": "bg-teal-50 text-teal-700 border-teal-200",
    "For Proposal": "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    "Proposal Sent": "bg-purple-50 text-purple-700 border-purple-200",
    "Converted": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Not Interested": "bg-gray-100 text-gray-600 border-gray-200",
    "Lost": "bg-rose-50 text-rose-700 border-rose-200",
};

const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-NZ", { day: "2-digit", month: "short", year: "numeric" });
};

// Highest education level of the lead. Free-typed via a datalist so agents
// can pick a common level or enter something specific.
const QUALIFICATION_OPTIONS = [
    "High School",
    "Certificate",
    "Diploma",
    "Bachelor's Degree",
    "Postgraduate Diploma",
    "Master's Degree",
    "Doctorate (PhD)",
];

function StatusPill({ value }) {
    if (!value) return <span className="text-gray-300">—</span>;
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold border whitespace-nowrap ${STATUS_TONE[value] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
            {value}
        </span>
    );
}

// Plain (non-sortable) table header — just applies the shared cell
// style so headers align visually with SortableTh.
function Th({ children, align = "left" }) {
    return (
        <th className={`px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider ${align === "right" ? "text-right" : "text-left"}`}>
            {children}
        </th>
    );
}

// Sortable header — click to cycle asc → desc on the same key, or switch
// to that key (asc) when previously sorting a different column. Chevron
// glyph reflects the current state: neutral double-arrow when inactive,
// direction-arrow when active.
function SortableTh({ label, sortKey, sort, onSort }) {
    const active = sort.key === sortKey;
    const Icon = ! active ? ChevronsUpDown : (sort.dir === "asc" ? ChevronUp : ChevronDown);
    return (
        <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className={`inline-flex items-center gap-1.5 uppercase tracking-wider transition-colors ${
                    active ? "text-gray-900" : "text-gray-500 hover:text-gray-800"
                }`}
                aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
            >
                {label}
                <Icon size={12} className={active ? "text-teal-600" : "text-gray-400"} strokeWidth={2.4} />
            </button>
        </th>
    );
}

// Toolbar filter chip — sits in the search row. Trigger reads
// "Label · N" when filters are active, plain "Label" when not. Popup
// is a scrollable checklist; each pick narrows the table via the
// caller's onChange (a Set of selected values).
function ToolbarFilter({ label, options = [], selected, onChange }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        if (! open) return;
        const onClick = (e) => { if (wrapRef.current && ! wrapRef.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const active = selected.size > 0;
    const toggle = (v) => {
        const next = new Set(selected);
        next.has(v) ? next.delete(v) : next.add(v);
        onChange(next);
    };

    return (
        <div ref={wrapRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => ! v)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors border ${
                    active
                        ? "bg-teal-50 border-teal-200 text-teal-800"
                        : "bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
                aria-expanded={open}
            >
                <Filter size={12} strokeWidth={2.4} className={active ? "text-teal-600" : "text-gray-400"} />
                {label}
                {active && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-teal-600 text-white text-[10px] font-bold tabular-nums">
                        {selected.size}
                    </span>
                )}
                <ChevronDown size={12} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} strokeWidth={2.4} />
            </button>

            {open && (
                <div className="absolute z-30 top-full right-0 mt-1 w-60 bg-white rounded-xl shadow-xl ring-1 ring-black/5 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Filter by {label.toLowerCase()}</span>
                        {active && (
                            <button
                                type="button"
                                onClick={() => onChange(new Set())}
                                className="text-[10px] font-bold text-teal-600 hover:text-teal-800 uppercase"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                        {options.length === 0 ? (
                            <p className="px-3 py-4 text-center text-[11px] text-gray-400 italic">No values yet.</p>
                        ) : options.map((opt) => {
                            const checked = selected.has(opt);
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => toggle(opt)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[12px] transition-colors ${
                                        checked ? "bg-teal-50 text-gray-900" : "hover:bg-gray-50 text-gray-700"
                                    }`}
                                >
                                    <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                        checked ? "bg-teal-600 border-teal-600" : "bg-white border-gray-300"
                                    }`}>
                                        {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                                    </span>
                                    <span className="truncate flex-1">{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AgentLeads({ leads = [], programs = [] }) {
    const [search, setSearch] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [editLead, setEditLead] = useState(null);
    // Sort state: { key: 'name'|'visa'|'status'|'added', dir: 'asc'|'desc' }
    // — default is newest first, matching the previous back-end order.
    const [sort, setSort] = useState({ key: "added", dir: "desc" });
    // Column value filters — each Set holds the picked values; empty Set
    // means "show all". Populated by the header dropdowns.
    const [visaFilter, setVisaFilter] = useState(() => new Set());
    const [statusFilter, setStatusFilter] = useState(() => new Set());

    // Unique-values feeding the header filter dropdowns — computed from
    // the CURRENT lead set so agents only see values that actually exist.
    const visaOptions = useMemo(
        () => Array.from(new Set(leads.map((l) => l.visa).filter(Boolean))).sort(),
        [leads],
    );
    const statusOptions = useMemo(
        () => Array.from(new Set(leads.map((l) => l.status).filter(Boolean))).sort(),
        [leads],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return leads.filter((l) => {
            if (q && ! [l.name, l.email, l.phone, l.location, l.course, l.visa, l.status]
                .filter(Boolean).some((v) => String(v).toLowerCase().includes(q))) return false;
            if (visaFilter.size > 0 && ! visaFilter.has(l.visa)) return false;
            if (statusFilter.size > 0 && ! statusFilter.has(l.status)) return false;
            return true;
        });
    }, [leads, search, visaFilter, statusFilter]);

    const sorted = useMemo(() => {
        const rows = filtered.slice();
        const cmp = (a, b) => {
            const norm = (v) => (v === null || v === undefined ? "" : String(v).toLowerCase());
            let av, bv;
            switch (sort.key) {
                case "added":  av = new Date(a.created_at).getTime() || 0; bv = new Date(b.created_at).getTime() || 0; break;
                case "visa":   av = norm(a.visa);   bv = norm(b.visa);   break;
                case "status": av = norm(a.status); bv = norm(b.status); break;
                case "name":
                default:       av = norm(a.name);   bv = norm(b.name);   break;
            }
            if (av < bv) return sort.dir === "asc" ? -1 : 1;
            if (av > bv) return sort.dir === "asc" ? 1 : -1;
            return 0;
        };
        return rows.sort(cmp);
    }, [filtered, sort]);

    // Clicking a header toggles asc → desc → asc on the same key, or
    // switches to that key (asc) when it was previously sorting a
    // different one.
    const toggleSort = (key) => {
        setSort((prev) => prev.key === key
            ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
            : { key, dir: "asc" });
    };

    return (
        <div className="space-y-6 max-w-[1500px] mx-auto pb-12">
            <Head title="My Leads" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Leads</h1>
                    <p className="text-sm text-gray-500 mt-1">Leads you've recruited. Add new ones and keep their details up to date.</p>
                </div>
                <button
                    onClick={() => setAddOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-semibold transition-colors shadow-sm"
                >
                    <Plus size={16} /> Add Lead
                </button>
            </div>

            <div className="flex items-start gap-2 px-4 py-3 bg-teal-50 border border-teal-100 rounded-xl text-[13px] text-teal-800">
                <Info size={16} className="mt-0.5 flex-shrink-0" />
                <span>You can add leads and edit their contact info. The sales team manages each lead's pipeline stage from here on.</span>
            </div>

            {/* Search + column filters row. Filters live here (not in the
                column headers) so they're always visible + reachable with
                one click, and active selections + a Clear-all shortcut
                stay on screen while the table scrolls. */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-2 lg:items-center">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search my leads…"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <ToolbarFilter label="Visa"   options={visaOptions}   selected={visaFilter}   onChange={setVisaFilter} />
                    <ToolbarFilter label="Status" options={statusOptions} selected={statusFilter} onChange={setStatusFilter} />
                    {(visaFilter.size > 0 || statusFilter.size > 0 || search) && (
                        <button
                            type="button"
                            onClick={() => { setVisaFilter(new Set()); setStatusFilter(new Set()); setSearch(""); }}
                            className="inline-flex items-center gap-1 px-3 py-2 text-[12px] font-semibold text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X size={13} /> Clear
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="min-h-[300px]">
                    {/* Wider viewport: 6 semantic columns fit without a
                        horizontal scroll. Contact info (email + phone)
                        stacks under the name in the Lead cell, and
                        Education + Program share one Interest column so
                        the row keeps a reasonable width even on 1280px. */}
                    <table className="w-full text-left border-collapse table-fixed">
                        <colgroup>
                            <col className="w-[28%]" />
                            <col className="w-[15%]" />
                            <col className="w-[16%]" />
                            <col className="w-[13%]" />
                            <col className="w-[11%]" />
                            <col className="w-[9%]" />
                            <col className="w-[8%]" />
                        </colgroup>
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <SortableTh label="Lead"     sortKey="name"   sort={sort} onSort={toggleSort} />
                                <Th>Location</Th>
                                <Th>Interest</Th>
                                <SortableTh label="Visa"     sortKey="visa"   sort={sort} onSort={toggleSort} />
                                <SortableTh label="Status"   sortKey="status" sort={sort} onSort={toggleSort} />
                                <SortableTh label="Added"    sortKey="added"  sort={sort} onSort={toggleSort} />
                                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right pr-5">Edit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {sorted.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                                        <UsersIcon className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                        <p className="font-semibold">No leads yet</p>
                                        <p className="text-sm mt-1">Add your first recruited lead to get started.</p>
                                    </td>
                                </tr>
                            ) : sorted.map((l) => (
                                <tr key={l.id} className="hover:bg-teal-50/30 transition-colors align-top">
                                    <td className="px-4 py-3">
                                        <div className="flex items-start gap-3">
                                            <Avatar name={l.name} colorKey={l.id} size={36} />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold text-gray-900 text-sm truncate">{l.name}</div>
                                                {l.email && (
                                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5 truncate">
                                                        <Mail size={11} className="text-gray-400 flex-shrink-0" />
                                                        <span className="truncate">{l.email}</span>
                                                    </div>
                                                )}
                                                {l.phone && (
                                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5 truncate">
                                                        <Phone size={11} className="text-gray-400 flex-shrink-0" />
                                                        <span className="truncate">{l.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {l.location
                                            ? <span className="inline-flex items-start gap-1.5 leading-snug"><MapPin size={12} className="text-gray-400 flex-shrink-0 mt-0.5" /><span className="text-[12px]">{l.location}</span></span>
                                            : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-[12px] text-gray-700 leading-snug">
                                        {l.course || l.highest_qualification ? (
                                            <div className="space-y-0.5">
                                                {l.course && (
                                                    <div className="flex items-start gap-1.5"><GraduationCap size={12} className="text-gray-400 flex-shrink-0 mt-0.5" /><span className="truncate">{l.course}</span></div>
                                                )}
                                                {l.highest_qualification && (
                                                    <div className="text-[11px] text-gray-500 pl-[18px] truncate">{l.highest_qualification}</div>
                                                )}
                                            </div>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {l.visa
                                            ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-teal-50 border border-teal-100 text-teal-700 text-[10.5px] font-semibold"><Stamp size={10} /><span className="truncate">{l.visa}</span></span>
                                            : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3"><StatusPill value={l.status} /></td>
                                    <td className="px-4 py-3 text-[12px] text-gray-600">{fmtDate(l.created_at)}</td>
                                    <td className="px-4 py-3 text-right pr-5">
                                        <button
                                            onClick={() => setEditLead(l)}
                                            title="Edit info"
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                                        >
                                            <Pencil size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {addOpen && <LeadFormDrawer mode="add" programs={programs} onClose={() => setAddOpen(false)} />}
            {editLead && <LeadFormDrawer mode="edit" lead={editLead} programs={programs} onClose={() => setEditLead(null)} />}
        </div>
    );
}

// ─── Add / Edit drawer ───────────────────────────────────────────────────
// Splits the display name back into first/last on edit. `suffix` is folded
// into last_name server-side, so on edit we present the stored last_name as-is.

function LeadFormDrawer({ mode, lead = null, programs = [], onClose }) {
    const isEdit = mode === "edit";

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm(
        isEdit
            ? {
                first_name: lead.first_name ?? "",
                last_name: lead.last_name ?? "",
                suffix: "",
                email: lead.email ?? "",
                phone: lead.phone ?? "",
                residence_city: lead.residence_city ?? "",
                residence_country: lead.residence_country ?? "",
                highest_qualification: lead.highest_qualification ?? "",
                program_offered: lead.course ?? "",
            }
            : {
                first_name: "", last_name: "", suffix: "",
                email: "", phone: "", highest_qualification: "", program_offered: "",
                cv_files: [], passport_files: [], diploma_files: [], transcript_files: [],
            }
    );

    useEffect(() => { clearErrors(); /* eslint-disable-next-line */ }, []);

    const submit = () => {
        const url = isEdit ? `/portal/agent/leads/${lead.id}/info` : "/portal/agent/leads";
        post(url, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-white shadow-2xl animate-slide-in-right">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Edit Lead Info" : "Add Lead"}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{isEdit ? "Update this lead's contact details" : "Recruit a new lead into the pipeline"}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X size={20} /></button>
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="mx-6 mt-4 flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={15} /> {Object.values(errors)[0]}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="First name" required>
                            <TextInput value={data.first_name} onChange={(v) => setData("first_name", v)} placeholder="Juan" />
                        </Field>
                        <Field label="Last name">
                            <TextInput value={data.last_name} onChange={(v) => setData("last_name", v)} placeholder="Dela Cruz" />
                        </Field>
                    </div>
                    <Field label="Suffix">
                        <TextInput value={data.suffix} onChange={(v) => setData("suffix", v)} placeholder="Jr., III (optional)" />
                    </Field>
                    <Field label="Email">
                        <TextInput type="email" value={data.email} onChange={(v) => setData("email", v)} placeholder="juan@example.com" />
                    </Field>
                    <Field label="Phone">
                        <TextInput value={data.phone} onChange={(v) => setData("phone", v)} placeholder="+64 21 000 0000" />
                    </Field>

                    {isEdit && (
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="City">
                                <TextInput value={data.residence_city} onChange={(v) => setData("residence_city", v)} placeholder="Auckland" />
                            </Field>
                            <Field label="Country">
                                <TextInput value={data.residence_country} onChange={(v) => setData("residence_country", v)} placeholder="Philippines" />
                            </Field>
                        </div>
                    )}

                    <Field label="Highest education">
                        <input
                            list="agent-qualifications"
                            value={data.highest_qualification}
                            onChange={(e) => setData("highest_qualification", e.target.value)}
                            placeholder="e.g. Bachelor's Degree"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all placeholder-gray-400"
                        />
                        <datalist id="agent-qualifications">
                            {QUALIFICATION_OPTIONS.map((q) => <option key={q} value={q} />)}
                        </datalist>
                    </Field>

                    <Field label="Program of interest">
                        <input
                            list="agent-programs"
                            value={data.program_offered}
                            onChange={(e) => setData("program_offered", e.target.value)}
                            placeholder="Start typing a program…"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all placeholder-gray-400"
                        />
                        <datalist id="agent-programs">
                            {programs.map((p) => <option key={p} value={p} />)}
                        </datalist>
                    </Field>

                    {/* Documents — same four as the public registration form. */}
                    {!isEdit && (
                        <div className="pt-2 border-t border-gray-100">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-3">Documents</p>
                            <div className="space-y-3">
                                <DocPick label="Attach CV" files={data.cv_files} onChange={(f) => setData("cv_files", f)} />
                                <DocPick label="Passport" files={data.passport_files} onChange={(f) => setData("passport_files", f)} />
                                <DocPick label="Diploma" files={data.diploma_files} onChange={(f) => setData("diploma_files", f)} />
                                <DocPick label="Transcript of Record" files={data.transcript_files} onChange={(f) => setData("transcript_files", f)} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                    <button
                        onClick={submit}
                        disabled={processing || !data.first_name.trim()}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {processing ? "Saving…" : (isEdit ? "Save Changes" : "Add Lead")}
                    </button>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .animate-slide-in-right { animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}} />
        </>,
        document.body
    );
}

// Multi-file picker for the Add-Lead Documents section (CV / Passport /
// Diploma / Transcript), mirroring the public registration form.
function DocPick({ label, files = [], onChange }) {
    const inputId = `agent-doc-${label.replace(/\s+/g, "-").toLowerCase()}`;
    const add = (list) => onChange([...(files || []), ...Array.from(list)]);
    const removeAt = (i) => onChange(files.filter((_, idx) => idx !== i));
    return (
        <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">{label}</p>
            <label htmlFor={inputId} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:border-teal-500 hover:bg-teal-50/40 cursor-pointer transition-colors">
                <Upload size={13} /> {files.length ? "Add more…" : "Choose file(s)"}
            </label>
            <input
                id={inputId}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.csv,.jpg,.jpeg,.png,.gif"
                className="hidden"
                onChange={(e) => { if (e.target.files?.length) add(e.target.files); e.target.value = ""; }}
            />
            {files.length > 0 && (
                <ul className="mt-1.5 space-y-1">
                    {files.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                            <FileText size={11} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate flex-1">{f.name}</span>
                            <button type="button" onClick={() => removeAt(i)} className="text-gray-400 hover:text-red-600"><X size={12} /></button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function Field({ label, required, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

function TextInput({ value, onChange, type = "text", placeholder }) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all placeholder-gray-400"
        />
    );
}
