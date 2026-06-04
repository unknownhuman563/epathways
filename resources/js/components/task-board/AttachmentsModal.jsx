import { useEffect } from "react";
import {
    X, Paperclip, Eye, Download, FileText, FileImage, Film, Music,
} from "lucide-react";

// Lightweight modal listing every file attached to a task. Opens when the
// thumbnail on a TaskCard is clicked. Each row exposes both View (opens in
// a new tab) and Save (downloads with the original filename).

function fmtBytes(b) {
    if (! b && b !== 0) return "";
    if (b < 1024)        return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIconFor(mime) {
    if (! mime) return <FileText size={18} />;
    if (mime.startsWith("image/")) return <FileImage size={18} />;
    if (mime.startsWith("video/")) return <Film size={18} />;
    if (mime.startsWith("audio/")) return <Music size={18} />;
    return <FileText size={18} />;
}

export default function AttachmentsModal({ open, onClose, task }) {
    useEffect(() => {
        if (! open) return;
        const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (! open || ! task) return null;

    const attachments = task.attachments || [];

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-6"
            onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        >
            <div
                className="bg-white w-full max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-0.5 inline-flex items-center gap-1.5">
                            <Paperclip size={11} /> Attachments · {attachments.length}
                        </p>
                        <h2 className="text-base font-bold text-gray-900 truncate">{task.title}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 flex-shrink-0"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {attachments.length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-500">
                            No attachments on this task yet.
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {attachments.map((a) => (
                                <AttachmentRow key={a.id} attachment={a} />
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function AttachmentRow({ attachment }) {
    const isImage = !! attachment.is_image;
    const name    = attachment.original_filename || "attachment";
    const size    = fmtBytes(attachment.size);

    return (
        <li className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5 hover:border-gray-300 transition-colors">
            {/* Preview / icon tile */}
            {isImage ? (
                <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 hover:opacity-90"
                    title={name}
                >
                    <img src={attachment.url} alt={name} className="w-full h-full object-cover" />
                </a>
            ) : (
                <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                    {fileIconFor(attachment.mime_type)}
                </div>
            )}

            {/* Meta */}
            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-gray-900 truncate" title={name}>
                    {name}
                </p>
                <p className="text-[11px] text-gray-500 tabular-nums">
                    {size}
                    {attachment.mime_type && (
                        <span className="ml-2 text-gray-400">{attachment.mime_type}</span>
                    )}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-100"
                    title="View in a new tab"
                >
                    <Eye size={12} /> View
                </a>
                <a
                    href={attachment.url}
                    download={name}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider text-white bg-gray-900 hover:bg-gray-800"
                    title="Download"
                >
                    <Download size={12} /> Download
                </a>
            </div>
        </li>
    );
}
