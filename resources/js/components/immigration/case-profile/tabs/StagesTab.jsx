import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { immBase } from "@/lib/caseRoutes";
import {
    CircleDashed, Loader2, MessageCircleQuestion, CheckCircle2, MinusCircle,
    ChevronDown, ChevronRight, History, MapPin, CalendarClock,
} from "lucide-react";

// The five INZ activity statuses → chip styling + label, mirroring the colours
// on the applicant-facing "Your visa application progress" screen.
const STATUS = {
    not_started:    { label: "Not started",    chip: "bg-slate-100 text-slate-500 border-slate-200",   Icon: CircleDashed },
    in_progress:    { label: "In progress",    chip: "bg-blue-50 text-blue-700 border-blue-200",        Icon: Loader2 },
    info_requested: { label: "Info requested", chip: "bg-amber-50 text-amber-700 border-amber-200",      Icon: MessageCircleQuestion },
    completed:      { label: "Completed",      chip: "bg-green-50 text-green-700 border-green-200",      Icon: CheckCircle2 },
    not_applicable: { label: "Not applicable", chip: "bg-slate-800 text-white border-slate-800",         Icon: MinusCircle },
};

const STATUS_ORDER = ["not_started", "in_progress", "info_requested", "completed", "not_applicable"];

function fmt(dt) {
    if (!dt) return null;
    try {
        return new Date(dt).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return dt; }
}

