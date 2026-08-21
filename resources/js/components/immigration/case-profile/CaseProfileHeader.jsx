import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { toast } from "sonner";
import CaseEngagementModal from "@/components/immigration/case-profile/CaseEngagementModal";
import CaseHealthBadge from "@/components/ai/CaseHealthBadge";
import {
    ArrowLeft, Globe, FileSignature, MessageSquarePlus, FilePlus2,
    BadgeCheck, Briefcase, Archive, Eye, Link2, Pencil,
} from "lucide-react";
import { AvatarPhoto } from "@/components/ui/Avatar";

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—";

const initials = (name = "") =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "C";

export default function CaseProfileHeader({ lead = {}, intake = null, attention = null, tiedTo = null, engagement = {}, visaTypes = [] }) {
    const [engageOpen, setEngageOpen] = useState(false);
    const [visaEditing, setVisaEditing] = useState(false);
    const [savingVisa, setSavingVisa] = useState(false);
    const fullName = `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || lead.lead_id || "Unnamed case";
    const visa = lead.inz_visa_type || intake?.data?.visa_type_label || "Visa type not set";
    const currentVisaId = visaTypes.find((v) => v.name === lead.inz_visa_type)?.id ?? "";

    // Inline edit of the case's visa type — posts to the same endpoint the Cases
    // table uses; the checklist follows the newly-set visa.
    const changeVisa = (id) => {
        setSavingVisa(true);
        router.post(`/portal/immigration/cases/${lead.id}/visa`, { visa_type_id: id || null }, {
            preserveScroll: true,
            onSuccess: () => { toast.success("Visa type updated"); setVisaEditing(false); },
            onError: (e) => toast.error(Object.values(e)[0] || "Could not update the visa type"),
            onFinish: () => setSavingVisa(false),
        });
    };
    const stage = lead.immigration_stage || lead.stage || "Stage not set";
    const conversionOrigin = lead.is_assessment_converted ? "Assessment-converted" : "Sales-converted";
    const openedIso = lead.created_at || lead.immigration_converted_at || null;
    const openedDate = openedIso ? fmtDate(openedIso) : null;

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

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* LEFT — identity, status, actions */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                            {/* Applicant's uploaded Face image when present, otherwise the initials tile. */}
                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 flex items-center justify-center font-black text-2xl flex-shrink-0 border border-gray-200">
                                <AvatarPhoto src={lead.avatar_url} title={fullName}>
                                    {initials(fullName)}
                                </AvatarPhoto>
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight truncate">
                                    {fullName}
                                </h1>
                                <p className="text-[13px] text-gray-500 mt-0.5">
                                    {visaEditing ? (
                                        <span className="inline-flex items-center gap-1.5">
                                            <Globe size={13} className="text-gray-400" />
                                            <select
                                                autoFocus
                                                defaultValue={currentVisaId}
                                                disabled={savingVisa}
                                                onChange={(e) => changeVisa(e.target.value)}
                                                onBlur={() => setVisaEditing(false)}
                                                className="text-[13px] border border-gray-300 rounded-md px-1.5 py-0.5 focus:outline-none focus:border-gray-500 disabled:opacity-50"
                                            >
                                                <option value="">Visa type not set</option>
                                                {visaTypes.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                                            </select>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 group">
                                            <Globe size={13} className="text-gray-400" /> {visa}
                                            <button type="button" onClick={() => setVisaEditing(true)} title="Edit visa type"
                                                className="text-gray-300 hover:text-gray-700 transition-colors">
                                                <Pencil size={11} />
                                            </button>
                                        </span>
                                    )}
                                    {lead.lead_id && <span className="text-gray-300"> · </span>}
                                    {lead.lead_id && <span className="font-mono text-gray-400">{lead.lead_id}</span>}
                                    {openedDate && <><span className="text-gray-300"> · </span>opened {openedDate}</>}
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
                                    {engagement.sent && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-100 text-[11px] font-semibold text-teal-700">
                                            <FileSignature size={11} /> Engagement {engagement.signed ? "signed" : "sent"}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-[11px] font-medium text-gray-600">
                                        {lead.is_assessment_converted
                                            ? <BadgeCheck size={11} className="text-emerald-500" />
                                            : <Briefcase size={11} className="text-gray-400" />}
                                        {conversionOrigin}
                                    </span>
                                    {tiedTo && (
                                        <Link
                                            href={`/portal/immigration/cases/${tiedTo.id}/profile`}
                                            title={`Included as a dependant on ${tiedTo.name}'s case`}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 border border-sky-200 text-[11px] font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
                                        >
                                            <Link2 size={11} /> Tied to {tiedTo.name}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {lead.id && (
                                <button
                                    type="button"
                                    onClick={() => setEngageOpen(true)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold border transition-colors ${
                                        engagement.sent
                                            ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                                            : "bg-teal-700 text-white border-teal-700 hover:bg-teal-800"
                                    }`}
                                >
                                    <FileSignature size={14} />
                                    {engagement.sent ? "Engagement emailed — manage" : "Generate Engagement"}
                                </button>
                            )}
                            <QuickAction icon={FilePlus2}      label="Request Document"   disabledHint="Available in Phase 2" />
                            <QuickAction icon={MessageSquarePlus} label="Compose Message" disabledHint="Wired by Build 11.A" />
                        </div>
                    </div>

                    {/* RIGHT — AI case summary + what changed since last open */}
                    <div className="w-full lg:w-96 flex-shrink-0 space-y-3">
                        {lead.id && <CaseHealthBadge caseId={lead.id} variant="card" />}
                        <SinceLastOpened attention={attention} />
                    </div>
                </div>
            </section>

            {engageOpen && (
                <CaseEngagementModal
                    leadId={lead.id}
                    leadName={fullName}
                    engagement={engagement}
                    onClose={() => setEngageOpen(false)}
                />
            )}
        </div>
    );
}

/**
 * Build 12 phase 4 (§5) — "what changed since you last opened this". Passive:
 * derived from the viewer's previous CaseView plus the activity log. Shows only
 * whether they've looked and what moved since — never any time-on-case. Renders
 * nothing on a first-ever open (nothing to diff against).
 */
function SinceLastOpened({ attention }) {
    if (! attention?.last_opened_at) return null;
    const changes = attention.changed_since || [];

    return (
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
            <p className="text-[11px] font-semibold text-gray-500 inline-flex items-center gap-1.5">
                <Eye size={12} className="text-teal-500" />
                Since you last opened this · {fmtDateTime(attention.last_opened_at)}
            </p>
            {changes.length === 0 ? (
                <p className="mt-1 text-[11px] text-gray-400">No changes since then.</p>
            ) : (
                <ul className="mt-1.5 space-y-1">
                    {changes.slice(0, 6).map((c) => (
                        <li key={c.id} className="text-[11.5px] text-gray-600 leading-snug">
                            <span className="text-gray-900">{c.description || "Update"}</span>
                            <span className="text-gray-400"> · {c.actor_name} · {fmtDateTime(c.created_at)}</span>
                        </li>
                    ))}
                    {changes.length > 6 && (
                        <li className="text-[11px] text-gray-400">+{changes.length - 6} more</li>
                    )}
                </ul>
            )}
        </div>
    );
}

const fmtDateTime = (iso) =>
    iso ? new Date(iso).toLocaleString("en-NZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

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
