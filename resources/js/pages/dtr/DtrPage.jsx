import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { Clock, LogIn, LogOut, Save, Settings, AlertTriangle, CheckCircle, BarChart3, Download, ChevronDown, ListChecks, ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Known teams → their timezone. Picking a team in Setup auto-fills the tz so
// PH/NZ staff can't mismatch them. Add teams here as they're onboarded.
const TEAM_TZ = { "Philippines": "Asia/Manila", "New Zealand": "Pacific/Auckland" };
const KNOWN_TEAMS = Object.keys(TEAM_TZ);

// Carried-forward pending items from earlier days — the checklist to close.
function CarriedChecklist({ carried }) {
    const [items, setItems] = useState(carried);
    useEffect(() => setItems(carried), [carried]);
    if (!items.length) return null;

    const done = (it) => {
        setItems((p) => p.filter((x) => !(x.entry_id === it.entry_id && x.index === it.index)));
        router.post("/dtr/pending/toggle", { entry_id: it.entry_id, index: it.index, done: true }, { preserveScroll: true, preserveState: true });
    };

    return (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
                <ListChecks size={16} className="text-amber-700" />
                <h2 className="text-sm font-bold text-amber-800">Carry-over checklist — {items.length} pending item{items.length === 1 ? "" : "s"} to close</h2>
            </div>
            <div className="space-y-1.5">
                {items.map((it) => (
                    <label key={`${it.entry_id}-${it.index}`} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-white border border-amber-100 hover:border-amber-300 cursor-pointer transition-colors">
                        <input type="checkbox" onChange={() => done(it)} className="mt-0.5 accent-emerald-600" />
                        <span className="text-sm text-gray-800 flex-1">{it.text}</span>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">from {it.date}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

// Interactive month calendar — colours each day by its logged status and
// lets you click a logged day to open its editor in the table.
function DtrCalendar({ entries, leaves = [], holidays = {}, today, expanded, onPick }) {
    const byDate = useMemo(() => Object.fromEntries(entries.map((e) => [e.work_date, e])), [entries]);
    const leaveByDate = useMemo(() => {
        const m = {};
        leaves.filter((l) => l.status === "approved").forEach((l) => {
            const d = new Date(l.start_date + "T00:00:00");
            const end = new Date(l.end_date + "T00:00:00");
            while (d <= end) {
                m[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`] = l.type;
                d.setDate(d.getDate() + 1);
            }
        });
        return m;
    }, [leaves]);
    const [cur, setCur] = useState(() => { const d = new Date(today + "T00:00:00"); return { y: d.getFullYear(), m: d.getMonth() }; });
    const first = new Date(cur.y, cur.m, 1);
    const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate();
    const pad = (n) => String(n).padStart(2, "0");
    const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    const step = (delta) => setCur((c) => { let m = c.m + delta, y = c.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return { y, m }; });

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">{first.toLocaleString("en-US", { month: "long" })} {cur.y}</h3>
                <div className="flex items-center gap-1">
                    <button onClick={() => step(-1)} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft size={16} /></button>
                    <button onClick={() => step(1)} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={16} /></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-1">{DOW.map((d) => <div key={d}>{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-1">
                {cells.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const ds = `${cur.y}-${pad(cur.m + 1)}-${pad(d)}`;
                    const e = byDate[ds];
                    const leaveType = leaveByDate[ds];
                    const holidayName = holidays[ds];
                    const isToday = ds === today;
                    const missing = e && e.net_hrs != null && e.tasks_count === 0;
                    const late = e && e.attendance === "Late";
                    const cellCls = leaveType ? "bg-indigo-50 border-indigo-200"
                        : missing ? "bg-amber-50 border-amber-200"
                        : late ? "bg-rose-50 border-rose-200"
                        : e ? "bg-emerald-50 border-emerald-200"
                        : holidayName ? "bg-orange-50 border-orange-200"
                        : "bg-white border-gray-100 hover:border-gray-300";
                    const label = leaveType ? leaveType
                        : late ? "Late"
                        : missing ? "No task"
                        : (e && e.net_hrs != null) ? `${e.net_hrs.toFixed(1)}h`
                        : holidayName || "";
                    const labelTone = leaveType ? "text-indigo-600" : late ? "text-rose-600" : missing ? "text-amber-600" : e ? "text-emerald-700" : "text-orange-600";
                    return (
                        <button key={i} onClick={() => onPick(ds)} title={[leaveType && `Leave — ${leaveType}`, holidayName].filter(Boolean).join(" · ") || undefined}
                            className={`relative h-16 rounded-xl border p-2 text-left transition-all hover:shadow-sm cursor-pointer ${cellCls} ${isToday ? "ring-2 ring-[#436235]" : ""} ${expanded === ds ? "ring-2 ring-gray-900 ring-offset-1" : ""}`}>
                            <span className={`text-xs font-bold ${e || leaveType || holidayName ? "text-gray-800" : "text-gray-400"}`}>{d}</span>
                            {holidayName && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-400" />}
                            {label && <span className={`absolute bottom-1.5 left-2 truncate max-w-[calc(100%-1rem)] text-[9px] font-bold ${labelTone}`}>{label}</span>}
                        </button>
                    );
                })}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 inline-block" /> Logged</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 inline-block" /> No task</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-100 inline-block" /> Late</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-100 inline-block" /> Leave</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> Holiday</span>
            </div>
        </div>
    );
}

// File-leave form + the user's own leave requests (Calendar tab side panel).
function LeavePanel({ leaves = [], leaveTypes = [], minLeaveDate = "" }) {
    const [f, setF] = useState({ type: leaveTypes[0] || "Vacation", start_date: minLeaveDate, end_date: minLeaveDate, reason: "" });
    const [saving, setSaving] = useState(false);
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
    const submit = () => {
        setSaving(true);
        router.post("/dtr/leaves", f, { preserveScroll: true, onFinish: () => setSaving(false), onSuccess: () => setF((p) => ({ ...p, reason: "" })) });
    };
    const input = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30 focus:border-[#436235]";
    const badge = (s) => s === "approved" ? "bg-emerald-100 text-emerald-700" : s === "rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-1">File a leave</h3>
                <p className="text-[11px] text-gray-400 mb-4">Must be filed at least 1 week ahead. Approved by admin.</p>
                <div className="space-y-3">
                    <label className="block">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Type</span>
                        <select className={input} value={f.type} onChange={set("type")}>
                            {leaveTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">From</span>
                            <input type="date" min={minLeaveDate} className={input} value={f.start_date} onChange={set("start_date")} />
                        </label>
                        <label className="block">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">To</span>
                            <input type="date" min={f.start_date || minLeaveDate} className={input} value={f.end_date} onChange={set("end_date")} />
                        </label>
                    </div>
                    <label className="block">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Reason</span>
                        <textarea rows={2} className={`${input} resize-y`} value={f.reason} onChange={set("reason")} placeholder="Optional…" />
                    </label>
                    <button onClick={submit} disabled={saving} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#436235] text-white text-sm font-bold rounded-xl hover:bg-[#375029] disabled:opacity-60 transition-colors">
                        {saving ? "Submitting…" : "Submit leave request"}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">My leave requests</h3>
                {leaves.length === 0 ? (
                    <p className="text-xs text-gray-400">No leave filed yet.</p>
                ) : (
                    <div className="space-y-2">
                        {leaves.map((l) => (
                            <div key={l.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-100">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800">{l.type}</p>
                                    <p className="text-[11px] text-gray-500">{l.start_date}{l.end_date !== l.start_date ? ` → ${l.end_date}` : ""}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${badge(l.status)}`}>{l.status}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const MIN_TASK_ROWS = 5; // starting rows; users add more as needed
const blankTasks = () => Array.from({ length: MIN_TASK_ROWS }, () => ({ task: "", pending: "" }));

const toMinutes = (hhmm) => {
    if (!hhmm) return null;
    const [h, m] = String(hhmm).split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
};
const to12h = (hhmm) => {
    if (!hhmm) return "—";
    const [h, m] = String(hhmm).split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    const hh = ((h + 11) % 12) + 1;
    return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
};

// Client-side mirror of the server's Net/Variance/Attendance formula for a live
// preview before saving. The saved rows carry the authoritative values.
const compute = (timeIn, timeOut, s) => {
    const std = Number(s?.std_hours ?? 8);
    const brk = Number(s?.break_hours ?? 1);
    const brkAfter = Number(s?.break_after ?? 6);
    const grace = Number(s?.grace_mins ?? 10);
    let net = null, variance = null, attendance = null;
    const inM = toMinutes(timeIn), outM0 = toMinutes(timeOut);
    if (inM != null && outM0 != null) {
        let outM = outM0 <= inM ? outM0 + 24 * 60 : outM0;
        const worked = (outM - inM) / 60;
        net = Math.round((worked >= brkAfter ? worked - brk : worked) * 100) / 100;
        variance = Math.round((net - std) * 100) / 100;
    }
    if (inM != null && s?.sched_in) {
        attendance = inM <= toMinutes(s.sched_in) + grace ? "On Time" : "Late";
    }
    return { net, variance, attendance };
};

// Module-level so they keep a stable identity across renders — defining these
// inside a component remounts the inputs on every keystroke (focus loss).
function Field({ label, hint, children }) {
    return (
        <label className="block">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</span>
            {children}
            {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
        </label>
    );
}

function Metric({ label, value, tone }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
            <p className={`text-lg font-bold ${tone || "text-gray-900"}`}>{value}</p>
        </div>
    );
}

export default function DtrPage({ setting = null, entries = [], carried = [], leaves = [], leaveTypes = [], minLeaveDate = "", holidays = {}, account = {}, today = "", canSummary = false }) {
    const ready = setting && setting.is_complete;
    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <Head title="DTR — Daily Time & Task Record" />
            {ready
                ? <DailyRecord setting={setting} entries={entries} carried={carried} leaves={leaves} leaveTypes={leaveTypes} minLeaveDate={minLeaveDate} holidays={holidays} account={account} today={today} canSummary={canSummary} />
                : <SetupForm setting={setting} account={account} />}
        </div>
    );
}

// ── Initial setup (the yellow cells, set once) ─────────────────────────────
function SetupForm({ setting, account }) {
    const tzOptions = useMemo(() => {
        try { return Intl.supportedValuesOf("timeZone"); }
        catch { return ["Asia/Manila", "Pacific/Auckland", "Australia/Sydney", "UTC"]; }
    }, []);
    const [f, setF] = useState({
        label: setting?.label || `${account.name || "My"} · DTR`,
        position: setting?.position || "",
        team: setting?.team || "",
        timezone: setting?.timezone || "Asia/Manila",
        sched_in: setting?.sched_in || "09:00",
        sched_out: setting?.sched_out || "18:00",
        break_hours: setting?.break_hours ?? 1,
        reports_to: setting?.reports_to || "",
        std_hours: setting?.std_hours ?? 8,
        grace_mins: setting?.grace_mins ?? 10,
        break_after: setting?.break_after ?? 6,
    });
    const [saving, setSaving] = useState(false);
    const [otherTeam, setOtherTeam] = useState(!!setting?.team && !KNOWN_TEAMS.includes(setting.team));
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

    // Picking a known team auto-fills the timezone; "Other" lets them type a
    // custom team name and keep their own timezone.
    const onTeamChange = (e) => {
        const v = e.target.value;
        if (v === "__other") { setOtherTeam(true); setF((p) => ({ ...p, team: "" })); return; }
        setOtherTeam(false);
        setF((p) => ({ ...p, team: v, timezone: TEAM_TZ[v] || p.timezone }));
    };

    const save = () => {
        setSaving(true);
        router.post("/dtr/setup", f, { preserveScroll: true, onFinish: () => setSaving(false) });
    };

    const input = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30 focus:border-[#436235]";

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400 mb-1">Set up your DTR</p>
                <h1 className="text-2xl font-bold text-gray-900">Let's set up your Daily Time & Task Record</h1>
                <p className="text-sm text-gray-500 mt-1">Fill these once — they drive your Net Hours, Variance and Attendance. Linked account: <span className="font-semibold text-gray-700">{account.name} ({account.email})</span></p>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <Field label="DTR name"><input className={input} value={f.label} onChange={set("label")} placeholder="e.g. Angelika · DTR" /></Field>
                <Field label="Position"><input className={input} value={f.position} onChange={set("position")} /></Field>
                <Field label="Team" hint="Sets your holidays & default timezone">
                    <select className={input} value={otherTeam ? "__other" : f.team} onChange={onTeamChange}>
                        <option value="">Select team…</option>
                        {KNOWN_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                        <option value="__other">Other…</option>
                    </select>
                    {otherTeam && (
                        <input className={`${input} mt-2`} value={f.team} onChange={set("team")} placeholder="Custom team name" />
                    )}
                </Field>

                <Field label="Time zone">
                    <select className={input} value={f.timezone} onChange={set("timezone")}>
                        {tzOptions.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                    </select>
                </Field>
                <Field label="Sched. in" hint="When your duty starts"><input type="time" className={input} value={f.sched_in} onChange={set("sched_in")} /></Field>
                <Field label="Sched. out" hint="When you're done for the day"><input type="time" className={input} value={f.sched_out} onChange={set("sched_out")} /></Field>

                <Field label="Break (hrs)"><input type="number" step="0.25" min="0" className={input} value={f.break_hours} onChange={set("break_hours")} /></Field>
                <Field label="Break after (hrs)" hint="Break is deducted once you work past this"><input type="number" step="0.5" min="0" className={input} value={f.break_after} onChange={set("break_after")} /></Field>
                <Field label="Std hrs / day"><input type="number" step="0.5" min="0" className={input} value={f.std_hours} onChange={set("std_hours")} /></Field>

                <Field label="Grace (mins)" hint="Late is counted after this"><input type="number" step="1" min="0" className={input} value={f.grace_mins} onChange={set("grace_mins")} /></Field>
                <Field label="Reports to"><input className={input} value={f.reports_to} onChange={set("reports_to")} /></Field>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#436235] text-white text-sm font-bold rounded-xl hover:bg-[#375029] disabled:opacity-60 transition-colors">
                    <Save size={15} /> {saving ? "Saving…" : "Save & start my DTR"}
                </button>
            </div>
        </div>
    );
}

// ── Daily record ───────────────────────────────────────────────────────────
// Client-side CSV export of the user's logged days (payroll-ready columns).
function exportCsv(entries, setting) {
    const header = ["Date", "Day", "Time In", "Time Out", "Net Hrs", "Variance", "Attendance", "Tasks", "Open", "Remarks"];
    const rows = entries.map((e) => [
        e.work_date, e.day, to12h(e.time_in), to12h(e.time_out),
        e.net_hrs ?? "", e.variance ?? "", e.attendance ?? "",
        e.tasks_count, e.open_count, (e.remarks || "").replace(/\s+/g, " "),
    ]);
    const csv = [header, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `DTR_${(setting.label || "record").replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Editor for a single day — reused for Today (clock-driven, read-only times)
// and for editing/backfilling a past day (editable times). Keyed by date so
// each instance mounts fresh from its own entry.
function DayEditor({ setting, entry, date, isToday = false }) {
    const [timeIn, setTimeIn] = useState(entry?.time_in || "");
    const [timeOut, setTimeOut] = useState(entry?.time_out || "");
    const [remarks, setRemarks] = useState(entry?.remarks || "");
    const [tasks, setTasks] = useState(() => {
        const rows = (entry?.tasks || []).map((r) => ({ task: r.task || "", pending: r.pending || "" }));
        while (rows.length < MIN_TASK_ROWS) rows.push({ task: "", pending: "" });
        return rows;
    });
    const [saving, setSaving] = useState(false);

    const live = compute(timeIn, timeOut, setting);
    const filledTasks = tasks.filter((t) => t.task.trim()).length;
    const filledOpen = tasks.filter((t) => t.pending.trim()).length;
    const setTask = (i, k) => (e) => setTasks((p) => p.map((r, idx) => idx === i ? { ...r, [k]: e.target.value } : r));
    const addRow = () => setTasks((p) => [...p, { task: "", pending: "" }]);
    const stampNow = () => new Date().toLocaleTimeString("en-GB", { timeZone: setting.timezone || "UTC", hour: "2-digit", minute: "2-digit", hour12: false });

    const saveDay = (override = {}) => {
        setSaving(true);
        router.post("/dtr/entry", {
            work_date: date,
            time_in: (override.time_in ?? timeIn) || null,
            time_out: (override.time_out ?? timeOut) || null,
            tasks: tasks.filter((t) => t.task.trim() || t.pending.trim()),
            remarks: remarks || null,
        }, { preserveScroll: true, preserveState: true, onFinish: () => setSaving(false) });
    };
    const clockIn = () => { const t = stampNow(); setTimeIn(t); saveDay({ time_in: t }); };
    const clockOut = () => { const t = stampNow(); setTimeOut(t); saveDay({ time_out: t }); };

    const input = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30 focus:border-[#436235]";
    const roBox = "px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700";
    const varTone = live.variance == null ? "" : live.variance >= 0 ? "text-emerald-600" : "text-rose-600";
    const attTone = live.attendance === "Late" ? "text-rose-600" : live.attendance ? "text-emerald-600" : "";
    const tid = (i) => `dtr-task-${date}-${i}`;

    return (
        <div className="p-6 space-y-5">
            {isToday && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-[#436235]/[0.06] to-transparent border border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            timeOut ? "bg-gray-100 text-gray-500" : timeIn ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                        }`}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</p>
                            <p className="text-sm font-bold text-gray-900">
                                {timeOut ? `Done for the day · ${to12h(timeIn)} – ${to12h(timeOut)}` : timeIn ? `Working since ${to12h(timeIn)}` : "Not clocked in yet"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={clockIn} disabled={!!timeIn} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#436235] text-white text-sm font-bold hover:bg-[#375029] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"><LogIn size={16} /> Clock in</button>
                        <button onClick={clockOut} disabled={!timeIn || !!timeOut} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><LogOut size={16} /> Clock out</button>
                    </div>
                </div>
            )}

            {/* Unified stat strip */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-gray-100">
                    <div className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Time in</p>
                        {isToday
                            ? <p className="text-lg font-bold text-gray-900">{timeIn ? to12h(timeIn) : "—"}</p>
                            : <input type="time" className={input} value={timeIn} onChange={(e) => setTimeIn(e.target.value)} />}
                    </div>
                    <div className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Time out</p>
                        {isToday
                            ? <p className="text-lg font-bold text-gray-900">{timeOut ? to12h(timeOut) : "—"}</p>
                            : <input type="time" className={input} value={timeOut} onChange={(e) => setTimeOut(e.target.value)} />}
                    </div>
                    <div className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Net hrs</p>
                        <p className="text-lg font-bold text-gray-900">{live.net != null ? live.net.toFixed(2) : "—"}</p>
                    </div>
                    <div className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Variance</p>
                        <p className={`text-lg font-bold ${varTone || "text-gray-900"}`}>{live.variance != null ? (live.variance >= 0 ? "+" : "") + live.variance.toFixed(2) : "—"}</p>
                    </div>
                    <div className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Attendance</p>
                        {live.attendance
                            ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${live.attendance === "Late" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{live.attendance === "Late" ? <AlertTriangle size={11} /> : <CheckCircle size={11} />} {live.attendance}</span>
                            : <p className="text-lg font-bold text-gray-300">—</p>}
                    </div>
                    <div className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Schedule</p>
                        <p className="text-sm font-semibold text-gray-700">{to12h(setting.sched_in)} – {to12h(setting.sched_out)}</p>
                    </div>
                </div>
            </div>

            {/* Task grid */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Tasks & pending</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 tabular-nums">{filledTasks} tasks</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 tabular-nums">{filledOpen} open</span>
                    </div>
                </div>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-[36px_1fr_1fr] bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <div className="px-2 py-2.5 text-center">#</div>
                        <div className="px-3 py-2.5 border-l border-gray-200">Task completed</div>
                        <div className="px-3 py-2.5 border-l border-gray-200">Pending / for tomorrow</div>
                    </div>
                    {tasks.map((row, i) => (
                        <div key={i} className="grid grid-cols-[36px_1fr_1fr] border-b border-gray-100 last:border-b-0 hover:bg-gray-50/40 transition-colors">
                            <div className="flex items-center justify-center text-[11px] text-gray-400 tabular-nums">{i + 1}</div>
                            <input
                                id={tid(i)}
                                onKeyDown={(e) => {
                                    if (e.key !== "Enter") return;
                                    e.preventDefault();
                                    if (i === tasks.length - 1) { addRow(); requestAnimationFrame(() => document.getElementById(tid(i + 1))?.focus()); }
                                    else document.getElementById(tid(i + 1))?.focus();
                                }}
                                className="px-3 py-2 text-sm bg-transparent border-l border-gray-100 outline-none focus:bg-[#436235]/[0.05]"
                                placeholder="What did you work on?" value={row.task} onChange={setTask(i, "task")}
                            />
                            <input className="px-3 py-2 text-sm bg-transparent border-l border-gray-100 outline-none focus:bg-[#436235]/[0.05]" placeholder="Anything carried over?" value={row.pending} onChange={setTask(i, "pending")} />
                        </div>
                    ))}
                    <button type="button" onClick={addRow} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[#436235] hover:bg-[#436235]/[0.05] border-t border-gray-100 transition-colors">
                        <Plus size={13} /> Add line
                    </button>
                </div>
            </div>

            <label className="block">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Remarks</span>
                <textarea rows={2} className={`${input} resize-y`} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Anything worth noting…" />
            </label>

            <div className="flex justify-end">
                <button onClick={() => saveDay()} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#436235] text-white text-sm font-bold rounded-xl hover:bg-[#375029] disabled:opacity-60 transition-colors">
                    <Save size={15} /> {saving ? "Saving…" : (isToday ? "Save today" : "Save changes")}
                </button>
            </div>
        </div>
    );
}

function DailyRecord({ setting, entries, carried = [], leaves = [], leaveTypes = [], minLeaveDate = "", holidays = {}, account, today, canSummary = false }) {
    const [showSetup, setShowSetup] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [view, setView] = useState("dtr");
    if (showSetup) return <SetupForm setting={setting} account={account} />;

    const todayEntry = entries.find((e) => e.work_date === today);
    const past = entries.filter((e) => e.work_date !== today);

    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400 mb-1">Daily Time & Task Record</p>
                    <h1 className="text-2xl font-bold text-gray-900">{setting.label || "My DTR"}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {account.name} · {setting.position || "—"} · {setting.team || "—"} · {setting.timezone.replace(/_/g, " ")}
                        {setting.reports_to ? ` · reports to ${setting.reports_to}` : ""}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => exportCsv(entries, setting)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        <Download size={15} /> Export CSV
                    </button>
                    {canSummary && (
                        <Link href="/admin/dtr/summary" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                            <BarChart3 size={15} /> Team Summary
                        </Link>
                    )}
                    <button onClick={() => setShowSetup(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        <Settings size={15} /> Settings
                    </button>
                </div>
            </div>

            {/* View tabs — DTR vs Calendar */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-max">
                <button onClick={() => setView("dtr")} className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-colors ${view === "dtr" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800"}`}>DTR</button>
                <button onClick={() => setView("calendar")} className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-colors ${view === "calendar" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800"}`}>Calendar</button>
            </div>

            {view === "dtr" && (<>
            {/* Carry-over checklist — yesterday's pending items to close today */}
            <CarriedChecklist carried={carried} />

            {/* Today */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-br from-gray-50 to-white">
                    <Clock size={16} className="text-[#436235]" />
                    <h2 className="text-base font-bold text-gray-900">Today — {today}</h2>
                </div>
                <DayEditor key={today} setting={setting} entry={todayEntry} date={today} isToday />
            </div>

            {/* Recent entries */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900">Recent days</h2>
                    <p className="text-[11px] text-gray-400">Click a row to view / edit that day</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Date</th><th className="px-3 py-3">Day</th>
                                <th className="px-3 py-3">In</th><th className="px-3 py-3">Out</th>
                                <th className="px-3 py-3">Net</th><th className="px-3 py-3">Var</th>
                                <th className="px-3 py-3">Attendance</th><th className="px-3 py-3">Tasks</th><th className="px-3 py-3">Open</th>
                                <th className="px-3 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {past.length === 0 ? (
                                <tr><td colSpan="10" className="px-4 py-10 text-center text-gray-400">No past days yet.</td></tr>
                            ) : past.map((e) => (
                                <React.Fragment key={e.id}>
                                    <tr onClick={() => setExpanded(expanded === e.work_date ? null : e.work_date)} className="hover:bg-gray-50/60 cursor-pointer">
                                        <td className="px-4 py-2.5 font-semibold text-gray-800">{e.work_date}</td>
                                        <td className="px-3 py-2.5 text-gray-500">{e.day}</td>
                                        <td className="px-3 py-2.5">{to12h(e.time_in)}</td>
                                        <td className="px-3 py-2.5">{to12h(e.time_out)}</td>
                                        <td className="px-3 py-2.5 font-semibold">{e.net_hrs != null ? e.net_hrs.toFixed(2) : "—"}</td>
                                        <td className={`px-3 py-2.5 font-semibold ${e.variance == null ? "" : e.variance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                            {e.variance != null ? (e.variance >= 0 ? "+" : "") + e.variance.toFixed(2) : "—"}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            {e.attendance ? (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${e.attendance === "Late" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                    {e.attendance === "Late" ? <AlertTriangle size={10} /> : <CheckCircle size={10} />} {e.attendance}
                                                </span>
                                            ) : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-3 py-2.5 tabular-nums">
                                            {e.net_hrs != null && e.tasks_count === 0
                                                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700"><AlertTriangle size={10} /> No task</span>
                                                : e.tasks_count}
                                        </td>
                                        <td className="px-3 py-2.5 tabular-nums">{e.open_count}</td>
                                        <td className="px-3 py-2.5 text-right">
                                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${expanded === e.work_date ? "rotate-180" : ""}`} />
                                        </td>
                                    </tr>
                                    {expanded === e.work_date && (
                                        <tr>
                                            <td colSpan="10" className="p-0 bg-gray-50/40 border-t border-gray-100">
                                                <DayEditor key={e.work_date} setting={setting} entry={e} date={e.work_date} />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            </>)}

            {view === "calendar" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        <DtrCalendar entries={entries} leaves={leaves} holidays={holidays} today={today} expanded={expanded} onPick={(ds) => setExpanded(ds)} />
                        {expanded && (() => {
                            const dayEntry = entries.find((e) => e.work_date === expanded);
                            return (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-gray-50 to-white">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays size={16} className="text-[#436235]" />
                                            <h2 className="text-base font-bold text-gray-900">{expanded}{expanded === today ? " · Today" : ""}</h2>
                                        </div>
                                        {!dayEntry && <span className="text-[11px] text-gray-400">No record yet — add one below</span>}
                                    </div>
                                    <DayEditor key={expanded} setting={setting} entry={dayEntry} date={expanded} isToday={expanded === today} />
                                </div>
                            );
                        })()}
                    </div>
                    <LeavePanel leaves={leaves} leaveTypes={leaveTypes} minLeaveDate={minLeaveDate} />
                </div>
            )}
        </>
    );
}
