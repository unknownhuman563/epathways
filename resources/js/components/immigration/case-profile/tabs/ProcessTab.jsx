import { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    Workflow, Check, Clock, Lock, ShieldCheck, RotateCcw, AlertTriangle,
    CircleDashed, MinusCircle, Play, DollarSign,
} from "lucide-react";

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : null;

// status → chip + icon
const STATUS = {
    active: { chip: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Active" },
    done: { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Check, label: "Done" },
    pending: { chip: "bg-gray-50 text-gray-500 border-gray-200", icon: CircleDashed, label: "Pending" },
    blocked: { chip: "bg-rose-50 text-rose-700 border-rose-200", icon: Lock, label: "Blocked" },
    not_applicable: { chip: "bg-gray-50 text-gray-400 border-gray-100", icon: MinusCircle, label: "N/A" },
};

export default function ProcessTab({ lead, process = { started: false, steps: [], payment: null, partner: null } }) {
    if (! lead?.id) return null;

    const post = (url, data = {}, ok) =>
        router.post(url, data, {
            preserveScroll: true,
            onSuccess: () => ok && toast.success(ok),
            onError: (e) => toast.error(Object.values(e)[0] || "Action failed"),
        });

    if (! process.started) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
                <Workflow size={22} className="mx-auto text-gray-400" />
                <h2 className="mt-2 text-base font-bold text-gray-900">Process not started</h2>
                <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                    Track this case against the department's 16-step process — owners, deadlines and gates. Existing
                    cases keep their current stage; the chain catches up as steps complete.
                </p>
                <button
                    type="button"
                    onClick={() => post(`/portal/immigration/cases/${lead.id}/steps/start`, {}, "Process tracking started")}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black"
                >
                    <Play size={14} /> Start process tracking
                </button>
            </div>
        );
    }

    const partnerVisible = process.steps.some((s) => s.step_key === "06a" && s.status !== "not_applicable");

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <Workflow size={16} className="text-gray-500" />
                    <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500">Process chain</h2>
                </div>
                <ol className="divide-y divide-gray-50">
                    {process.steps.map((s) => (
                        <StepRow key={s.step_key} leadId={lead.id} step={s} post={post} />
                    ))}
                </ol>
            </div>

            <PaymentPanel leadId={lead.id} payment={process.payment} post={post} />
            {partnerVisible && <PartnerPanel leadId={lead.id} partner={process.partner} post={post} />}
        </div>
    );
}

