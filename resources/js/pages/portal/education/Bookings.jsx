import React, { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
    Search, Plus, Download, ChevronLeft, ChevronRight, MoreVertical,
    Check, Eye, Trash2, Globe, Calendar as CalendarIcon,
} from "lucide-react";
import { stageClass } from "@/pages/portal/sales/Leads";
import ManualBookingModal from "@/components/bookings/ManualBookingModal";

// ── Education Consultation Bookings — calendar + list redesign. Purely a
// front-end redesign: it consumes the SAME controller props and posts to the
// SAME endpoints as the admin Bookings page (no backend changes).

const GRID_START = 8;   // 8:00
const GRID_END = 18;    // 18:00
const HOUR_PX = 46;

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const initials = (name = "") =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "—";

// Parse an appointment time string ("11:00", "11:00 AM", "11:00 - 12:00")
// into decimal start/end hours. Defaults to a one-hour block.
const parseTime = (t) => {
    if (! t) return null;
    const m = String(t).match(/(\d{1,2}):(\d{2})/g);
    const toDec = (s) => {
        const [h, mn] = s.split(":").map(Number);
        return h + mn / 60;
    };
    if (! m) return null;
    const start = toDec(m[0]);
    const end = m[1] ? toDec(m[1]) : start + 1;
    return { start, end: Math.max(end, start + 0.5) };
};

const fmtHM = (dec) => {
    const h = Math.floor(dec);
    const mn = Math.round((dec - h) * 60);
    return `${String(h).padStart(2, "0")}:${String(mn).padStart(2, "0")}`;
};

const startOfWeek = (d) => {
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7; // Mon=0
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - day);
    return x;
};
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const isConfirmed = (s) => String(s || "").toLowerCase() === "confirmed";
const isPending = (s) => String(s || "").toLowerCase() === "pending";

