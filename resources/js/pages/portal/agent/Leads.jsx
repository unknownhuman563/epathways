import { useState, useMemo, useEffect } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import { createPortal } from "react-dom";
import {
    Plus, Search, X, Users as UsersIcon, Mail, Phone, MapPin,
    GraduationCap, Pencil, AlertCircle, Info, Upload, FileText,
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
        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_TONE[value] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
            {value}
        </span>
    );
}

export default function AgentLeads({ leads = [], programs = [] }) {
    const [search, setSearch] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [editLead, setEditLead] = useState(null);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return leads;
        return leads.filter((l) =>
            [l.name, l.email, l.phone, l.location, l.course]
                .filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
        );
    }, [leads, search]);

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

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-full sm:w-80 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search my leads…"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Education</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Program</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Added</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right pr-8">Edit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center text-gray-400">
                                        <UsersIcon className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                        <p className="font-semibold">No leads yet</p>
                                        <p className="text-sm mt-1">Add your first recruited lead to get started.</p>
                                    </td>
                                </tr>
                            ) : filtered.map((l) => (
                                <tr key={l.id} className="hover:bg-teal-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={l.name} colorKey={l.id} size={36} />
                                            <div>
                                                <div className="font-bold text-gray-900 text-sm">{l.name}</div>
                                                <div className="text-[11px] text-gray-400">{l.lead_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        <div className="space-y-1">
                                            {l.email && <div className="flex items-center gap-1.5"><Mail size={13} className="text-gray-400" />{l.email}</div>}
                                            {l.phone && <div className="flex items-center gap-1.5"><Phone size={13} className="text-gray-400" />{l.phone}</div>}
                                            {!l.email && !l.phone && <span className="text-gray-300">—</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {l.location ? <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-gray-400" />{l.location}</span> : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {l.highest_qualification ? <span className="inline-flex items-center gap-1.5"><GraduationCap size={13} className="text-gray-400" />{l.highest_qualification}</span> : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {l.course ? <span className="inline-flex items-center gap-1.5"><GraduationCap size={13} className="text-gray-400" />{l.course}</span> : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-6 py-4"><StatusPill value={l.status} /></td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{fmtDate(l.created_at)}</td>
                                    <td className="px-6 py-4 text-right pr-6">
                                        <button
                                            onClick={() => setEditLead(l)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                                        >
                                            <Pencil size={13} className="text-gray-400" /> Edit info
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
