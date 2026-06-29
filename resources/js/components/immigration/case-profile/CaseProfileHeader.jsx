import { Link, router } from "@inertiajs/react";
import { toast } from "sonner";
import CaseHealthBadge from "@/components/ai/CaseHealthBadge";
import {
    ArrowLeft, Globe, FileSignature, MessageSquarePlus, FilePlus2,
    BadgeCheck, Briefcase, Archive,
} from "lucide-react";

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—";

const initials = (name = "") =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "C";

export default function CaseProfileHeader({ lead = {}, intake = null }) {
    const fullName = `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || lead.lead_id || "Unnamed case";
    const visa = lead.inz_visa_type || intake?.data?.visa_type_label || "Visa type not set";
    const stage = lead.immigration_stage || lead.stage || "Stage not set";
    const conversionOrigin = lead.is_assessment_converted ? "Assessment-converted" : "Sales-converted";

    // Soft-delete (archive) — the case row stays in the database, notes
    // and tasks survive, and it can be restored from the archive view.
    // Confirm dialog gates the destructive action; on success Inertia
    // follows the controller's redirect back to /admin/leads (Cases list
    // re-renders without this row).
    const archive = () => {
        if (! lead?.id) return;
        if (! window.confirm(`Archive ${fullName}?\n\nThe case will be hidden from the Cases list. Notes, tasks, documents, and audit history are preserved and the case can be restored later.`)) return;
        router.delete(`/admin/leads/${lead.id}`, {
            preserveScroll: false,
            onSuccess: () => toast.success(`${fullName} archived`),
            onError: () => toast.error('Could not archive — please try again.'),
        });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <Link
                    href="/portal/immigration/cases"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={14} /> Back to cases
                </Link>
                <button
                    type="button"
                    onClick={archive}
                    title="Archive (soft-delete) this case"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors"
                >
                    <Archive size={12} /> Archive
                </button>
            </div>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700" />
                <div className="px-6 pb-5 -mt-12">
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div className="flex items-end gap-4">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 text-white flex items-center justify-center font-black text-3xl ring-4 ring-white shadow-lg">
                                {initials(fullName)}
                            </div>
                            <div className="pb-2">
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                                    {fullName}
                                </h1>
                                <p className="text-sm text-gray-500 mt-0.5 inline-flex items-center gap-2">
                                    <Globe size={13} className="text-gray-400" />
                                    {visa}
                                    {lead.lead_id && (
                                        <span className="ml-2 font-mono text-gray-400">{lead.lead_id}</span>
                                    )}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200 text-[11px] font-semibold text-gray-700">
                                        {stage}
                                    </span>
                                    {lead.inz_status && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-[11px] font-semibold text-blue-700">
                                            INZ: {lead.inz_status}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-[11px] font-medium text-gray-600">
                                        {lead.is_assessment_converted
                                            ? <BadgeCheck size={11} className="text-emerald-500" />
                                            : <Briefcase size={11} className="text-gray-400" />}
                                        {conversionOrigin}
                                    </span>
                                    {lead.immigration_converted_at && (
                                        <span className="text-[11px] text-gray-400">
                                            since {fmtDate(lead.immigration_converted_at)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pb-2 flex items-center gap-2 flex-wrap">
                            {lead.id ? <CaseHealthBadge caseId={lead.id} /> : null}
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                        <QuickAction icon={FileSignature} label="Generate Agreement" disabledHint="Available in Phase 3" />
                        <QuickAction icon={FilePlus2}      label="Request Document"   disabledHint="Available in Phase 2" />
                        <QuickAction icon={MessageSquarePlus} label="Compose Message" disabledHint="Wired by Build 11.A" />
                    </div>
                </div>
            </section>
        </div>
    );
}

function QuickAction({ icon: Icon, label, disabledHint }) {
    return (
        <button
            type="button"
            disabled
            title={disabledHint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-gray-200 bg-white text-gray-500 cursor-not-allowed"
        >
            <Icon size={13} className="text-gray-400" />
            {label}
        </button>
    );
}
