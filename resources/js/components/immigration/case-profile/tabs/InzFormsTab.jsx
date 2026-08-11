import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { FileCheck2, Sparkles, AlertTriangle, Clock, CheckCircle2, Send } from "lucide-react";

// Case → INZ Forms. The forms available for THIS case (its visa type's category).
// Staff generate the official PDF filled from case data (a draft for the step-10
// check), and — soon — send it to the client to fill in the lead portal.

export default function InzFormsTab({ lead, inzForms = [] }) {
    if (! lead?.id) return null;

    const generate = (code) =>
        router.post(`/portal/immigration/cases/${lead.id}/inz-forms/${code}/generate`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success(`${code} generated — see Documents`),
            onError: (e) => toast.error(Object.values(e)[0] || "Could not generate"),
        });

    const sendToClient = (code) =>
        router.post(`/portal/immigration/cases/${lead.id}/inz-forms/${code}/assign`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success(`${code} sent to the client to fill`),
            onError: (e) => toast.error(Object.values(e)[0] || "Could not send"),
        });

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-[#009688]/20 bg-white shadow-sm p-4 flex items-start gap-2">
                <Sparkles size={15} className="text-[#009688] mt-0.5 flex-shrink-0" />
                <p className="text-[12px] text-gray-600 leading-snug">
                    INZ forms for this case's category. Generating fills the <span className="font-semibold">official PDF</span> from case
                    data and drops a <span className="font-semibold">draft</span> into Documents for review — never auto-filed.
                </p>
            </div>

            {inzForms.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <FileCheck2 size={26} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm text-gray-700 font-semibold">No INZ forms for this case</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Set the case's visa type, and make sure its category has forms in <span className="font-medium">Setup → INZ Forms</span>.
                    </p>
                </div>
            ) : (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
                    {inzForms.map((f) => (
                        <div key={f.code} className="px-5 py-3 flex items-center gap-3 flex-wrap">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-gray-900">{f.code}</span>
                                    {f.version && <span className="text-[10px] font-semibold text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">{f.version}</span>}
                                    {f.ready
                                        ? <Badge tone="emerald" icon={<CheckCircle2 size={10} />}>Ready</Badge>
                                        : <Badge tone="amber" icon={<AlertTriangle size={10} />}>No PDF yet</Badge>}
                                    {f.lapsing && <Badge tone="amber" icon={<Clock size={10} />}>Version lapsing</Badge>}
                                    {f.assignment_status === "assigned" && <Badge tone="teal" icon={<Send size={10} />}>Sent to client</Badge>}
                                    {f.assignment_status === "submitted" && <Badge tone="teal" icon={<CheckCircle2 size={10} />}>Client submitted</Badge>}
                                    {f.assignment_status === "reviewed" && <Badge tone="gray" icon={<CheckCircle2 size={10} />}>Reviewed</Badge>}
                                </div>
                                <p className="text-[12px] text-gray-500 truncate">{f.name}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button type="button" onClick={() => generate(f.code)} disabled={! f.ready}
                                    title={f.assignment_status === "submitted"
                                        ? "Fill the official PDF from the client's answers"
                                        : (f.ready ? "Fill the official PDF from this case" : "Upload the official PDF in Setup → INZ Forms first")}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed">
                                    <Sparkles size={12} /> {f.assignment_status === "submitted" ? "Generate from answers" : "Generate"}
                                </button>
                                <button type="button" onClick={() => sendToClient(f.code)} disabled={! f.ready}
                                    title={f.ready ? "Send to the client to fill in their portal" : "Upload the official PDF in Setup → INZ Forms first"}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#009688]/30 text-[#009688] text-[11px] font-semibold hover:bg-[#009688]/5 disabled:opacity-40 disabled:cursor-not-allowed">
                                    <Send size={12} /> {f.assignment_status ? "Re-send" : "Send to client"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Badge({ tone = "gray", icon, children }) {
    const map = {
        gray: "bg-gray-50 text-gray-600 border-gray-200",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
        amber: "bg-amber-50 text-amber-700 border-amber-200",
        teal: "bg-[#009688]/10 text-[#009688] border-[#009688]/30",
    };
    return <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${map[tone]}`}>{icon}{children}</span>;
}
