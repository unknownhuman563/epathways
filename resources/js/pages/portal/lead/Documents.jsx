import { useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
    FileText, Upload, Check, AlertTriangle, Clock, Download, Loader,
    Inbox, Share2,
} from "lucide-react";

const STATUS_BADGE = {
    Submitted:   { label: "Awaiting review", chip: "bg-blue-50 text-blue-700 border-blue-200",       icon: Clock },
    UnderReview: { label: "Under review",    chip: "bg-amber-50 text-amber-700 border-amber-200",    icon: Loader },
    Approved:    { label: "Approved",        chip: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Check },
    Rejected:    { label: "Needs new file",  chip: "bg-red-50 text-red-700 border-red-200",          icon: AlertTriangle },
    StaffShared: { label: "Shared with you", chip: "bg-gray-50 text-gray-600 border-gray-200",       icon: Share2 },
};

const fmtSize = (b) => {
    if (!b) return "";
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
};
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "";

export default function LeadDocumentsPage({ lead, requests = [], shared_by_staff = [] }) {
    const [uploadingFor, setUploadingFor] = useState(null);

    const handleFile = (e, requestId = null) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("file", file);
        if (requestId) fd.append("request_id", requestId);
        setUploadingFor(requestId ?? "general");
        router.post("/portal/lead/documents/upload", fd, {
            preserveScroll: true,
            forceFormData: true,
            onFinish: () => {
                setUploadingFor(null);
                e.target.value = ""; // reset file input
            },
        });
    };

    const openCount = requests.filter(r => !r.latest_document || r.latest_document.status === "Rejected").length;

    return (
        <div className="space-y-7 max-w-5xl mx-auto pb-12">
            <Head title="My documents" />

            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-medium text-[#282728] tracking-tight">My documents</h1>
                <p className="text-sm text-gray-500 font-light mt-1.5 max-w-2xl">
                    Upload documents your ePathways adviser asks for. We&apos;ll review each one and let you know if anything needs to be re-submitted.
                </p>
            </div>

            {openCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={18} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-amber-900">{openCount} document{openCount > 1 ? "s" : ""} needs your attention.</p>
                        <p className="text-xs text-amber-700 mt-1">Items below show <strong>Upload required</strong> or <strong>Needs new file</strong>.</p>
                    </div>
                </div>
            )}

            {/* Requested by your adviser */}
            <section className="bg-white rounded-2xl border border-[#282728]/15 overflow-hidden">
                <div className="px-6 py-4 border-b border-[#282728]/10 flex items-center gap-2.5">
                    <Inbox size={16} className="text-[#436235]" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#282728]">Requested by your adviser</h2>
                </div>

                {requests.length === 0 ? (
                    <div className="p-14 text-center text-gray-400">
                        <FileText size={28} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">No documents requested yet.</p>
                        <p className="text-xs mt-1">Your adviser will let you know when they need specific files.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-[#282728]/10">
                        {requests.map((r) => {
                            const doc = r.latest_document;
                            const status = doc?.status;
                            const isUploading = uploadingFor === r.id;
                            const needsUpload = !doc || status === "Rejected";
                            const badge = doc ? STATUS_BADGE[status] : null;

                            return (
                                <li key={r.id} className="p-5 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium text-[#282728]">{r.label}</p>
                                                {r.required && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600">REQUIRED</span>
                                                )}
                                            </div>
                                            {r.description && <p className="text-xs text-gray-500 mb-2">{r.description}</p>}
                                            {doc && (
                                                <p className="text-[11px] text-gray-400">
                                                    Last upload: {doc.original_name} {fmtSize(doc.size) && <>· {fmtSize(doc.size)}</>} · {fmtDate(doc.created_at)}
                                                </p>
                                            )}
                                            {status === "Rejected" && doc?.note && (
                                                <p className="text-xs text-red-700 mt-2 bg-red-50 rounded-lg p-2.5">
                                                    <strong>Adviser&apos;s note:</strong> {doc.note}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            {badge && (
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${badge.chip}`}>
                                                    <badge.icon size={11} strokeWidth={2.5} />
                                                    {badge.label}
                                                </span>
                                            )}
                                            {doc && (
                                                <a
                                                    href={`/portal/lead/documents/${doc.id}/download`}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                    title="Download my upload"
                                                >
                                                    <Download size={14} />
                                                </a>
                                            )}
                                            {needsUpload && (
                                                <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#436235] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#385029] active:scale-[0.99] transition-all cursor-pointer">
                                                    {isUploading ? <Loader size={13} className="animate-spin" /> : <Upload size={13} />}
                                                    {status === "Rejected" ? "Re-upload" : "Upload"}
                                                    <input
                                                        type="file"
                                                        onChange={(e) => handleFile(e, r.id)}
                                                        className="hidden"
                                                        disabled={isUploading}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* Shared by staff */}
            {shared_by_staff.length > 0 && (
                <section className="bg-white rounded-2xl border border-[#282728]/15 overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#282728]/10 flex items-center gap-2.5">
                        <Share2 size={16} className="text-[#436235]" />
                        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#282728]">Shared by your adviser</h2>
                    </div>
                    <ul className="divide-y divide-[#282728]/10">
                        {shared_by_staff.map((d) => (
                            <li key={d.id} className="p-5 sm:p-6 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-[#436235]/10 text-[#436235] flex items-center justify-center flex-shrink-0">
                                        <FileText size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[#282728] truncate">{d.original_name}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{fmtSize(d.size)} · {fmtDate(d.created_at)}</p>
                                        {d.note && <p className="text-xs text-gray-600 mt-1.5">{d.note}</p>}
                                    </div>
                                </div>
                                <a
                                    href={`/portal/lead/documents/${d.id}/download`}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#282728] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black active:scale-[0.99] transition-all"
                                >
                                    <Download size={13} />
                                    Download
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
