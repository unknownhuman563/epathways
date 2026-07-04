import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    FileText, Download, Upload, Eye, Check, Loader2,
    Send, X as XIcon, AlertCircle,
} from "lucide-react";

// Documents tab — table view that joins the visa-type checklist with
// uploaded LeadDocuments by checklist_key. Each row is a required (or
// optional) document slot; if a file has been uploaded it shows here
// inline with a view link, status dropdown, and editable notes.
//
// Uses the existing endpoints:
//   POST /admin/leads/{lead}/documents/{doc}/status   — status + note update
//   GET  /admin/documents/{doc}/download              — staff download
//
// Orphan documents (uploaded with a checklist_key that doesn't match the
// current visa-type checklist, or with no key at all) are folded under
// an "Other" group at the bottom so nothing is hidden.

const STATUS_OPTIONS = [
    { value: "Submitted",   label: "Submitted" },
    { value: "UnderReview", label: "Under review" },
    { value: "Approved",    label: "Approved" },
    { value: "Rejected",    label: "Rejected" },
];

const STATUS_TONE = {
    Submitted:   "bg-yellow-50 text-yellow-700 border-yellow-200",
    UnderReview: "bg-blue-50 text-blue-700 border-blue-200",
    Approved:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected:    "bg-red-50 text-red-700 border-red-200",
    StaffShared: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function DocumentsTab({
    lead,
    documents = [],
    checklist = { items: [] },
    checklistProgress = { required_total: 0, required_approved: 0, total: 0, approved: 0 },
}) {
    // Build a checklist-keyed map of uploaded documents (latest wins per key).
    // Orphans (no matching checklist entry) get collected separately.
    const items = checklist.items || [];
    const knownKeys = new Set(items.map((i) => i.key));

    const docsByKey = useMemo(() => {
        const map = new Map();
        for (const d of documents) {
            const key = d.checklist_key;
            if (! key) continue;
            const existing = map.get(key);
            if (! existing || new Date(d.created_at) > new Date(existing.created_at)) {
                map.set(key, d);
            }
        }
        return map;
    }, [documents]);

    const orphans = useMemo(
        () => documents.filter((d) => ! d.checklist_key || ! knownKeys.has(d.checklist_key)),
        [documents, knownKeys],
    );

    const rows = items.map((item) => {
        const rawLabel = item.label || item.key;
        // Seed labels are stored as "Category · Document name" — split on
        // the middle dot so the table can show a clean two-line cell with
        // the category as the small subtitle.
        const split = typeof rawLabel === "string" ? rawLabel.split(" · ") : [rawLabel];
        const hasCategoryPrefix = split.length > 1;
        return {
            kind:     "checklist",
            key:      item.key,
            label:    hasCategoryPrefix ? split.slice(1).join(" · ") : rawLabel,
            category: item.category || (hasCategoryPrefix ? split[0] : categoryFromKey(item.key)) || "Other",
            required: !! item.required,
            hidden:   !! item.hidden,
            document: docsByKey.get(item.key) || null,
        };
    });

    const orphanRows = orphans.map((d) => ({
        kind:     "orphan",
        key:      `orphan-${d.id}`,
        label:    d.original_name,
        category: "Other (no checklist match)",
        required: false,
        document: d,
    }));

    const allRows = [...rows, ...orphanRows];
    const totals = useMemo(() => {
        const total = allRows.length;
        const approved = allRows.filter((r) => r.document?.status === "Approved").length;
        return { total, approved };
    }, [allRows]);

    // Group rows by category into ordered sections (Applicant → Financial →
    // Sponsor → Other), preserving the checklist order. First appearance of a
    // category fixes its position, so the seeded order drives the layout.
    const groupedRows = [];
    const groupIndex = new Map();
    for (const row of allRows) {
        const category = row.category || "Other";
        if (! groupIndex.has(category)) {
            groupIndex.set(category, groupedRows.length);
            groupedRows.push([category, []]);
        }
        groupedRows[groupIndex.get(category)][1].push(row);
    }

    if (allRows.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <FileText size={32} className="mx-auto text-gray-300" />
                <p className="mt-3 text-sm font-semibold text-gray-700">
                    No checklist configured for this visa type
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    {checklist.visa
                        ? `Source: ${checklist.source} · ${checklist.visa}`
                        : "No documents on file and no checklist available."}
                </p>
            </div>
        );
    }

    // Progress count uses REQUIRED items only — optional items don't move
    // the needle on "case ready for submission" (per Phase 4 spec).
    // Falls back to all-items when no required flags are set.
    const reqTotal    = checklistProgress.required_total ?? 0;
    const reqApproved = checklistProgress.required_approved ?? 0;
    const pct = reqTotal > 0 ? Math.round((reqApproved / reqTotal) * 100) : 0;

    return (
        <div className="space-y-4">
            <div className="flex items-end justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                    <h2 className="text-base font-bold text-gray-900">Documents</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {checklist.visa || "All uploads"}
                        {reqTotal > 0 && (
                            <> · <span className="font-semibold text-gray-700">{reqApproved} of {reqTotal}</span> required documents approved</>
                        )}
                        {reqTotal === 0 && totals.total > 0 && (
                            <> · {totals.approved} of {totals.total} approved</>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {documents.length > 0 && (
                        <a
                            href={`/admin/leads/${lead.id}/documents/download-all`}
                            title="Download every uploaded document as a single ZIP"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-gray-900 text-white hover:bg-black transition-colors"
                        >
                            <Download size={12} /> Download all (ZIP)
                        </a>
                    )}
                    <p className="text-[10.5px] text-gray-400">
                        Source: <span className="font-semibold">{checklist.source || "none"}</span>
                    </p>
                </div>
            </div>

            {reqTotal > 0 && (
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gray-900 transition-[width] duration-500"
                        style={{ width: `${Math.min(100, pct)}%` }}
                    />
                </div>
            )}

            <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[10.5px] font-bold uppercase tracking-wider text-gray-500">
                                <th className="text-left px-4 py-2.5 w-[36%]">Document</th>
                                <th className="text-left px-4 py-2.5 w-[24%]">Attachment</th>
                                <th className="text-left px-4 py-2.5 w-[18%]">Status</th>
                                <th className="text-left px-4 py-2.5 w-[22%]">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedRows.map(([category, groupRows]) => {
                                const approved = groupRows.filter((r) => r.document?.status === "Approved").length;
                                const checklistRows = groupRows.filter((r) => r.kind === "checklist");
                                return (
                                    <Fragment key={category}>
                                        <tr className="bg-gray-200 border-y border-gray-300">
                                            <td colSpan={4} className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    {checklistRows.length > 0 && (
                                                        <SectionSelectAll leadId={lead.id} rows={checklistRows} />
                                                    )}
                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                                                        {category}
                                                    </span>
                                                    <span className="text-[10.5px] font-semibold text-gray-500">
                                                        {approved}/{groupRows.length}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        {groupRows.map((row) => (
                                            <Row key={row.key} row={row} leadId={lead.id} />
                                        ))}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function Row({ row, leadId }) {
    const doc = row.document;
    const [status, setStatus] = useState(doc?.status || "");
    const [note, setNote] = useState(doc?.note || "");
    const [savingStatus, setSavingStatus] = useState(false);
    const [savingNote, setSavingNote] = useState(false);
    const [savedNote, setSavedNote] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);

    const persist = (nextStatus, nextNote, kind) => {
        if (! doc) return;
        const isStatus = kind === "status";
        if (isStatus) setSavingStatus(true); else setSavingNote(true);

        router.post(
            `/admin/leads/${leadId}/documents/${doc.id}/status`,
            { status: nextStatus, note: nextNote },
            {
                preserveScroll: true,
                preserveState: true,
                only: ["documents"],
                onSuccess: () => {
                    if (isStatus) toast.success("Status updated");
                    else { setSavedNote(true); setTimeout(() => setSavedNote(false), 1500); }
                },
                onError: (errs) => {
                    toast.error(Object.values(errs)[0] || "Update failed");
                    if (isStatus) setStatus(doc.status || "");
                    else setNote(doc.note || "");
                },
                onFinish: () => {
                    if (isStatus) setSavingStatus(false); else setSavingNote(false);
                },
            },
        );
    };

    const onStatusChange = (e) => {
        const next = e.target.value;
        // Rejection must carry an explanation — divert through a modal that
        // requires the note before posting. A silent rejection is worse than
        // none. (Phase 4 spec: "Reject requires reviewer notes".)
        if (next === "Rejected") {
            setRejectOpen(true);
            // Don't optimistically update the select — modal will dispatch.
            e.target.value = status || doc.status || "";
            return;
        }
        setStatus(next);
        persist(next, note, "status");
    };

    const confirmReject = (reason) => {
        setStatus("Rejected");
        setNote(reason);
        setRejectOpen(false);
        // Single POST updates both status + note so the audit trail is atomic.
        persist("Rejected", reason, "status");
    };

    const onNoteBlur = () => {
        if (! doc) return;
        if ((note || "") === (doc.note || "")) return;
        persist(status || doc.status, note, "note");
    };

    return (
        <tr className="border-b border-gray-50 last:border-b-0 align-top">
            {/* Document slot. For checklist rows the leading icon is a
                tracker-visibility checkbox (checked = shown on the applicant's
                tracking link, unchecked = hidden). Orphan rows keep the file
                icon since they aren't part of the checklist. */}
            <td className="px-4 py-3">
                <div className="flex items-start gap-2">
                    {row.kind === "checklist" ? (
                        <TrackVisibilityCheckbox
                            leadId={leadId}
                            checklistKey={row.key}
                            hidden={row.hidden}
                        />
                    ) : (
                        <FileText size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 leading-tight">
                            {row.label}
                            {row.required && <span className="ml-1 text-red-500">*</span>}
                        </p>
                        {doc && (
                            <p className="text-[10.5px] text-gray-400 mt-0.5">
                                uploaded {formatDate(doc.created_at)}
                            </p>
                        )}
                    </div>
                </div>
            </td>

            {/* Attachment column — filename + View + Download for uploaded;
                Upload button (opens file picker) for empty slots. */}
            <td className="px-4 py-3">
                {doc ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-gray-700 max-w-[160px] truncate" title={doc.original_name}>
                            {doc.original_name}
                        </span>
                        <a
                            href={`/admin/documents/${doc.id}/download?inline=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View in browser"
                            className="inline-flex items-center justify-center p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        >
                            <Eye size={12} />
                        </a>
                        <a
                            href={`/admin/documents/${doc.id}/download`}
                            title="Download"
                            className="inline-flex items-center justify-center p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        >
                            <Download size={12} />
                        </a>
                        {row.kind === "checklist" && (
                            <UploadSlot
                                leadId={leadId}
                                checklistKey={row.key}
                                label="Replace"
                            />
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <UploadSlot
                            leadId={leadId}
                            checklistKey={row.key}
                            label="Upload"
                            empty
                        />
                        {row.kind === "checklist" && (
                            <RequestFromClient
                                leadId={leadId}
                                rowLabel={row.label}
                                rowRequired={row.required}
                            />
                        )}
                    </div>
                )}
            </td>

            {/* Status dropdown — disabled when nothing's been uploaded yet */}
            <td className="px-4 py-3">
                {doc ? (
                    <div className="flex items-center gap-1.5">
                        <select
                            value={status || ""}
                            onChange={onStatusChange}
                            disabled={savingStatus}
                            className={`text-[11px] font-semibold px-2 py-1 rounded-md border focus:outline-none focus:ring-0 disabled:opacity-50 ${STATUS_TONE[status] || "bg-gray-50 text-gray-700 border-gray-200"}`}
                        >
                            {STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value} className="bg-white text-gray-900">{o.label}</option>
                            ))}
                        </select>
                        {savingStatus && <span className="text-[10px] text-gray-400">Saving…</span>}
                    </div>
                ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-gray-50 text-gray-500 border-gray-200">
                        Not submitted
                    </span>
                )}
            </td>

            {/* Notes — inline-editable, saves on blur */}
            <td className="px-4 py-3">
                {doc ? (
                    <div className="relative">
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            onBlur={onNoteBlur}
                            placeholder="Add a note…"
                            maxLength={500}
                            className="w-full text-[12px] px-2 py-1 rounded-md border border-gray-200 bg-white focus:outline-none focus:border-gray-400 disabled:opacity-50"
                            disabled={savingNote}
                        />
                        {savedNote && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center text-emerald-600">
                                <Check size={11} />
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-[11px] text-gray-300">—</span>
                )}
            </td>
            {rejectOpen && (
                <RejectModal
                    rowLabel={row.label}
                    initialNote={note}
                    onClose={() => setRejectOpen(false)}
                    onConfirm={confirmReject}
                />
            )}
        </tr>
    );
}

/**
 * Per-item toggle controlling whether this checklist item shows on the
 * applicant's public tracking link. Posts to the staff endpoint and
 * partial-reloads the checklist so the flag reflects the saved state.
 */
function TrackVisibilityCheckbox({ leadId, checklistKey, hidden }) {
    // Optimistic local state so the box flips instantly; falls back to the
    // server value once the partial reload lands (or reverts on error).
    const [optimistic, setOptimistic] = useState(null);
    const shown = optimistic ?? ! hidden;

    const onChange = (e) => {
        const nextShown = e.target.checked;
        setOptimistic(nextShown);
        router.post(
            `/admin/leads/${leadId}/documents/track-visibility`,
            { checklist_keys: [checklistKey], hidden: ! nextShown },
            {
                preserveScroll: true,
                preserveState: true,
                only: ["checklist"],
                onSuccess: () => toast.success(nextShown ? "Shown on tracker" : "Hidden from tracker"),
                onError: () => { setOptimistic(null); toast.error("Could not update visibility"); },
                onFinish: () => setOptimistic(null),
            },
        );
    };

    return (
        <input
            type="checkbox"
            checked={shown}
            onChange={onChange}
            title={shown
                ? "Shown on the applicant's tracker — uncheck to hide"
                : "Hidden from the applicant's tracker — check to show"}
            className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-0 w-3.5 h-3.5 flex-shrink-0 cursor-pointer"
        />
    );
}

/**
 * Section-level "select all" — shows/hides every checklist item in a
 * category at once. Checked = all shown; indeterminate when only some are.
 */
function SectionSelectAll({ leadId, rows }) {
    const ref = useRef(null);
    // Optimistic override for instant feedback (true = all shown).
    const [optimistic, setOptimistic] = useState(null);
    const shownCount = rows.filter((r) => ! r.hidden).length;
    const allShown = optimistic ?? (rows.length > 0 && shownCount === rows.length);
    const someShown = optimistic == null && shownCount > 0 && shownCount < rows.length;

    useEffect(() => {
        if (ref.current) ref.current.indeterminate = someShown;
    }, [someShown]);

    const onChange = (e) => {
        const nextShown = e.target.checked;
        setOptimistic(nextShown);
        router.post(
            `/admin/leads/${leadId}/documents/track-visibility`,
            { checklist_keys: rows.map((r) => r.key), hidden: ! nextShown },
            {
                preserveScroll: true,
                preserveState: true,
                only: ["checklist"],
                onSuccess: () => toast.success(nextShown ? "Section shown on tracker" : "Section hidden from tracker"),
                onError: () => { setOptimistic(null); toast.error("Could not update visibility"); },
                onFinish: () => setOptimistic(null),
            },
        );
    };

    return (
        <input
            ref={ref}
            type="checkbox"
            checked={allShown}
            onChange={onChange}
            title="Show/hide every item in this section on the applicant's tracker"
            className="rounded border-gray-400 text-emerald-600 focus:ring-0 w-3.5 h-3.5 flex-shrink-0 cursor-pointer"
        />
    );
}

/**
 * Rejection modal — collects the mandatory reviewer note before the
 * status flips to Rejected. A rejected document without a reason on the
 * audit trail is worse than no rejection (consultant can't follow up,
 * client has no actionable feedback). Reason length capped at 500 to
 * match the LeadDocument.note schema column.
 */
function RejectModal({ rowLabel, initialNote = "", onClose, onConfirm }) {
    const [reason, setReason] = useState(initialNote || "");
    const trimmed = reason.trim();
    const isValid = trimmed.length > 0;
    if (typeof document === "undefined") return null;

    return createPortal(
        (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                    <header className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 inline-flex items-center gap-2">
                                <AlertCircle size={14} className="text-red-500" />
                                Reject document
                            </h2>
                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">{rowLabel}</p>
                        </div>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
                            <XIcon size={16} />
                        </button>
                    </header>
                    <div className="px-5 py-4 space-y-2">
                        <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
                            Reason for rejection <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            maxLength={500}
                            placeholder="e.g. Issued more than 6 months ago — please obtain a fresh certificate."
                            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-gray-900 resize-none"
                            autoFocus
                        />
                        <p className="text-[10px] text-gray-400">
                            This note is shown to the client on their tracker so they know what to fix. {trimmed.length}/500
                        </p>
                    </div>
                    <footer className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => isValid && onConfirm(trimmed)}
                            disabled={! isValid}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-gray-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <XIcon size={11} /> Reject document
                        </button>
                    </footer>
                </div>
            </div>
        ),
        document.body,
    );
}

/**
 * Inline upload button bound to a checklist key. Triggers a hidden
 * file input and POSTs multipart to the existing staff-checklist-upload
 * endpoint:
 *   POST /admin/leads/{lead}/documents/checklist/{key}/upload
 *
 * Uses Inertia's router.post so CSRF + partial-prop reload (just
 * `documents`) are both handled automatically. After the upload the
 * row re-renders with the new doc + status dropdown active.
 *
 * `empty`: the slot has no doc yet — render a slightly more prominent
 * primary-style button. Otherwise (replace mode), render as a quiet
 * icon-only secondary button matching the View/Download buttons.
 */
function UploadSlot({ leadId, checklistKey, label = "Upload", empty = false }) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    if (! checklistKey) return null; // orphan rows can't be re-uploaded against a key

    const onPick = () => inputRef.current?.click();

    const onChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setUploading(true);
        router.post(
            `/admin/leads/${leadId}/documents/checklist/${encodeURIComponent(checklistKey)}/upload`,
            { files },
            {
                forceFormData: true,
                preserveScroll: true,
                preserveState: true,
                only: ["documents"],
                onSuccess: () => toast.success(`${files.length} file${files.length === 1 ? "" : "s"} uploaded`),
                onError:   (errs) => toast.error(Object.values(errs)[0] || "Upload failed"),
                onFinish:  () => {
                    setUploading(false);
                    if (inputRef.current) inputRef.current.value = "";
                },
            },
        );
    };

    return (
        <>
            <button
                type="button"
                onClick={onPick}
                disabled={uploading}
                title={empty ? "Upload file for this checklist item" : "Replace with a new file"}
                className={
                    empty
                        ? "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gray-900 text-white hover:bg-black disabled:opacity-50"
                        : "inline-flex items-center justify-center p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                }
            >
                {uploading
                    ? <Loader2 size={empty ? 11 : 12} className="animate-spin" />
                    : <Upload size={empty ? 11 : 12} />}
                {empty && <span>{uploading ? "Uploading…" : label}</span>}
            </button>
            <input
                ref={inputRef}
                type="file"
                multiple
                onChange={onChange}
                className="hidden"
                accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
            />
        </>
    );
}

/**
 * Inline "Request from client" trigger. Opens a small modal that posts
 * to LeadDocumentController::requestStore — that endpoint already handles
 * everything: creates a LeadDocumentRequest, sends the lead an email
 * (via CommunicationService template 'doc_request' with fallback to the
 * legacy Mailable), and the audit trail. We just feed it one item.
 *
 * The checklist label becomes the request's `label`; the consultant's
 * optional message becomes the `description` shown in the email.
 */
function RequestFromClient({ leadId, rowLabel, rowRequired }) {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const send = () => {
        if (submitting) return;
        setSubmitting(true);
        router.post(
            `/admin/leads/${leadId}/documents/requests`,
            {
                items: [{
                    label:       rowLabel,
                    description: message.trim() || null,
                    required:    !! rowRequired,
                }],
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success("Request sent to client");
                    setOpen(false);
                    setMessage("");
                },
                onError: (errs) => toast.error(Object.values(errs)[0] || "Request failed"),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                title={`Email the client a link to upload "${rowLabel}"`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            >
                <Send size={11} /> Request
            </button>
            {open && typeof document !== "undefined" && createPortal(
                (
                    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                            <header className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="text-sm font-bold text-gray-900 inline-flex items-center gap-2">
                                        <Send size={14} className="text-gray-500" /> Request from client
                                    </h2>
                                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{rowLabel}</p>
                                </div>
                                <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700">
                                    <XIcon size={16} />
                                </button>
                            </header>
                            <div className="px-5 py-4 space-y-2">
                                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
                                    Message (optional)
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    maxLength={500}
                                    placeholder="e.g. Please upload the bio page only — not the full passport."
                                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-gray-900 resize-none"
                                    autoFocus
                                />
                                <p className="text-[10px] text-gray-400">
                                    We'll email the client a link to upload this document via their tracker.
                                </p>
                            </div>
                            <footer className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={send}
                                    disabled={submitting}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-gray-900 text-white hover:bg-black disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                                    Send request
                                </button>
                            </footer>
                        </div>
                    </div>
                ),
                document.body,
            )}
        </>
    );
}

// VisaType.checklist_items often use dotted keys like "identity.passport"
// or "admission.tor" — surface the leading segment as a category fallback
// when the JSON doesn't carry an explicit category field.
function categoryFromKey(key) {
    if (! key || typeof key !== "string") return null;
    const parts = key.split(/[.\-:]/);
    if (parts.length < 2) return null;
    return parts[0].replace(/\b\w/g, (c) => c.toUpperCase());
}

const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—";
