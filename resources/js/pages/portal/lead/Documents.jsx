import { useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
    FileText, Upload, Check, AlertTriangle, Clock, Download, Loader, Wand2, Sparkles, Eye,
    Inbox, Share2, Lock, CheckCircle2, ChevronDown, ChevronRight, Send, Copy,
} from "lucide-react";
import { CHECKLIST, SECTION_STATUSES, renderFilename, currentSectionIndex } from "@/data/leadDocumentChecklist";

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

export default function LeadDocumentsPage({
    lead,
    requests = [],
    shared_by_staff = [],
    checklistFiles = {},
    sectionVerifications = {},
}) {
    const currentIdx = currentSectionIndex(sectionVerifications);

    return (
        <div className="space-y-7 max-w-5xl mx-auto pb-12">
            <Head title="My documents" />

            {/* Header */}
            <div>
                <p className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.32em] mb-1.5">
                    Document submission journey
                </p>
                <h1 className="text-2xl sm:text-3xl font-medium text-[#282728] tracking-tight">My documents</h1>
                <p className="text-sm text-gray-500 font-light mt-1.5 max-w-2xl">
                    Submit each section in order. Once your adviser verifies a section, the next one unlocks.
                </p>
            </div>

            {/* Progress strip */}
            <SectionProgressStrip sections={CHECKLIST} verifications={sectionVerifications} currentIdx={currentIdx} />

            {/* Sections */}
            <div className="space-y-4">
                {CHECKLIST.map((section, idx) => {
                    const ver = sectionVerifications[section.key];
                    const verStatus = ver?.status;
                    const state = idx < currentIdx
                        ? 'done'
                        : idx === currentIdx
                            ? (currentIdx >= CHECKLIST.length ? 'done' : 'current')
                            : 'locked';

                    return (
                        <SectionPanel
                            key={section.key}
                            section={section}
                            sectionIndex={idx}
                            state={state}
                            verification={ver}
                            verStatus={verStatus}
                            files={Object.fromEntries(section.items.map(it => [it.id, checklistFiles[it.id] || []]))}
                            lead={lead}
                        />
                    );
                })}
            </div>

            {/* Legacy adviser-requested documents — kept for backwards compat
                until your adviser fully migrates to the section flow. */}
            {requests.length > 0 && (
                <AdviserRequestsPanel requests={requests} />
            )}

            {/* Shared by staff */}
            {shared_by_staff.length > 0 && (
                <SharedByStaffPanel shared={shared_by_staff} />
            )}
        </div>
    );
}

// ── Progress strip ─────────────────────────────────────────────────────────