export default function EducationBookings({ bookings: backendBookings = [], stages = [], leadPicker = [] }) {
    const [manualOpen, setManualOpen] = useState(false);
    const [view, setView] = useState("week"); // day | week | month
    const [anchor, setAnchor] = useState(() => new Date());
    const [search, setSearch] = useState("");
    const [menuId, setMenuId] = useState(null);

    const [bookings, setBookings] = useState(() =>
        (backendBookings || []).map((b) => ({
            id: b.id,
            name: `${b.first_name || ""} ${b.last_name || ""}`.trim() || "Unknown",
            email: b.email || "—",
            phone: b.phone || "—",
            service: b.service_type || "Consultation",
            consultant: b.consultant_name || "—",
            platform: b.platform || "Google Calendar",
            status: b.status || "Pending",
            lead_id: b.lead?.lead_id || null,
            lead_internal_id: b.lead?.id || null,
            stage: b.lead?.status || null,
            rawDate: b.appointment_date || "",
            date: b.appointment_date ? new Date(b.appointment_date) : null,
            time: b.appointment_time || null,
            tz: b.client_timezone || null,
            requestedOn: b.created_at ? new Date(b.created_at) : null,
        })),
    );

    const pendingCount = bookings.filter((b) => isPending(b.status)).length;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (! q) return bookings;
        return bookings.filter((b) => `${b.name} ${b.email} ${b.lead_id || ""} ${b.consultant}`.toLowerCase().includes(q));
    }, [bookings, search]);

    // ── Actions (reuse existing endpoints) ──────────────────────────────────
    const changeStage = (b, newStatus) => {
        if (! b.lead_internal_id || newStatus === b.stage) return;
        const prev = b.stage;
        setBookings((bs) => bs.map((x) => x.id === b.id ? { ...x, stage: newStatus } : x));
        router.post(`/admin/leads/${b.lead_internal_id}/stage`, { status: newStatus }, {
            preserveScroll: true, preserveState: true,
            onError: () => setBookings((bs) => bs.map((x) => x.id === b.id ? { ...x, stage: prev } : x)),
        });
    };

    const confirmBooking = (b) => {
        setMenuId(null);
        const prev = b.status;
        setBookings((bs) => bs.map((x) => x.id === b.id ? { ...x, status: "Confirmed" } : x));
        router.post(`/admin/bookings/${b.id}`, {
            appointment_date: b.rawDate || null,
            appointment_time: b.time || null,
            status: "Confirmed",
        }, {
            preserveScroll: true, preserveState: true,
            onError: () => setBookings((bs) => bs.map((x) => x.id === b.id ? { ...x, status: prev } : x)),
        });
    };

    const deleteBooking = (b) => {
        setMenuId(null);
        if (! confirm(`Delete this booking for ${b.name}? This can't be undone.`)) return;
        router.delete(`/admin/bookings/${b.id}`, {
            preserveScroll: true, preserveState: true,
            onSuccess: () => setBookings((bs) => bs.filter((x) => x.id !== b.id)),
        });
    };

    const exportCsv = () => {
        const headers = ["Client", "Reference", "Email", "Service", "Consultant", "Date", "Time", "Status"];
        const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const lines = [headers.map(esc).join(",")];
        filtered.forEach((b) => lines.push([b.name, b.lead_id, b.email, b.service, b.consultant, b.rawDate, b.time, b.status].map(esc).join(",")));
        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `education-bookings-${ymd(new Date())}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    // ── Calendar range ──────────────────────────────────────────────────────
    const weekStart = startOfWeek(anchor);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const today = new Date();

    const rangeLabel = view === "month"
        ? `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
        : view === "day"
            ? anchor.toLocaleDateString("en-NZ", { weekday: "long", day: "numeric", month: "short", year: "numeric" })
            : `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()].slice(0, 3)} – ${addDays(weekStart, 6).getDate()} ${MONTHS[addDays(weekStart, 6).getMonth()].slice(0, 3)} ${addDays(weekStart, 6).getFullYear()}`;

    const step = (dir) => {
        if (view === "month") setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
        else if (view === "day") setAnchor((d) => addDays(d, dir));
        else setAnchor((d) => addDays(d, dir * 7));
    };

    const bookingsOn = (day) => bookings.filter((b) => b.date && sameDay(b.date, day));

    return (
        <div className="space-y-5 pb-12">
            <Head title="Bookings — Education" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Work / Bookings</p>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">Consultation Bookings</h1>
                    <p className="text-sm text-gray-500 mt-1">Schedule, confirm and track consultation requests across consultants.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        <Download size={15} /> Export
                    </button>
                    <button type="button" onClick={() => setManualOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#14532d] text-white text-sm font-semibold hover:bg-[#0f3d21]">
                        <Plus size={15} /> Log booking
                    </button>
                </div>
            </div>

            {/* Calendar card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
                            <button type="button" onClick={() => step(-1)} className="p-2 hover:bg-gray-50 text-gray-500"><ChevronLeft size={16} /></button>
                            <button type="button" onClick={() => step(1)} className="p-2 hover:bg-gray-50 text-gray-500 border-l border-gray-200"><ChevronRight size={16} /></button>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{rangeLabel}</span>
                        <button type="button" onClick={() => setAnchor(new Date())} className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-600 hover:bg-gray-50">Today</button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 text-[11px] text-gray-500">
                            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Confirmed</span>
                            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Pending</span>
                        </div>
                        <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-[12px] font-semibold">
                            {["day", "week", "month"].map((v) => (
                                <button key={v} type="button" onClick={() => setView(v)}
                                    className={`px-3 py-1.5 capitalize ${view === v ? "bg-[#14532d] text-white" : "bg-white text-gray-600 hover:bg-gray-50"} ${v !== "day" ? "border-l border-gray-200" : ""}`}>
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {view === "month"
                    ? <MonthGrid anchor={anchor} today={today} bookings={bookings} />
                    : <TimeGrid days={view === "day" ? [anchor] : weekDays} today={today} bookingsOn={bookingsOn} />}
            </div>

            {/* All bookings list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-gray-900">All bookings</h2>
                        {pendingCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                {pendingCount} awaiting confirmation
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-1 lg:justify-end">
                        <div className="flex items-center gap-2 flex-1 lg:max-w-xs rounded-lg border border-gray-200 px-3 py-2">
                            <Search size={14} className="text-gray-400 flex-shrink-0" />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client, case ref, consultant" className="flex-1 min-w-0 outline-none text-[13px] bg-transparent placeholder:text-gray-400" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Client</th>
                                <th className="px-4 py-3">Appointment</th>
                                <th className="px-4 py-3">Service &amp; Consultant</th>
                                <th className="px-4 py-3">Stage</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400 text-sm">No bookings found.</td></tr>
                            ) : filtered.map((b) => (
                                <tr key={b.id} className="text-sm hover:bg-gray-50/40 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-white text-[11px] font-bold bg-[#14532d] flex-shrink-0">{initials(b.name)}</span>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[13px] font-semibold text-gray-900 truncate">{b.name}</span>
                                                    {b.lead_id && <span className="text-[9px] font-mono text-gray-400 bg-gray-100 rounded px-1 py-0.5">{b.lead_id}</span>}
                                                </div>
                                                <div className="text-[11px] text-gray-500 truncate">{b.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {b.date ? (
                                            <>
                                                <div className="text-[12px] font-semibold text-gray-800">{b.date.toLocaleDateString("en-NZ", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</div>
                                                <div className="text-[11px] text-gray-500">{b.time || "—"}{b.tz ? ` (${b.tz})` : ""}</div>
                                                <div className="text-[10px] text-gray-400">{b.platform}{b.requestedOn ? ` · requested ${b.requestedOn.toLocaleDateString("en-NZ", { day: "numeric", month: "short" })}` : ""}</div>
                                            </>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-[12px] font-medium text-gray-800">{b.service}</div>
                                        <div className="text-[11px] text-gray-500">{b.consultant}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {b.lead_internal_id ? (
                                            <select value={b.stage || ""} onChange={(e) => changeStage(b, e.target.value)}
                                                className={`appearance-none max-w-[190px] truncate text-[11px] font-bold uppercase tracking-wide rounded-full border pl-3 pr-6 py-1.5 cursor-pointer focus:outline-none ${stageClass(b.stage)}`}>
                                                {! b.stage && <option value="" disabled>Set stage…</option>}
                                                {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        ) : <span className="text-gray-300 text-[12px]">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                            isConfirmed(b.status) ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                            : isPending(b.status) ? "bg-amber-100 text-amber-700 border-amber-200"
                                            : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {! isConfirmed(b.status) && (
                                                <button type="button" onClick={() => confirmBooking(b)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#14532d] text-white text-[11px] font-bold hover:bg-[#0f3d21]">
                                                    <Check size={12} /> Confirm
                                                </button>
                                            )}
                                            <div className="relative">
                                                <button type="button" onClick={() => setMenuId(menuId === b.id ? null : b.id)} className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100">
                                                    <MoreVertical size={15} />
                                                </button>
                                                {menuId === b.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl ring-1 ring-black/5 py-1.5 z-30 text-[12px]">
                                                        {b.lead_id && (
                                                            <a href={`/portal/education/leads/${b.lead_internal_id}`} className="flex items-center gap-2.5 px-3 py-2 text-gray-700 hover:bg-gray-50"><Eye size={13} className="text-gray-400" /> Open lead</a>
                                                        )}
                                                        {! isConfirmed(b.status) && (
                                                            <button type="button" onClick={() => confirmBooking(b)} className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-gray-700 hover:bg-gray-50"><Check size={13} className="text-gray-400" /> Mark confirmed</button>
                                                        )}
                                                        <button type="button" onClick={() => deleteBooking(b)} className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-red-600 hover:bg-red-50"><Trash2 size={13} /> Delete</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
                    <span>Showing {filtered.length} of {bookings.length} bookings</span>
                </div>
            </div>

            {manualOpen && <ManualBookingModal leads={leadPicker} onClose={() => setManualOpen(false)} />}
        </div>
    );
}

// Week / Day time grid.
function TimeGrid({ days, today, bookingsOn }) {
    const hours = Array.from({ length: GRID_END - GRID_START }, (_, i) => GRID_START + i);
    return (
        <div className="overflow-x-auto border-t border-gray-100">
            <div className="min-w-[720px]">
                {/* Day headers */}
                <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
                    <div />
                    {days.map((d, i) => {
                        const isToday = sameDay(d, today);
                        const pending = bookingsOn(d).filter((b) => isPending(b.status)).length;
                        return (
                            <div key={i} className={`px-2 py-2 text-center border-l border-gray-100 ${isToday ? "bg-emerald-50/40" : ""}`}>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{DOW[(d.getDay() + 6) % 7]}</div>
                                <div className={`text-sm font-bold ${isToday ? "text-emerald-700" : "text-gray-900"}`}>{d.getDate()}</div>
                                {pending > 0 && <div className="text-[9px] text-amber-600 font-semibold">{pending} pending</div>}
                            </div>
                        );
                    })}
                </div>
                {/* Time rows */}
                <div className="grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
                    {/* Hour labels */}
                    <div>
                        {hours.map((h) => (
                            <div key={h} className="h-[46px] pr-2 text-right text-[10px] text-gray-400 -translate-y-1.5">{String(h).padStart(2, "0")}:00</div>
                        ))}
                    </div>
                    {/* Day columns */}
                    {days.map((d, i) => (
                        <div key={i} className="relative border-l border-gray-100" style={{ height: `${hours.length * HOUR_PX}px` }}>
                            {hours.map((h) => <div key={h} className="border-b border-gray-50" style={{ height: `${HOUR_PX}px` }} />)}
                            {bookingsOn(d).map((b) => {
                                const t = parseTime(b.time) || { start: 11, end: 12 };
                                const top = (t.start - GRID_START) * HOUR_PX;
                                const height = Math.max((t.end - t.start) * HOUR_PX - 4, 26);
                                const confirmed = isConfirmed(b.status);
                                return (
                                    <div key={b.id}
                                        className={`absolute left-1 right-1 rounded-md px-2 py-1 overflow-hidden text-[10px] leading-tight ${
                                            confirmed ? "bg-blue-50 border border-blue-300 text-blue-900" : "bg-amber-50 border border-dashed border-amber-400 text-amber-900"}`}
                                        style={{ top: `${top}px`, height: `${height}px` }}
                                        title={`${b.name} · ${b.service}`}>
                                        <div className="font-semibold">{fmtHM(t.start)} – {fmtHM(t.end)}</div>
                                        <div className="font-bold truncate">{b.name}</div>
                                        <div className="truncate opacity-80">{b.service}{b.consultant && b.consultant !== "—" ? ` · ${b.consultant}` : ""}</div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Month grid.
function MonthGrid({ anchor, today, bookings }) {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    const onDay = (d) => bookings.filter((b) => b.date && sameDay(b.date, d));
    return (
        <div className="border-t border-gray-100">
            <div className="grid grid-cols-7 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {DOW.map((d) => <div key={d} className="px-2 py-2 text-center">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
                {cells.map((d, i) => {
                    const inMonth = d.getMonth() === anchor.getMonth();
                    const isToday = sameDay(d, today);
                    const items = onDay(d);
                    return (
                        <div key={i} className={`min-h-[90px] border-b border-l border-gray-50 p-1.5 ${inMonth ? "" : "bg-gray-50/40"}`}>
                            <div className={`text-[11px] font-semibold ${isToday ? "text-emerald-700" : inMonth ? "text-gray-700" : "text-gray-300"}`}>{d.getDate()}</div>
                            <div className="mt-1 space-y-0.5">
                                {items.slice(0, 3).map((b) => (
                                    <div key={b.id} className={`truncate rounded px-1 py-0.5 text-[9px] font-semibold ${isConfirmed(b.status) ? "bg-blue-50 text-blue-800 border border-blue-200" : "bg-amber-50 text-amber-800 border border-dashed border-amber-300"}`} title={`${b.name} · ${b.time || ""}`}>
                                        {b.time ? `${b.time.match(/\d{1,2}:\d{2}/)?.[0] || ""} ` : ""}{b.name}
                                    </div>
                                ))}
                                {items.length > 3 && <div className="text-[9px] text-gray-400 px-1">+{items.length - 3} more</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
