import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    Sparkles, RefreshCw, AlertTriangle, Info, ShieldCheck, X, Loader2,
    FileText, ListChecks, StickyNote, Mail, Copy, Check, UserRound,
} from "lucide-react";

// AI assessment "adviser pack" for a visa-assessment intake.
// INTERNAL & INDICATIVE, form-fields only (no document OCR). It summarises the
// applicant, flags gaps/inconsistencies and things to verify, lists the standard
// documents for the client's stated visa, and drafts an internal note + a
// status-only client email for the adviser to edit and send.
// It is NOT immigration advice, an eligibility decision, or a pathway
// recommendation (IAA 2007 / immigration AI guardrails §1). The adviser decides.

function csrfHeaders() {
    const xsrf = decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || "");
    const meta = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
    return xsrf ? { "X-XSRF-TOKEN": xsrf, "X-CSRF-TOKEN": meta } : { "X-CSRF-TOKEN": meta };
}

const fmtWhen = (iso) =>
    iso ? new Date(iso).toLocaleString("en-NZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

const SEV = {
    check: { icon: AlertTriangle, chip: "bg-amber-50 text-amber-700 border-amber-200", dot: "text-amber-500" },
    info:  { icon: Info, chip: "bg-gray-50 text-gray-600 border-gray-200", dot: "text-gray-400" },
};

function CopyButton({ text }) {
    const [done, setDone] = useState(false);
    if (! text) return null;
    return (
        <button
            type="button"
            onClick={() => { navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}
            className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-gray-400 hover:text-gray-700"
        >
            {done ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />} {done ? "Copied" : "Copy"}
        </button>
    );
}

function IssueList({ items = [], labelKey }) {
    if (items.length === 0) {
        return <p className="text-[12px] text-emerald-700">Nothing flagged in what the review could read.</p>;
    }
    return (
        <ul className="space-y-2">
            {items.map((o, i) => {
                const sev = SEV[o.severity] || SEV.info;
                const Icon = sev.icon;
                const label = o[labelKey];
                return (
                    <li key={i} className="flex items-start gap-2.5 rounded-lg border border-gray-100 px-3 py-2">
                        <Icon size={14} className={`${sev.dot} mt-0.5 flex-shrink-0`} />
                        <div className="min-w-0">
                            {label && (
                                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border mb-0.5 ${sev.chip}`}>
                                    {label}
                                </span>
                            )}
                            <p className="text-[12.5px] text-gray-800 leading-snug">{o.note}</p>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

function Section({ icon: Icon, title, right, children }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 inline-flex items-center gap-1.5">
                    <Icon size={12} className="text-gray-400" /> {title}
                </h4>
                {right}
            </div>
            {children}
        </div>
    );
}

export default function AiAssessmentReview({ type, id }) {
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState(null);

    const base = `/portal/immigration/assessments/${type}/${id}/ai-review`;

    useEffect(() => {
        let alive = true;
        fetch(base, { credentials: "same-origin", headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } })
            .then((r) => (r.ok ? r.json() : { review: null }))
            .then((d) => { if (alive) setReview(d.review || null); })
            .catch(() => {})
            .finally(() => { if (alive) setFetching(false); });
        return () => { alive = false; };
    }, [base]);

    const run = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(base, {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json", Accept: "application/json", "X-Requested-With": "XMLHttpRequest", ...csrfHeaders() },
            });
            const data = await res.json().catch(() => ({}));
            if (! res.ok) { setError(data.message || "The AI review could not be completed."); return; }
            setReview(data.review || null);
        } catch {
            setError("The AI review could not be completed.");
        } finally {
            setLoading(false);
        }
    }, [base]);

    const email = review?.client_email || {};
    const emailText = email.subject || email.body ? `Subject: ${email.subject || ""}\n\n${email.body || ""}` : "";

    return (
        <div className="rounded-2xl border border-indigo-100 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-indigo-50 flex items-center justify-between gap-2">
                <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-indigo-600 inline-flex items-center gap-2">
                    <Sparkles size={14} /> AI assessment review
                </h3>
                <button type="button" onClick={run} disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 disabled:opacity-50">
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    {review ? "Re-run" : "Run AI review"}
                </button>
            </div>

            <div className="p-5 space-y-5">
                {/* Compliance disclaimer */}
                <div className="flex items-start gap-2 rounded-lg bg-indigo-50/60 border border-indigo-100 px-3 py-2">
                    <ShieldCheck size={13} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-indigo-900/80 leading-snug">
                        Internal &amp; indicative — a work-up to speed the adviser's review.
                        <span className="font-semibold"> Not immigration advice, an eligibility decision, or a visa recommendation.</span> Drafts
                        are for the adviser to edit and send. The licensed adviser decides.
                    </p>
                </div>

                {loading && (
                    <p className="text-[12px] text-gray-500 inline-flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Reviewing the intake…</p>
                )}
                {fetching ? (
                    <p className="text-[12px] text-gray-400">Loading…</p>
                ) : error ? (
                    <p className="text-[12px] text-rose-600">{error}</p>
                ) : ! review ? (
                    <p className="text-[12px] text-gray-500">No review yet. Run one to work up this intake for the adviser.</p>
                ) : (
                    <>
                        {review.summary && (
                            <Section icon={UserRound} title="Applicant summary">
                                <p className="text-[13px] text-gray-800 leading-relaxed">{review.summary}</p>
                            </Section>
                        )}

                        <Section icon={AlertTriangle} title="Completeness & consistency">
                            <IssueList items={review.observations} labelKey="field" />
                        </Section>

                        <Section icon={ShieldCheck} title="To verify / investigate">
                            <IssueList items={review.risks} labelKey="area" />
                        </Section>

                        {(review.checklist || []).length > 0 && (
                            <Section icon={ListChecks} title="Documents for the stated visa">
                                <ul className="space-y-1">
                                    {review.checklist.map((c, i) => (
                                        <li key={i} className="flex items-start gap-2 text-[12.5px] text-gray-800">
                                            <FileText size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                            <span>
                                                {c.document}
                                                {c.required && <span className="ml-1 text-rose-500 font-semibold">*</span>}
                                                {c.note && <span className="text-gray-500"> — {c.note}</span>}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </Section>
                        )}

                        {review.adviser_note && (
                            <Section icon={StickyNote} title="Draft adviser note" right={<CopyButton text={review.adviser_note} />}>
                                <textarea
                                    readOnly
                                    value={review.adviser_note}
                                    rows={6}
                                    className="w-full text-[12.5px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg leading-relaxed resize-y"
                                />
                            </Section>
                        )}

                        {(email.subject || email.body) && (
                            <Section icon={Mail} title="Draft client email (status only — adviser sends)" right={<CopyButton text={emailText} />}>
                                <div className="rounded-lg border border-gray-200 overflow-hidden">
                                    <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-[12px] text-gray-700">
                                        <span className="font-semibold">Subject:</span> {email.subject}
                                    </div>
                                    <textarea readOnly value={email.body} rows={6}
                                        className="w-full text-[12.5px] px-3 py-2 leading-relaxed resize-y border-0 focus:outline-none" />
                                </div>
                                <p className="text-[10.5px] text-gray-400">This is a draft. Review, edit, and send it yourself — nothing is sent automatically.</p>
                            </Section>
                        )}

                        <p className="text-[10.5px] text-gray-400 border-t border-gray-50 pt-2">
                            {review.reviewed_by ? `Run by ${review.reviewed_by}` : "Run"}
                            {review.created_at && ` · ${fmtWhen(review.created_at)}`}
                            {review.model && ` · ${review.model}`}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

/** Modal wrapper for the Assessments list row action. */
export function AiAssessmentReviewModal({ type, id, name, onClose }) {
    if (typeof document === "undefined") return null;
    return createPortal(
        (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true" onClick={onClose}>
                <div className="w-full max-w-lg my-10" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-white drop-shadow">{name || "Assessment"}</p>
                        <button type="button" onClick={onClose} className="text-white/80 hover:text-white"><X size={18} /></button>
                    </div>
                    <AiAssessmentReview type={type} id={id} />
                </div>
            </div>
        ),
        document.body,
    );
}