function StatusChip({ status }) {
    const s = STATUS[status] ?? STATUS.not_started;
    const { Icon } = s;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${s.chip}`}>
            <Icon size={12} className={status === "in_progress" ? "animate-spin" : ""} />
            {s.label}
        </span>
    );
}

// One INZ activity row: description, current status chip, a status picker, and
// an expandable past→present history.
function ActivityRow({ leadId, activity }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const setStatus = (status) => {
        if (status === activity.status) return;
        setSaving(true);
        router.post(`${immBase()}/cases/${leadId}/visa-progress`, { activity: activity.key, status }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    const history = activity.history ?? [];

    return (
        <div className="px-4 py-3.5 border-t border-gray-100 first:border-t-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{activity.label}</p>
                        {history.length > 0 && (
                            <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600">
                                <History size={12} /> {history.length}
                                {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{activity.description}</p>
                    {activity.updated_at && (
                        <p className="text-[10px] text-gray-400 mt-1">Updated {fmt(activity.updated_at)}</p>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <StatusChip status={activity.status} />
                    <select
                        value={activity.status}
                        disabled={saving}
                        onChange={(e) => setStatus(e.target.value)}
                        className="text-xs border border-gray-200 rounded-md py-1 pl-2 pr-6 bg-white text-gray-700 focus:ring-1 focus:ring-[#009688] focus:border-[#009688] disabled:opacity-50"
                    >
                        {STATUS_ORDER.map((k) => (
                            <option key={k} value={k}>{STATUS[k].label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {open && history.length > 0 && (
                <ol className="mt-3 ml-1 border-l border-gray-200 pl-4 space-y-2">
                    {history.map((h, i) => (
                        <li key={i} className="relative">
                            <span className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-gray-300" />
                            <div className="flex items-center gap-2 flex-wrap">
                                <StatusChip status={h.status} />
                                <span className="text-[11px] text-gray-400">{fmt(h.at)}{h.by_name ? ` · ${h.by_name}` : ""}</span>
                            </div>
                            {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}

// The INZ sub-status tracker, shown nested under the current stage when the case
// is at Visa Lodged → outcome.
function SubStatusTracker({ leadId, visaProgress }) {
    const [appStatus, setAppStatus] = useState(visaProgress.application_status ?? "");
    const [lodgedAt, setLodgedAt] = useState(visaProgress.lodged_at ? visaProgress.lodged_at.slice(0, 16) : "");
    const [savingHead, setSavingHead] = useState(false);

    const saveHead = () => {
        setSavingHead(true);
        router.post(`${immBase()}/cases/${leadId}/visa-progress/status`, {
            application_status: appStatus || null,
            lodged_at: lodgedAt || null,
        }, { preserveScroll: true, onFinish: () => setSavingHead(false) });
    };

    // Group activities by their INZ "Status" column, preserving catalogue order.
    const groups = [];
    (visaProgress.activities ?? []).forEach((a) => {
        let g = groups.find((x) => x.name === a.group);
        if (!g) { g = { name: a.group, items: [] }; groups.push(g); }
        g.items.push(a);
    });

    return (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Head: lodge date + overall application status */}
            <div className="px-4 py-3 bg-[#f7faf8] border-b border-gray-100 flex flex-wrap items-end gap-4">
                <label className="text-xs text-gray-600">
                    <span className="flex items-center gap-1.5 mb-1 font-semibold text-gray-700"><CalendarClock size={13} /> Visa lodged</span>
                    <input type="datetime-local" value={lodgedAt} onChange={(e) => setLodgedAt(e.target.value)}
                        className="text-xs border border-gray-200 rounded-md py-1.5 px-2 bg-white" />
                </label>
                <label className="text-xs text-gray-600 flex-1 min-w-[180px]">
                    <span className="mb-1 block font-semibold text-gray-700">Application status</span>
                    <input type="text" value={appStatus} onChange={(e) => setAppStatus(e.target.value)} placeholder="e.g. Under Assessment"
                        className="w-full text-xs border border-gray-200 rounded-md py-1.5 px-2 bg-white" />
                </label>
                <button onClick={saveHead} disabled={savingHead}
                    className="text-xs font-semibold bg-[#009688] text-white px-3.5 py-2 rounded-md hover:bg-[#00877a] disabled:opacity-50">
                    {savingHead ? "Saving…" : "Save"}
                </button>
            </div>

            {/* Activities grouped by phase */}
            {groups.map((g) => (
                <div key={g.name}>
                    <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-100">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">{g.name}</p>
                    </div>
                    {g.items.map((a) => <ActivityRow key={a.key} leadId={leadId} activity={a} />)}
                </div>
            ))}
        </div>
    );
}

/**
 * Stages tab — the dated timeline of every immigration stage this case moved
 * through (outer level), with the CURRENT stage expanding into the INZ
 * sub-status tracker (inner level: past + current sub-status) when the case is
 * at Visa Lodged → outcome.
 */
export default function StagesTab({ lead = {}, visaProgress = { tracked: false, activities: [] }, stageTimeline = [] }) {
    // Newest first for display; the last entry is the current stage.
    const entries = [...(stageTimeline ?? [])].reverse();
    const currentStage = visaProgress.stage ?? lead.immigration_stage;

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <MapPin size={15} className="text-[#009688]" /> Case stages
                </h3>

                {entries.length === 0 && (
                    <p className="text-sm text-gray-400">No stage changes recorded yet.</p>
                )}

                <ol className="relative border-l-2 border-gray-100 ml-2 space-y-6">
                    {entries.map((e, i) => {
                        const isCurrent = i === 0 && e.stage === currentStage;
                        return (
                            <li key={i} className="ml-5 relative">
                                <span className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${isCurrent ? "bg-[#009688]" : "bg-gray-300"}`} />
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className={`text-sm font-semibold ${isCurrent ? "text-[#009688]" : "text-gray-900"}`}>{e.stage ?? "—"}</p>
                                    {isCurrent && <span className="text-[10px] font-bold uppercase tracking-wide text-[#009688] bg-[#009688]/10 px-2 py-0.5 rounded-full">Current</span>}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    {fmt(e.at)}{e.by_name ? ` · ${e.by_name}` : ""}{e.assignee ? ` · assigned ${e.assignee}` : ""}
                                </p>

                                {/* The current stage expands into the sub-status tracker. */}
                                {isCurrent && visaProgress.tracked && (
                                    <SubStatusTracker leadId={lead.id} visaProgress={visaProgress} />
                                )}
                            </li>
                        );
                    })}
                </ol>

                {/* If the case is tracked but has no immigration stage_history entry
                    yet, still surface the tracker so staff can use it. */}
                {entries.length === 0 && visaProgress.tracked && (
                    <SubStatusTracker leadId={lead.id} visaProgress={visaProgress} />
                )}
            </div>
        </div>
    );
}
