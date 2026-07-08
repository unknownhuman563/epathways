import { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Calendar, User, CheckCircle2, Clock, X, Send, Loader2 } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import BookingsCalendar from "@/components/immigration/BookingsCalendar";
import AvailabilitySettings from "@/components/immigration/AvailabilitySettings";

const STATUS_CHIP = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Completed: "bg-gray-100 text-gray-600 border-gray-200",
    Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};
const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—");

function PaymentPill({ status, amount, currency }) {
    const paid = status === "paid";
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${paid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
            {paid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
            {paid ? "Paid" : "Not yet paid"}
            {amount ? ` · ${(currency || "").toUpperCase()} $${amount}` : ""}
        </span>
    );
}

export default function ImmigrationAppointments({ appointments = [], myAvailability = {}, teamAvailability = [], currentUserId = null }) {
    const [selectedKey, setSelectedKey] = useState(null);
    const [resendingId, setResendingId] = useState(null);
    const [tab, setTab] = useState("bookings"); // bookings | availability

    const resendInvoice = (id) => {
        setResendingId(id);
        // Feedback comes from the global FlashToaster reading the flash message;
        // the button spinner covers the in-flight state.
        router.post(`/portal/immigration/appointments/${id}/resend-invoice`, {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setResendingId(null),
        });
    };

    const rows = useMemo(
        () => (selectedKey ? appointments.filter((a) => a.appointment_date === selectedKey) : appointments),
        [appointments, selectedKey],
    );

    const paidCount = appointments.filter((a) => a.payment_status === "paid").length;
    const unpaidCount = appointments.length - paidCount;

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
            <Head title="Bookings — Immigration" />
            <PortalPageHeader
                eyebrow="Consultations"
                title="Bookings"
                description="Immigration consultation bookings from the website — schedule, time, and payment status."
            />

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-gray-200">
                {[
                    { key: "bookings", label: "Bookings" },
                    { key: "availability", label: "Availability" },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === t.key ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "availability" ? (
                <AvailabilitySettings myAvailability={myAvailability} teamAvailability={teamAvailability} currentUserId={currentUserId} />
            ) : (
            <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Total bookings", value: appointments.length, cls: "text-gray-900" },
                    { label: "Paid", value: paidCount, cls: "text-emerald-600" },
                    { label: "Not yet paid", value: unpaidCount, cls: "text-amber-600" },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Calendar — Day / Week / Month */}
            <BookingsCalendar bookings={appointments} selectedKey={selectedKey} onSelectDay={setSelectedKey} />

            <div className="space-y-5">
                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            {selectedKey ? `Bookings on ${fmt(selectedKey)}` : "All bookings"}
                            {selectedKey && (
                                <button onClick={() => setSelectedKey(null)} className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800">
                                    <X size={13} /> Show all
                                </button>
                            )}
                        </h3>
                        <span className="text-xs text-gray-400">{rows.length} shown</span>
                    </div>
                    {rows.length === 0 ? (
                        <div className="p-14 text-center text-gray-400">
                            <Calendar size={28} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-sm font-medium">No bookings{selectedKey ? " on this date" : " yet"}.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="px-5 py-2.5">Client</th>
                                        <th className="px-5 py-2.5">Schedule</th>
                                        <th className="px-5 py-2.5">Adviser</th>
                                        <th className="px-5 py-2.5">Status</th>
                                        <th className="px-5 py-2.5">Payment</th>
                                        <th className="px-5 py-2.5 text-right">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {rows.map((a) => (
                                        <tr key={a.id} className="hover:bg-gray-50/40">
                                            <td className="px-5 py-3">
                                                <p className="text-sm font-semibold text-gray-900">{a.name}</p>
                                                <p className="text-[11px] text-gray-500">{a.email}{a.phone ? ` · ${a.phone}` : ""}</p>
                                                {a.visa && <p className="text-[11px] text-[#436235] font-medium mt-0.5">{a.visa}</p>}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-gray-700">
                                                <div className="flex items-center gap-1.5"><Calendar size={13} className="text-gray-400" /> {fmt(a.appointment_date)}</div>
                                                {a.appointment_time && <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5"><Clock size={11} className="text-gray-400" /> {a.appointment_time}</div>}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-gray-600">
                                                {a.consultant_name ? <span className="inline-flex items-center gap-1"><User size={12} className="text-gray-400" /> {a.consultant_name}</span> : "—"}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${STATUS_CHIP[a.status] || STATUS_CHIP.Pending}`}>{a.status}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <PaymentPill status={a.payment_status} amount={a.amount} currency={a.currency} />
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() => resendInvoice(a.id)}
                                                    disabled={resendingId === a.id}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                                                    title="Re-send the confirmation + invoice email"
                                                >
                                                    {resendingId === a.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                                                    {resendingId === a.id ? "Sending…" : "Resend"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            </>
            )}
        </div>
    );
}
