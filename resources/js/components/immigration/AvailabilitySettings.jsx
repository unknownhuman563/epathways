import { useState } from "react";
import { router } from "@inertiajs/react";
import { Save } from "lucide-react";

const DAYS = [
    ["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"],
    ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"],
];

// Weekly availability editor: the logged-in user sets their own hours (Mon–Sun),
// and sees the hours other immigration advisers have set.
export default function AvailabilitySettings({ myAvailability = {}, teamAvailability = [], currentUserId }) {
    const [schedule, setSchedule] = useState(() => {
        const base = {};
        DAYS.forEach(([k]) => { base[k] = myAvailability[k] || { enabled: false, start: "09:00", end: "17:00" }; });
        return base;
    });
    const [saving, setSaving] = useState(false);

    const setDay = (day, patch) => setSchedule((s) => ({ ...s, [day]: { ...s[day], ...patch } }));

    const save = () => {
        setSaving(true);
        router.post("/portal/immigration/availability", { schedule }, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setSaving(false),
        });
    };

    const summarize = (sched) => DAYS
        .filter(([k]) => sched?.[k]?.enabled)
        .map(([k, label]) => `${label.slice(0, 3)} ${sched[k].start}–${sched[k].end}`);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* My availability editor */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-1">My weekly availability</h3>
                <p className="text-xs text-gray-500 mb-4">Set the hours you're available for consultations each day (New Zealand time).</p>
                <div className="space-y-2">
                    {DAYS.map(([k, label]) => {
                        const d = schedule[k];
                        return (
                            <div key={k} className={`flex items-center gap-3 rounded-xl border p-2.5 ${d.enabled ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"}`}>
                                <label className="flex items-center gap-2 w-32 shrink-0 cursor-pointer">
                                    <input type="checkbox" checked={d.enabled} onChange={(e) => setDay(k, { enabled: e.target.checked })} className="rounded border-gray-300 text-[#436235] focus:ring-[#436235]" />
                                    <span className={`text-sm font-medium ${d.enabled ? "text-gray-800" : "text-gray-400"}`}>{label}</span>
                                </label>
                                {d.enabled ? (
                                    <div className="flex items-center gap-2 text-sm">
                                        <input type="time" value={d.start} onChange={(e) => setDay(k, { start: e.target.value })} className="px-2 py-1 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30" />
                                        <span className="text-gray-400">–</span>
                                        <input type="time" value={d.end} onChange={(e) => setDay(k, { end: e.target.value })} className="px-2 py-1 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30" />
                                    </div>
                                ) : <span className="text-xs text-gray-400">Unavailable</span>}
                            </div>
                        );
                    })}
                </div>
                <button onClick={save} disabled={saving} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#436235] text-white text-sm font-semibold rounded-xl hover:bg-[#375029] disabled:opacity-50">
                    <Save size={15} /> {saving ? "Saving…" : "Save availability"}
                </button>
            </div>

            {/* Team availability */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Team availability</h3>
                <p className="text-xs text-gray-500 mb-4">Hours set by other immigration advisers.</p>
                <div className="space-y-3">
                    {teamAvailability.length === 0 ? (
                        <p className="text-sm text-gray-400">No team members yet.</p>
                    ) : teamAvailability.map((m) => {
                        const hrs = summarize(m.schedule);
                        return (
                            <div key={m.id} className="rounded-xl border border-gray-100 p-3">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">{m.name?.[0]?.toUpperCase()}</span>
                                    <span className="text-sm font-semibold text-gray-800">{m.name}{m.id === currentUserId ? " (You)" : ""}</span>
                                    {! m.is_set && <span className="text-[10px] text-gray-400">not set</span>}
                                </div>
                                {hrs.length === 0 ? (
                                    <p className="text-xs text-gray-400 pl-9">No available days.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5 pl-9">
                                        {hrs.map((h, i) => <span key={i} className="text-[11px] bg-gray-50 border border-gray-200 rounded-md px-2 py-0.5 text-gray-600">{h}</span>)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
