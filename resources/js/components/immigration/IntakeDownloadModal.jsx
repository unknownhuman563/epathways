import { useEffect } from "react";
import { X, FileText, FileType2, Download } from "lucide-react";

/**
 * Preview-then-download modal for a Visa Information Form. Shows an inline
 * HTML preview of the intake (server-rendered) and offers PDF or Word export.
 *
 * Props: open, onClose, type ('work'|'student'|'visitor'), id, applicant.
 */
export default function IntakeDownloadModal({ open, onClose, type, id, applicant }) {
    useEffect(() => {
        if (! open) return;
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (! open) return null;

    const base = `/portal/immigration/intakes/${type}/${id}`;

    return (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#1F4E79] text-white flex items-center justify-center flex-shrink-0">
                            <FileText size={17} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 truncate">Visa Information Form</h3>
                            <p className="text-[11px] text-gray-500 truncate">{applicant || "Applicant"} · preview</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center flex-shrink-0"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Preview */}
                <div className="flex-1 bg-gray-100 overflow-hidden">
                    <iframe
                        src={`${base}/preview`}
                        title="Visa Information Form preview"
                        className="w-full h-full border-0 bg-white"
                    />
                </div>

                {/* Footer actions */}
                <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-end gap-2.5">
                    <a
                        href={`${base}/word`}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <FileType2 size={15} /> Download Word
                    </a>
                    <a
                        href={`${base}/pdf`}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1F4E79] text-white text-sm font-bold hover:bg-[#173a5c] transition-colors"
                    >
                        <Download size={15} /> Download PDF
                    </a>
                </div>
            </div>
        </div>
    );
}
