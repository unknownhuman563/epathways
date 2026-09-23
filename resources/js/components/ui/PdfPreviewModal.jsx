import { X, Download } from "lucide-react";

// Lightweight modal that previews a PDF (or image) in an iframe. Pass the inline
// URL (e.g. .../download?inline=1). Closes on backdrop click or the X.
export default function PdfPreviewModal({ open, onClose, url, title = "Preview", downloadUrl }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <h3 className="truncate text-sm font-bold text-gray-900">{title}</h3>
                    <div className="flex items-center gap-1.5">
                        {downloadUrl && (
                            <a href={downloadUrl} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                                <Download size={13} /> Download
                            </a>
                        )}
                        <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"><X size={18} /></button>
                    </div>
                </div>
                <iframe title={title} src={url} className="w-full flex-1" />
            </div>
        </div>
    );
}
