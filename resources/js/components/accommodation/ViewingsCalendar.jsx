import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Home } from "lucide-react";

// Day / Week / Month calendar for accommodation property-viewing bookings —
// same interaction model as the immigration bookings calendar, but chips are
// coloured by booking status and show the property. Clicking a day selects it
// so the parent can filter its list.

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CHIP = {
    Pending: "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900",
    Confirmed: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900",
    Completed: "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700",
    Cancelled: "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-900",
};

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const buildMonthGrid = (anchor) => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const offsetToMonday = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - offsetToMonday);
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
};
const buildWeekGrid = (anchor) => {
    const a = startOfDay(anchor);
    a.setDate(a.getDate() - ((a.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(a); d.setDate(a.getDate() + i); return d; });
};

export default function ViewingsCalendar({ viewings = [], selectedKey = null, onSelectDay }) {
    const [anchor, setAnchor] = useState(() => new Date());
    const [mode, setMode] = useState("month");

    const monthGrid = useMemo(() => buildMonthGrid(anchor), [anchor]);
    const weekGrid = useMemo(() => buildWeekGrid(anchor), [anchor]);
    const today = startOfDay(new Date());
    const monthOf = anchor.getMonth();

    const byDate = useMemo(() => {
        const out = new Map();
        for (const b of viewings) {
            if (! b.appointment_date) continue;
            if (! out.has(b.appointment_date)) out.set(b.appointment_date, []);
            out.get(b.appointment_date).push(b);
        }
        return out;
    }, [viewings]);

    const pickDay = (d) => { const k = keyOf(d); onSelectDay?.(selectedKey === k ? null : k); };

    const shiftAnchor = (sign) => {
        const next = new Date(anchor);
        if (mode === "day") next.setDate(anchor.getDate() + sign);
        else if (mode === "week") next.setDate(anchor.getDate() + sign * 7);
        else next.setMonth(anchor.getMonth() + sign);
        setAnchor(next);
    };

    const headerLabel = useMemo(() => {
        if (mode === "day") return anchor.toLocaleDateString("en-NZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        if (mode === "week") {
            const f = weekGrid[0], l = weekGrid[6];
            const sameMonth = f.getMonth() === l.getMonth();
            return `${f.toLocaleDateString("en-NZ", { day: "numeric", month: sameMonth ? undefined : "short" })} – ${l.toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })}`;
        }
        return anchor.toLocaleDateString("en-NZ", { month: "long", year: "numeric" });
    }, [mode, anchor, weekGrid]);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => shiftAnchor(-1)} className="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500"><ChevronLeft size={16} /></button>
                    <h3 className="text-lg font-bold text-gray-900 min-w-[220px] text-center">{headerLabel}</h3>
                    <button type="button" onClick={() => shiftAnchor(1)} className="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500"><ChevronRight size={16} /></button>
                </div>
                <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                        {[["day", "Day"], ["week", "Week"], ["month", "Month"]].map(([key, label]) => (
                            <button key={key} type="button" onClick={() => setMode(key)} className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors ${mode === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{label}</button>
                        ))}
                    </div>
                    <button type="button" onClick={() => setAnchor(new Date())} className="text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50">Today</button>
                </div>
            </div>

            {mode === "month" && (
                <>
                    <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/40">
                        {WEEKDAYS.map((w) => <div key={w} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">{w}</div>)}
                    </div>
                    <div className="grid grid-cols-7">
                        {monthGrid.map((day, idx) => {
                            const inMonth = day.getMonth() === monthOf;
                            const isToday = sameDay(day, today);
                            const k = keyOf(day);
                            const list = byDate.get(k) || [];
                            const selected = selectedKey === k;
                            return (
                                <div key={k} onClick={() => pickDay(day)} className={`min-h-[128px] border-b border-gray-100 cursor-pointer ${idx % 7 === 0 ? "" : "border-l"} ${selected ? "bg-amber-50/60" : inMonth ? "bg-white hover:bg-gray-50/60" : "bg-gray-50/40"}`}>
                                    <div className="flex items-center justify-between px-2 py-1">
                                        <span className={`text-[11px] font-bold tabular-nums inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? "bg-gray-900 text-white" : inMonth ? "text-gray-700" : "text-gray-400"}`}>{day.getDate()}</span>
                                        {list.length > 0 && <span className="text-[9px] font-bold tabular-nums text-gray-400">{list.length}</span>}
                                    </div>
                                    <div className="px-1.5 pb-1.5 space-y-1">
                                        {list.slice(0, 3).map((b) => <ViewingChip key={b.id} b={b} />)}
                                        {list.length > 3 && <p className="text-[10px] text-gray-500 font-medium px-1.5">+{list.length - 3} more</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {mode === "week" && (
                <>
                    <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/40">
                        {weekGrid.map((day) => (
                            <div key={day.toISOString()} className="px-3 py-2 text-center">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{day.toLocaleDateString("en-NZ", { weekday: "short" })}</div>
                                <div className={`mt-1 mx-auto inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold tabular-nums ${sameDay(day, today) ? "bg-gray-900 text-white" : "text-gray-700"}`}>{day.getDate()}</div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {weekGrid.map((day, idx) => {
                            const k = keyOf(day);
                            const list = byDate.get(k) || [];
                            const selected = selectedKey === k;
                            return (
                                <div key={k} onClick={() => pickDay(day)} className={`min-h-[380px] cursor-pointer ${idx === 0 ? "" : "border-l border-gray-100"} ${selected ? "bg-amber-50/60" : "bg-white hover:bg-gray-50/50"}`}>
                                    <div className="px-1.5 py-1.5 space-y-1">
                                        {list.length === 0 ? <p className="text-[10px] text-gray-300 text-center mt-4">No viewings</p> : list.map((b) => <ViewingChip key={b.id} b={b} />)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {mode === "day" && (() => {
                const list = byDate.get(keyOf(anchor)) || [];
                return (
                    <div className="px-4 py-5">
                        {list.length === 0 ? (
                            <p className="text-[12px] text-gray-400 text-center py-10">No viewings on this day.</p>
                        ) : (
                            <div className="space-y-2 max-w-xl mx-auto">{list.map((b) => <ViewingChip key={b.id} b={b} wide />)}</div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}

function ViewingChip({ b, wide = false }) {
    return (
        <div
            title={`${b.name}${b.property ? ` — ${b.property}` : ""}`}
            className={`block w-full text-left rounded-lg border px-2 py-1.5 ${CHIP[b.status] || CHIP.Pending} ${wide ? "px-3 py-2.5" : ""}`}
        >
            <p className="text-[11.5px] font-bold leading-snug truncate">{b.name}</p>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] opacity-80">
                {b.appointment_time && <span className="inline-flex items-center gap-0.5"><Clock size={9} /> {b.appointment_time}</span>}
                <span className="font-semibold">{b.status}</span>
            </div>
            {b.property && <p className="text-[10px] opacity-70 truncate mt-0.5 inline-flex items-center gap-1"><Home size={9} /> {b.property}</p>}
        </div>
    );
}
