import React, { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, CircleDashed, CalendarDays, Clock, AlertTriangle, Download } from "lucide-react";

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const pad = (n) => String(n).padStart(2, "0");
const to12h = (hhmm) => {
    if (!hhmm) return "—";
    const [h, m] = String(hhmm).split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    const hh = ((h + 11) % 12) + 1;
    return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
};

// Month calendar whose cells show a submitted/total submission badge, coloured
// by how many of the team have handed in that day's report.
function ReportCalendar({ date, today, dayCounts, staffCount, onPick }) {
    const [cur, setCur] = useState(() => { const d = new Date(date + "T00:00:00"); return { y: d.getFullYear(), m: d.getMonth() }; });
    const first = new Date(cur.y, cur.m, 1);
    const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate();
    const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    const step = (delta) => setCur((c) => { let m = c.m + delta, y = c.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return { y, m }; });

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{first.toLocaleString("en-US", { month: "long" })} {cur.y}</h3>
                <div className="flex items-center gap-1">
                    <button onClick={() => step(-1)} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft size={18} /></button>
                    <button onClick={() => step(1)} className="p-2 rounded-lg hover:bg-gray-100"><ChevronRight size={18} /></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-gray-400 mb-1.5">{DOW.map((d) => <div key={d}>{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-1.5">
                {cells.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const ds = `${cur.y}-${pad(cur.m + 1)}-${pad(d)}`;
                    const isFuture = ds > today;
                    const isSelected = ds === date;
                    const submitted = dayCounts[ds] || 0;
                    const showBadge = !isFuture && staffCount > 0;
                    const all = submitted >= staffCount && submitted > 0;
                    const cellCls = isFuture ? "bg-gray-50/40 border-gray-100"
                        : all ? "bg-emerald-50 border-emerald-200"
                        : submitted > 0 ? "bg-amber-50 border-amber-200"
                        : "bg-white border-gray-100 hover:border-gray-300";
                    const inner = (
                        <>
                            <span className={`text-sm font-bold ${isFuture ? "text-gray-300" : "text-gray-800"}`}>{d}</span>
                            {showBadge && (
                                <span className={`absolute bottom-2 left-2.5 text-[10px] font-bold ${all ? "text-emerald-700" : submitted > 0 ? "text-amber-600" : "text-gray-400"}`}>
                                    {submitted}/{staffCount}
                                </span>
                            )}
                        </>
                    );
                    const base = `relative h-24 rounded-xl border p-2.5 text-left ${cellCls} ${isSelected ? "ring-2 ring-gray-900 ring-offset-1" : ds === today ? "ring-2 ring-[#436235]" : ""}`;
                    return isFuture ? (
                        <div key={i} className={`${base} cursor-default`}>{inner}</div>
                    ) : (
                        <button key={i} onClick={() => onPick(ds)} className={`${base} transition-all hover:shadow-sm cursor-pointer`}>{inner}</button>
                    );
                })}
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-[11px] text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 inline-block" /> All submitted</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 inline-block" /> Some submitted</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-gray-200 inline-block" /> None yet</span>
            </div>
        </div>
    );
}

