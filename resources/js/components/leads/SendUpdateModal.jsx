import { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { X, Send, Mail, Paperclip } from "lucide-react";

const fmtSize = (bytes) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

const inp = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300";

/**
 * "Send application update" — lets staff email a lead using one of their
 * department's (or a shared) message templates, filling {{status}} and
 * {{status_detail}}. Templates are fetched for the acting user on open; the
 * send POSTs to /leads/{id}/send-message and flashes a toast on return.
 */
export default function SendUpdateModal({ leadId, leadEmail, open, onClose }) {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [templateId, setTemplateId] = useState("");
    const [status, setStatus] = useState("");
    const [statusDetail, setStatusDetail] = useState("");
    const [files, setFiles] = useState([]);
    const [sending, setSending] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        window.axios
            .get("/lead-message/templates")
            .then((r) => {
                const list = r.data || [];
                setTemplates(list);
                setTemplateId(list.length ? String(list[0].id) : "");
            })
            .catch(() => setTemplates([]))
            .finally(() => setLoading(false));
    }, [open]);

    if (!open) return null;

    const selected = templates.find((t) => String(t.id) === String(templateId));

    const addFiles = (e) => {
        const picked = Array.from(e.target.files || []);
        // Cap at 5 total, dedupe by name+size.
        setFiles((prev) => {
            const merged = [...prev];
            picked.forEach((f) => {
                if (!merged.some((m) => m.name === f.name && m.size === f.size)) merged.push(f);
            });
            return merged.slice(0, 5);
        });
        if (fileRef.current) fileRef.current.value = "";
    };

    const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

    const submit = (e) => {
        e.preventDefault();
        if (!templateId) return;
        setSending(true);
        router.post(
            `/leads/${leadId}/send-message`,
            { template_id: templateId, status, status_detail: statusDetail, attachments: files },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => { onClose(); setStatus(""); setStatusDetail(""); setFiles([]); },
                onFinish: () => setSending(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><Mail size={18} /> Send application update</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <form onSubmit={submit} className="p-6 space-y-4">
                    <p className="text-sm text-gray-500">
                        Emails {leadEmail ? <strong className="text-gray-700">{leadEmail}</strong> : "the lead"} using one of your department's templates.
                    </p>
                    {!leadEmail && <p className="text-xs text-rose-600">This lead has no email address on file.</p>}

                    <label className="block">
                        <span className="block text-xs font-semibold text-gray-600 mb-1">Template</span>
                        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={inp} disabled={loading || !templates.length}>
                            {loading && <option>Loading…</option>}
                            {!loading && !templates.length && <option value="">No active email templates available</option>}
                            {templates.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}{t.department ? "" : " · shared"}</option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="block text-xs font-semibold text-gray-600 mb-1">Status <span className="text-gray-400 font-normal">— fills {"{{status}}"}</span></span>
                        <input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="e.g. Under Review" className={inp} />
                    </label>

                    <label className="block">
                        <span className="block text-xs font-semibold text-gray-600 mb-1">Details <span className="text-gray-400 font-normal">— fills {"{{status_detail}}"}</span></span>
                        <textarea value={statusDetail} onChange={(e) => setStatusDetail(e.target.value)} rows={3} placeholder="Optional note to the lead…" className={inp} />
                    </label>

                    <div>
                        <span className="block text-xs font-semibold text-gray-600 mb-1">Attachments <span className="text-gray-400 font-normal">— optional, up to 5</span></span>
                        <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                            <Paperclip size={15} /> Attach files
                        </button>
                        <input
                            ref={fileRef}
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp"
                            onChange={addFiles}
                            className="hidden"
                        />
                        {files.length > 0 && (
                            <ul className="mt-2 space-y-1.5">
                                {files.map((f, i) => (
                                    <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
                                        <span className="truncate text-gray-700">{f.name} <span className="text-gray-400">· {fmtSize(f.size)}</span></span>
                                        <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-rose-600 shrink-0"><X size={14} /></button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="text-[11px] text-gray-400 mt-1">PDF, Office docs, or images · max 10 MB each.</p>
                    </div>

                    {selected?.channels?.includes("sms") && (
                        <p className="text-[11px] text-amber-600">SMS is text-only — attachments are sent with the email, not the SMS.</p>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl">Cancel</button>
                        <button type="submit" disabled={sending || !templateId || !leadEmail} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">
                            <Send size={15} /> {sending ? "Sending…" : "Send update"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
