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

export default function DtrSummary({ teams = [], total = {}, start = "", end = "", pendingLeaves = [] }) {
    const [range, setRange] = useState({ start, end });
    const apply = (next) => {
        setRange(next);
        router.get("/admin/dtr/summary", next, { preserveState: true, preserveScroll: true, replace: true });
    };
    const review = (id, action) => router.post(`/dtr/leaves/${id}/review`, { action }, { preserveScroll: true });

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

            {/* Pending leave requests — awaiting approval */}
            {pendingLeaves.length > 0 && (
                <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/60">
                        <h2 className="text-sm font-bold text-amber-800">Leave requests awaiting approval · {pendingLeaves.length}</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {pendingLeaves.map((l) => (
                            <div key={l.id} className="flex items-center justify-between gap-4 px-6 py-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">{l.user} · <span className="text-gray-600">{l.type}</span></p>
                                    <p className="text-xs text-gray-500">{l.start_date}{l.end_date !== l.start_date ? ` → ${l.end_date}` : ""}{l.reason ? ` · ${l.reason}` : ""}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={() => review(l.id, "approve")} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors">Approve</button>
                                    <button onClick={() => review(l.id, "reject")} className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors">Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No staff have set up a DTR yet.</td></tr>
                            ) : teams.map((t) => (
                                <React.Fragment key={t.team}>
                                    <tr className="bg-gray-50/80 border-y border-gray-100">
                                        <td colSpan={9} className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gray-600">{t.team}</td>
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
                                    <tr className="bg-[#436235]/5 border-b border-gray-100">
                                        <td className="px-4 py-2 text-[11px] font-bold text-[#436235]">{t.team} subtotal</td>
                                        <td></td>
                                        {COLS.map(([k]) => <td key={k} className="px-3 py-2 text-right tabular-nums font-bold text-[#436235]">{fmt(k, t.subtotal[k])}</td>)}
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                        {teams.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-900 text-white">
                                    <td className="px-4 py-3 font-bold uppercase tracking-wider text-[11px]">All staff</td>
                                    <td></td>
                                    {COLS.map(([k]) => <td key={k} className="px-3 py-3 text-right tabular-nums font-bold">{fmt(k, total[k])}</td>)}
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
