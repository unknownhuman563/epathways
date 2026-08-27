import { useMemo, useState, useEffect, useRef } from "react";
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import RichTextEditor from "@/components/templates/RichTextEditor";
import { FilePlus, FileText, Trash2, Search, Layers, ArrowRight, X, Eye, Pencil } from "lucide-react";

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—");
const relTime = (iso) => {
    if (!iso) return "—";
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
    if (s < 86400) { const h = Math.round(s / 3600); return `${h} hour${h === 1 ? "" : "s"} ago`; }
    const d = Math.floor(s / 86400);
    if (d === 1) return "Yesterday";
    if (d < 7) return `${d} days ago`;
    return fmtDate(iso);
};
const STATE = {
    draft: ["Draft", "bg-gray-100 text-gray-500"],
    edited: ["Edited on case", "bg-violet-50 text-violet-700"],
    awaiting_signature: ["Awaiting signature", "bg-amber-50 text-amber-700"],
    signed: ["Signed", "bg-emerald-50 text-emerald-700"],
    needs_manager: ["Needs manager", "bg-rose-50 text-rose-700"],
};

// Merge variables staff can drop into a document; filled per case on apply.
const VAR_GROUPS = [
    ["Client", ["client.full_name", "client.first_name", "client.email", "client.nationality", "client.passport_no"]],
    ["Case", ["case.reference", "case.visa_type", "case.fee_total", "case.inz_fee", "case.fee_instalments", "case.lodged_on"]],
    ["Adviser & firm", ["adviser.full_name", "adviser.licence", "firm.name", "firm.address", "today"]],
];
const SAMPLE = {
    "client.full_name": "Aroha Ngata", "client.first_name": "Aroha", "client.email": "aroha@example.com", "client.nationality": "New Zealand", "client.passport_no": "PA1234567",
    "case.reference": "IMM-0001", "case.visa_type": "Accredited Employer Work Visa", "case.fee_total": "$3,450.00", "case.inz_fee": "$750.00", "case.fee_instalments": "3", "case.lodged_on": "12 Aug 2026",
    "adviser.full_name": "Hendry Dai", "adviser.licence": "201100888", "firm.name": "ePathways", "firm.address": "Auckland, NZ", "today": fmtDate(new Date().toISOString()),
};
const fillPreview = (html) => String(html || "").replace(/\{([a-z0-9_.]+)\}/gi, (m, k) => (SAMPLE[k] !== undefined ? SAMPLE[k] : m));

