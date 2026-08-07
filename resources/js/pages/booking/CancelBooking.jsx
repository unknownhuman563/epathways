import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Calendar, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

// Client-facing cancel page, opened from the "Cancel booking" button in a
// booking email. GET shows a confirmation (so an email prefetch can't cancel);
// the actual cancel is a POST. Also handles the already-cancelled state.
export default function CancelBooking({ booking = {}, token = null, alreadyCancelled = false, justCancelled = false }) {
    const [submitting, setSubmitting] = useState(false);
    const done = alreadyCancelled || justCancelled;

    const fmtDate = (d) => {
        if (!d) return null;
        try { return new Date(`${d}T00:00:00`).toLocaleDateString("en-NZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
        catch { return d; }
    };

    const confirmCancel = () => {
        if (!token) return;
        setSubmitting(true);
        router.post(`/booking/cancel/${token}`, {}, { onFinish: () => setSubmitting(false) });
    };

    return (
        <div className="min-h-screen font-urbanist bg-[#F9F8F6]">
            <Navbar />
            <Head title={done ? "Booking cancelled" : "Cancel your consultation"} />

            <section className="py-24 px-4">
                <div className="max-w-lg mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10 text-center">
                    {done ? (
                        <>
                            <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 flex items-center justify-center mb-6">
                                <XCircle size={32} className="text-rose-500" strokeWidth={1.5} />
                            </div>
                            <h1 className="text-3xl font-light text-gray-900 mb-3">Booking cancelled</h1>
                            <p className="text-gray-600 leading-relaxed">
                                {justCancelled
                                    ? "Your consultation has been cancelled and removed from the calendar. We've sent you a confirmation email."
                                    : "This consultation has already been cancelled."}
                            </p>
                            <a href="/booking" className="inline-block mt-8 px-6 py-3 rounded-xl bg-[#436235] text-white text-sm font-bold hover:bg-[#375029] transition-colors">
                                Book a new consultation
                            </a>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center mb-6">
                                <AlertTriangle size={30} className="text-amber-500" strokeWidth={1.5} />
                            </div>
                            <h1 className="text-3xl font-light text-gray-900 mb-3">Cancel your consultation?</h1>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                {booking.first_name ? `Hi ${booking.first_name}, this ` : "This "} will cancel your booking and free up the slot. This can't be undone.
                            </p>

                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-left mb-8">
                                {booking.service_type && (
                                    <p className="text-sm text-gray-800 font-semibold mb-1">{booking.service_type}</p>
                                )}
                                {booking.consultant_name && (
                                    <p className="text-xs text-gray-500 mb-3">with {booking.consultant_name}</p>
                                )}
                                {(booking.appointment_date || booking.appointment_time) && (
                                    <div className="flex items-center gap-2 text-sm text-[#436235]">
                                        <Calendar size={15} />
                                        <span>{fmtDate(booking.appointment_date)}{booking.appointment_time ? ` at ${booking.appointment_time}` : ""}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={confirmCancel}
                                    disabled={submitting}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-rose-300 text-rose-600 text-sm font-bold hover:bg-rose-50 disabled:opacity-60 transition-colors"
                                >
                                    {submitting ? "Cancelling…" : "Yes, cancel my booking"}
                                </button>
                                <a href="/" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#436235] text-white text-sm font-bold hover:bg-[#375029] transition-colors inline-flex items-center justify-center gap-2">
                                    <CheckCircle size={15} /> Keep my booking
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
