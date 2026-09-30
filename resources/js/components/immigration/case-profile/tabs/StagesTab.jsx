import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { immBase } from "@/lib/caseRoutes";
import { History, ChevronDown, MapPin } from "lucide-react";

// The five INZ activity statuses → pill styling, mirroring the applicant-facing
// "Your visa application progress" screen. One control per row (a coloured
// dropdown that both shows and sets the status) — no separate chip.
const STATUS = {
    not_started:    { label: "Not started",    pill: "bg-slate-100 text-slate-500 border-slate-200" },
    in_progress:    { label: "In progress",    pill: "bg-blue-50 text-blue-700 border-blue-200" },
    info_requested: { label: "Info requested", pill: "bg-amber-50 text-amber-700 border-amber-200" },
    completed:      { label: "Completed",      pill: "bg-green-50 text-green-700 border-green-200" },
    not_applicable: { label: "Not applicable", pill: "bg-slate-700 text-white border-slate-700" },
};
const STATUS_ORDER = ["not_started", "in_progress", "info_requested", "completed", "not_applicable"];

function fmt(dt) {
    if (!dt) return null;
    try {
        return new Date(dt).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return dt; }
}

// One INZ activity: name + description on the left, a single coloured status
// dropdown on the right, and an optional (collapsed) history of past statuses.
function ActivityRow({ leadId, activity }) {
    const [saving, setSaving] = useState(false);
    const [open, setOpen] = useState(false);
    const s = STATUS[activity.status] ?? STATUS.not_started;
    const history = activity.history ?? [];

    const setStatus = (status) => {
        if (status === activity.status) return;
        setSaving(true);
        router.post(`${immBase()}/cases/${leadId}/visa-progress`, { activity: activity.key, status }, {
            preserveScroll: true, onFinish: () => setSaving(false),
        });
    };

    return (
        <div className="px-4 py-2.5 border-t border-gray-100 first:border-t-0">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800">{activity.label}</p>
                    <p className="text-[11px] text-gray-500 leading-snug">{activity.description}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {history.length > 1 && (
                        <button type="button" onClick={() => setOpen((o) => !o)} title="Status history"
                            className="p-1 text-gray-300 hover:text-gray-500">
                            <History size={13} />
                        </button>
                    )}
                    <div className="relative">
                        <select value={activity.status} disabled={saving} onChange={(e) => setStatus(e.target.value)}
                            className={`appearance-none cursor-pointer text-[11px] font-semibold rounded-full border pl-3 pr-7 py-1 focus:outline-none disabled:opacity-50 ${s.pill}`}>
                            {STATUS_ORDER.map((k) => <option key={k} value={k} className="bg-white text-gray-700">{STATUS[k].label}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>
                </div>
            </div>

            {open && history.length > 0 && (
                <ol className="mt-2 ml-1 border-l border-gray-200 pl-3 space-y-1">
                    {history.map((h, i) => (
                        <li key={i} className="flex items-center gap-2 text-[11px] text-gray-400">
                            <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-semibold ${(STATUS[h.status] ?? STATUS.not_started).pill}`}>
                                {(STATUS[h.status] ?? STATUS.not_started).label}
                            </span>
                            <span>{fmt(h.at)}{h.by_name ? ` · ${h.by_name}` : ""}</span>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}

// The INZ sub-status tracker, nested under the current stage (Visa Lodged →
// outcome). Clean: just the activities grouped by phase — no input fields.
function SubStatusTracker({ leadId, visaProgress }) {
    const groups = [];
    (visaProgress.activities ?? []).forEach((a) => {
        let g = groups.find((x) => x.name === a.group);
        if (!g) { g = { name: a.group, items: [] }; groups.push(g); }
        g.items.push(a);
    });

    return (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {groups.map((g) => (
                <div key={g.name}>
                    <div className="px-4 py-1.5 bg-gray-50/70 border-t border-gray-100 first:border-t-0">
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
 * through, with the CURRENT stage expanding into the INZ sub-status tracker
 * (Visa Lodged → outcome).
 */
export default function StagesTab({ lead = {}, visaProgress = { tracked: false, activities: [] }, stageTimeline = [] }) {
    const entries = [...(stageTimeline ?? [])].reverse(); // newest first; [0] is current
    const currentStage = visaProgress.stage ?? lead.immigration_stage;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                <MapPin size={15} className="text-[#009688]" /> Case stages
            </h3>

            {entries.length === 0 && !visaProgress.tracked && (
                <p className="text-sm text-gray-400">No stage changes recorded yet.</p>
            )}

            <ol className="relative border-l-2 border-gray-100 ml-1.5 space-y-4">
                {entries.map((e, i) => {
                    const isCurrent = i === 0 && e.stage === currentStage;
                    return (
                        <li key={i} className="ml-5 relative">
                            <span className={`absolute -left-[26px] top-1 w-3 h-3 rounded-full border-2 border-white ${isCurrent ? "bg-[#009688]" : "bg-gray-300"}`} />
                            <div className="flex flex-wrap items-center gap-2">
                                <p className={`text-sm font-semibold ${isCurrent ? "text-[#009688]" : "text-gray-900"}`}>{e.stage ?? "—"}</p>
                                {isCurrent && <span className="text-[10px] font-bold uppercase tracking-wide text-[#009688] bg-[#009688]/10 px-2 py-0.5 rounded-full">Current</span>}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                {fmt(e.at)}{e.by_name ? ` · ${e.by_name}` : ""}
                            </p>

                            {isCurrent && visaProgress.tracked && (
                                <SubStatusTracker leadId={lead.id} visaProgress={visaProgress} />
                            )}
                        </li>
                    );
                })}
            </ol>

            {/* Tracked case with no stage_history entry yet — still show the tracker. */}
            {entries.length === 0 && visaProgress.tracked && (
                <SubStatusTracker leadId={lead.id} visaProgress={visaProgress} />
            )}
        </div>
    );
}
