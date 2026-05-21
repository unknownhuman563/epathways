import { useState, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import { Search, CalendarDays, Table2, ChevronLeft, ChevronRight, Clock, User } from "lucide-react";

const BOOKING_STYLES = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Confirmed: "bg-blue-100 text-blue-700 border-blue-200",
    Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Cancelled: "bg-red-100 text-red-700 border-red-200",
};
const bookingClass = (s) => BOOKING_STYLES[s] || "bg-gray-100 text-gray-700 border-gray-200";

// Calendar chip palette — used when colour-by = status.
const STATUS_CHIP_TINT = {
    Pending:   { bar: "bg-amber-500",   bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-900"   },
    Confirmed: { bar: "bg-blue-500",    bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-900"    },
    Completed: { bar: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900" },
    Cancelled: { bar: "bg-red-500",     bg: "bg-red-50",     border: "border-red-200",     text: "text-red-900"     },
};
const statusTint = (s) => STATUS_CHIP_TINT[s] || { bar: "bg-gray-400", bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700" };

// Colour palette when colour-by = consultant. Deterministic pick by name
// so the same consultant always lands on the same colour across the grid.
const CONSULTANT_PALETTE = [
    { bar: "bg-blue-500",    bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-900" },
    { bar: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900" },
    { bar: "bg-violet-500",  bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-900" },
    { bar: "bg-amber-500",   bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-900" },
    { bar: "bg-pink-500",    bg: "bg-pink-50",    border: "border-pink-200",    text: "text-pink-900" },
    { bar: "bg-cyan-500",    bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-900" },
    { bar: "bg-orange-500",  bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-900" },
    { bar: "bg-rose-500",    bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-900" },
    { bar: "bg-teal-500",    bg: "bg-teal-50",    border: "border-teal-200",    text: "text-teal-900" },
    { bar: "bg-fuchsia-500", bg: "bg-fuchsia-50", border: "border-fuchsia-200", text: "text-fuchsia-900" },
];
function consultantTint(name) {
    const n = (name || "").trim();
    if (!n) return { bar: "bg-gray-400", bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700" };
    let hash = 0;
    for (let i = 0; i < n.length; i++) hash = (hash * 31 + n.charCodeAt(i)) >>> 0;
    return CONSULTANT_PALETTE[hash % CONSULTANT_PALETTE.length];
}
function chipTint(booking, mode) {
    return mode === "consultant" ? consultantTint(booking.consultant_name) : statusTint(booking.status);
}

function BookingRow({ b, statuses }) {
    const [form, setForm] = useState({
        appointment_date: b.appointment_date || "",
        appointment_time: b.appointment_time || "",
        consultant_name: b.consultant_name || "",
        status: b.status || "Pending",
    });
    const [saving, setSaving] = useState(false);

    const dirty =
        form.appointment_date !== (b.appointment_date || "") ||
        form.appointment_time !== (b.appointment_time || "") ||
        form.consultant_name !== (b.consultant_name || "") ||
        form.status !== (b.status || "Pending");

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const save = () => {
        setSaving(true);
        router.post(`/portal/sales/bookings/${b.id}`, form, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setSaving(false),
        });
    };

    const input = "text-xs rounded-lg border border-gray-200 bg-white py-1.5 px-2 outline-none focus:ring-2 focus:ring-blue-500";

    return (
        <tr className="align-top hover:bg-gray-50/40">
            <td className="px-6 py-3">
                <div className="font-semibold text-gray-900 text-sm">{b.name}</div>
                <div className="text-xs text-gray-400">{b.email || "—"}{b.phone ? ` · ${b.phone}` : ""}</div>
                {b.lead_ref && <div className="text-[11px] text-gray-300 font-mono">{b.lead_ref}</div>}
            </td>
            <td className="px-6 py-3 text-sm text-gray-600">
                {b.service_type || "—"}
                {b.platform && <div className="text-xs text-gray-400">{b.platform}</div>}
            </td>
            <td className="px-6 py-3">
                <div className="flex flex-wrap items-center gap-2">
                    <input type="date" value={form.appointment_date} onChange={(e) => set("appointment_date", e.target.value)} className={input} />
                    <input type="text" value={form.appointment_time} onChange={(e) => set("appointment_time", e.target.value)} placeholder="e.g. 2:00 PM" className={`${input} w-24`} />
                    <input type="text" value={form.consultant_name} onChange={(e) => set("consultant_name", e.target.value)} placeholder="Consultant" className={`${input} w-28`} />
                </div>
            </td>
            <td className="px-6 py-3">
                <div className="flex flex-col gap-1.5">
                    <span className={`inline-flex w-fit px-2.5 py-1 rounded-full text-xs font-bold border ${bookingClass(b.status)}`}>{b.status}</span>
                    <select value={form.status} onChange={(e) => set("status", e.target.value)} className="text-xs rounded-lg border border-gray-200 bg-white py-1.5 pl-2 pr-7 outline-none hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </td>
            <td className="px-6 py-3 text-right pr-6">
                <button
                    onClick={save}
                    disabled={!dirty || saving}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {saving ? "Saving…" : "Save"}
                </button>
            </td>
        </tr>
    );
}

export default function SalesBookings({ bookings = [], statuses = [] }) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [view, setView] = useState("calendar"); // calendar | table
    const [cursor, setCursor] = useState(() => {
        // Start the calendar on the month with the next upcoming appointment;
        // fall back to today.
        const todayKey = new Date().toISOString().slice(0, 10);
        const upcoming = bookings
            .map((b) => b.appointment_date)
            .filter((d) => d && d >= todayKey)
            .sort()[0];
        return upcoming ? new Date(upcoming + 'T00:00:00') : new Date();
    });

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return bookings.filter((b) => {
            const hay = `${b.name || ""} ${b.email || ""} ${b.service_type || ""} ${b.consultant_name || ""} ${b.lead_ref || ""}`.toLowerCase();
            const matchSearch = !q || hay.includes(q);
            const matchStatus = statusFilter === "All" || b.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [bookings, search, statusFilter]);

    return (
        <div className="space-y-5 max-w-7xl mx-auto">
            <Head title="Bookings — Sales Portal" />

            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Consultation Bookings</h1>
                    <p className="text-sm text-gray-500 mt-1">See the month at a glance, or drop into the full table to edit.</p>
                </div>

                {/* View toggle */}
                <div className="inline-flex items-center bg-white rounded-xl border border-gray-200 p-1">
                    <button
                        type="button"
                        onClick={() => setView("calendar")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
                            view === "calendar" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        <CalendarDays size={12} /> Calendar
                    </button>
                    <button
                        type="button"
                        onClick={() => setView("table")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
                            view === "table" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        <Table2 size={12} /> Table
                    </button>
                </div>
            </div>

            {/* Toolbar — search + status filters */}
            <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search client, email or service…"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {["All", ...statuses].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${statusFilter === s ? "bg-gray-900 text-white border-gray-900 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {view === "calendar" ? (
                <CalendarView
                    bookings={filtered}
                    cursor={cursor}
                    onCursorChange={setCursor}
                    onOpenBooking={(b) => {
                        // Jump to the table view filtered to that day's bookings.
                        setView("table");
                        setSearch(b.email || b.name);
                    }}
                />
            ) : (
                <TableView bookings={filtered} statuses={statuses} />
            )}
        </div>
    );
}

function TableView({ bookings, statuses }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="px-6 py-3">Client</th>
                            <th className="px-6 py-3">Service</th>
                            <th className="px-6 py-3">Schedule &amp; consultant</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right pr-6">Save</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {bookings.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm">No bookings match your filters.</td></tr>
                        ) : bookings.map((b) => <BookingRow key={b.id} b={b} statuses={statuses} />)}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Calendar view ─────────────────────────────────────────────────────────

function CalendarView({ bookings, cursor, onCursorChange, onOpenBooking }) {
    const [mode, setMode] = useState("month");     // month | week
    const [colourBy, setColourBy] = useState("status"); // status | consultant
    const [dragId, setDragId] = useState(null);
    const [dropTarget, setDropTarget] = useState(null);
    const todayKey = new Date().toISOString().slice(0, 10);

    // Drag-and-drop rescheduling — when a chip is dropped on a different
    // day, post the new date to the existing update endpoint. preserveState
    // so the calendar stays put after the reload.
    const reschedule = (booking, newIso) => {
        if (!booking || !newIso || booking.appointment_date === newIso) return;
        router.post(`/portal/sales/bookings/${booking.id}`, {
            appointment_date: newIso,
            appointment_time: booking.appointment_time || "",
            consultant_name:  booking.consultant_name || "",
            status:           booking.status || "Pending",
        }, { preserveScroll: true, preserveState: true });
    };

    const monthCells = useMemo(() => buildMonthGrid(cursor, bookings, todayKey), [cursor, bookings, todayKey]);
    const weekDays   = useMemo(() => buildWeek(cursor, bookings, todayKey), [cursor, bookings, todayKey]);

    const monthLabel = cursor.toLocaleDateString("en-NZ", { month: "long", year: "numeric" });
    const weekLabel  = (() => {
        const first = weekDays[0]?.date, last = weekDays[6]?.date;
        if (!first || !last) return monthLabel;
        const sameMonth = first.getMonth() === last.getMonth();
        return sameMonth
            ? `${first.toLocaleDateString("en-NZ", { day: "numeric" })} – ${last.toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}`
            : `${first.toLocaleDateString("en-NZ", { day: "numeric", month: "short" })} – ${last.toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })}`;
    })();

    const step = (delta) => {
        const next = new Date(cursor);
        mode === "week"
            ? next.setDate(cursor.getDate() + (delta * 7))
            : next.setMonth(cursor.getMonth() + delta);
        onCursorChange(next);
    };

    const monthCount = mode === "week"
        ? weekDays.reduce((t, d) => t + d.bookings.length, 0)
        : monthCells.reduce((t, c) => t + (c.inMonth ? c.bookings.length : 0), 0);

    const onDragStart = (e, b) => {
        setDragId(b.id);
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", String(b.id)); } catch (_) { /* some browsers */ }
    };
    const onDragOver = (e, iso) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dropTarget !== iso) setDropTarget(iso);
    };
    const onDragLeave = () => setDropTarget(null);
    const onDrop = (e, iso) => {
        e.preventDefault();
        const b = bookings.find((x) => x.id === dragId);
        setDragId(null); setDropTarget(null);
        reschedule(b, iso);
    };

    return (
        <section className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
            {/* Header — month nav + view + colour toggles */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => step(-1)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100" title={mode === "week" ? "Previous week" : "Previous month"}>
                        <ChevronLeft size={16} />
                    </button>
                    <h2 className="text-lg font-semibold text-gray-900 tracking-tight min-w-[14rem] text-center tabular-nums">
                        {mode === "week" ? weekLabel : monthLabel}
                    </h2>
                    <button type="button" onClick={() => step(1)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100" title={mode === "week" ? "Next week" : "Next month"}>
                        <ChevronRight size={16} />
                    </button>
                    <button type="button" onClick={() => onCursorChange(new Date())} className="ml-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200">
                        Today
                    </button>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 tabular-nums">
                        {monthCount} {monthCount === 1 ? "booking" : "bookings"}
                    </p>

                    {/* Colour-by toggle */}
                    <div className="inline-flex items-center bg-gray-50 rounded-xl border border-gray-200 p-1" title="Colour chips by">
                        <button type="button" onClick={() => setColourBy("status")} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${colourBy === "status" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>
                            Status
                        </button>
                        <button type="button" onClick={() => setColourBy("consultant")} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${colourBy === "consultant" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>
                            Consultant
                        </button>
                    </div>

                    {/* Mode toggle */}
                    <div className="inline-flex items-center bg-gray-50 rounded-xl border border-gray-200 p-1">
                        <button type="button" onClick={() => setMode("month")} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${mode === "month" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>
                            Month
                        </button>
                        <button type="button" onClick={() => setMode("week")} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${mode === "week" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>
                            Week
                        </button>
                    </div>
                </div>
            </div>

            {mode === "month" ? (
                <MonthGrid
                    cells={monthCells}
                    colourBy={colourBy}
                    dragId={dragId}
                    dropTarget={dropTarget}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onOpenBooking={onOpenBooking}
                />
            ) : (
                <WeekGrid
                    days={weekDays}
                    colourBy={colourBy}
                    dragId={dragId}
                    dropTarget={dropTarget}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onOpenBooking={onOpenBooking}
                />
            )}

            {/* Legend / hint */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between gap-3 flex-wrap text-[11px] text-gray-500">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-700">Legend:</span>
                    {colourBy === "status"
                        ? Object.entries(STATUS_CHIP_TINT).map(([k, t]) => (
                            <span key={k} className="inline-flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${t.bar}`}></span>
                                {k}
                            </span>
                        ))
                        : <span className="italic">Each consultant gets a unique colour, deterministically assigned by name.</span>}
                </div>
                <p className="italic text-gray-400">Drag any booking onto a different day to reschedule.</p>
            </div>
        </section>
    );
}

// ── Helpers — grid construction ────────────────────────────────────────────

function buildMonthGrid(cursor, bookings, todayKey) {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startDow = first.getDay();
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - startDow);

    const byDay = groupBookingsByDay(bookings);

    return Array.from({ length: 42 }).map((_, i) => {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        const iso = isoDate(d);
        return {
            date: d, iso,
            inMonth: d.getMonth() === cursor.getMonth(),
            isToday: iso === todayKey,
            bookings: byDay[iso] || [],
        };
    });
}

function buildWeek(cursor, bookings, todayKey) {
    const startDow = cursor.getDay();
    const weekStart = new Date(cursor);
    weekStart.setDate(cursor.getDate() - startDow);
    const byDay = groupBookingsByDay(bookings);

    return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const iso = isoDate(d);
        return { date: d, iso, isToday: iso === todayKey, bookings: byDay[iso] || [] };
    });
}

function groupBookingsByDay(bookings) {
    return bookings.reduce((acc, b) => {
        if (!b.appointment_date) return acc;
        (acc[b.appointment_date] ||= []).push(b);
        acc[b.appointment_date].sort((a, b) => (a.appointment_time || '').localeCompare(b.appointment_time || ''));
        return acc;
    }, {});
}

function isoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

// ── Month grid ─────────────────────────────────────────────────────────────

function MonthGrid({ cells, colourBy, dragId, dropTarget, onDragStart, onDragOver, onDragLeave, onDrop, onOpenBooking }) {
    return (
        <>
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/40">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                    <div key={d} className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-gray-100 border-t border-gray-100" style={{ minHeight: 720 }}>
                {cells.map((c, i) => (
                    <DayCell
                        key={i}
                        cell={c}
                        colourBy={colourBy}
                        isDropTarget={dropTarget === c.iso}
                        dragId={dragId}
                        onDragStart={onDragStart}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onOpenBooking={onOpenBooking}
                        maxVisible={4}
                    />
                ))}
            </div>
        </>
    );
}

function DayCell({ cell, colourBy, isDropTarget, dragId, onDragStart, onDragOver, onDragLeave, onDrop, onOpenBooking, maxVisible = 4 }) {
    const visible = cell.bookings.slice(0, maxVisible);
    const overflow = cell.bookings.length - visible.length;

    return (
        <div
            onDragOver={(e) => onDragOver(e, cell.iso)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, cell.iso)}
            className={`min-h-[120px] p-2 flex flex-col gap-1.5 transition-colors ${cell.inMonth ? "bg-white" : "bg-gray-50/40 text-gray-300"} ${cell.isToday ? "ring-2 ring-blue-500 ring-inset" : ""} ${isDropTarget ? "bg-blue-50/60 ring-2 ring-blue-400 ring-dashed" : ""}`}
        >
            <div className="flex items-center justify-between px-1">
                <span className={`text-xs font-bold tabular-nums ${cell.isToday ? "inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white" : cell.inMonth ? "text-gray-700" : "text-gray-300"}`}>
                    {cell.date.getDate()}
                </span>
                {cell.bookings.length > 0 && (
                    <span className="text-[10px] font-bold text-gray-400 tabular-nums">{cell.bookings.length}</span>
                )}
            </div>
            <div className="flex flex-col gap-1 min-h-0">
                {visible.map((b) => (
                    <BookingChip
                        key={b.id}
                        booking={b}
                        colourBy={colourBy}
                        isDragging={dragId === b.id}
                        onDragStart={onDragStart}
                        onClick={() => onOpenBooking(b)}
                    />
                ))}
                {overflow > 0 && (
                    <p className="text-[10px] text-gray-400 px-1 font-semibold">+{overflow} more</p>
                )}
            </div>
        </div>
    );
}

// ── Week grid ──────────────────────────────────────────────────────────────

function WeekGrid({ days, colourBy, dragId, dropTarget, onDragStart, onDragOver, onDragLeave, onDrop, onOpenBooking }) {
    return (
        <div className="grid grid-cols-7 divide-x divide-gray-100 border-t border-gray-100" style={{ minHeight: 600 }}>
            {days.map((d, i) => (
                <div
                    key={i}
                    onDragOver={(e) => onDragOver(e, d.iso)}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => onDrop(e, d.iso)}
                    className={`flex flex-col transition-colors ${d.isToday ? "ring-2 ring-blue-500 ring-inset" : ""} ${dropTarget === d.iso ? "bg-blue-50/60 ring-2 ring-blue-400 ring-dashed" : "bg-white"}`}
                >
                    {/* Day header */}
                    <div className="px-3 py-3 border-b border-gray-100 bg-gray-50/40 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {d.date.toLocaleDateString("en-NZ", { weekday: "short" })}
                        </p>
                        <p className={`mt-0.5 text-lg font-bold tabular-nums inline-flex items-center justify-center w-9 h-9 rounded-full ${d.isToday ? "bg-blue-600 text-white" : "text-gray-800"}`}>
                            {d.date.getDate()}
                        </p>
                        {d.bookings.length > 0 && (
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                                {d.bookings.length} {d.bookings.length === 1 ? "booking" : "bookings"}
                            </p>
                        )}
                    </div>

                    {/* Bookings — all visible, no overflow truncation. */}
                    <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                        {d.bookings.length === 0 ? (
                            <p className="text-[10px] text-gray-300 italic text-center mt-4">No bookings</p>
                        ) : (
                            d.bookings.map((b) => (
                                <BookingChip
                                    key={b.id}
                                    booking={b}
                                    colourBy={colourBy}
                                    isDragging={dragId === b.id}
                                    onDragStart={onDragStart}
                                    onClick={() => onOpenBooking(b)}
                                    expanded
                                />
                            ))
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Booking chip ───────────────────────────────────────────────────────────

function BookingChip({ booking, colourBy, isDragging, onDragStart, onClick, expanded = false }) {
    const t = chipTint(booking, colourBy);

    return (
        <button
            type="button"
            draggable
            onDragStart={(e) => onDragStart(e, booking)}
            onClick={onClick}
            className={`w-full text-left rounded-lg border ${t.border} ${t.bg} hover:shadow-md transition-all cursor-grab active:cursor-grabbing overflow-hidden ${isDragging ? "opacity-40 scale-95" : ""}`}
            title={`${booking.appointment_time || ''} · ${booking.name} · ${booking.status}${booking.consultant_name ? ' · ' + booking.consultant_name : ''}`}
        >
            <div className="flex">
                {/* Coloured side bar */}
                <span className={`w-1 ${t.bar} flex-shrink-0`} aria-hidden></span>
                <div className="flex-1 min-w-0 px-2 py-1.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        {booking.appointment_time && (
                            <span className={`text-[10px] font-bold tabular-nums ${t.text}`}>
                                {booking.appointment_time}
                            </span>
                        )}
                        {expanded && booking.status && (
                            <span className={`ml-auto text-[8px] font-bold uppercase tracking-widest ${t.text} opacity-70`}>
                                {booking.status}
                            </span>
                        )}
                    </div>
                    <p className={`text-[11px] font-bold ${t.text} truncate leading-tight`}>
                        {booking.name}
                    </p>
                    {expanded && (
                        <div className={`flex items-center gap-2 mt-1 text-[10px] ${t.text} opacity-75`}>
                            {booking.consultant_name && (
                                <span className="inline-flex items-center gap-0.5 truncate">
                                    <User size={9} /> {booking.consultant_name}
                                </span>
                            )}
                            {booking.service_type && (
                                <span className="truncate">· {booking.service_type}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
}
