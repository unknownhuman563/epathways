import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import { FileText, Sparkles, Download, CheckCircle2, Clock } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";

// Lead portal → Visa Information Form. The client generates the official VIF
// from their completed assessment; once generated it's downloadable here. They
// never upload it — it's produced from their assessment answers.

const ACCENT = "#436235";

export default function LeadVisaAssessment({ vif = {} }) {
    const [busy, setBusy] = useState(false);

    const generate = () => {
        setBusy(true);
        router.post("/portal/lead/vif", {}, {
            preserveScroll: true,
            onSuccess: () => toast.success("Your Visa Information Form is ready"),
            onError: (e) => toast.error(Object.values(e)[0] || "Could not generate"),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-12">
            <Head title="Visa Information Form" />
            <PortalPageHeader
                eyebrow="Application"
                title="Visa Information Form"
                description="Generate your official Visa Information Form from the assessment you completed. Once generated, you can download it here."
            />

            {!vif.available ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <FileText size={26} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm text-gray-700 font-medium">No completed assessment yet</p>
                    <p className="text-xs text-gray-500 mt-1">Complete your visa assessment first — your form will be available to generate here.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}1a` }}>
                            <FileText size={20} style={{ color: ACCENT }} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base font-semibold text-gray-900">Visa Information Form</h2>
                            <p className="text-[13px] text-gray-500 mt-0.5">
                                Built from your assessment answers in the official ePathways format.
                            </p>

                            {vif.generated ? (
                                <div className="mt-4 flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-lg border" style={{ color: ACCENT, backgroundColor: `${ACCENT}1a`, borderColor: `${ACCENT}4d` }}>
                                        <CheckCircle2 size={14} /> Ready
                                    </span>
                                    {vif.generated_at && (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                                            <Clock size={12} /> Generated {new Date(vif.generated_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <p className="mt-3 text-[12px] text-gray-500">Not generated yet — click below to create it.</p>
                            )}

                            <div className="mt-5 flex items-center gap-2 flex-wrap">
                                <button type="button" onClick={generate} disabled={busy}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                                    style={{ backgroundColor: ACCENT }}>
                                    <Sparkles size={15} /> {busy ? "Generating…" : vif.generated ? "Regenerate" : "Generate my form"}
                                </button>
                                {vif.generated && vif.download_url && (
                                    <a href={vif.download_url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50">
                                        <Download size={15} /> Download
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
