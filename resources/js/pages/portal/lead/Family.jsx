import { useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    Users, Plus, X, Pencil, Trash2, Upload, FileText, Eye, IdCard, FolderOpen,
    CheckCircle2, Clock, AlertTriangle, XCircle, Circle,
} from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";

// Lead portal → My Family. Each family member has a document checklist. The
// principal uploads each required document; their adviser reviews and approves.

const RELATIONSHIPS = ["child", "partner", "parent", "sibling", "other"];
const REL_LABEL = { child: "Child", partner: "Partner", parent: "Parent", sibling: "Sibling", other: "Other" };
const ACCENT = "#436235";

const STATUS = {
    Missing:     { label: "Not uploaded", tone: "bg-gray-50 text-gray-500 border-gray-200",         icon: Circle },
    Submitted:   { label: "Uploaded",     tone: "bg-blue-50 text-blue-700 border-blue-200",          icon: Clock },
    UnderReview: { label: "Under review", tone: "bg-amber-50 text-amber-700 border-amber-200",       icon: AlertTriangle },
    Approved:    { label: "Approved",     tone: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    Rejected:    { label: "Rejected",     tone: "bg-red-50 text-red-700 border-red-200",             icon: XCircle },
};

export default function LeadFamily({ dependents = [] }) {
    const [editing, setEditing] = useState(null);
    const [docsFor, setDocsFor] = useState(null);

    const remove = (d) => {
        if (!window.confirm(`Remove ${d.full_name}?`)) return;
        router.delete(`/portal/lead/family/${d.id}`, { preserveScroll: true, onSuccess: () => toast.success("Removed") });
    };
    const openDoc = docsFor ? dependents.find((x) => x.id === docsFor.id) || docsFor : null;

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-12">
            <Head title="My Family" />
            <PortalPageHeader
                eyebrow="Application"
                title="My Family"
                description="Add the family members included in your application and upload each person's required documents. Your adviser reviews and approves them."
                action={
                    <button type="button" onClick={() => setEditing({})}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: ACCENT }}>
                        <Plus size={15} /> Add family member
                    </button>
                }
            />

            {dependents.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <Users size={26} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm text-gray-700 font-medium">No family members added yet</p>
                    <p className="text-xs text-gray-500 mt-1">Add anyone included in your application.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {dependents.map((d) => <PersonCard key={d.id} d={d} onEdit={() => setEditing(d)} onRemove={() => remove(d)} onDocs={() => setDocsFor(d)} />)}
                </div>
            )}

            {editing && <PersonModal person={editing} onClose={() => setEditing(null)} />}
            {openDoc && <DocumentsModal d={openDoc} onClose={() => setDocsFor(null)} />}
        </div>
    );
}

function ProgressBar({ done, total }) {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const complete = total > 0 && done >= total;
    return (
        <div className="flex items-center gap-2 min-w-[150px]">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full" style={{ width: `${pct}%`, backgroundColor: complete ? "#059669" : ACCENT }} />
            </div>
            <span className="text-[11px] font-bold" style={{ color: complete ? "#059669" : "#6b7280" }}>{done}/{total}</span>
        </div>
    );
}

function PersonCard({ d, onEdit, onRemove, onDocs }) {
    const p = d.progress || { required_done: 0, required_total: 0 };
    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-4 flex items-center gap-4 flex-wrap">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}1a` }}>
                <IdCard size={16} style={{ color: ACCENT }} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{d.full_name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border" style={{ color: ACCENT, backgroundColor: `${ACCENT}1a`, borderColor: `${ACCENT}4d` }}>{REL_LABEL[d.relationship] || d.relationship}</span>
                </div>
                <p className="text-[12px] text-gray-500 mt-0.5">{[d.dob && `DOB ${d.dob}`, d.nationality].filter(Boolean).join(" · ") || "No details yet"}</p>
            </div>
            <div className="hidden sm:block">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Documents</div>
                <ProgressBar done={p.required_done} total={p.required_total} />
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <button type="button" onClick={onDocs} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold" style={{ color: ACCENT, borderColor: `${ACCENT}4d` }}>
                    <FolderOpen size={13} /> Documents
                </button>
                <button type="button" onClick={onEdit} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><Pencil size={13} /></button>
                <button type="button" onClick={onRemove} className="p-1.5 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>
            </div>
        </div>
    );
}

