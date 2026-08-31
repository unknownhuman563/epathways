import { Download, X, FileText } from "lucide-react";

// Simple PDF viewer modal — embeds an inline PDF URL in an iframe. The URL
// must be served with Content-Disposition: inline (our /agreement/view routes).
export default function PdfViewerModal({ url, title = "Document", downloadUrl = null, onClose }) {
    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
                        <FileText size={16} /> {title}
                    </h3>
                    <div className="flex items-center gap-2">
                        {downloadUrl && (
                            <a href={downloadUrl} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-[12px] font-semibold hover:bg-gray-50">
                                <Download size={13} /> Download
                            </a>
                        )}
                        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X size={18} /></button>
                    </div>
                </div>
                <div className="flex-1 min-h-0 bg-gray-100">
                    <iframe src={url} title={title} className="w-full h-full border-0" />
                </div>
            </div>
        </div>
    );
}
