import { useState, useEffect } from "react";
import { X, Mail, Eye, Send, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { getJson, postJson } from "@/lib/http";

const inp = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-gray-400";

/**
 * Bulk email modal launched from the leads list. Pick a template or write a
 * custom personalised message, preview the first few, then send. Gray/white
 * theme; talks to /portal/sales/leads/bulk-email/{preview,send}.
 */
export default function BulkEmailModal({ open, onClose, leadIds = [] }) {
    const [templates, setTemplates] = useState([]);
    const [templateId, setTemplateId] = useState(""); // "" = custom
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [previews, setPreviews] = useState(null);
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open) return;
        setPreviews(null); setResult(null); setError(null);
        getJson("/api/message-templates").then(({ data }) => {
            setTemplates((data || []).filter((t) => (t.channels || []).includes("email")));
        });
    }, [open]);

    if (!open) return null;

    const payload = () => ({
        lead_ids: leadIds,
        ...(templateId ? { template_id: Number(templateId) } : { subject, body }),
    });

    const valid = templateId || (subject.trim() && body.trim());

    const doPreview = async () => {
        setBusy(true); setError(null); setResult(null);
        const { ok, data } = await postJson("/portal/sales/leads/bulk-email/preview", payload());
        setBusy(false);
        if (!ok) { setError(data?.message || "Could not build preview."); return; }
        setPreviews(data);
    };

    const doSend = async () => {
        setBusy(true); setError(null);
        const { ok, data } = await postJson("/portal/sales/leads/bulk-email/send", payload());
        setBusy(false);
        if (!ok) { setError(data?.message || "Send failed."); return; }
        setResult(data);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onMouseDown={onClose}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center"><Mail size={16} /></span>
                        <h2 className="text-base font-bold text-gray-900">Email {leadIds.length} selected lead{leadIds.length === 1 ? "" : "s"}</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
                </div>

                {result ? (
                    <div className="p-6 text-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-gray-900">Sent to {result.sent} lead{result.sent === 1 ? "" : "s"}</p>
                        {result.failed > 0 && <p className="text-sm text-rose-600 mt-1">{result.failed} failed</p>}
                        <p className="text-[11px] text-gray-400 mt-2">Messages are queued for delivery. Check the lead's Communications tab for status.</p>
                        <button onClick={onClose} className="mt-5 px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black">Done</button>
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        <label className="block">
                            <span className="block text-xs font-semibold text-gray-600 mb-1">Template</span>
                            <select value={templateId} onChange={(e) => { setTemplateId(e.target.value); setPreviews(null); }} className={inp}>
                                <option value="">Custom message…</option>
                                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </label>

                        {!templateId && (
                            <>
                                <label className="block">
                                    <span className="block text-xs font-semibold text-gray-600 mb-1">Subject</span>
                                    <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Your application update" className={inp} />
                                </label>
                                <label className="block">
                                    <span className="block text-xs font-semibold text-gray-600 mb-1">Message</span>
                                    <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Hi {{first_name}}, …" className={inp} />
                                    <span className="text-[11px] text-gray-400 mt-1 block">Personalise with {`{{first_name}}`}, {`{{client_portal_url}}`}, {`{{tracker_url}}`}.</span>
                                </label>
                            </>
                        )}

                        {error && <p className="text-xs text-rose-600 flex items-center gap-1.5"><AlertTriangle size={13} /> {error}</p>}

                        {previews && (
                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-3">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                                    Preview · showing {previews.preview_count} of {previews.total_count}
                                </p>
                                {previews.previews.map((p) => (
                                    <div key={p.lead_id} className="bg-white rounded-lg border border-gray-100 p-3">
                                        <p className="text-[11px] text-gray-400">{p.lead_name} · {p.email || "no email"}</p>
                                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{p.rendered_subject || "(no subject)"}</p>
                                        <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap line-clamp-4">{p.rendered_body}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                            <button onClick={doPreview} disabled={!valid || busy} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 inline-flex items-center gap-2">
                                {busy && !result ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />} Preview
                            </button>
                            <button onClick={doSend} disabled={!valid || busy} className="px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-black disabled:opacity-40 inline-flex items-center gap-2">
                                {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send to {leadIds.length}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
