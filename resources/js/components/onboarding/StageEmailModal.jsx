import { router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { X, Mail, Info, RotateCcw } from "lucide-react";
import { STAGE_EMAILS } from "@/lib/stageEmails";
import { statusLabel } from "@/lib/onboardingMeta";

/**
 * Previews — and lets staff edit — the automated email tied to an onboarding
 * stage, then on confirm advances the application into that stage. Used for the
 * stages registered in STAGE_EMAILS (viewing booking, post-viewing follow-up,
 * pre-tenancy form, move-in welcome).
 *
 * The email automation is not implemented yet, so confirming only changes the
 * stage; the Subject/Body are editable for this send and are NOT saved as a
 * reusable template. The starting text is generated from the submission +
 * linked property, and "Reset to template" restores it.
 */
export default function StageEmailModal({ submission, target, onClose }) {
    const [processing, setProcessing] = useState(false);
    const config = STAGE_EMAILS[target];

    // Generated template text — the starting point for the editable fields.
    const built = useMemo(
        () => (config ? config.build(submission) : { subject: "", body: "", recipient: "" }),
        [config, submission],
    );
    const [subject, setSubject] = useState(built.subject);
    const [body, setBody] = useState(built.body);

    if (!config) return null;

    const previewOnly = !!config.previewOnly;
    const recipient = built.recipient;
    const edited = subject !== built.subject || body !== built.body;
    const resetTemplate = () => { setSubject(built.subject); setBody(built.body); };

    const confirm = () => {
        setProcessing(true);
        router.patch(
            `/portal/accommodation/applications/${submission.id}/status`,
            { status: target },
            { preserveScroll: true, onSuccess: onClose, onFinish: () => setProcessing(false) },
        );
    };

    const FIELD = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#1F5A8B] focus:ring-1 focus:ring-[#1F5A8B]";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
                        <Mail size={18} className="text-[#1F5A8B]" /> {config.title}
                    </h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
                </div>

                <div className="mb-3 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
                    <Info size={15} className="mt-0.5 shrink-0" />
                    {previewOnly ? (
                        <span>Email automation isn't live yet — this is the move-in welcome email. You can edit it below for your own copy; edits aren't saved as a template.</span>
                    ) : (
                        <span>Email automation isn't live yet — confirming moves this application to <strong>{statusLabel(target)}</strong> without actually sending the email. You can edit the Subject and Body for this send; edits aren't saved as a reusable template.</span>
                    )}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-baseline gap-2 text-xs">
                        <span className="font-semibold uppercase tracking-wider text-gray-400">To</span>
                        <span className="text-gray-700">{recipient || "— no email on file —"}</span>
                    </div>
                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Subject</label>
                        <input className={FIELD} value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </div>
                    <div>
                        <div className="mb-1 flex items-center justify-between">
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Body</label>
                            {edited && (
                                <button type="button" onClick={resetTemplate} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F5A8B] hover:underline">
                                    <RotateCcw size={12} /> Reset to template
                                </button>
                            )}
                        </div>
                        <textarea className={`${FIELD} resize-y font-sans leading-relaxed`} rows={14} value={body} onChange={(e) => setBody(e.target.value)} />
                    </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    {previewOnly ? (
                        <button type="button" onClick={onClose} className="rounded-full bg-[#1F5A8B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#184A73]">Close</button>
                    ) : (
                        <>
                            <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                            <button type="button" onClick={confirm} disabled={processing} className="rounded-full bg-[#1F5A8B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#184A73] disabled:opacity-50">
                                {processing ? "Saving…" : "Send & advance"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
