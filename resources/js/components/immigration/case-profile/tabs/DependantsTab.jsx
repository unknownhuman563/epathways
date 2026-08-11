import { useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    Users, Plus, X, Pencil, Trash2, Upload, FileText, Eye, Download, IdCard, FolderOpen,
    CheckCircle2, Clock, AlertTriangle, XCircle, Circle,
} from "lucide-react";

// Case → Family / Dependants. Each dependant has a document CHECKLIST (dependent
// child visa etc.), with per-item status + overall progress. Clicking a
// dependant's "Documents" opens the full checklist modal.

const RELATIONSHIPS = ["child", "partner", "parent", "sibling", "other"];
const REL_LABEL = { child: "Child", partner: "Partner", parent: "Parent", sibling: "Sibling", other: "Other" };

const STATUS = {
    Missing:     { label: "Not submitted", tone: "bg-gray-50 text-gray-500 border-gray-200",         icon: Circle },
    Submitted:   { label: "Submitted",     tone: "bg-yellow-50 text-yellow-700 border-yellow-200",   icon: Clock },
    UnderReview: { label: "Under review",  tone: "bg-blue-50 text-blue-700 border-blue-200",         icon: AlertTriangle },
    Approved:    { label: "Approved",      tone: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    Rejected:    { label: "Rejected",      tone: "bg-red-50 text-red-700 border-red-200",            icon: XCircle },
};

export default function DependantsTab({ lead, dependents = [] }) {
    const [editing, setEditing] = useState(null);
    const [docsFor, setDocsFor] = useState(null);
    if (!lead?.id) return null;

    const base = `/portal/immigration/cases/${lead.id}/dependents`;

    const remove = (d) => {
        if (!window.confirm(`Remove ${d.full_name} and their documents from this case?`)) return;
        router.delete(`${base}/${d.id}`, { preserveScroll: true, onSuccess: () => toast.success("Dependant removed") });
    };

    // Keep the open modal's data fresh after an Inertia reload.
    const openDoc = docsFor ? dependents.find((x) => x.id === docsFor.id) || docsFor : null;

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-[#009688]/20 bg-white shadow-sm p-4 flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-2">
                    <Users size={15} className="text-[#009688] mt-0.5 flex-shrink-0" />
                    <p className="text-[12px] text-gray-600 leading-snug max-w-2xl">
                        Dependants included in this application, each with their own document checklist. The principal applicant
                        can also add them and upload documents from their portal.
                    </p>
                </div>
                <button type="button" onClick={() => setEditing({})}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#009688] text-white text-[12px] font-semibold hover:bg-[#00796b] flex-shrink-0">
                    <Plus size={14} /> Add dependant
                </button>
            </div>

            {dependents.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <Users size={26} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm text-gray-700 font-semibold">No dependants on this case</p>
                    <p className="text-xs text-gray-500 mt-1">Add children or a partner included in this application.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {dependents.map((d) => (
                        <DependantCard key={d.id} d={d} onEdit={() => setEditing(d)} onRemove={() => remove(d)} onDocs={() => setDocsFor(d)} />
                    ))}
                </div>
            )}

            {editing && <DependantModal dependant={editing} base={base} onClose={() => setEditing(null)} />}
            {openDoc && <DocumentsModal d={openDoc} base={base} onClose={() => setDocsFor(null)} />}
        </div>
    );
}

