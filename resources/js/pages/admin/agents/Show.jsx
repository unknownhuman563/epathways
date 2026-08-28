import { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft, Mail, Phone, MapPin, Users, FileSignature, Download, Eye,
    Wand2, X, Loader, Plus, FileText, RefreshCw, UsersRound,
} from "lucide-react";

export default function AgentShow({
    agent = {},
    leads = [],
    leadsCount = 0,
    agreement = null,
    agreementFieldGroups = [],
    agreementDefaults = {},
    previewBase = "",
}) {
    const [modalOpen, setModalOpen] = useState(false);

    // Same rule as the Sales agent-leads screen: everything not closed out.
    const inPipeline = leads.filter((l) => l.status !== "Closed" && l.status !== "Not Qualified").length;

    const initials = (name = "") =>
        (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("") || "?";

    const fmtDate = (iso) => iso
        ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", year: "numeric" })
        : "—";
    const fmtSize = (b) => (! b ? "—" : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`);

    const stageChip = (s) => {
        if (! s) return "bg-gray-100 text-gray-500 border-gray-200";
        if (/new/i.test(s)) return "bg-rose-50 text-rose-700 border-rose-200";
        if (/qualified/i.test(s)) return "bg-amber-50 text-amber-700 border-amber-200";
        if (/consultation/i.test(s)) return "bg-purple-50 text-purple-700 border-purple-200";
        if (/proposal|endorsed/i.test(s)) return "bg-teal-50 text-teal-700 border-teal-200";
        return "bg-gray-100 text-gray-600 border-gray-200";
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <Head title={`${agent.name} — Agent`} />

            <Link href="/admin/agents" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
                <ArrowLeft size={15} /> Back to Agents
            </Link>

            {/* Agent header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4 flex-wrap">
                <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-gray-900 text-white text-lg font-bold shrink-0">
                    {agent.avatar_url ? <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" /> : initials(agent.name)}
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400">Agent</p>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{agent.name}</h1>
                    <div className="flex items-center gap-4 flex-wrap text-[13px] text-gray-500 mt-1">
                        {agent.email && <span className="inline-flex items-center gap-1.5"><Mail size={13} /> {agent.email}</span>}
                        {agent.phone && <span className="inline-flex items-center gap-1.5"><Phone size={13} /> {agent.phone}</span>}
                        {agent.location && <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {agent.location}</span>}
                        {agent.referral_code && <span className="font-mono text-gray-400">{agent.referral_code}</span>}
                    </div>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <UsersRound size={20} />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Leads recruited</div>
                        <div className="text-3xl font-black text-gray-900 tabular-nums leading-none mt-1">{leadsCount}</div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Users size={20} />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">In pipeline</div>
                        <div className="text-3xl font-black text-gray-900 tabular-nums leading-none mt-1">{inPipeline}</div>
                    </div>
                </div>
            </div>

            {/* Agreement section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <FileSignature size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Referral Agent Agreement</h2>
                            <p className="text-[12px] text-gray-500 mt-0.5">
                                {agreement
                                    ? `Generated ${fmtDate(agreement.created_at)} · ${fmtSize(agreement.size)}`
                                    : "No agreement on file yet."}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {agreement && (
                            <>
                                <a href={agreement.download_url} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-[12px] font-semibold hover:bg-gray-50">
                                    <Download size={14} /> Download
                                </a>
                                <button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-[12px] font-semibold hover:bg-gray-50">
                                    <RefreshCw size={14} /> Regenerate
                                </button>
                            </>
                        )}
                        {! agreement && (
                            <button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-bold hover:bg-black transition-colors">
                                <Wand2 size={14} /> Generate agreement
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Leads */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Leads recruited</h3>
                </div>
                {leads.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 text-sm">No leads recruited yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-3">Lead</th>
                                    <th className="px-3 py-3">Stage</th>
                                    <th className="px-3 py-3">Contact</th>
                                    <th className="px-3 py-3">Location</th>
                                    <th className="px-3 py-3">Added</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {leads.map((l) => (
                                    <tr key={l.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="font-semibold text-gray-900">{l.name}</div>
                                            <div className="text-[10px] text-gray-400 font-mono">{l.lead_id}</div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${stageChip(l.status)}`}>
                                                {l.status || "—"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="text-gray-600 truncate max-w-[200px]">{l.email || "—"}</div>
                                            <div className="text-gray-500">{l.phone || "—"}</div>
                                        </td>
                                        <td className="px-3 py-3 text-gray-600">{l.location || "—"}</td>
                                        <td className="px-3 py-3 whitespace-nowrap text-gray-600">{fmtDate(l.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalOpen && (
                <AgreementModal
                    agentId={agent.id}
                    fieldGroups={agreementFieldGroups}
                    defaults={agreementDefaults}
                    previewBase={previewBase}
                    isRegenerate={!! agreement}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
}

// ── Generate / edit agreement modal ──────────────────────────────────
function AgreementModal({ agentId, fieldGroups, defaults, previewBase, isRegenerate, onClose }) {
    const [fields, setFields] = useState(() => ({ ...defaults }));
    const [previewFields, setPreviewFields] = useState(() => ({ ...defaults }));
    const [previewLoading, setPreviewLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const timer = useRef(null);

    const setField = (key, val) => setFields((f) => ({ ...f, [key]: val }));

    // Debounce the preview so it refreshes ~half a second after typing stops.
    useEffect(() => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setPreviewFields({ ...fields }), 500);
        return () => clearTimeout(timer.current);
    }, [fields]);

    const previewUrl = useMemo(() => {
        const params = new URLSearchParams();
        Object.entries(previewFields).forEach(([k, v]) => params.set(k, v ?? ""));
        return `${previewBase}?${params.toString()}`;
    }, [previewFields, previewBase]);

    useEffect(() => { setPreviewLoading(true); }, [previewUrl]);

    const submit = () => {
        setSubmitting(true);
        router.post(`/admin/agents/${agentId}/agreement/generate`, fields, {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[1400px] h-[94vh] flex flex-col overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                            <FileSignature size={16} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-bold text-gray-900 leading-tight">{isRegenerate ? "Regenerate" : "Generate"} agreement</h3>
                            <p className="text-[11px] text-gray-500 mt-0.5">Fill the editable fields — blanks show a grey guide in the document. Preview updates as you type.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X size={18} /></button>
                </div>

                <div className="flex-1 flex min-h-0">
                    {/* Fields */}
                    <div className="w-[420px] border-r border-gray-100 overflow-y-auto p-5 space-y-5 shrink-0">
                        {fieldGroups.map((group) => (
                            <div key={group.group}>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">{group.group}</p>
                                <div className="space-y-2.5">
                                    {group.fields.map((f) => (
                                        <label key={f.key} className="block">
                                            <span className="block text-[11px] font-semibold text-gray-600 mb-1">{f.label}</span>
                                            {f.type === "textarea" ? (
                                                <textarea
                                                    rows={2}
                                                    value={fields[f.key] ?? ""}
                                                    onChange={(e) => setField(f.key, e.target.value)}
                                                    placeholder={f.placeholder}
                                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={fields[f.key] ?? ""}
                                                    onChange={(e) => setField(f.key, e.target.value)}
                                                    placeholder={f.placeholder}
                                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                                                />
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Preview */}
                    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
                        <div className="px-4 py-2.5 border-b border-gray-100 bg-white flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Preview</span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900 text-white text-[11px] font-semibold">
                                <FileText size={11} /> Referral Agent Agreement
                            </span>
                        </div>
                        <div className="flex-1 relative min-h-0">
                            <iframe
                                key={previewUrl}
                                src={previewUrl}
                                title="Agreement preview"
                                sandbox="allow-same-origin"
                                onLoad={() => setPreviewLoading(false)}
                                className="absolute inset-0 w-full h-full bg-white"
                            />
                            {previewLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-sm z-10">
                                    <Loader size={22} className="animate-spin text-gray-500" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-white">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={submit}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black disabled:opacity-60 transition-colors"
                    >
                        {submitting ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
                        {isRegenerate ? "Regenerate PDF" : "Generate PDF"}
                    </button>
                </div>
            </div>
        </div>
    );
}
