import { useState } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { ArrowLeft, Trash2, UserCog, Home, StickyNote, History, UserCheck, X } from "lucide-react";
import TransitionModal from "@/components/onboarding/TransitionModal";
import ConvertTenantModal from "@/components/onboarding/ConvertTenantModal";
import { STATUS_STYLES, STATUS_DOT, statusLabel, tempBadge, daysStyle, STAGE_INPUTS } from "@/lib/onboardingMeta";

const fmtDate = (v) => { if (!v) return "—"; const d = new Date(v); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(); };
const fmtDateTime = (v) => { if (!v) return "—"; const d = new Date(v); return isNaN(d.getTime()) ? "—" : d.toLocaleString(); };
const displayBool = (v) => (v === true || v === 1 || v === "1" ? "Yes" : v === false || v === 0 || v === "0" ? "No" : "—");
const displayValue = (v) => (v === null || v === undefined || v === "" ? "—" : v);

function Row({ label, value }) {
    return (
        <div className="flex gap-4 py-2.5 border-b border-gray-50 last:border-0">
            <dt className="w-48 shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wide pt-0.5">{label}</dt>
            <dd className="flex-1 text-sm text-gray-800 break-words">{value}</dd>
        </div>
    );
}
function Section({ title, children }) {
    return (
        <div className="rounded-3xl border border-gray-50 bg-white p-6 shadow-sm space-y-1">
            <h2 className="text-sm font-semibold text-[#1F5A8B] uppercase tracking-wide mb-3">{title}</h2>
            <dl className="divide-y divide-gray-50">{children}</dl>
        </div>
    );
}
function Panel({ title, icon, action, children }) {
    return (
        <div className="rounded-3xl border border-gray-50 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">{icon}{title}</h2>
                {action}
            </div>
            {children}
        </div>
    );
}