function ProgressBar({ done, total }) {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const complete = total > 0 && done >= total;
    return (
        <div className="flex items-center gap-2 min-w-[160px]">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full ${complete ? "bg-emerald-500" : "bg-[#009688]"}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-[11px] font-bold ${complete ? "text-emerald-600" : "text-gray-500"}`}>{done}/{total}</span>
        </div>
    );
}

function DependantCard({ d, onEdit, onRemove, onDocs }) {
    const p = d.progress || { required_done: 0, required_total: 0 };
    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-4 flex items-center gap-4 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-[#009688]/10 flex items-center justify-center flex-shrink-0">
                <IdCard size={16} className="text-[#009688]" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900">{d.full_name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-[#009688]/10 text-[#009688] border-[#009688]/30">{REL_LABEL[d.relationship] || d.relationship}</span>
                    {d.source === "portal" && <span className="text-[10px] font-semibold text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">Added by applicant</span>}
                </div>
                <p className="text-[12px] text-gray-500 mt-0.5">
                    {[d.dob && `DOB ${d.dob}`, d.nationality, d.passport_number && `Passport ${d.passport_number}`].filter(Boolean).join(" · ") || "No details yet"}
                </p>
            </div>
            <div className="hidden sm:block">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Required docs</div>
                <ProgressBar done={p.required_done} total={p.required_total} />
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <button type="button" onClick={onDocs} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#009688]/30 text-[#009688] text-[11px] font-semibold hover:bg-[#009688]/5">
                    <FolderOpen size={13} /> Documents
                </button>
                <button type="button" onClick={onEdit} title="Edit" className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><Pencil size={13} /></button>
                <button type="button" onClick={onRemove} title="Remove" className="p-1.5 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>
            </div>
        </div>
    );
}

function DocumentsModal({ d, base, onClose }) {
    const fileRefs = useRef({});
    const [busyKey, setBusyKey] = useState(null);
    const checklist = d.checklist || [];
    const other = d.other_documents || [];

    const upload = (key, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusyKey(key || "__other__");
        router.post(`${base}/${d.id}/documents`, { file, checklist_key: key || "" }, {
            forceFormData: true, preserveScroll: true,
            onSuccess: () => toast.success("Uploaded"),
            onError: (err) => toast.error(Object.values(err)[0] || "Upload failed"),
            onFinish: () => { setBusyKey(null); if (fileRefs.current[key || "__other__"]) fileRefs.current[key || "__other__"].value = ""; },
        });
    };
    const setStatus = (doc, status) => router.post(`${base}/${d.id}/documents/${doc.id}/status`, { status }, {
        preserveScroll: true, onSuccess: () => toast.success(`Marked ${status}`),
    });
    const removeDoc = (doc) => {
        if (!window.confirm(`Remove ${doc.original_name}?`)) return;
        router.delete(`${base}/${d.id}/documents/${doc.id}`, { preserveScroll: true, onSuccess: () => toast.success("Removed") });
    };

    const satisfied = checklist.filter((i) => i.document && i.status !== "Rejected").length;

    const AttachmentCell = ({ item, doc, busy }) => (
        <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => fileRefs.current[item.key]?.click()} disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-black disabled:opacity-50">
                <Upload size={12} /> {busy ? "Uploading…" : doc ? "Replace" : "Upload"}
            </button>
            <input ref={(el) => (fileRefs.current[item.key] = el)} type="file" className="hidden" onChange={(e) => upload(item.key, e)} />
            {doc && <a href={`/admin/documents/${doc.id}/download?inline=1`} target="_blank" rel="noopener noreferrer" title="View" className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><Eye size={12} /></a>}
            {doc && <a href={`/admin/documents/${doc.id}/download`} title="Download" className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><Download size={12} /></a>}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">{d.full_name} — Documents</h2>
                        <p className="text-[12px] text-gray-500">{REL_LABEL[d.relationship] || d.relationship} · {d.progress?.required_done ?? 0}/{d.progress?.required_total ?? 0} required complete</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
                </div>

                <div className="p-5 overflow-y-auto">
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-[10.5px] font-bold uppercase tracking-wider text-gray-500">
                                    <th className="text-left px-4 py-2.5 w-[40%]">Document</th>
                                    <th className="text-left px-4 py-2.5 w-[26%]">Attachment</th>
                                    <th className="text-left px-4 py-2.5 w-[18%]">Status</th>
                                    <th className="text-left px-4 py-2.5 w-[16%]">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-gray-200 border-y border-gray-300">
                                    <td colSpan={4} className="px-4 py-2">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">{REL_LABEL[d.relationship] || d.relationship} documents</span>
                                        <span className="text-[10.5px] font-semibold text-gray-500 ml-2">{satisfied}/{checklist.length}</span>
                                    </td>
                                </tr>
                                {checklist.map((item) => {
                                    const st = STATUS[item.status] || STATUS.Missing;
                                    const doc = item.document;
                                    const busy = busyKey === item.key;
                                    return (
                                        <tr key={item.key} className="border-b border-gray-50 hover:bg-gray-50/40 align-top">
                                            <td className="px-4 py-3">
                                                <span className="text-[13px] font-medium text-gray-800">{item.label}</span>
                                                {item.required && <span className="text-red-500 ml-1">*</span>}
                                                {doc && <div className="text-[11px] text-gray-400 truncate mt-0.5 max-w-[240px]">{doc.original_name}</div>}
                                            </td>
                                            <td className="px-4 py-3"><AttachmentCell item={item} doc={doc} busy={busy} /></td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${st.tone}`}>{st.label}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {doc ? (
                                                    <div className="flex items-center gap-1">
                                                        <button type="button" title="Approve" onClick={() => setStatus(doc, "Approved")} className="px-1.5 py-1 rounded text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50">Approve</button>
                                                        <button type="button" title="Reject" onClick={() => setStatus(doc, "Rejected")} className="px-1.5 py-1 rounded text-[10px] font-semibold text-red-600 hover:bg-red-50">Reject</button>
                                                        <button type="button" title="Remove" onClick={() => removeDoc(doc)} className="p-1 rounded text-red-500 hover:bg-red-50"><Trash2 size={12} /></button>
                                                    </div>
                                                ) : <span className="text-gray-300">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {other.length > 0 && (
                                    <>
                                        <tr className="bg-gray-200 border-y border-gray-300">
                                            <td colSpan={4} className="px-4 py-2">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Other documents</span>
                                            </td>
                                        </tr>
                                        {other.map((doc) => (
                                            <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50/40">
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-800"><FileText size={13} className="text-gray-400" />{doc.original_name}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <a href={`/admin/documents/${doc.id}/download?inline=1`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-[11px] font-semibold hover:bg-gray-50"><Eye size={12} /> View</a>
                                                </td>
                                                <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${(STATUS[doc.status] || STATUS.Submitted).tone}`}>{(STATUS[doc.status] || STATUS.Submitted).label}</span></td>
                                                <td className="px-4 py-3"><button type="button" onClick={() => removeDoc(doc)} className="p-1 rounded text-red-500 hover:bg-red-50"><Trash2 size={12} /></button></td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                    <button type="button" onClick={() => fileRefs.current["__other__"]?.click()} disabled={busyKey === "__other__"}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={12} /> Add other document
                    </button>
                    <input ref={(el) => (fileRefs.current["__other__"] = el)} type="file" className="hidden" onChange={(e) => upload("", e)} />
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Done</button>
                </div>
            </div>
        </div>
    );
}

function DependantModal({ dependant, base, onClose }) {
    const isNew = !dependant.id;
    const [form, setForm] = useState({
        relationship: dependant.relationship || "child",
        first_name: dependant.first_name || "",
        family_name: dependant.family_name || "",
        middle_name: dependant.middle_name || "",
        dob: dependant.dob || "",
        gender: dependant.gender || "",
        nationality: dependant.nationality || "",
        passport_number: dependant.passport_number || "",
        passport_expiry: dependant.passport_expiry || "",
        notes: dependant.notes || "",
    });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = () => {
        setSaving(true);
        const opts = {
            preserveScroll: true,
            onSuccess: () => { toast.success(isNew ? "Dependant added" : "Dependant updated"); onClose(); },
            onError: (err) => toast.error(Object.values(err)[0] || "Could not save"),
            onFinish: () => setSaving(false),
        };
        if (isNew) router.post(base, form, opts);
        else router.put(`${base}/${dependant.id}`, form, opts);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                    <h2 className="text-base font-semibold text-gray-900">{isNew ? "Add dependant" : "Edit dependant"}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
                </div>
                <div className="p-5 space-y-3.5">
                    <Field label="Relationship">
                        <select value={form.relationship} onChange={(e) => set("relationship", e.target.value)} className={INPUT}>
                            {RELATIONSHIPS.map((r) => <option key={r} value={r}>{REL_LABEL[r]}</option>)}
                        </select>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Given name(s)"><input className={INPUT} value={form.first_name} onChange={(e) => set("first_name", e.target.value)} /></Field>
                        <Field label="Family name"><input className={INPUT} value={form.family_name} onChange={(e) => set("family_name", e.target.value)} /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Date of birth"><input type="date" className={INPUT} value={form.dob} onChange={(e) => set("dob", e.target.value)} /></Field>
                        <Field label="Gender"><input className={INPUT} value={form.gender} onChange={(e) => set("gender", e.target.value)} /></Field>
                    </div>
                    <Field label="Nationality"><input className={INPUT} value={form.nationality} onChange={(e) => set("nationality", e.target.value)} /></Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Passport number"><input className={INPUT} value={form.passport_number} onChange={(e) => set("passport_number", e.target.value)} /></Field>
                        <Field label="Passport expiry"><input type="date" className={INPUT} value={form.passport_expiry} onChange={(e) => set("passport_expiry", e.target.value)} /></Field>
                    </div>
                    <Field label="Notes"><textarea rows={2} className={INPUT} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
                </div>
                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2 sticky bottom-0 bg-white">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={submit} disabled={saving} className="px-4 py-2 rounded-lg bg-[#009688] text-white text-sm font-semibold hover:bg-[#00796b] disabled:opacity-50">
                        {saving ? "Saving…" : isNew ? "Add dependant" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const INPUT = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688]";

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</span>
            {children}
        </label>
    );
}
