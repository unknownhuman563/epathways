import { Head } from "@inertiajs/react";
import { FileSignature, Download, Eye, FileText, Clock } from "lucide-react";

// Agent-facing view of their own Referral Agent Agreement. Read-only — staff
// generate it from the Agents module; the agent just views/downloads it here.
export default function AgentAgreement({ agreement = null }) {
    const fmtDate = (iso) => iso
        ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", year: "numeric" })
        : "—";
    const fmtSize = (b) => (! b ? "—" : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`);

    return (
        <div className="space-y-6 max-w-3xl">
            <Head title="My Agreement" />

            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Agreement</h1>
                <p className="text-sm text-gray-500 mt-1">Your Referral Agent Agreement with ePathways.</p>
            </div>

            {agreement ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <FileSignature size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-bold text-gray-900">Referral Agent Agreement</h2>
                            <p className="text-[12px] text-gray-500 mt-0.5">
                                Prepared {fmtDate(agreement.created_at)} · {fmtSize(agreement.size)}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <a
                                href={agreement.download_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-[12px] font-semibold hover:bg-gray-50"
                            >
                                <Eye size={14} /> View
                            </a>
                            <a
                                href={agreement.download_url}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-bold hover:bg-black transition-colors"
                            >
                                <Download size={14} /> Download
                            </a>
                        </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-start gap-2 text-[12px] text-gray-500">
                        <FileText size={14} className="mt-0.5 shrink-0 text-gray-400" />
                        <span>This is the current version of your agreement. If anything needs updating, contact the ePathways team.</span>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
                        <Clock size={24} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">No agreement yet</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        Your Referral Agent Agreement hasn&rsquo;t been prepared yet. The ePathways team will generate it and it will appear here for you to view and download.
                    </p>
                </div>
            )}
        </div>
    );
}
