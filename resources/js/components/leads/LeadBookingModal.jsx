import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { X, CalendarCheck, Check } from "lucide-react";
import { NativeScheduler, consultants } from "@/pages/booking/BookingPage";

// Staff booking modal — book a consultation for an EXISTING lead. No intake
// form (the lead already has all their details); staff just pick a timezone +
// date + time. The consultant is Emma (Education Consultant) and the slot pool
// comes from the same in-app scheduler the public booking page uses.
export default function LeadBookingModal({ lead, onClose }) {
    const emma = useMemo(
        () => consultants.education.find((c) => c.name === "Emma Ceballo") || consultants.education[0],
        [],
    );

    // Seed the scheduler with the lead's own details so nothing needs re-typing.
    const [info, setInfo] = useState({
        firstName: lead.first_name || "",
        lastName: lead.last_name || "",
        email: lead.email || "",
        phoneNumber: lead.phone || "",
        clientTimezone: "",
        appointmentDate: "",
        appointmentTime: "",
        appointmentAt: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const updateInfo = (patch) => setInfo((i) => ({ ...i, ...patch }));

    const canBook = info.appointmentDate && info.appointmentTime && info.appointmentAt && !saving;

    const confirm = () => {
        if (!canBook) { setError("Please pick a date and time."); return; }
        setSaving(true);
        setError("");
        router.post(`/admin/leads/${lead.id}/booking`, {
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
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl my-auto flex flex-col max-h-[94vh]"
                onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Book a consultation</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            For <span className="font-semibold text-gray-700">{lead.first_name} {lead.last_name}</span> · Education Consultation with {emma.name}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500" disabled={saving}>
                        <X size={16} />
                    </button>
                </div>

                {/* Scheduler (timezone + calendar + slots; details are the lead's own) */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
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
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-500 min-w-0">
                        {error
                            ? <span className="text-rose-600 font-medium">{error}</span>
                            : info.appointmentDate && info.appointmentTime
                                ? <span>Selected: <span className="font-semibold text-gray-700">{info.appointmentDate}</span> · {info.appointmentTime} ({emma.timezone.replace(/_/g, " ")})</span>
                                : "Pick a timezone, date and time above."}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={onClose} disabled={saving}
                            className="px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-40">
                            Cancel
                        </button>
                        <button type="button" onClick={confirm} disabled={!canBook}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#436235] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#375029] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            {saving ? "Booking…" : <><CalendarCheck size={13} /> Confirm booking</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