function SectionProgressStrip({ sections, verifications, currentIdx }) {
    return (
        <section className="bg-white rounded-2xl border border-[#282728]/15 p-5">
            <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={14} className="text-[#436235]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#436235]">
                    Your progress
                </p>
                <span className="ml-auto text-[11px] font-bold text-[#282728]/60 tabular-nums">
                    {Math.min(currentIdx, sections.length)} of {sections.length} verified
                </span>
            </div>

            <ol className="flex flex-wrap gap-2">
                {sections.map((s, i) => {
                    const ver = verifications[s.key];
                    const verStatus = ver?.status;
                    const isDone = i < currentIdx;
                    const isCurrent = i === currentIdx;
                    const isLocked = i > currentIdx;

                    const cls = isDone
                        ? 'bg-[#436235] text-white border-[#436235]'
                        : isCurrent
                            ? 'bg-white text-[#436235] border-[#436235] ring-2 ring-[#436235]/15'
                            : 'bg-gray-50 text-gray-400 border-gray-200';

                    return (
                        <li
                            key={s.key}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${cls}`}
                            title={s.section + (verStatus ? ` — ${SECTION_STATUSES[verStatus].label}` : '')}
                        >
                            {isDone ? (
                                <Check size={11} strokeWidth={3} />
                            ) : isLocked ? (
                                <Lock size={10} />
                            ) : (
                                <span className="w-4 h-4 rounded-full bg-[#436235] text-white text-[9px] flex items-center justify-center">{i + 1}</span>
                            )}
                            <span className="truncate max-w-[160px]">{s.section}</span>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

// ── Section panel ──────────────────────────────────────────────────────────

function SectionPanel({ section, sectionIndex, state, verification, verStatus, files, lead }) {
    const isCurrent = state === 'current';
    const isDone    = state === 'done';
    const isLocked  = state === 'locked';
    const [expanded, setExpanded] = useState(isCurrent);

    const verMeta = verStatus ? SECTION_STATUSES[verStatus] : null;

    // Differentiate items by who provides them. `system: true` items are
    // *staff-sent* (the agreement document is generated and uploaded by
    // Sales/Education, the lead just downloads). All other items are
    // *lead-uploaded*. This drives the row UI and the section CTA.
    const staffSentItems  = section.items.filter((it) => it.system);
    const leadUploadItems = section.items.filter((it) => !it.system);
    const isStaffSent     = staffSentItems.length > 0 && leadUploadItems.length === 0;

    const totalUploaded = Object.values(files).filter(arr => (arr?.length || 0) > 0).length;
    const allFilled = totalUploaded === section.items.length;

    const headerSurface = isCurrent
        ? 'bg-gradient-to-br from-[#436235]/8 to-white border-[#436235]/40'
        : isDone
            ? 'bg-emerald-50/40 border-emerald-200'
            : 'bg-gray-50 border-gray-200 opacity-70';

    return (
        <section className={`rounded-2xl border ${headerSurface}`}>
            <button
                type="button"
                onClick={() => !isLocked && setExpanded((v) => !v)}
                disabled={isLocked}
                className="w-full p-5 sm:p-6 flex items-center gap-4 text-left disabled:cursor-not-allowed"
            >
                {/* Step indicator */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                            ? 'bg-[#436235] text-white ring-4 ring-[#436235]/15'
                            : 'bg-gray-200 text-gray-400'
                }`}>
                    {isDone ? <Check size={18} strokeWidth={3} /> : isLocked ? <Lock size={16} /> : <span className="text-sm font-bold">{sectionIndex + 1}</span>}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-medium text-[#282728] tracking-tight">{section.section}</h3>
                        {verMeta && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${verMeta.chip}`}>
                                {verMeta.label}
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                        {section.items.length} document{section.items.length === 1 ? '' : 's'}
                        {isStaffSent && ' · sent by your adviser'}
                        {!isLocked && !isStaffSent && ` · ${totalUploaded} uploaded`}
                        {isLocked && ' · unlocks after previous section is verified'}
                    </p>
                </div>

                {!isLocked && (
                    <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
                )}
            </button>

            {/* Revisions note from staff */}
            {verStatus === 'revisions_needed' && verification?.notes && (
                <div className="mx-5 sm:mx-6 mb-4 bg-rose-50 border border-rose-200 rounded-xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-700 mb-1">
                        Revisions requested
                    </p>
                    <p className="text-xs text-rose-900 italic leading-relaxed">{verification.notes}</p>
                </div>
            )}

            {/* Items — only render when expanded and unlocked */}
            {!isLocked && expanded && (
                <div className="border-t border-[#282728]/10 p-5 sm:p-6 space-y-3">
                    {section.items.map((item) => (
                        <ChecklistItemRow
                            key={item.id}
                            item={item}
                            files={files[item.id] || []}
                            lead={lead}
                            sectionKey={section.key}
                            readOnly={isDone || verStatus === 'in_review'}
                        />
                    ))}

                    {/* Lead acknowledgment — only on the Agreements section.
                        Lead ticks "I have read and agreed to both agreements"
                        once they've reviewed the generated PDFs above. */}
                    {section.key === 'agreements' && (
                        <AgreementsAcknowledgmentBox lead={lead} />
                    )}

                    {/* CTA — differs for staff-sent vs lead-uploaded sections. */}
                    {isCurrent && verStatus !== 'in_review' && !isStaffSent && (
                        <div className="pt-3 border-t border-[#282728]/10 flex items-center justify-between gap-3 flex-wrap">
                            <p className="text-xs text-gray-500">
                                {allFilled
                                    ? "All documents uploaded. Ready to submit for verification?"
                                    : `Upload remaining ${section.items.length - totalUploaded} document(s) before submitting.`}
                            </p>
                            <SubmitForVerificationButton lead={lead} sectionKey={section.key} disabled={!allFilled} />
                        </div>
                    )}

                    {/* Staff-sent sections — lead acknowledges receipt instead of uploading. */}
                    {isCurrent && verStatus !== 'in_review' && isStaffSent && (
                        <div className="pt-3 border-t border-[#282728]/10 flex items-center justify-between gap-3 flex-wrap">
                            <p className="text-xs text-gray-500">
                                {totalUploaded === section.items.length
                                    ? "Read and acknowledge the documents above to move on."
                                    : "Your adviser will upload the agreement here. You'll be able to download and review it."}
                            </p>
                            <SubmitForVerificationButton
                                lead={lead}
                                sectionKey={section.key}
                                disabled={totalUploaded !== section.items.length}
                                label="Acknowledge & continue"
                            />
                        </div>
                    )}

                    {verStatus === 'in_review' && (
                        <div className="pt-3 border-t border-[#282728]/10 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                            <Clock size={14} />
                            Awaiting your adviser&apos;s review. We&apos;ll notify you when this section is verified.
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

// ── Submit for verification button ─────────────────────────────────────────

function SubmitForVerificationButton({ lead, sectionKey, disabled, label = 'Submit for verification' }) {
    const [submitting, setSubmitting] = useState(false);

    const submit = () => {
        if (!confirm("Submit this section for your adviser to review? You won't be able to add files until they verify or request revisions.")) return;
        setSubmitting(true);
        router.post(`/portal/lead/documents/section/${sectionKey}/submit`, {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <button
            type="button"
            onClick={submit}
            disabled={disabled || submitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#436235] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#385029] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
            <Send size={13} />
            {submitting ? 'Submitting…' : label}
        </button>
    );
}

// ── Checklist item row (lead side) ─────────────────────────────────────────

function ChecklistItemRow({ item, files, lead, sectionKey, readOnly = false }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const filename = renderFilename(item.filename, lead);
    const fileCount = files.length;
    // `system: true` = staff-sent agreement / generated document. Lead
    // only downloads it, never uploads. Hides the upload control and the
    // suggested filename hint (irrelevant — they don't name it).
    const isStaffSent = !!item.system;

    const triggerUpload = () => fileInputRef.current?.click();

    const handleFiles = (e) => {
        const picked = Array.from(e.target.files || []);
        if (picked.length === 0) return;
        const fd = new FormData();
        picked.forEach((f) => fd.append('files[]', f));
        setUploading(true);
        router.post(`/portal/lead/documents/checklist/${item.id}/upload`, fd, {
            preserveScroll: true,
            preserveState: true,
            forceFormData: true,
            onFinish: () => {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const copyFilename = () => filename && navigator.clipboard?.writeText(filename);

    return (
        <div className={`bg-white rounded-xl border ${fileCount > 0 ? 'border-emerald-200' : 'border-gray-200'} p-4 space-y-3`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-[#282728]">{item.name}</p>
                        {isStaffSent && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-[#436235]/10 text-[#436235] border border-[#436235]/20">
                                Sent by adviser
                            </span>
                        )}
                        {fileCount > 0 && !isStaffSent && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700">
                                <Check size={9} strokeWidth={3} />
                                {fileCount} {fileCount === 1 ? 'file' : 'files'}
                            </span>
                        )}
                    </div>
                    {item.description && (
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                    )}
                    {/* Suggested-filename hint only applies when the LEAD is
                        the one naming a file they're about to upload. Skip
                        it for staff-sent items. */}
                    {filename && !isStaffSent && (
                        <button
                            type="button"
                            onClick={copyFilename}
                            className="mt-2 group inline-flex items-center gap-1.5 text-[10px] font-mono text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md px-2 py-1"
                            title="Suggested filename — click to copy"
                        >
                            <span className="truncate">{filename}</span>
                            <Copy size={9} className="text-gray-400 group-hover:text-gray-700" />
                        </button>
                    )}
                </div>

                {/* Upload control — only for lead-uploaded items. */}
                {!readOnly && !isStaffSent && (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFiles}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={triggerUpload}
                            disabled={uploading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#282728] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50"
                        >
                            <Upload size={11} />
                            {uploading ? 'Uploading…' : fileCount > 0 ? 'Add more' : 'Upload'}
                        </button>
                    </>
                )}
            </div>

            {/* Files — uploaded by lead OR sent by staff. */}
            {fileCount > 0 ? (
                <ul className="space-y-1">
                    {files.map((f) => (
                        <li key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-gray-50 border border-gray-200">
                            {f.source === 'generated' ? (
                                <Wand2 size={12} className="text-violet-500 flex-shrink-0" />
                            ) : (
                                <FileText size={12} className={isStaffSent ? 'text-[#436235] flex-shrink-0' : 'text-gray-400 flex-shrink-0'} />
                            )}
                            <a
                                href={`/portal/lead/documents/${f.id}/download?inline=1`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 min-w-0 text-[11px] font-medium text-gray-800 hover:text-[#436235] truncate"
                                title={`View ${f.original_name}`}
                            >
                                {f.original_name}
                            </a>
                            {f.source === 'generated' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-violet-100 text-violet-700 border border-violet-200">
                                    <Sparkles size={9} /> Ready to sign
                                </span>
                            )}
                            <span className="text-[10px] text-gray-400 tabular-nums">{fmtSize(f.size)}</span>
                            <a
                                href={`/portal/lead/documents/${f.id}/download?inline=1`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center w-6 h-6 rounded text-gray-500 hover:text-[#436235] hover:bg-[#436235]/10 transition-colors"
                                title="View"
                            >
                                <Eye size={11} />
                            </a>
                            <a
                                href={`/portal/lead/documents/${f.id}/download`}
                                className="inline-flex items-center justify-center w-6 h-6 rounded text-gray-500 hover:text-[#436235] hover:bg-[#436235]/10 transition-colors"
                                title="Download"
                            >
                                <Download size={11} />
                            </a>
                        </li>
                    ))}
                </ul>
            ) : isStaffSent ? (
                <p className="text-[11px] italic text-gray-400 bg-gray-50 rounded-md px-2 py-2 flex items-center gap-1.5">
                    <Clock size={11} />
                    Your adviser will upload this document here soon.
                </p>
            ) : null}
        </div>
    );
}

// ── Legacy panels (unchanged) ──────────────────────────────────────────────

function AdviserRequestsPanel({ requests }) {
    return (
        <section className="bg-white rounded-2xl border border-[#282728]/15 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#282728]/10 flex items-center gap-2.5">
                <Inbox size={16} className="text-[#436235]" />
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#282728]">Also requested by your adviser</h2>
            </div>
            <ul className="divide-y divide-[#282728]/10">
                {requests.map((r) => {
                    const doc = r.latest_document;
                    const status = doc?.status;
                    const badge = doc ? STATUS_BADGE[status] : null;
                    return (
                        <li key={r.id} className="p-5 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-[#282728]">{r.label}</p>
                                {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                            </div>
                            {badge && (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${badge.chip}`}>
                                    <badge.icon size={11} strokeWidth={2.5} />
                                    {badge.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

function SharedByStaffPanel({ shared }) {
    return (
        <section className="bg-white rounded-2xl border border-[#282728]/15 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#282728]/10 flex items-center gap-2.5">
                <Share2 size={16} className="text-[#436235]" />
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#282728]">Shared by your adviser</h2>
            </div>
            <ul className="divide-y divide-[#282728]/10">
                {shared.map((d) => (
                    <li key={d.id} className="p-5 flex items-center justify-between gap-4">
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
    );
}

// Lead's one-tick acknowledgment that they've read both agreements. POSTs
// to /portal/lead/documents/agreements/acknowledge — server stamps
// agreements_acknowledged_at on the lead row.
function AgreementsAcknowledgmentBox({ lead }) {
    const acknowledgedAt = lead?.agreements_acknowledged_at;
    const isAcknowledged = !!acknowledgedAt;
    const [busy, setBusy] = useState(false);

    const toggle = () => {
        setBusy(true);
        router.post(
            '/portal/lead/documents/agreements/acknowledge',
            { acknowledged: !isAcknowledged },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setBusy(false),
            }
        );
    };

    const formattedDate = acknowledgedAt
        ? new Date(acknowledgedAt).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' })
        : null;

    return (
        <div className={`mt-2 rounded-xl border-2 p-4 transition-colors ${
            isAcknowledged ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-[#436235]/30'
        }`}>
            <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={isAcknowledged}
                    onChange={toggle}
                    disabled={busy}
                    className="mt-0.5 w-5 h-5 rounded border-2 border-[#436235] text-[#436235] focus:ring-2 focus:ring-[#436235]/30 cursor-pointer disabled:opacity-50"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#282728] leading-snug">
                        I have read and agreed to the Consultancy Agreement and English Engagement Agreement terms.
                    </p>
                    {isAcknowledged ? (
                        <p className="text-[11px] text-emerald-700 font-semibold mt-1.5 flex items-center gap-1.5">
                            <Check size={12} strokeWidth={2.5} />
                            Acknowledged on {formattedDate}
                        </p>
                    ) : (
                        <p className="text-[11px] text-gray-600 mt-1.5">
                            Please download and review both agreement PDFs above, then tick this box to confirm you accept the terms.
                        </p>
                    )}
                </div>
            </label>
        </div>
    );
}
