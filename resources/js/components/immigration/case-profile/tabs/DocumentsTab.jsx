import { FileText, Info } from "lucide-react";

// Phase 1 placeholder. Phase 2 builds the full checklist + status grid via
// CaseChecklistService. For now this lists every LeadDocument on the case
// and shows the raw visa-type checklist for reference.

const STATUS_TONE = {
    Submitted:   "bg-yellow-50 text-yellow-700 border-yellow-200",
    UnderReview: "bg-blue-50 text-blue-700 border-blue-200",
    Approved:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected:    "bg-red-50 text-red-700 border-red-200",
    StaffShared: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function DocumentsTab({ documents = [], checklist = { items: [] } }) {
    return (
        <div className="space-y-5">
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-50 border border-amber-100">
                <Info size={15} className="text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                    <p className="font-semibold">Phase 1 placeholder.</p>
                    <p className="mt-0.5 text-amber-800">
                        Full visa-type checklist + per-document status grid lands in Phase 2 (CaseChecklistService).
                        For now: uploaded documents below, raw checklist on the right.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                        Documents on file ({documents.length})
                    </h3>
                    {documents.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No documents uploaded yet.</p>
                    ) : (
                        <ul className="space-y-1.5">
                            {documents.map((d) => (
                                <li key={d.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-gray-100 bg-white">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <FileText size={14} className="text-gray-400 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{d.original_name}</p>
                                            <p className="text-[10.5px] text-gray-400 mt-0.5">
                                                {d.checklist_key ? <span className="font-mono">{d.checklist_key}</span> : "no checklist key"}
                                                {" · "}
                                                {formatDate(d.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${STATUS_TONE[d.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                                        {d.status || "—"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <aside>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                        Checklist ({(checklist.items || []).length})
                    </h3>
                    <p className="text-[10.5px] text-gray-400 mb-2">
                        Source: <span className="font-semibold">{checklist.source || "none"}</span>
                        {checklist.visa && <> · {checklist.visa}</>}
                    </p>
                    {(checklist.items || []).length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No checklist configured for this visa type.</p>
                    ) : (
                        <ul className="space-y-1">
                            {(checklist.items || []).map((item, i) => (
                                <li key={item.key || i} className="text-xs text-gray-700 px-2.5 py-1.5 rounded-md bg-gray-50">
                                    {item.label || item.key}
                                    {item.required && <span className="ml-1.5 text-red-500">*</span>}
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>
            </div>
        </div>
    );
}

const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—";
