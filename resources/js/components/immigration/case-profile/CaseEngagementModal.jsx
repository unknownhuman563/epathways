import { useState } from "react";
import { createPortal } from "react-dom";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { X, FileText, FileSignature, Loader2, Send, Check } from "lucide-react";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import GenerationProgress from "@/components/ui/GenerationProgress";

// Generate an engagement pack from the case profile — preview on the left,
// editable settings on the right. Posts to the same endpoint the Engagement
// workspace uses. "Save as draft" doesn't email the client; "Generate & email"
// sends the scoped signing link.
export default function CaseEngagementModal({ leadId, leadName, engagement = {}, onClose }) {
    const documents = engagement.documents || [];
    const signers = engagement.signers || [];
    const [selectedTypes, setSelectedTypes] = useState(documents.map((d) => d.key));
    const [signerId, setSignerId] = useState(engagement.default_signer_id ?? signers[0]?.id ?? null);
    const [feeLocation, setFeeLocation] = useState("onshore");
    const [includeGst, setIncludeGst] = useState(false);
    const [feeOverride, setFeeOverride] = useState("");
    const [busy, setBusy] = useState(null); // 'draft' | 'send'
    const [previewType, setPreviewType] = useState(documents.some((d) => d.key === "written_agreement") ? "written_agreement" : (documents[0]?.key || "written_agreement"));

    const activePreview = selectedTypes.includes(previewType) ? previewType : (selectedTypes[0] || previewType);
    const labelFor = (k) => (documents.find((d) => d.key === k)?.label) || k;
    const previewUrl = `/admin/leads/${leadId}/generate/engage_${activePreview}/preview?fee_location=${feeLocation}&include_gst=${includeGst ? 1 : 0}${signerId ? `&signer=${signerId}` : ""}${feeOverride !== "" ? `&professional_fee=${encodeURIComponent(feeOverride)}` : ""}`;

    const toggleType = (k) => setSelectedTypes((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

    const generate = async (sendEmail) => {
        if (selectedTypes.length === 0) return;
        const n = selectedTypes.length;
        const ok = await confirmDialog({
            title: sendEmail ? "Generate & email engagement?" : "Save engagement as draft?",
            message: sendEmail
                ? `Generate ${n} document${n === 1 ? "" : "s"} and email the signing link to ${leadName}.`
                : `Generate ${n} document${n === 1 ? "" : "s"} as a draft. The client will NOT be emailed.`,
            confirmText: sendEmail ? "Generate & email" : "Save as draft",
        });
        if (!ok) return;

        setBusy(sendEmail ? "send" : "draft");
        router.post(`/admin/leads/${leadId}/engagement/generate`, {
            types: selectedTypes,
            notify: sendEmail,
            signer_id: signerId,
            fee_tier: "normal",
            fee_location: feeLocation,
            include_gst: includeGst,
            professional_fee: feeOverride !== "" ? Number(feeOverride) : null,
        }, {
            preserveScroll: true,
            onSuccess: () => { toast.success(sendEmail ? "Engagement generated and emailed" : "Engagement saved as draft"); onClose(); },
            onError: (e) => toast.error(Object.values(e)[0] || "Could not generate the documents."),
            onFinish: () => setBusy(null),
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-3" onClick={onClose}>
            <div className="w-[96vw] max-w-[1200px] h-[92vh] max-h-[calc(100vh-1.5rem)] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 flex-shrink-0">
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-gray-900 truncate">Generate engagement — {leadName}</h2>
                        {engagement.sent && <p className="text-[11px] text-emerald-600">Already emailed to the client — regenerating replaces the current draft.</p>}
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
                </div>

                <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
                    {/* Preview + a tab per generated document */}
                    <div className="flex-1 min-w-0 min-h-[280px] bg-gray-100 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col">
                        {/* Document tabs double as include checkboxes: tick to keep
                            in the pack, click the name to preview. */}
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b border-gray-100 overflow-x-auto flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setSelectedTypes(selectedTypes.length === documents.length ? [] : documents.map((d) => d.key))}
                                className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900 flex-shrink-0 mr-0.5"
                            >
                                {selectedTypes.length === documents.length ? "Clear all" : "Select all"}
                            </button>
                            {documents.map((d) => {
                                const checked = selectedTypes.includes(d.key);
                                const isPreview = activePreview === d.key;
                                return (
                                    <div
                                        key={d.key}
                                        className={`flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full whitespace-nowrap border flex-shrink-0 transition-colors ${isPreview ? "bg-gray-900 border-gray-900 text-white" : checked ? "bg-gray-100 border-gray-200 text-gray-700" : "bg-white border-gray-200 text-gray-400"}`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleType(d.key)}
                                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${checked ? (isPreview ? "bg-white border-white" : "bg-gray-900 border-gray-900") : "bg-white border-gray-300"}`}
                                        >
                                            {checked && <Check size={10} className={isPreview ? "text-gray-900" : "text-white"} strokeWidth={3} />}
                                        </button>
                                        <button type="button" onClick={() => setPreviewType(d.key)} className="text-[11px] font-semibold flex items-center gap-1">
                                            {d.label}
                                            {d.dynamic && <span className={`text-[8px] font-bold uppercase tracking-wide rounded px-1 ${isPreview ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>Auto</span>}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <iframe key={previewUrl} src={previewUrl} title="Engagement preview" className="flex-1 w-full border-0" />
                    </div>

                    {/* Settings */}
                    <div className="lg:w-[360px] flex-shrink-0 overflow-y-auto p-5 space-y-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Settings</p>

                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Signing adviser</label>
                            <select value={signerId ?? ""} onChange={(e) => setSignerId(Number(e.target.value) || null)}
                                className="w-full text-[13px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900">
                                {signers.length === 0 && <option value="">No licensed advisers</option>}
                                {signers.map((s) => <option key={s.id} value={s.id}>{s.name}{s.licence_current === false ? " (licence expired)" : ""}</option>)}
                            </select>
                        </div>


                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Location</label>
                                <select value={feeLocation} onChange={(e) => setFeeLocation(e.target.value)}
                                    className="w-full text-[13px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900">
                                    <option value="onshore">Onshore</option>
                                    <option value="offshore">Offshore</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">GST</label>
                                <select value={includeGst ? "incl" : "excl"} onChange={(e) => setIncludeGst(e.target.value === "incl")}
                                    className="w-full text-[13px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900">
                                    <option value="excl">Exclusive</option>
                                    <option value="incl">Inclusive</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Agreement fee (ex GST) — blank for the visa fee</label>
                            <input type="number" min="0" step="0.01" value={feeOverride} onChange={(e) => setFeeOverride(e.target.value)} placeholder="Visa default"
                                className="w-full text-[13px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900" />
                        </div>

                        <div className="pt-2 space-y-2 border-t border-gray-100">
                            <button type="button" onClick={() => generate(false)} disabled={!!busy || selectedTypes.length === 0}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-[13px] font-bold hover:bg-gray-50 disabled:opacity-50">
                                {busy === "draft" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} Save as draft
                            </button>
                            <button type="button" onClick={() => generate(true)} disabled={!!busy || selectedTypes.length === 0 || !engagement.has_email}
                                title={engagement.has_email ? "" : "No client email on file"}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-[13px] font-bold hover:bg-black disabled:opacity-50">
                                {busy === "send" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Generate &amp; email
                            </button>
                            {!engagement.has_email && <p className="text-[11px] text-amber-600">No email on file for this client.</p>}
                        </div>
                    </div>
                </div>
            </div>
            <GenerationProgress active={!!busy} title={busy === "send" ? "Generating & emailing…" : "Saving your draft…"} />
        </div>,
        document.body,
    );
}
