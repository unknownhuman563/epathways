import { FileSignature, Clock } from "lucide-react";

// Phase 1 placeholder. Phase 3 brings the full agreement-generation
// workflow (templates, variable substitution, dompdf, send-to-client).

export default function AgreementTab() {
    return (
        <div className="text-center py-14 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <FileSignature size={36} className="mx-auto text-gray-300" />
            <p className="mt-3 text-base font-semibold text-gray-700">Agreement workflow</p>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Generate a consultancy agreement from a template, send it to the client, and track signing status.
                Ships in Phase 3 of Build 11.D.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                <Clock size={11} /> Phase 3
            </p>
        </div>
    );
}
