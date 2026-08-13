import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { CalendarRange, ArrowLeft } from "lucide-react";

const COLS = [
    ["days_logged", "Days Logged"],
    ["total_hours", "Total Hours"],
    ["avg_hrs", "Avg Hrs / Day"],
    ["late_days", "Late Days"],
    ["tasks_recorded", "Tasks Recorded"],
    ["days_missing_tasks", "Days Missing Tasks"],
    ["open_items", "Open Items"],
];

const fmt = (key, v) => (key === "total_hours" || key === "avg_hrs") ? Number(v || 0).toFixed(2) : (v ?? 0);

// Per-team colour, mirroring the spreadsheet (NZ = blue, PH = teal). Falls
// back to a neutral slate for any team we don't have a colour for yet.
const TEAM_THEMES = {
    "New Zealand": { header: "bg-indigo-50 text-indigo-800", subtotalRow: "bg-indigo-50/60", subtotalText: "text-indigo-700" },
    "Philippines": { header: "bg-teal-50 text-teal-800", subtotalRow: "bg-teal-50/60", subtotalText: "text-teal-700" },
};
const teamTheme = (team) => TEAM_THEMES[team] || { header: "bg-slate-50 text-slate-700", subtotalRow: "bg-slate-50/60", subtotalText: "text-slate-700" };

export default function DtrSummary({ teams = [], total = {}, start = "", end = "" }) {
    const [range, setRange] = useState({ start, end });
    const apply = (next) => {
        setRange(next);
        router.get("/admin/dtr/summary", next, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <Head title="DTR — Team Summary" />

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <Link href="/admin/dtr" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-2">
                        <ArrowLeft size={14} /> Back to my DTR
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Summary Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Every staffer's figures for the reporting period — recalculated from their tabs.</p>
                </div>
                <div className="flex items-end gap-3 bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3">
                    <CalendarRange size={18} className="text-[#436235] mb-1.5" />
                    <label className="block">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Period start</span>
                        <input type="date" value={range.start} onChange={(e) => apply({ ...range, start: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30 focus:border-[#436235]" />
                    </label>
                    <label className="block">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Period end</span>
                        <input type="date" value={range.end} onChange={(e) => apply({ ...range, end: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30 focus:border-[#436235]" />
                    </label>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider">
                                <th className="px-4 py-3">Staff</th>
                                <th className="px-3 py-3">Team</th>
                                {COLS.map(([k, label]) => <th key={k} className="px-3 py-3 text-right whitespace-nowrap">{label}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {teams.length === 0 ? (
                                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No DTR records logged in this period.</td></tr>
                            ) : teams.map((t) => {
                                const th = teamTheme(t.team);
                                return (
                                <React.Fragment key={t.team}>
                                    <tr className={`${th.header} border-y border-gray-100`}>
                                        <td colSpan={9} className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest">{t.team} team</td>
                                    </tr>
                                    {t.staff.map((s, i) => (
                                        <tr key={s.name + i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                            <td className="px-4 py-2.5 font-semibold text-gray-800">{s.name}</td>
                                            <td className="px-3 py-2.5 text-gray-500">{s.team}</td>
                                            {COLS.map(([k]) => (
                                                <td key={k} className={`px-3 py-2.5 text-right tabular-nums ${k === "late_days" && s[k] > 0 ? "text-rose-600 font-semibold" : k === "days_missing_tasks" && s[k] > 0 ? "text-amber-600 font-semibold" : "text-gray-800"}`}>
                                                    {fmt(k, s[k])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    <tr className={`${th.subtotalRow} border-b border-gray-100`}>
                                        <td className={`px-4 py-2 text-[11px] font-bold ${th.subtotalText}`}>{t.team} subtotal</td>
                                        <td></td>
                                        {COLS.map(([k]) => <td key={k} className={`px-3 py-2 text-right tabular-nums font-bold ${th.subtotalText}`}>{fmt(k, t.subtotal[k])}</td>)}
                                    </tr>
                                </React.Fragment>
                                );
                            })}
                        </tbody>
                        {teams.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-900 text-white">
                                    <td className="px-4 py-3 font-bold uppercase tracking-wider text-[11px]">All staff</td>
                                    <td></td>
                                    {COLS.map(([k]) => (
                                        <td key={k} className={`px-3 py-3 text-right tabular-nums font-bold ${k === "late_days" && total[k] > 0 ? "text-rose-300" : k === "days_missing_tasks" && total[k] > 0 ? "text-amber-300" : ""}`}>
                                            {fmt(k, total[k])}
                                        </td>
                                    ))}
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            <p className="text-[11px] text-gray-400">
                Days Missing Tasks counts any day where time was recorded but no task was written. Open Items counts pending lines still sitting on each tab. Total Hours is the payroll figure for the period.
            </p>
        </div>
    );
}