function StepRow({ leadId, step, post }) {
    const meta = STATUS[step.status] || STATUS.pending;
    const Icon = meta.icon;
    const isActive = step.status === "active";
    const isDone = step.status === "done";

    const reopen = () => {
        const trigger = step.step_key === "12" || step.step_key === "13" ? "rfi" : "manual";
        const reason = window.prompt(`Re-open step ${step.step_key}? Optional note:`) ?? "";
        post(`/portal/immigration/cases/${leadId}/steps/${step.step_key}/reactivate`, { trigger, reason }, "Step re-opened");
    };

    return (
        <li className={`px-5 py-3 flex items-start gap-3 ${step.overdue ? "bg-rose-50/40" : ""}`}>
            <div className="flex flex-col items-center pt-0.5">
                <Icon size={16} className={step.overdue ? "text-rose-500" : "text-gray-400"} />
                <span className="text-[9px] font-mono text-gray-300 mt-1">{step.step_key}</span>
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{step.label}</span>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${meta.chip}`}>{meta.label}</span>
                    {step.gate && <span className="text-[10px] font-bold uppercase text-rose-600 inline-flex items-center gap-0.5"><Lock size={9} /> Gate</span>}
                    {step.is_qc && <span className="text-[10px] font-bold uppercase text-indigo-600 inline-flex items-center gap-0.5"><ShieldCheck size={9} /> QC</span>}
                    {step.attempt > 1 && <span className="text-[10px] font-semibold text-amber-600">attempt {step.attempt}</span>}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                    {step.owner ? <>Owner: <span className="text-gray-600 font-medium">{step.owner.name}</span></> : <>Role: {step.owner_role}</>}
                    {step.due_at && <> · Due {fmtDate(step.due_at)}{step.overdue && <span className="text-rose-600 font-semibold"> — overdue</span>}</>}
                    {isDone && step.completed_at && <> · Completed {fmtDate(step.completed_at)}</>}
                    {step.qc_result && <> · QC <span className={step.qc_result === "pass" ? "text-emerald-600" : "text-rose-600"}>{step.qc_result}</span></>}
                </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
                {isActive && step.is_qc && (
                    <>
                        <button type="button" onClick={() => post(`/portal/immigration/cases/${leadId}/steps/${step.step_key}/complete`, { qc_result: "pass" }, "QC passed")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700">QC pass</button>
                        <button type="button" onClick={() => post(`/portal/immigration/cases/${leadId}/steps/${step.step_key}/complete`, { qc_result: "fail" }, "QC failed")}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 text-[11px] font-semibold hover:bg-rose-50">QC fail</button>
                    </>
                )}
                {isActive && ! step.is_qc && (
                    <button type="button" onClick={() => post(`/portal/immigration/cases/${leadId}/steps/${step.step_key}/complete`, {}, "Step completed")}
                        className="px-2.5 py-1 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-black inline-flex items-center gap-1">
                        <Check size={12} /> Complete
                    </button>
                )}
                {isDone && (
                    <button type="button" onClick={reopen} title="Re-open (RFI / correction)"
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-900">
                        <RotateCcw size={13} />
                    </button>
                )}
            </div>
        </li>
    );
}

function PaymentPanel({ leadId, payment, post }) {
    const [expected, setExpected] = useState(payment?.amount_expected ?? "");
    const [received, setReceived] = useState(payment?.amount_received ?? "");
    const [method, setMethod] = useState(payment?.method ?? "");

    const submit = () =>
        post(`/portal/immigration/cases/${leadId}/payment`, { amount_expected: expected || 0, amount_received: received || 0, method }, "Payment recorded");

    const statusChip = { paid: "bg-emerald-50 text-emerald-700 border-emerald-200", part_paid: "bg-amber-50 text-amber-700 border-amber-200", unpaid: "bg-rose-50 text-rose-700 border-rose-200" };

    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500 inline-flex items-center gap-2"><DollarSign size={14} /> Payment (step 11)</h3>
                {payment && <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${statusChip[payment.status]}`}>{payment.status}</span>}
            </div>
            <div className="grid grid-cols-3 gap-2">
                <NumberField label="Expected" value={expected} onChange={setExpected} />
                <NumberField label="Received" value={received} onChange={setReceived} />
                <div>
                    <span className="block text-[11px] font-semibold text-gray-600 mb-1">Method</span>
                    <input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Bank transfer"
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-gray-300" />
                </div>
            </div>
            <button type="button" onClick={submit} className="mt-3 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-black">Record payment</button>
        </div>
    );
}

function PartnerPanel({ leadId, partner, post }) {
    const [main, setMain] = useState(partner?.recommended_main_applicant ?? "");
    const [reason, setReason] = useState(partner?.recommendation_reason ?? "");
    const [choice, setChoice] = useState(partner?.client_choice ?? "");
    const [docId, setDocId] = useState(partner?.choice_document_id ?? "");

    const submit = () =>
        post(`/portal/immigration/cases/${leadId}/partner-recommendation`, {
            recommended_main_applicant: main, recommendation_reason: reason,
            client_choice: choice, choice_document_id: docId || null,
        }, "Partner recommendation saved");

    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
            <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-amber-700">Partner visa — main applicant</h3>
                {partner?.resolved && <span className="text-[10px] font-bold uppercase text-emerald-700 inline-flex items-center gap-1"><Check size={11} /> Resolved</span>}
            </div>
            <p className="text-[11px] text-gray-600 mb-3 flex items-start gap-1.5">
                <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                Recommending the main applicant is advice — only a licensed adviser may set it. The client must choose in writing (attach the document) to clear the fork before step 06.
            </p>
            <div className="space-y-2">
                <TextField label="Recommended main applicant (adviser)" value={main} onChange={setMain} placeholder="e.g. Maria Santos" />
                <TextField label="Reason" value={reason} onChange={setReason} placeholder="Stronger employment history…" />
                <div className="grid grid-cols-2 gap-2">
                    <TextField label="Client's written choice" value={choice} onChange={setChoice} placeholder="e.g. Maria Santos" />
                    <NumberField label="Choice document ID" value={docId} onChange={setDocId} />
                </div>
            </div>
            <button type="button" onClick={submit} className="mt-3 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-black">Save</button>
        </div>
    );
}

function NumberField({ label, value, onChange }) {
    return (
        <div>
            <span className="block text-[11px] font-semibold text-gray-600 mb-1">{label}</span>
            <input type="number" step="0.01" min="0" value={value} onChange={(e) => onChange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-gray-300" />
        </div>
    );
}

function TextField({ label, value, onChange, placeholder }) {
    return (
        <div>
            <span className="block text-[11px] font-semibold text-gray-600 mb-1">{label}</span>
            <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-gray-300" />
        </div>
    );
}
