import { Head, Link } from "@inertiajs/react";
import { CheckCircle, Clock, Calendar, ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); } catch { return iso; } };
const fmtLocal = (iso) => { try { return new Date(iso).toLocaleString("en-US", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }); } catch { return iso; } };

// Landing page after returning from Stripe Checkout. `status` is 'paid'
// (payment confirmed), 'unpaid' (skipped/cancelled — booking still saved), or
// 'pending' (paid but webhook not yet confirmed).
export default function PaymentResult({ status = "unpaid", booking = null, retryUrl = null }) {
    const paid = status === "paid";
    const pending = status === "pending";

    const retry = async () => {
        if (!retryUrl) return;
        try {
            const res = await fetch(retryUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content"),
                },
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.url) window.location.href = data.url;
        } catch { /* ignore */ }
    };

    return (
        <div className="min-h-screen bg-[#F9F8F6] font-urbanist flex flex-col">
            <Head title={paid ? "Payment received" : "Booking saved"} />
            <Navbar />

            <div className="flex-1 flex items-center justify-center px-4 py-20">
                <div className="max-w-lg w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${paid ? "bg-[#436235]/10" : "bg-amber-100"}`}>
                        {paid ? <CheckCircle size={38} className="text-[#436235]" strokeWidth={1.5} /> : <Clock size={38} className="text-amber-600" strokeWidth={1.5} />}
                    </div>

                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        {paid ? "Payment received" : pending ? "Almost there" : "Your booking is saved"}
                    </h1>
                    <p className="text-gray-600 mb-6">
                        {paid
                            ? "Your consultation is confirmed and paid. We've emailed you the details."
                            : pending
                                ? "We're confirming your payment — this can take a moment. Your booking is saved either way."
                                : "We've saved your consultation. Payment isn't complete yet, so it's marked as not yet paid — you can pay anytime."}
                    </p>

                    {booking && (
                        <div className="text-left bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 space-y-2">
                            <div className="flex items-start gap-2 text-sm text-gray-700">
                                <Calendar size={15} className="text-gray-400 mt-0.5" />
                                {booking.appointment_at ? (
                                    <span>{fmtLocal(booking.appointment_at)} <span className="text-gray-400">(your local time)</span>{booking.appointment_time ? <span className="block text-xs text-gray-400">NZ time: {booking.appointment_time}</span> : null}</span>
                                ) : (
                                    <span>{booking.appointment_date ? fmtDate(booking.appointment_date) : "Date to be confirmed"}{booking.appointment_time ? ` · ${booking.appointment_time} (NZ)` : ""}</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-700"><span className="text-gray-400">Service:</span> {booking.service_type}</p>
                            {booking.visa && <p className="text-sm text-gray-700"><span className="text-gray-400">Visa type:</span> {booking.visa}</p>}
                            {booking.consultant_name && <p className="text-sm text-gray-700"><span className="text-gray-400">With:</span> {booking.consultant_name}</p>}
                            <p className="text-sm">
                                <span className="text-gray-400">Payment:</span>{" "}
                                <span className={paid ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                                    {paid ? "Paid" : "Not yet paid"}
                                </span>
                                {booking.amount ? ` · ${(booking.currency || "NZD").toUpperCase()} $${Number(booking.amount).toFixed(2)}` : ""}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {!paid && retryUrl && (
                            <button onClick={retry} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#436235] text-white text-sm font-semibold rounded-xl hover:bg-[#375029] transition-colors">
                                Pay now
                            </button>
                        )}
                        <Link href="/" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                            <ArrowLeft size={15} /> Back to home
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
