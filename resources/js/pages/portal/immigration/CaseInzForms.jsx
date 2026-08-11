import { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    FileCheck2, Sparkles, Send, Search, CheckCircle2, AlertTriangle, Clock, Plus, X, ExternalLink, Eye,
} from "lucide-react";

// Case → INZ Forms register. A table of every case × the INZ forms its visa
// category offers, with status and per-row actions. The "Generate INZ Form"
// button opens a guided picker: choose the case, category and form type, then
// generate the official draft or send it to the client to fill.

const SELECT = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688] bg-white";

export default function CaseInzForms({ rows = [], cases = [], categories = [], formsByCategory = {} }) {
    const [q, setQ] = useState("");
    const [modal, setModal] = useState(false);

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return rows;
        return rows.filter((r) =>
            [r.case_name, r.lead_id, r.code, r.name, r.category].filter(Boolean).some((v) => String(v).toLowerCase().includes(t)),
        );
    }, [rows, q]);

    const generate = (leadId, code) =>
        router.post(`/portal/immigration/cases/${leadId}/inz-forms/${code}/generate`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success(`${code} generated — see the case's Documents`),
            onError: (e) => toast.error(Object.values(e)[0] || "Could not generate"),
        });

    const sendToClient = (leadId, code) =>
        router.post(`/portal/immigration/cases/${leadId}/inz-forms/${code}/assign`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success(`${code} sent to the client to fill`),
            onError: (e) => toast.error(Object.values(e)[0] || "Could not send"),
        });

    return (
        <div className="max-w-[1150px] mx-auto pb-12 space-y-5">
            <Head title="INZ Forms — Cases" />

            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">INZ Forms</h1>
                    <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                        Generate the official INZ draft from case data, or send a form to the client to fill.
                        Drafts land in the case's Documents — never auto-filed.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#009688] text-white text-sm font-semibold hover:bg-[#00796b] shadow-sm flex-shrink-0"
                >
                    <Plus size={16} /> Generate INZ Form
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search case, form, category…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#009688] focus:ring-1 focus:ring-[#009688]"
                />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-sm">
                        <thead>
                            <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 bg-gray-50/60">
                                <th className="px-4 py-3">Case</th>
                                <th className="px-4 py-3">INZ Form</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Version</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center">
                                        <FileCheck2 size={26} className="mx-auto text-gray-300" />
                                        <p className="mt-3 text-sm text-gray-700 font-semibold">Nothing here yet</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Cases appear once they have a visa type whose category has INZ forms.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={`${r.case_id}-${r.code}`} className="hover:bg-gray-50/60">
                                        <td className="px-4 py-3">
                                            <Link href={`/portal/immigration/cases/${r.case_id}?tab=inz_forms`} className="group inline-flex items-center gap-1.5">
                                                <span className="font-semibold text-gray-900 group-hover:text-[#009688]">{r.case_name}</span>
                                                <ExternalLink size={12} className="text-gray-300 group-hover:text-[#009688]" />
                                            </Link>
                                            <div className="text-[11px] text-gray-400">{r.lead_id}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-900">{r.code}</div>
                                            <div className="text-[12px] text-gray-500 truncate max-w-[220px]">{r.name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{r.category || "—"}</td>
                                        <td className="px-4 py-3">
                                            {r.version
                                                ? <span className="text-[11px] font-semibold text-gray-500 border border-gray-200 rounded px-1.5 py-0.5">{r.version}</span>
                                                : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadges r={r} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {r.generated_document_id && (
                                                    <a
                                                        href={`/admin/documents/${r.generated_document_id}/download?inline=1`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="View the generated draft PDF"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-[11px] font-semibold hover:bg-gray-50"
                                                    >
                                                        <Eye size={12} /> View
                                                    </a>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => generate(r.case_id, r.code)}
                                                    disabled={!r.ready}
                                                    title={r.assignment_status === "submitted" ? "Fill the official PDF from the client's answers" : "Fill the official PDF from this case"}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <Sparkles size={12} /> {r.assignment_status === "submitted" ? "From answers" : "Generate"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => sendToClient(r.case_id, r.code)}
                                                    disabled={!r.ready}
                                                    title={r.ready ? "Send to the client to fill in their portal" : "Upload the official PDF in Setup → INZ Forms first"}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#009688]/30 text-[#009688] text-[11px] font-semibold hover:bg-[#009688]/5 disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <Send size={12} /> {r.assignment_status ? "Re-send" : "Send"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <GenerateModal
                    cases={cases}
                    categories={categories}
                    formsByCategory={formsByCategory}
                    onClose={() => setModal(false)}
                    onGenerate={generate}
                    onSend={sendToClient}
                />
            )}
        </div>
    );
}

function StatusBadges({ r }) {
    const genDate = r.generated_at
        ? new Date(r.generated_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })
        : null;
    return (
        <div className="flex items-center gap-1 flex-wrap">
            {r.generated_document_id && <Badge tone="indigo" icon={<FileCheck2 size={10} />}>Generated{genDate ? ` · ${genDate}` : ""}</Badge>}
            {r.ready
                ? <Badge tone="emerald" icon={<CheckCircle2 size={10} />}>Ready</Badge>
                : <Badge tone="amber" icon={<AlertTriangle size={10} />}>No PDF</Badge>}
            {r.lapsing && <Badge tone="amber" icon={<Clock size={10} />}>Lapsing</Badge>}
            {r.assignment_status === "assigned" && <Badge tone="teal" icon={<Send size={10} />}>Sent</Badge>}
            {r.assignment_status === "submitted" && <Badge tone="teal" icon={<CheckCircle2 size={10} />}>Submitted</Badge>}
            {r.assignment_status === "reviewed" && <Badge tone="gray" icon={<CheckCircle2 size={10} />}>Reviewed</Badge>}
        </div>
    );
}