export default function ClientDocuments({ cases = [], formats = [], usages = [], visaOptions = [] }) {
    const [tab, setTab] = useState("formats");

    // Selected format + editing buffer (lifted so the header Save can act on it).
    const [selId, setSelId] = useState(formats[0]?.id ?? null);
    const sel = formats.find((f) => f.id === selId) || null;
    const [name, setName] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("client_facing");
    const [visaTypes, setVisaTypes] = useState([]);
    const [status, setStatus] = useState("draft");
    const [dirty, setDirty] = useState(false);
    const [preview, setPreview] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const editorRef = useRef(null);
    const selectTop = useRef(false);

    useEffect(() => {
        setName(sel?.name || ""); setContent(sel?.content || ""); setCategory(sel?.category || "client_facing");
        setVisaTypes(sel?.visa_types || []); setStatus(sel?.status || "draft"); setDirty(false); setPreview(false);
        // eslint-disable-next-line
    }, [selId]);
    useEffect(() => { if (selectTop.current && formats[0]) { setSelId(formats[0].id); selectTop.current = false; } }, [formats]);

    const newFormat = () => { selectTop.current = true; router.post("/admin/document-formats", { name: "Untitled document", content: "", category: "client_facing", status: "draft" }, { preserveScroll: true, only: ["formats"] }); };
    const save = () => { if (!sel) return; router.post(`/admin/document-formats/${sel.id}`, { name, content, category, visa_types: visaTypes, status }, { preserveScroll: true, only: ["formats"], onSuccess: () => setDirty(false), onError: () => toast.error("Could not save") }); };
    const del = () => { if (!sel || !window.confirm(`Delete “${sel.name}”? This removes it from every case using it.`)) return; router.delete(`/admin/document-formats/${sel.id}`, { preserveScroll: true, only: ["formats"], onSuccess: () => setSelId(null) }); };
    const insertVar = (token) => {
        const ed = editorRef.current;
        if (ed) ed.chain().focus().insertContent(`{${token}}`).run();
        else { setContent((c) => `${c} {${token}}`); setDirty(true); }
    };
    const toggleVisa = (v) => setVisaTypes((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

    const grouped = useMemo(() => ({
        client_facing: formats.filter((f) => f.category !== "internal"),
        internal: formats.filter((f) => f.category === "internal"),
    }), [formats]);

    return (
        <>
            <Head title="Client Documents" />
            <div className="max-w-[1400px] mx-auto pb-12">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-600">Settings · Templates</p>
                        <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Client documents</h1>
                        <p className="text-[13.5px] text-gray-500 mt-1 max-w-[58ch]">Write a document once with variables in it. Apply it to a case and the values fill themselves in — you can still edit that case's copy.</p>
                    </div>
                    {tab === "formats" && sel && (
                        <div className="flex items-center gap-3">
                            <span className={`text-[12.5px] font-medium ${dirty ? "text-amber-600" : "text-gray-400"}`}>{dirty ? "Unsaved changes" : "All changes saved"}</span>
                            <button type="button" onClick={save} disabled={!dirty}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-[13.5px] font-semibold hover:bg-violet-700 disabled:opacity-50">Save template</button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 flex gap-1 mb-5">
                    {[["formats", "File formats", formats.length], ["cases", "Case documents", usages.length]].map(([v, t, n]) => (
                        <button key={v} type="button" onClick={() => setTab(v)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold border-b-2 -mb-px ${tab === v ? "border-violet-600 text-violet-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
                            {t}<span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${tab === v ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-400"}`}>{n}</span>
                        </button>
                    ))}
                </div>

                {tab === "cases" ? <CaseDocs formats={formats} usages={usages} cases={cases} /> : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
                        {/* ── Left rail: format list ── */}
                        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-3 border-b border-gray-100 space-y-2">
                                <button type="button" onClick={newFormat} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800"><FilePlus size={15} /> New format</button>
                            </div>
                            <div className="max-h-[64vh] overflow-y-auto py-1">
                                {[["Client facing", grouped.client_facing], ["Internal", grouped.internal]].map(([label, list]) => (
                                    list.length > 0 && (
                                        <div key={label}>
                                            <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{label}</p>
                                            {list.map((f) => (
                                                <button key={f.id} type="button" onClick={() => setSelId(f.id)}
                                                    className={`w-full text-left px-3 py-2.5 ${f.id === selId ? "bg-violet-50" : "hover:bg-gray-50"}`}>
                                                    <p className={`text-[13px] font-semibold truncate ${f.id === selId ? "text-violet-800" : "text-gray-800"}`}>{f.name}</p>
                                                    <p className="text-[10.5px] text-gray-400">{f.uses_count ? `${f.uses_count} case${f.uses_count === 1 ? "" : "s"}` : "not applied"} · {fmtDate(f.updated_at)}</p>
                                                    {f.status !== "live" && <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">Draft · not live</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )
                                ))}
                                {formats.length === 0 && <p className="px-4 py-6 text-center text-[12.5px] text-gray-400">No formats yet.</p>}
                            </div>
                        </div>

                        {/* ── Center: editor ── */}
                        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden min-h-[70vh]">
                            {!sel ? (
                                <div className="px-6 py-24 text-center"><Layers size={34} className="text-gray-300 mx-auto" /><p className="text-[14px] font-semibold text-gray-700 mt-3">Pick a format to edit</p></div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                                        <input value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }} className="flex-1 text-[15px] font-semibold text-gray-900 outline-none" placeholder="Document name" />
                                        <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${status === "live" ? "bg-teal-50 text-teal-700" : "bg-gray-100 text-gray-500"}`}>{status === "live" ? "Live" : "Draft"}</span>
                                        <button type="button" onClick={() => setPreview((p) => !p)} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-violet-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-violet-400">
                                            {preview ? <><Pencil size={13} /> Edit</> : <><Eye size={13} /> Preview with real values</>}
                                        </button>
                                    </div>
                                    <div className="p-4 bg-gray-50 min-h-[60vh]">
                                        {preview ? (
                                            <div className="tiptap-body max-w-[600px] mx-auto bg-white rounded shadow-sm px-8 py-6 text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: fillPreview(content) }} />
                                        ) : (
                                            <RichTextEditor value={content} onChange={(html) => { setContent(html); setDirty(true); }} onReady={(ed) => { editorRef.current = ed; }} />
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* ── Right rail: variables, where it applies, in use ── */}
                        {sel && (
                            <div className="lg:col-span-1 space-y-4">
                                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Insert a variable</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5 mb-3">Click one to drop it into the document.</p>
                                    {VAR_GROUPS.map(([label, tokens]) => (
                                        <div key={label} className="mb-3 last:mb-0">
                                            <p className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">{label}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {tokens.map((t) => (
                                                    <button key={t} type="button" onClick={() => insertVar(t)} disabled={preview}
                                                        className="font-mono text-[10.5px] px-1.5 py-1 rounded border border-violet-100 bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-40">{`{${t}}`}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Where it applies</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5 mb-2.5">Offered on cases matching these visa types (blank = all).</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {visaTypes.map((v) => (
                                            <span key={v} className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 text-gray-700 rounded-full pl-2.5 pr-1.5 py-1">
                                                {v}<button type="button" onClick={() => { toggleVisa(v); setDirty(true); }} className="text-gray-400 hover:text-rose-600"><X size={11} /></button>
                                            </span>
                                        ))}
                                        <VisaAdder options={visaOptions} chosen={visaTypes} onAdd={(v) => { toggleVisa(v); setDirty(true); }} />
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <label className="text-[12px] text-gray-600 inline-flex items-center gap-1.5">Section
                                            <select value={category} onChange={(e) => { setCategory(e.target.value); setDirty(true); }} className="text-[12px] border border-gray-200 rounded-lg px-2 py-1"><option value="client_facing">Client facing</option><option value="internal">Internal</option></select>
                                        </label>
                                        <label className="text-[12px] text-gray-600 inline-flex items-center gap-1.5">Status
                                            <select value={status} onChange={(e) => { setStatus(e.target.value); setDirty(true); }} className="text-[12px] border border-gray-200 rounded-lg px-2 py-1"><option value="draft">Draft</option><option value="live">Live</option></select>
                                        </label>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">In use</p>
                                    <p className="text-[22px] font-bold text-gray-900 mt-1 leading-none">{sel.uses_count} <span className="text-[12px] font-medium text-gray-400">live cop{sel.uses_count === 1 ? "y" : "ies"} on cases</span></p>
                                    <p className="text-[11px] text-gray-400 mt-1">Live copies aren't changed when you edit this format.</p>
                                    <div className="flex items-center gap-2 mt-3">
                                        <button type="button" onClick={del} className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-2"><Trash2 size={15} /></button>
                                        <button type="button" onClick={() => setAssignOpen(true)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800"><Layers size={14} /> Apply to cases…</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {assignOpen && sel && <AssignModal formats={[sel]} initialFormatId={sel.id} cases={cases} onClose={() => setAssignOpen(false)} />}
        </>
    );
}

function VisaAdder({ options = [], chosen = [], onAdd }) {
    const [open, setOpen] = useState(false);
    const avail = options.filter((o) => !chosen.includes(o));
    return (
        <span className="relative">
            <button type="button" onClick={() => setOpen((o) => !o)} className="text-[11px] font-semibold text-violet-700 border border-dashed border-violet-200 rounded-full px-2.5 py-1 hover:border-violet-400">+ Visa type</button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute z-50 mt-1 left-0 w-56 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl py-1">
                        {avail.length === 0 && <p className="px-3 py-2 text-[12px] text-gray-400">All added.</p>}
                        {avail.map((o) => (
                            <button key={o} type="button" onClick={() => { onAdd(o); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-[12.5px] text-gray-700 hover:bg-gray-50">{o}</button>
                        ))}
                    </div>
                </>
            )}
        </span>
    );
}

// ── Tab 2: Case documents (usage) ────────────────────────────────────────────
function CaseDocs({ formats, usages, cases }) {
    const [assignOpen, setAssignOpen] = useState(false);
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? usages.filter((u) => (u.format_name + " " + u.case_name).toLowerCase().includes(q)) : usages;
    }, [usages, query]);
    const remove = (id) => router.delete(`/admin/document-format-uses/${id}`, { preserveScroll: true, only: ["usages", "formats"] });

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-[15px] font-bold text-gray-900">Documents on cases <span className="text-[12.5px] font-normal text-gray-400 ml-1">· generated from a format, then edited per case</span></h2>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="text-[13px] pl-8 pr-3 py-2 border border-gray-200 rounded-lg w-[180px] focus:outline-none focus:border-gray-400" />
                    </div>
                    <button type="button" onClick={() => setAssignOpen(true)} disabled={formats.length === 0} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800 disabled:opacity-50"><Layers size={15} /> Apply a format</button>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="px-6 py-16 text-center"><FileText size={34} className="text-gray-300 mx-auto" /><p className="text-[14px] font-semibold text-gray-700 mt-3">No documents applied yet</p><p className="text-[12.5px] text-gray-400 mt-1">Use <b>Apply a format</b> to add a document to one or more cases.</p></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[720px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">
                                    <th className="px-5 py-3">Case</th>
                                    <th className="px-3 py-3">Document</th>
                                    <th className="px-3 py-3">State</th>
                                    <th className="px-3 py-3">Updated</th>
                                    <th className="px-3 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((u) => {
                                    const [label, tone] = STATE[u.state] || STATE.edited;
                                    return (
                                        <tr key={u.id} className="group hover:bg-gray-50/60">
                                            <td className="px-5 py-3.5"><p className="text-[13.5px] font-semibold text-gray-900">{u.case_name}</p>{u.case_ref && <p className="text-[10.5px] text-gray-400 font-mono">{u.case_ref}</p>}</td>
                                            <td className="px-3 py-3.5 text-[13px] text-gray-700">{u.format_name}</td>
                                            <td className="px-3 py-3.5"><span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${tone}`}>{label}</span></td>
                                            <td className="px-3 py-3.5 text-[12.5px] text-gray-400">{relTime(u.updated_at)}</td>
                                            <td className="px-3 py-3.5 text-right"><button type="button" onClick={() => remove(u.id)} title="Remove" className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md p-1.5 transition-opacity"><Trash2 size={14} /></button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {assignOpen && <AssignModal formats={formats} cases={cases} onClose={() => setAssignOpen(false)} />}
        </div>
    );
}

function AssignModal({ formats = [], cases = [], initialFormatId = null, onClose }) {
    const [formatId, setFormatId] = useState(initialFormatId ?? formats[0]?.id ?? "");
    const fmt = formats.find((f) => String(f.id) === String(formatId));
    const [content, setContent] = useState(fmt?.content || "");
    const [picked, setPicked] = useState([]);
    const [caseSearch, setCaseSearch] = useState("");
    const [saving, setSaving] = useState(false);
    useEffect(() => { setContent(fmt?.content || ""); /* eslint-disable-next-line */ }, [formatId]);

    const filteredCases = useMemo(() => {
        const q = caseSearch.trim().toLowerCase();
        return (q ? cases.filter((c) => (c.name + " " + (c.lead_id || "")).toLowerCase().includes(q)) : cases).slice(0, 100);
    }, [cases, caseSearch]);
    const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    const apply = () => {
        if (!formatId) return toast.error("Pick a format");
        if (!picked.length) return toast.error("Select at least one case");
        setSaving(true);
        router.post(`/admin/document-formats/${formatId}/apply`, { lead_ids: picked, content }, { preserveScroll: true, only: ["usages", "formats"], onSuccess: () => onClose(), onError: (e) => toast.error(Object.values(e)[0] || "Could not apply"), onFinish: () => setSaving(false) });
    };

    return (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-[96vw] max-w-[1050px] h-[86vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100"><h2 className="text-[15px] font-bold text-gray-900">Apply a document to cases</h2><button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button></div>
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
                    <div className="lg:w-[340px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col min-h-0">
                        <div className="p-3 border-b border-gray-100"><label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Document format</label><select value={formatId} onChange={(e) => setFormatId(e.target.value)} className="w-full text-[13px] px-2.5 py-2 border border-gray-200 rounded-lg bg-white">{formats.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
                        <div className="p-3 flex items-center justify-between"><label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Apply to cases</label><span className="text-[11px] text-violet-700 font-semibold">{picked.length} selected</span></div>
                        <div className="px-3"><div className="relative mb-2"><Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" /><input value={caseSearch} onChange={(e) => setCaseSearch(e.target.value)} placeholder="Search cases…" className="w-full text-[12.5px] pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400" /></div></div>
                        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-0.5">
                            {filteredCases.map((c) => (
                                <label key={c.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c.id)} className="rounded border-gray-300 text-violet-600" /><div className="min-w-0"><p className="text-[12.5px] font-medium text-gray-800 truncate">{c.name}</p><p className="text-[10px] text-gray-400 font-mono">{c.lead_id}{c.inz_visa_type ? ` · ${c.inz_visa_type}` : ""}</p></div></label>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 flex flex-col">
                        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2 text-[11px] text-gray-400"><ArrowRight size={13} /> Edit the copy that will be applied to the selected case(s)</div>
                        <div className="flex-1 min-h-0 overflow-y-auto p-4"><RichTextEditor value={content} onChange={setContent} /></div>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100"><button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">Cancel</button><button type="button" onClick={apply} disabled={saving} className="px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50">{saving ? "Applying…" : `Apply to ${picked.length || ""} case${picked.length === 1 ? "" : "s"}`}</button></div>
            </div>
        </div>
    );
}