export default function ApplicationDetails({ submission, options = {}, allowedTransitions = [] }) {
    const [modal, setModal] = useState(null);          // 'assign' | 'link' | 'note' | 'convert'
    const [transitionTo, setTransitionTo] = useState(null);
    const stages = options.stages ?? [];
    const currentIdx = stages.indexOf(submission.status);
    const isTerminal = (options.terminals ?? []).includes(submission.status);
    const canConvert = submission.status === "payment_confirmed" || (submission.status === "moved_in" && !submission.converted_to_tenant_id);

    const go = (target) => {
        if (target === "moved_in") { setModal("convert"); return; }
        if (STAGE_INPUTS[target]) { setTransitionTo(target); return; }
        router.patch(`/portal/accommodation/applications/${submission.id}/status`, { status: target }, { preserveScroll: true });
    };

    const handleDelete = () => {
        if (confirm(`Delete application from "${submission.full_legal_name}"?`)) {
            router.delete(`/portal/accommodation/applications/${submission.id}`);
        }
    };

    const timeline = [
        ["Submitted", submission.created_at],
        ["Viewing scheduled", submission.viewing_scheduled_at],
        ["Viewing completed", submission.viewing_completed_at],
        ["Pre-tenancy form sent", submission.pre_tenancy_form_sent_at],
        ["Pre-tenancy form completed", submission.pre_tenancy_form_completed_at],
        ["Agreement sent", submission.tenancy_agreement_sent_at],
        ["Agreement signed", submission.tenancy_agreement_signed_at],
        ["Invoice sent", submission.invoice_sent_at],
        ["Payment confirmed", submission.payment_confirmed_at],
        ["Moved in", submission.move_in_date],
    ].filter(([, v]) => v);

    const visa = submission.visa_status === "Other" && submission.visa_status_other ? `Other — ${submission.visa_status_other}` : displayValue(submission.visa_status);
    const nat = submission.nationality === "Other" && submission.nationality_other ? `Other — ${submission.nationality_other}` : displayValue(submission.nationality);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <Head title={`Onboarding — ${submission.full_legal_name}`} />

            <Link href="/portal/accommodation/onboarding" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1F5A8B]">
                <ArrowLeft size={15} /> Back to onboarding
            </Link>

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Onboarding — {submission.full_legal_name}</h1>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        {tempBadge(submission.lead_temperature || submission.form_type) && <span>{tempBadge(submission.lead_temperature || submission.form_type)}</span>}
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[submission.status]}`}>{statusLabel(submission.status)}</span>
                        <span className={daysStyle(submission.days_at_current_stage)}>{submission.days_at_current_stage ?? 0}d at stage</span>
                    </p>
                </div>
                <button onClick={handleDelete} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-100">
                    <Trash2 size={14} /> Delete
                </button>
            </div>

            {/* Stage stepper */}
            <div className="rounded-3xl border border-gray-50 bg-white p-5 shadow-sm overflow-x-auto">
                <div className="flex items-center gap-1 min-w-max">
                    {stages.map((s, i) => {
                        const done = currentIdx >= 0 && i < currentIdx;
                        const current = i === currentIdx;
                        return (
                            <div key={s} className="flex items-center">
                                <div className="flex flex-col items-center w-[90px] text-center">
                                    <span className={`h-3 w-3 rounded-full ${current ? STATUS_DOT[s] : done ? "bg-emerald-400" : "bg-gray-200"}`} />
                                    <span className={`mt-1 text-[10px] leading-tight ${current ? "font-bold text-gray-900" : "text-gray-400"}`}>{statusLabel(s)}</span>
                                </div>
                                {i < stages.length - 1 && <span className={`h-0.5 w-4 ${done ? "bg-emerald-300" : "bg-gray-200"}`} />}
                            </div>
                        );
                    })}
                </div>
                {isTerminal && (
                    <p className="mt-3 text-sm font-semibold text-rose-600">This application is {statusLabel(submission.status)}.</p>
                )}
            </div>

            {/* Action buttons (allowed transitions) + quick stage dropdown */}
            <div className="flex flex-wrap items-center gap-2">
                {allowedTransitions.length > 0 && (
                    <select
                        value=""
                        onChange={(e) => { if (e.target.value) go(e.target.value); }}
                        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1F5A8B]"
                    >
                        <option value="">Move to stage…</option>
                        {allowedTransitions.map((t) => (
                            <option key={t} value={t}>{t === "moved_in" ? "Convert to Tenant" : statusLabel(t)}</option>
                        ))}
                    </select>
                )}
                {allowedTransitions.map((t) => {
                    const danger = t === "declined" || t === "not_proceeding";
                    const label = t === "moved_in" ? "Convert to Tenant" : `→ ${statusLabel(t)}`;
                    return (
                        <button key={t} onClick={() => go(t)} className={`rounded-full px-4 py-2 text-sm font-semibold ${danger ? "border border-rose-200 text-rose-600 hover:bg-rose-50" : "bg-[#1F5A8B] text-white hover:bg-[#184A73]"}`}>
                            {label}
                        </button>
                    );
                })}
                {canConvert && !allowedTransitions.includes("moved_in") && (
                    <button onClick={() => setModal("convert")} className="rounded-full bg-[#1F5A8B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#184A73]">Convert to Tenant</button>
                )}
            </div>

            {/* Panels */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Panel title="Assigned to" icon={<UserCog size={16} className="text-[#1F5A8B]" />} action={<button onClick={() => setModal("assign")} className="text-xs font-semibold text-[#1F5A8B] hover:underline">{submission.assigned_to ? "Reassign" : "Assign"}</button>}>
                    <p className="text-sm text-gray-700">{submission.assigned_to?.name ?? "Unassigned"}</p>
                </Panel>

                <Panel title="Property" icon={<Home size={16} className="text-[#1F5A8B]" />} action={<button onClick={() => setModal("link")} className="text-xs font-semibold text-[#1F5A8B] hover:underline">{submission.property_id ? "Change" : "Link"}</button>}>
                    {submission.property_id ? (
                        <Link href={`/portal/accommodation/properties/${submission.property_id}`} className="text-sm font-medium text-[#1F5A8B] hover:underline">
                            {submission.property?.code ? `#${submission.property.code} · ` : ""}{submission.property?.address}
                        </Link>
                    ) : (
                        <p className="text-sm text-gray-500">{submission.property_interested || "Not linked"}</p>
                    )}
                </Panel>

                {submission.converted_to_tenant_id && (
                    <Panel title="Linked tenant" icon={<UserCheck size={16} className="text-[#1F5A8B]" />}>
                        <Link href={`/portal/accommodation/tenants/${submission.converted_to_tenant_id}`} className="text-sm font-medium text-emerald-700 hover:underline">
                            View tenant record →
                        </Link>
                    </Panel>
                )}

                <Panel title="Internal notes" icon={<StickyNote size={16} className="text-[#1F5A8B]" />} action={<button onClick={() => setModal("note")} className="text-xs font-semibold text-[#1F5A8B] hover:underline">Add note</button>}>
                    {submission.internal_notes ? (
                        <p className="whitespace-pre-wrap text-sm text-gray-700">{submission.internal_notes}</p>
                    ) : <p className="text-sm text-gray-400">No notes yet.</p>}
                </Panel>

                <div className="md:col-span-2">
                    <Panel title="Stage history" icon={<History size={16} className="text-[#1F5A8B]" />}>
                        {timeline.length === 0 ? <p className="text-sm text-gray-400">No stage events recorded yet.</p> : (
                            <ol className="space-y-2">
                                {timeline.map(([label, val]) => (
                                    <li key={label} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-700">{label}</span>
                                        <span className="text-gray-500">{label === "Submitted" ? fmtDateTime(val) : (label === "Moved in" ? fmtDate(val) : fmtDateTime(val))}</span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </Panel>
                </div>
            </div>

            {/* Read-only application sections */}
            <Section title="Personal Details">
                <Row label="Full legal name" value={displayValue(submission.full_legal_name)} />
                <Row label="ID / Licence number" value={displayValue(submission.id_number)} />
                <Row label="Visa status" value={visa} />
                <Row label="Nationality" value={nat} />
                <Row label="Preferred name" value={displayValue(submission.preferred_name)} />
                <Row label="Email" value={displayValue(submission.email)} />
                <Row label="Mobile" value={displayValue(submission.mobile)} />
                <Row label="Age" value={displayValue(submission.age)} />
            </Section>
            <Section title="Property & Room Interest">
                {submission.property_interested && <Row label="Property of interest" value={submission.property_interested} />}
                <Row label="Room type" value={displayValue(submission.room_type_interest)} />
                <Row label="Preferred start date" value={fmtDate(submission.tenancy_start_date)} />
                <Row label="Stay duration" value={displayValue(submission.stay_duration)} />
            </Section>
            <Section title="Occupancy">
                <Row label="Occupants" value={displayValue(submission.occupants)} />
                <Row label="Occupant ages" value={displayValue(submission.occupant_ages)} />
                <Row label="Children" value={displayBool(submission.has_children)} />
                <Row label="Children ages" value={displayValue(submission.children_ages)} />
                <Row label="Pets" value={displayBool(submission.has_pets)} />
                <Row label="Pet details" value={displayValue(submission.pet_details)} />
            </Section>
            <Section title="Employment / Study">
                <Row label="Rent funding" value={displayValue(submission.rent_funding)} />
                <Row label="Current status" value={displayValue(submission.employment_status)} />
            </Section>
            <Section title="Rental Background">
                <Row label="Current address" value={displayValue(submission.current_address)} />
                <Row label="Rented before" value={displayBool(submission.has_rented_before)} />
                <Row label="Time at current address" value={displayValue(submission.current_address_duration)} />
                <Row label="Living situation" value={displayValue(submission.living_situation)} />
                <Row label="Reason for moving" value={displayValue(submission.reason_for_moving)} />
            </Section>
            <Section title="Lifestyle & Compatibility">
                <Row label="Smokes / vapes" value={displayBool(submission.smokes_or_vapes)} />
                <Row label="Drinks alcohol" value={displayValue(submission.drinks_alcohol)} />
                <Row label="Work hours" value={displayValue(submission.work_hours)} />
                <Row label="Flatmate description" value={displayValue(submission.flatmate_description)} />
            </Section>
            <Section title="Viewing Availability">
                <Row label="Available within 7 days" value={displayBool(submission.viewing_available_7days)} />
                <Row label="Preferred viewing time" value={displayValue(submission.preferred_viewing_time)} />
            </Section>
            <Section title="Declaration & Consent">
                <Row label="Confirmed accurate" value={displayBool(submission.confirm_accurate)} />
                <Row label="Consent to collection" value={displayBool(submission.consent_collection)} />
            </Section>

            {/* Modals */}
            {transitionTo && <TransitionModal submission={submission} target={transitionTo} onClose={() => setTransitionTo(null)} />}
            {modal === "convert" && <ConvertTenantModal submission={submission} properties={options.properties ?? []} contractTypes={options.contract_types ?? []} onClose={() => setModal(null)} />}
            {modal === "assign" && <AssignModal submission={submission} team={options.team ?? []} onClose={() => setModal(null)} />}
            {modal === "link" && <LinkModal submission={submission} properties={options.properties ?? []} onClose={() => setModal(null)} />}
            {modal === "note" && <NoteModal submission={submission} onClose={() => setModal(null)} />}
        </div>
    );
}

function Shell({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}
const FIELD = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1F5A8B] focus:ring-[#1F5A8B]";

function AssignModal({ submission, team, onClose }) {
    const { data, setData, post, processing, errors } = useForm({ user_id: submission.assigned_to_user_id ?? "" });
    const submit = (e) => { e.preventDefault(); post(`/portal/accommodation/applications/${submission.id}/assign`, { preserveScroll: true, onSuccess: onClose }); };
    return (
        <Shell title="Assign application" onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                <select className={FIELD} value={data.user_id} onChange={(e) => setData("user_id", e.target.value)}>
                    <option value="">Select a team member</option>
                    {team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                {errors.user_id && <p className="text-xs text-rose-600">{errors.user_id}</p>}
                <button type="submit" disabled={processing} className="w-full rounded-full bg-[#1F5A8B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#184A73] disabled:opacity-50">Assign</button>
            </form>
        </Shell>
    );
}
function LinkModal({ submission, properties, onClose }) {
    const { data, setData, post, processing, errors } = useForm({ property_id: submission.property_id ?? "" });
    const submit = (e) => { e.preventDefault(); post(`/portal/accommodation/applications/${submission.id}/link-property`, { preserveScroll: true, onSuccess: onClose }); };
    return (
        <Shell title="Link to property" onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                <select className={FIELD} value={data.property_id} onChange={(e) => setData("property_id", e.target.value)}>
                    <option value="">Select a property</option>
                    {properties.map((p) => <option key={p.id} value={p.id}>{p.code ? `#${p.code} · ` : ""}{p.address}</option>)}
                </select>
                {errors.property_id && <p className="text-xs text-rose-600">{errors.property_id}</p>}
                <button type="submit" disabled={processing} className="w-full rounded-full bg-[#1F5A8B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#184A73] disabled:opacity-50">Link</button>
            </form>
        </Shell>
    );
}
function NoteModal({ submission, onClose }) {
    const { data, setData, post, processing, errors } = useForm({ note: "" });
    const submit = (e) => { e.preventDefault(); post(`/portal/accommodation/applications/${submission.id}/note`, { preserveScroll: true, onSuccess: onClose }); };
    return (
        <Shell title="Add internal note" onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                <textarea rows={4} className={FIELD} value={data.note} onChange={(e) => setData("note", e.target.value)} placeholder="Internal note…" />
                {errors.note && <p className="text-xs text-rose-600">{errors.note}</p>}
                <button type="submit" disabled={processing} className="w-full rounded-full bg-[#1F5A8B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#184A73] disabled:opacity-50">Add note</button>
            </form>
        </Shell>
    );
}