function GenerateModal({ cases, categories, formsByCategory, onClose, onGenerate, onSend }) {
    const [caseId, setCaseId] = useState("");
    const [category, setCategory] = useState("");
    const [code, setCode] = useState("");

    const forms = useMemo(() => formsByCategory[category] || [], [formsByCategory, category]);
    const selectedForm = useMemo(() => forms.find((f) => f.code === code) || null, [forms, code]);
    const canAct = caseId && code && selectedForm?.ready;

    // Picking a case pre-selects its own category as a helpful default.
    const pickCase = (id) => {
        setCaseId(id);
        const c = cases.find((x) => String(x.id) === String(id));
        if (c?.category && categories.includes(c.category)) {
            setCategory(c.category);
            setCode("");
        }
    };

    const run = (fn) => {
        fn(caseId, code);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900">Generate INZ Form</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
                </div>

                <div className="p-5 space-y-4">
                    <Field label="Case">
                        <select value={caseId} onChange={(e) => pickCase(e.target.value)} className={SELECT}>
                            <option value="">Select a case…</option>
                            {cases.map((c) => (
                                <option key={c.id} value={c.id}>{c.name} — {c.lead_id}{c.visa_type ? ` · ${c.visa_type}` : ""}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Category">
                        <select value={category} onChange={(e) => { setCategory(e.target.value); setCode(""); }} className={SELECT}>
                            <option value="">Select a category…</option>
                            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </Field>

                    <Field label="INZ Form type">
                        <select value={code} onChange={(e) => setCode(e.target.value)} disabled={!category} className={`${SELECT} disabled:bg-gray-50 disabled:text-gray-400`}>
                            <option value="">{category ? "Select a form…" : "Pick a category first"}</option>
                            {forms.map((f) => (
                                <option key={f.code} value={f.code}>{f.code} — {f.name}{f.ready ? "" : " (no PDF yet)"}</option>
                            ))}
                        </select>
                    </Field>

                    {selectedForm && !selectedForm.ready && (
                        <p className="text-[12px] text-amber-600 flex items-center gap-1.5">
                            <AlertTriangle size={13} /> No official PDF uploaded for this form yet — add it in Setup → INZ Forms.
                        </p>
                    )}
                </div>

                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button
                        type="button"
                        onClick={() => run(onSend)}
                        disabled={!canAct}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#009688]/30 text-[#009688] text-sm font-semibold hover:bg-[#009688]/5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Send size={14} /> Send to client
                    </button>
                    <button
                        type="button"
                        onClick={() => run(onGenerate)}
                        disabled={!canAct}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Sparkles size={14} /> Generate draft
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</span>
            {children}
        </label>
    );
}

function Badge({ tone = "gray", icon, children }) {
    const map = {
        gray: "bg-gray-50 text-gray-600 border-gray-200",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
        amber: "bg-amber-50 text-amber-700 border-amber-200",
        teal: "bg-[#009688]/10 text-[#009688] border-[#009688]/30",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    };
    return <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${map[tone]}`}>{icon}{children}</span>;
}
