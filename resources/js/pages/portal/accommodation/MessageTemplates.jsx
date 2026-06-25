import { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Copy, ExternalLink, MessageSquareText } from "lucide-react";

const isUrl = (s) => /^https?:\/\//i.test((s || "").trim());

const copyToClipboard = (text) => {
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => toast.success("Copied")).catch(() => toast.error("Could not copy"));
    } else {
        toast.error("Clipboard not available");
    }
};

export default function MessageTemplates({ templates = [] }) {
    const [modal, setModal] = useState(null); // null | { } (new) | template (edit)

    const remove = (t) => {
        if (confirm(`Delete "${t.title}"?`)) {
            router.delete(`/portal/accommodation/message-templates/${t.id}`, { preserveScroll: true });
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <Head title="Message Templates" />

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Chat &amp; Message Format Library</h1>
                    <p className="text-sm text-gray-500">Save the title of each message template and its link or text so the whole team can find them quickly.</p>
                </div>
                <button onClick={() => setModal({})} className="inline-flex items-center gap-2 rounded-full bg-[#1F5A8B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#184A73]">
                    <Plus size={18} /> Add template
                </button>
            </div>

            {templates.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
                    <MessageSquareText className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="font-semibold text-gray-900">No templates yet</p>
                    <p className="text-sm text-gray-500">Add your first message title and its link or text.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-3xl border border-gray-50 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-4 py-4 font-semibold">#</th>
                                <th className="px-4 py-4 font-semibold">Message title</th>
                                <th className="px-4 py-4 font-semibold">Link / Template</th>
                                <th className="px-4 py-4 font-semibold">Notes</th>
                                <th className="px-4 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {templates.map((t, i) => (
                                <tr key={t.id} className="align-top hover:bg-gray-50/50">
                                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{t.title}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-start gap-2">
                                            {isUrl(t.content) ? (
                                                <a href={t.content} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-md items-center gap-1.5 truncate text-[#1F5A8B] hover:underline">
                                                    <ExternalLink size={14} className="shrink-0" /> <span className="truncate">{t.content}</span>
                                                </a>
                                            ) : (
                                                <p className="max-w-md whitespace-pre-wrap break-words text-gray-700 line-clamp-4">{t.content}</p>
                                            )}
                                            <button onClick={() => copyToClipboard(t.content)} title="Copy" className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{t.notes || "—"}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => setModal(t)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900" title="Edit"><Pencil size={16} /></button>
                                            <button onClick={() => remove(t)} className="rounded-lg p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600" title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modal && <TemplateModal template={modal.id ? modal : null} onClose={() => setModal(null)} />}
        </div>
    );
}

const FIELD = "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#1F5A8B] focus:ring-1 focus:ring-[#1F5A8B]";
const LABEL = "block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1";

function TemplateModal({ template, onClose }) {
    const editing = Boolean(template);
    const { data, setData, post, patch, processing, errors } = useForm({
        title: template?.title ?? "",
        content: template?.content ?? "",
        notes: template?.notes ?? "",
    });

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: onClose };
        if (editing) patch(`/portal/accommodation/message-templates/${template.id}`, opts);
        else post("/portal/accommodation/message-templates", opts);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h3 className="text-lg font-bold text-gray-900">{editing ? "Edit template" : "Add template"}</h3>
                    <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                    <div>
                        <label className={LABEL}>Message title</label>
                        <input className={FIELD} value={data.title} onChange={(e) => setData("title", e.target.value)} placeholder="e.g. Client Viewing" />
                        {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
                    </div>
                    <div>
                        <label className={LABEL}>Link / Template</label>
                        <textarea rows={6} className={FIELD} value={data.content} onChange={(e) => setData("content", e.target.value)} placeholder="Paste a link (Google Doc/Drive) or the message text…" />
                        {errors.content && <p className="mt-1 text-xs text-rose-600">{errors.content}</p>}
                    </div>
                    <div>
                        <label className={LABEL}>Notes (optional)</label>
                        <textarea rows={2} className={FIELD} value={data.notes} onChange={(e) => setData("notes", e.target.value)} />
                        {errors.notes && <p className="mt-1 text-xs text-rose-600">{errors.notes}</p>}
                    </div>
                </div>
                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
                    <button type="button" onClick={onClose} className="rounded-full px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                    <button type="submit" disabled={processing} className="rounded-full bg-[#1F5A8B] px-6 py-2 text-sm font-semibold text-white hover:bg-[#184A73] disabled:opacity-50">
                        {processing ? "Saving…" : editing ? "Save" : "Add template"}
                    </button>
                </div>
            </form>
        </div>
    );
}
