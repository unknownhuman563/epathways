import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { X, Search, CalendarCheck, Check, UserRound } from "lucide-react";
import { NativeScheduler, consultants } from "@/pages/booking/BookingPage";

// Log a manual consultation booking: pick a client (lead) from the searchable
// list, then choose a timezone + date + time (same in-app scheduler as the
// public booking page). Emma is the Education consultant. Reuses the staff
// booking endpoint, which books for the existing lead and advances its stage.
export default function ManualBookingModal({ leads = [], onClose }) {
    const emma = useMemo(
        () => consultants.education.find((c) => c.name === "Emma Ceballo") || consultants.education[0],
        [],
    );

    const [q, setQ] = useState("");
    const [selected, setSelected] = useState(null);
    const [info, setInfo] = useState({
        firstName: "", email: "", clientTimezone: "",
        appointmentDate: "", appointmentTime: "", appointmentAt: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const filtered = useMemo(() => {
        const n = q.trim().toLowerCase();
        const base = n
            ? leads.filter((l) => [l.name, l.email, l.lead_id].filter(Boolean).some((v) => String(v).toLowerCase().includes(n)))
            : leads;
        return base.slice(0, 60);
    }, [q, leads]);

    const pick = (l) => {
        setSelected(l);
        setError("");
        setInfo((i) => ({ ...i, firstName: l.name, email: l.email || "", appointmentDate: "", appointmentTime: "", appointmentAt: "" }));
    };
    const updateInfo = (patch) => setInfo((i) => ({ ...i, ...patch }));
    const canBook = selected && info.appointmentDate && info.appointmentTime && info.appointmentAt && !saving;

    const confirm = () => {
        if (!selected) { setError("Select a client first."); return; }
        if (!info.appointmentDate || !info.appointmentTime) { setError("Pick a date and time."); return; }
        setSaving(true);
        setError("");
        router.post(`/admin/leads/${selected.id}/booking`, {
            service_type: "education",
            consultant_name: emma.name,
            appointment_date: info.appointmentDate,
            appointment_time: info.appointmentTime,
            appointment_at: info.appointmentAt,
            client_timezone: info.clientTimezone,
        }, {
            preserveScroll: true,
            onSuccess: () => onClose?.(),
            onError: (errs) => setError(Object.values(errs || {})[0] || "Could not create the booking."),
            onFinish: () => setSaving(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-0 sm:p-6 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose?.(); }}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-5xl my-auto flex flex-col max-h-[94vh]"
                onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center"><CalendarCheck size={17} /></span>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Log a manual booking</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Pick a client, then choose a timezone, date and time · Education Consultation with {emma.name}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500" disabled={saving}>
                        <X size={16} />
                    </button>
                </div>

                {/* Body: client picker + scheduler */}
                <div className="flex-1 overflow-hidden flex flex-col sm:flex-row min-h-0">
                    {/* Left — client picker */}
                    <div className="sm:w-72 sm:border-r border-b sm:border-b-0 border-gray-100 flex flex-col shrink-0">
                        <div className="p-3 border-b border-gray-100">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Client</p>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or LP ID…"
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#436235] focus:ring-1 focus:ring-[#436235]" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[280px] sm:max-h-none">
                            {filtered.length === 0 ? (
                                <p className="px-3 py-6 text-center text-xs text-gray-400">No clients match.</p>
                            ) : filtered.map((l) => {
                                const active = selected?.id === l.id;
                                return (
                                    <button key={l.id} type="button" onClick={() => pick(l)}
                                        className={`w-full text-left px-3 py-2.5 border-b border-gray-50 flex items-center justify-between gap-2 hover:bg-gray-50 ${active ? "bg-emerald-50" : ""}`}>
                                        <span className="min-w-0">
                                            <span className={`block text-sm font-semibold truncate ${active ? "text-emerald-800" : "text-gray-800"}`}>{l.name}</span>
                                            {l.email && <span className="block text-[11px] text-gray-400 truncate">{l.email}</span>}
                                        </span>
                                        {l.lead_id && <span className="text-[10px] font-mono text-gray-400 shrink-0">{l.lead_id}</span>}
                                        {active && <Check size={14} className="text-emerald-600 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right — scheduler */}
                    <div className="flex-1 overflow-y-auto p-5 min-w-0">
                        {!selected ? (
                            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-gray-400">
                                <UserRound size={30} className="mb-2 text-gray-300" />
                                <p className="text-sm font-semibold text-gray-500">Select a client to schedule</p>
                                <p className="text-xs mt-1">Pick someone from the list on the left.</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 flex items-center gap-2 text-sm">
                                    <span className="text-gray-500">Booking for</span>
                                    <span className="font-semibold text-gray-900">{selected.name}</span>
                                    {selected.email && <span className="text-gray-400">· {selected.email}</span>}
                                </div>
                                <NativeScheduler
                                    hideDetails
                                    visaTypes={[]}
                                    availability={emma.availabilityConfig}
                                    businessTz={emma.timezone}
                                    slotMinutes={emma.slotMinutes || 15}
                                    busyUrl={emma.busyUrl}
                                    info={info}
                                    onChange={updateInfo}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-500 min-w-0">
                        {error
                            ? <span className="text-rose-600 font-medium">{error}</span>
                            : selected && info.appointmentDate && info.appointmentTime
                                ? <span>{selected.name} · <span className="font-semibold text-gray-700">{info.appointmentDate}</span> · {info.appointmentTime} ({emma.timezone.replace(/_/g, " ")})</span>
                                : selected
                                    ? "Now pick a date and time."
                                    : "Select a client, then a date and time."}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={onClose} disabled={saving}
                            className="px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-40">
                            Cancel
                        </button>
                        <button type="button" onClick={confirm} disabled={!canBook}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#436235] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#375029] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            {saving ? "Booking…" : <><CalendarCheck size={13} /> Log booking</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
