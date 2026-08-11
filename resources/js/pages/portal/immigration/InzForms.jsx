import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    FileText, Plus, Upload, Trash2, Pencil, Check, CheckCircle2, AlertTriangle,
    Clock, Star, ListChecks, X, Loader2, Tags, Folder, ChevronRight,
} from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";

// Setup → INZ Forms. Two tabs:
//  • INZ Forms — version-tracked catalogue: upload the OFFICIAL PDF per version,
//    map its fields to case data (fill the official PDF, never a look-alike).
//  • Category — group visa types; a case's visa → category → the INZ forms it
//    can generate.

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—");
const post = (url, data, opts = {}) => router.post(url, data, { preserveScroll: true, ...opts });

export default function ImmigrationInzForms({ forms = [], categories = [], visaTypes = [], contextKeys = [] }) {
    const [tab, setTab] = useState("forms");
    const [adding, setAdding] = useState(false);
    const [addingCat, setAddingCat] = useState(false);
    const [openCat, setOpenCat] = useState(null); // null = folder (category) view

    // Folders = categories (from the table) + any category strings on forms.
    const folderNames = [];
    const seen = new Set();
    for (const c of categories) { if (! seen.has(c.name)) { seen.add(c.name); folderNames.push(c.name); } }
    for (const f of forms) { const c = f.category || "Uncategorised"; if (! seen.has(c)) { seen.add(c); folderNames.push(c); } }
    const countFor = (name) => forms.filter((f) => (f.category || "Uncategorised") === name).length;
    const formsIn = (name) => forms.filter((f) => (f.category || "Uncategorised") === name);

    return (
        <div className="space-y-5 max-w-[1100px] mx-auto pb-14">
            <Head title="INZ Forms — Immigration" />
            <div className="flex items-end justify-between gap-3 flex-wrap">
                <PortalPageHeader eyebrow="Setup" title="INZ Forms" description="Version-tracked catalogue of official INZ forms, and the visa categories that decide which forms a case can generate." />
                {tab === "forms"
                    ? <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black"><Plus size={15} /> Add form</button>
                    : <button type="button" onClick={() => setAddingCat(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black"><Plus size={15} /> Add category</button>}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-gray-200">
                <Tab active={tab === "forms"} onClick={() => setTab("forms")} icon={<FileText size={14} />}>INZ Forms</Tab>
                <Tab active={tab === "category"} onClick={() => setTab("category")} icon={<Tags size={14} />}>Category</Tab>
            </div>

            {tab === "forms" ? (
                openCat === null ? (
                    // ── Folder (category) view ──
                    folderNames.length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                            <FileText size={30} className="mx-auto text-gray-300" />
                            <p className="mt-3 text-sm text-gray-500">No categories yet. Add one on the Category tab, then add forms.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {folderNames.map((name) => (
                                <button key={name} type="button" onClick={() => setOpenCat(name)}
                                    className="group text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#009688]/40 transition-all p-4 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-[#009688]/10 text-[#009688] flex items-center justify-center flex-shrink-0"><Folder size={20} /></span>
                                    <span className="min-w-0">
                                        <span className="block font-semibold text-gray-900 text-sm truncate">{name}</span>
                                        <span className="block text-xs text-gray-400">{countFor(name)} form{countFor(name) === 1 ? "" : "s"}</span>
                                    </span>
                                    <ChevronRight size={16} className="ml-auto text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    )
                ) : (
                    // ── Inside a folder ──
                    <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-sm">
                            <button type="button" onClick={() => setOpenCat(null)} className="text-gray-500 hover:text-gray-900">All forms</button>
                            <ChevronRight size={14} className="text-gray-300" />
                            <span className="font-semibold text-gray-900 inline-flex items-center gap-1.5"><Folder size={14} className="text-amber-500" /> {openCat}</span>
                        </div>
                        {formsIn(openCat).length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                <p className="text-sm text-gray-500">No forms in {openCat} yet. Use “Add form”.</p>
                            </div>
                        ) : formsIn(openCat).map((f) => <FormCard key={f.id} form={f} contextKeys={contextKeys} />)}
                    </div>
                )
            ) : (
                <CategoryPanel categories={categories} visaTypes={visaTypes} />
            )}

            {adding && <FormModal defaultCategory={openCat || ""} onClose={() => setAdding(false)} />}
            {addingCat && <CategoryModal onClose={() => setAddingCat(false)} />}
        </div>
    );
}

function Tab({ active, onClick, icon, children }) {
    return (
        <button type="button" onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
                active ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"
            }`}>
            {icon}{children}
        </button>
    );
}

// ── Category tab ────────────────────────────────────────────────────────────
function CategoryPanel({ categories, visaTypes }) {
    if (categories.length === 0) {
        return <p className="text-sm text-gray-400 py-10 text-center">No categories yet. Add one to group your visas.</p>;
    }
    return (
        <div className="space-y-3">
            {categories.map((c) => <CategoryCard key={c.id} category={c} visaTypes={visaTypes} />)}
        </div>
    );
}

function CategoryCard({ category: c, visaTypes }) {
    const [editing, setEditing] = useState(false);
    const [assign, setAssign] = useState(false);
    const [selected, setSelected] = useState(() => new Set(c.visa_type_ids || []));
    const [busy, setBusy] = useState(false);

    const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const saveVisas = () => {
        setBusy(true);
        post(`/portal/immigration/visa-categories/${c.id}/visas`, { visa_type_ids: [...selected] }, {
            onSuccess: () => { toast.success("Visas updated"); setAssign(false); },
            onError: (e) => toast.error(Object.values(e)[0] || "Failed"),
            onFinish: () => setBusy(false),
        });
    };
    const del = () => { if (window.confirm(`Remove category ${c.name}?`)) router.delete(`/portal/immigration/visa-categories/${c.id}`, { preserveScroll: true, onSuccess: () => toast.success("Category removed") }); };

    const assigned = visaTypes.filter((v) => (c.visa_type_ids || []).includes(v.id));

    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{c.name}</span>
                        {c.code && <span className="text-[10px] font-mono text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">{c.code}</span>}
                        <span className="text-[11px] text-gray-400">{assigned.length} visa{assigned.length === 1 ? "" : "s"} · {c.form_count} form{c.form_count === 1 ? "" : "s"}</span>
                    </div>
                    {c.description && <p className="text-[12px] text-gray-500 mt-0.5">{c.description}</p>}
                </div>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setAssign((v) => ! v)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900">Assign visas</button>
                    <button type="button" onClick={() => setEditing(true)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-900"><Pencil size={13} /></button>
                    <button type="button" onClick={del} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:border-rose-400"><Trash2 size={13} /></button>
                </div>
            </div>

            {! assign ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {assigned.length === 0 ? <span className="text-[11px] text-gray-400">No visas assigned.</span>
                        : assigned.map((v) => <span key={v.id} className="text-[11px] bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-gray-600">{v.name}</span>)}
                </div>
            ) : (
                <div className="mt-3 border-t border-gray-50 pt-3">
                    <p className="text-[11px] font-semibold text-gray-600 mb-2">Tick the visa types under {c.name}:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto">
                        {visaTypes.map((v) => (
                            <label key={v.id} className="inline-flex items-center gap-2 text-[12.5px] text-gray-700 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggle(v.id)} className="rounded border-gray-300" />
                                <span className="truncate">{v.name}{v.category && v.category !== c.name && <span className="text-[10px] text-amber-500"> (in {v.category})</span>}</span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2">
                        <button type="button" onClick={() => { setSelected(new Set(c.visa_type_ids || [])); setAssign(false); }} className="px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-900">Cancel</button>
                        <button type="button" onClick={saveVisas} disabled={busy} className="px-3.5 py-1.5 rounded-lg bg-gray-900 text-white text-[12px] font-semibold hover:bg-black disabled:opacity-50">Save visas</button>
                    </div>
                </div>
            )}

            {editing && <CategoryModal category={c} onClose={() => setEditing(false)} />}
        </div>
    );
}

function CategoryModal({ category, onClose }) {
    const editing = !! category;
    const [d, setD] = useState({ name: category?.name || "", code: category?.code || "", description: category?.description || "" });
    const [busy, setBusy] = useState(false);
    const submit = () => {
        if (! d.name.trim()) return toast.error("Name is required");
        setBusy(true);
        const url = editing ? `/portal/immigration/visa-categories/${category.id}` : "/portal/immigration/visa-categories";
        post(url, d, {
            onSuccess: () => { toast.success(editing ? "Category updated" : "Category added"); onClose(); },
            onError: (e) => toast.error(Object.values(e)[0] || "Save failed"),
            onFinish: () => setBusy(false),
        });
    };
    return (
        <Modal onClose={onClose} title={editing ? `Edit ${category.name}` : "Add category"}>
            <div className="space-y-3">
                <Field label="Name"><input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Student" className={inp} /></Field>
                <Field label="Code"><input value={d.code} onChange={(e) => setD({ ...d, code: e.target.value })} placeholder="SV (optional)" className={inp} /></Field>
                <Field label="Description"><input value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} placeholder="optional" className={inp} /></Field>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={onClose} className="px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-900">Cancel</button>
                <button type="button" onClick={submit} disabled={busy} className="px-3.5 py-1.5 rounded-lg bg-gray-900 text-white text-[12px] font-semibold hover:bg-black disabled:opacity-50">{editing ? "Save" : "Add category"}</button>
            </div>
        </Modal>
    );
}

function FormCard({ form, contextKeys }) {
    const [editing, setEditing] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [mapVersion, setMapVersion] = useState(null);

    const del = () => {
        if (! window.confirm(`Remove ${form.code} and all its versions?`)) return;
        router.delete(`/portal/immigration/inz-forms/${form.id}`, { preserveScroll: true, onSuccess: () => toast.success("Form removed") });
    };

    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{form.code}</span>
                        {! form.is_active && <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">Inactive</span>}
                    </div>
                    <p className="text-[12px] text-gray-500 truncate">{form.name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setUploadOpen((v) => ! v)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-black">
                        <Upload size={12} /> Upload version
                    </button>
                    <button type="button" onClick={() => setEditing(true)} title="Edit form"
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-900"><Pencil size={13} /></button>
                    <button type="button" onClick={del} title="Delete form"
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:border-rose-400"><Trash2 size={13} /></button>
                </div>
            </div>

            {uploadOpen && <UploadVersionForm formId={form.id} onDone={() => setUploadOpen(false)} />}

            <div className="divide-y divide-gray-50">
                {form.versions.length === 0 ? (
                    <p className="px-5 py-3 text-[12px] text-gray-400">No versions yet — upload the official PDF.</p>
                ) : form.versions.map((v) => (
                    <VersionRow key={v.id} version={v} onMap={() => setMapVersion(v)} />
                ))}
            </div>

            {editing && <FormModal form={form} onClose={() => setEditing(false)} />}
            {mapVersion && <FieldMapModal version={mapVersion} contextKeys={contextKeys} onClose={() => setMapVersion(null)} />}
        </div>
    );
}

function VersionRow({ version: v, onMap }) {
    const setCurrent = () => post(`/portal/immigration/inz-forms/versions/${v.id}/set-current`, {}, { onSuccess: () => toast.success("Set as current") });
    const markChecked = () => post(`/portal/immigration/inz-forms/versions/${v.id}/checked`, {}, { onSuccess: () => toast.success("Marked checked") });
    const del = () => { if (window.confirm("Remove this version?")) router.delete(`/portal/immigration/inz-forms/versions/${v.id}`, { preserveScroll: true, onSuccess: () => toast.success("Version removed") }); };

    return (
        <div className="px-5 py-3 flex items-center gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-gray-900">{v.version_label}</span>
                    {v.is_current && <Badge tone="gray" icon={<Star size={10} />}>Current</Badge>}
                    {v.ready ? <Badge tone="emerald" icon={<CheckCircle2 size={10} />}>PDF on file</Badge> : <Badge tone="amber">No PDF</Badge>}
                    {v.ready && (v.is_acroform ? <Badge tone="blue">Fillable</Badge> : <Badge tone="gray">Flat form</Badge>)}
                    {v.lapsed ? <Badge tone="rose" icon={<AlertTriangle size={10} />}>Lapsed</Badge>
                        : v.lapsing ? <Badge tone="amber" icon={<Clock size={10} />}>Lapsing</Badge> : null}
                </div>
                <p className="text-[10.5px] text-gray-400 mt-0.5">
                    {v.effective_from && <>Effective {fmtDate(v.effective_from)} · </>}
                    {v.accepted_until && <>accepted until {fmtDate(v.accepted_until)} · </>}
                    {(v.field_map || []).length} field{(v.field_map || []).length === 1 ? "" : "s"} mapped · checked {v.checked_at ? fmtDate(v.checked_at) : "never"}
                </p>
            </div>
            <div className="flex items-center gap-1.5">
                <button type="button" onClick={onMap} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900"><ListChecks size={12} /> Map fields</button>
                {! v.is_current && <button type="button" onClick={setCurrent} className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900">Set current</button>}
                <button type="button" onClick={markChecked} title="Mark still-current as verified today" className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-500"><Check size={13} /></button>
                <button type="button" onClick={del} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:border-rose-400"><Trash2 size={13} /></button>
            </div>
        </div>
    );
}

function UploadVersionForm({ formId, onDone }) {
    const [f, setF] = useState({ version_label: "", effective_from: "", accepted_until: "", make_current: true });
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);

    const submit = () => {
        if (! f.version_label.trim()) return toast.error("Version label is required (e.g. November 2025)");
        if (! file) return toast.error("Choose the official PDF");
        setBusy(true);
        post(`/portal/immigration/inz-forms/${formId}/versions`, { ...f, file }, {
            forceFormData: true,
            onSuccess: () => { toast.success("Version uploaded"); onDone(); },
            onError: (e) => toast.error(Object.values(e)[0] || "Upload failed"),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100 flex items-end gap-3 flex-wrap">
            <Field label="Version label"><input value={f.version_label} onChange={(e) => setF({ ...f, version_label: e.target.value })} placeholder="November 2025" className={inp} /></Field>
            <Field label="Official PDF"><input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-[12px]" /></Field>
            <Field label="Effective from"><input type="date" value={f.effective_from} onChange={(e) => setF({ ...f, effective_from: e.target.value })} className={inp} /></Field>
            <Field label="Accepted until"><input type="date" value={f.accepted_until} onChange={(e) => setF({ ...f, accepted_until: e.target.value })} className={inp} /></Field>
            <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 pb-1.5">
                <input type="checkbox" checked={f.make_current} onChange={(e) => setF({ ...f, make_current: e.target.checked })} className="rounded border-gray-300" /> Make current
            </label>
            <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-black disabled:opacity-50">
                {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Upload
            </button>
        </div>
    );
}

function FieldMapModal({ version, contextKeys, onClose }) {
    const [rows, setRows] = useState((version.field_map || []).map((r) => ({ pdf_field: r.pdf_field || "", source: r.source || "", literal: r.literal || "" })));
    const [busy, setBusy] = useState(false);

    const setRow = (i, k, val) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: val } : r)));
    const addRow = () => setRows((rs) => [...rs, { pdf_field: "", source: "", literal: "" }]);
    const delRow = (i) => setRows((rs) => rs.filter((_, j) => j !== i));

    const save = () => {
        const clean = rows.filter((r) => r.pdf_field.trim());
        setBusy(true);
        post(`/portal/immigration/inz-forms/versions/${version.id}/field-map`, { field_map: clean }, {
            onSuccess: () => { toast.success("Field map saved"); onClose(); },
            onError: (e) => toast.error(Object.values(e)[0] || "Save failed"),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <Modal onClose={onClose} title={`Field map · ${version.version_label}`} wide>
            <p className="text-[11px] text-gray-500 mb-3">
                Map each PDF form-field name to a case value (or a fixed literal). {version.is_acroform === false && <span className="text-amber-600 font-semibold">This is a flat form — field-fill won't apply until the x/y overlay ships.</span>}
            </p>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {rows.length === 0 && <p className="text-[12px] text-gray-400">No rows yet. Add the PDF's field names and point each at a case value.</p>}
                {rows.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <input value={r.pdf_field} onChange={(e) => setRow(i, "pdf_field", e.target.value)} placeholder="PDF field name" className={`${inp} flex-1`} />
                        <span className="text-gray-300">←</span>
                        <select value={r.source} onChange={(e) => setRow(i, "source", e.target.value)} className={`${inp} flex-1`}>
                            <option value="">(case value…)</option>
                            {contextKeys.map((k) => <option key={k} value={k}>{k}</option>)}
                        </select>
                        <input value={r.literal} onChange={(e) => setRow(i, "literal", e.target.value)} placeholder="or literal" className={`${inp} w-32`} />
                        <button type="button" onClick={() => delRow(i)} className="text-gray-300 hover:text-rose-600"><X size={15} /></button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={addRow} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-900"><Plus size={12} /> Add field</button>
            <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={onClose} className="px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-900">Cancel</button>
                <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-gray-900 text-white text-[12px] font-semibold hover:bg-black disabled:opacity-50">Save map</button>
            </div>
        </Modal>
    );
}

function FormModal({ form, defaultCategory = "", onClose }) {
    const editing = !! form;
    const [d, setD] = useState({ code: form?.code || "", name: form?.name || "", category: form?.category || defaultCategory || "", is_active: form?.is_active ?? true });
    const [busy, setBusy] = useState(false);

    const submit = () => {
        if (! editing && ! d.code.trim()) return toast.error("Form code is required (e.g. INZ1012)");
        if (! d.name.trim()) return toast.error("Name is required");
        setBusy(true);
        const url = editing ? `/portal/immigration/inz-forms/${form.id}` : "/portal/immigration/inz-forms";
        post(url, editing ? { name: d.name, category: d.category, is_active: d.is_active } : d, {
            onSuccess: () => { toast.success(editing ? "Form updated" : "Form added"); onClose(); },
            onError: (e) => toast.error(Object.values(e)[0] || "Save failed"),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <Modal onClose={onClose} title={editing ? `Edit ${form.code}` : "Add INZ form"}>
            <div className="space-y-3">
                {! editing && <Field label="Code"><input value={d.code} onChange={(e) => setD({ ...d, code: e.target.value.toUpperCase() })} placeholder="INZ1012" className={inp} /></Field>}
                <Field label="Name"><input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Student Visa Application" className={inp} /></Field>
                <Field label="Category"><input value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })} placeholder="Student / Work / Visitor / Residence / Cross-cutting" className={inp} /></Field>
                {editing && <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-gray-600"><input type="checkbox" checked={d.is_active} onChange={(e) => setD({ ...d, is_active: e.target.checked })} className="rounded border-gray-300" /> Active</label>}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={onClose} className="px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-900">Cancel</button>
                <button type="button" onClick={submit} disabled={busy} className="px-3.5 py-1.5 rounded-lg bg-gray-900 text-white text-[12px] font-semibold hover:bg-black disabled:opacity-50">{editing ? "Save" : "Add form"}</button>
            </div>
        </Modal>
    );
}

// ── small shared bits ──────────────────────────────────────────────────────
const inp = "px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[12.5px] focus:outline-none focus:border-gray-400";

function Field({ label, children }) {
    return <div className="flex flex-col gap-1"><span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400">{label}</span>{children}</div>;
}

function Badge({ tone = "gray", icon, children }) {
    const map = {
        gray: "bg-gray-50 text-gray-600 border-gray-200",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
        amber: "bg-amber-50 text-amber-700 border-amber-200",
        rose: "bg-rose-50 text-rose-700 border-rose-200",
        blue: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${map[tone]}`}>{icon}{children}</span>;
}

function Modal({ title, children, onClose, wide = false }) {
    if (typeof document === "undefined") return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true" onClick={onClose}>
            <div className={`bg-white rounded-2xl shadow-2xl w-full my-10 ${wide ? "max-w-2xl" : "max-w-md"}`} onClick={(e) => e.stopPropagation()}>
                <header className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-bold text-gray-900">{title}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
                </header>
                <div className="px-5 py-4">{children}</div>
            </div>
        </div>
    );
}