// One staffer's row — expands to show their full report for the day.
function RosterRow({ r, date }) {
    const [open, setOpen] = useState(false);
    const filled = (r.tasks || []).filter((t) => (t.task || "").trim() || (t.pending || "").trim());
    const chip = r.on_leave
        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700">On leave · {r.on_leave}</span>
        : r.submitted
            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700"><CheckCircle2 size={11} /> Submitted</span>
            : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700"><CircleDashed size={11} /> Not submitted</span>;

    return (
        <>
            <tr onClick={() => (r.submitted || r.time_in) && setOpen((o) => !o)} className={`${(r.submitted || r.time_in) ? "cursor-pointer hover:bg-gray-50/60" : ""}`}>
                <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{r.name}</p>
                    <p className="text-[11px] text-gray-400">{r.team}</p>
                </td>
                <td className="px-3 py-3">{chip}</td>
                <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{to12h(r.time_in)} – {to12h(r.time_out)}</td>
                <td className="px-3 py-3 tabular-nums font-semibold text-gray-800">{r.net_hrs != null ? Number(r.net_hrs).toFixed(2) : "—"}</td>
                <td className="px-3 py-3">
                    {r.attendance
                        ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${r.attendance === "Late" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{r.attendance === "Late" ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />} {r.attendance}</span>
                        : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-3 tabular-nums text-gray-600">{r.tasks_count}</td>
                <td className="px-3 py-3 text-right text-gray-300">{(r.submitted || r.time_in) ? <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} /> : null}</td>
            </tr>
            {open && (
                <tr>
                    <td colSpan={7} className="p-0 bg-gray-50/50 border-t border-gray-100">
                        <div className="p-5 space-y-4">
                            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                                <div className="grid grid-cols-[36px_1fr_1fr] bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    <div className="px-2 py-2 text-center">#</div>
                                    <div className="px-3 py-2 border-l border-gray-200">Task completed</div>
                                    <div className="px-3 py-2 border-l border-gray-200">Pending / for tomorrow</div>
                                </div>
                                {filled.length === 0 ? (
                                    <div className="px-3 py-4 text-center text-xs text-gray-400">No tasks logged.</div>
                                ) : filled.map((t, i) => (
                                    <div key={i} className="grid grid-cols-[36px_1fr_1fr] border-b border-gray-100 last:border-b-0">
                                        <div className="flex items-center justify-center text-[11px] text-gray-400 tabular-nums">{i + 1}</div>
                                        <div className="px-3 py-2 text-sm text-gray-800 border-l border-gray-100">{t.task || <span className="text-gray-300">—</span>}</div>
                                        <div className="px-3 py-2 text-sm text-gray-800 border-l border-gray-100">{t.pending || <span className="text-gray-300">—</span>}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Remarks</p>
                                    <p className="text-sm text-gray-700">{r.remarks || <span className="text-gray-300">—</span>}</p>
                                </div>
                                <a href={`/dtr/report?date=${date}&user=${r.user_id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-[#436235] text-white text-xs font-bold rounded-lg hover:bg-[#375029] transition-colors shrink-0">
                                    <Download size={13} /> Generate report
                                </a>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function DtrReports({ date = "", today = "", staffCount = 0, dayCounts = {}, roster = [] }) {
    const pick = (ds) => router.get("/admin/dtr/reports", { date: ds }, { preserveState: true, preserveScroll: true, replace: true });

    const submittedCount = useMemo(() => roster.filter((r) => r.submitted).length, [roster]);
    const onLeaveCount = useMemo(() => roster.filter((r) => r.on_leave).length, [roster]);
    const prettyDate = useMemo(() => {
        try { return new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }); }
        catch { return date; }
    }, [date]);

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <Head title="DTR — Team Daily Reports" />

            <div>
                <Link href="/admin/dtr" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-2">
                    <ArrowLeft size={14} /> Back to my DTR
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Daily Reports</h1>
                <p className="text-sm text-gray-500 mt-1">See who has submitted their end-of-day report. Pick a day on the calendar, then open a staffer's row to read their report.</p>
            </div>

            <ReportCalendar date={date} today={today} dayCounts={dayCounts} staffCount={staffCount} onPick={pick} />

            {/* Selected day roster */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-[#436235]" />
                        <h2 className="text-base font-bold text-gray-900">{prettyDate}</h2>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold"><CheckCircle2 size={12} /> {submittedCount} submitted</span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold"><CircleDashed size={12} /> {staffCount - submittedCount - onLeaveCount} pending</span>
                        {onLeaveCount > 0 && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold">{onLeaveCount} on leave</span>}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Staff</th>
                                <th className="px-3 py-3">Report</th>
                                <th className="px-3 py-3">In – Out</th>
                                <th className="px-3 py-3">Net</th>
                                <th className="px-3 py-3">Attendance</th>
                                <th className="px-3 py-3">Tasks</th>
                                <th className="px-3 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {roster.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No staff have a DTR set up yet.</td></tr>
                            ) : roster.map((r) => <RosterRow key={r.user_id} r={r} date={date} />)}
                        </tbody>
                    </table>
                </div>
                <p className="px-6 py-3 text-[11px] text-gray-400 flex items-center gap-1.5 border-t border-gray-100">
                    <Clock size={12} /> A report counts as submitted once the staffer clocks out or logs tasks for the day. Click a submitted row to read the report.
                </p>
            </div>
        </div>
    );
}