function DocumentsModal({ d, onClose }) {
    const fileRefs = useRef({});
    const [busyKey, setBusyKey] = useState(null);
    const checklist = d.checklist || [];
    // Tied to this member's own case — they upload there; here it's view-only.
    const linked = !!d.linked;

    const upload = (key, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusyKey(key);
        router.post(`/portal/lead/family/${d.id}/documents`, { file, checklist_key: key || "" }, {
            forceFormData: true, preserveScroll: true,
            onSuccess: () => toast.success("Uploaded"),
            onError: (err) => toast.error(Object.values(err)[0] || "Upload failed"),
            onFinish: () => { setBusyKey(null); if (fileRefs.current[key]) fileRefs.current[key].value = ""; },
        });
    };
    const removeDoc = (doc) => {
        if (!window.confirm(`Remove ${doc.original_name}?`)) return;
        router.delete(`/portal/lead/family/${d.id}/documents/${doc.id}`, { preserveScroll: true, onSuccess: () => toast.success("Removed") });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">{d.full_name} — Documents</h2>
                        <p className="text-[12px] text-gray-500">{d.progress?.required_done ?? 0} of {d.progress?.required_total ?? 0} required documents uploaded</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
                </div>
                <div className="p-5 space-y-2.5 overflow-y-auto">
                    {linked && (
                        <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 mb-1">
                            <FolderOpen size={16} className="text-sky-500 mt-0.5 flex-shrink-0" />
                            <p className="text-[12px] text-sky-800">{d.full_name} uploads these documents on their own portal. You can view what they've submitted here.</p>
                        </div>
                    )}
                    {checklist.map((item) => {
                        const st = STATUS[item.status] || STATUS.Missing;
                        const StIcon = st.icon;
                        const doc = item.document;
                        const busy = busyKey === item.key;
                        return (
                            <div key={item.key} className="rounded-xl border border-gray-100 p-3">
                                <div className="flex items-start gap-3 flex-wrap">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[13px] font-semibold text-gray-900">{item.label}</span>
                                            {item.required && <span className="text-[9px] font-bold uppercase tracking-wider text-red-500">Required</span>}
                                        </div>
                                        {doc && <p className="text-[12px] text-gray-500 truncate mt-0.5">{doc.original_name}</p>}
                                    </div>
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${st.tone}`}><StIcon size={10} />{st.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-2.5">
                                    {!linked && (
                                        <>
                                            <button type="button" onClick={() => fileRefs.current[item.key]?.click()} disabled={busy}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold disabled:opacity-50" style={{ color: ACCENT, borderColor: `${ACCENT}4d` }}>
                                                <Upload size={12} /> {busy ? "Uploading…" : doc ? "Replace" : "Upload"}
                                            </button>
                                            <input ref={(el) => (fileRefs.current[item.key] = el)} type="file" className="hidden" onChange={(e) => upload(item.key, e)} />
                                        </>
                                    )}
                                    {doc && (
                                        <a href={`/portal/lead/family/${d.id}/documents/${doc.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><Eye size={12} /></a>
                                    )}
                                    {doc && !linked && (
                                        <button type="button" onClick={() => removeDoc(doc)} className="p-1.5 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50"><Trash2 size={12} /></button>
                                    )}
                                    {linked && !doc && <span className="text-[11px] text-gray-400">Not yet submitted</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Done</button>
                </div>
            </div>
        </div>
    );
}

function PersonModal({ person, onClose }) {
    const isNew = !person.id;
    const [form, setForm] = useState({
        relationship: person.relationship || "child",
        first_name: person.first_name || "",
        family_name: person.family_name || "",
        middle_name: person.middle_name || "",
        dob: person.dob || "",
        gender: person.gender || "",
        nationality: person.nationality || "",
        passport_number: person.passport_number || "",
        passport_expiry: person.passport_expiry || "",
    });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = () => {
        setSaving(true);
        const opts = {
            preserveScroll: true,
            onSuccess: () => { toast.success(isNew ? "Added" : "Saved"); onClose(); },
            onError: (err) => toast.error(Object.values(err)[0] || "Could not save"),
            onFinish: () => setSaving(false),
        };
        if (isNew) router.post("/portal/lead/family", form, opts);
        else router.put(`/portal/lead/family/${person.id}`, form, opts);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                    <h2 className="text-base font-semibold text-gray-900">{isNew ? "Add family member" : "Edit family member"}</h2>
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
                </div>
                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2 sticky bottom-0 bg-white">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={submit} disabled={saving} className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: ACCENT }}>
                        {saving ? "Saving…" : isNew ? "Add" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const INPUT = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#436235] focus:ring-1 focus:ring-[#436235]";

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</span>
            {children}
        </label>
    );
}
