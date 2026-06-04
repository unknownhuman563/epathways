import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { CheckCircle, Calendar, Mail } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const PENDING_ASSESSMENT_KEY = 'epathways_pending_assessment';

export default function AssessmentBooked({ assessment, visaType, booking }) {
    // Journey complete — clear the marker so the next /resident-interest visit
    // shows a fresh form (or stamp it as 'booked' for ResidentIntakePage to
    // detect and self-clear; both paths are handled there).
    useEffect(() => {
        try {
            window.localStorage.setItem(PENDING_ASSESSMENT_KEY, JSON.stringify({
                token:  assessment.token,
                status: 'booked',
            }));
        } catch { /* ignore */ }
    }, [assessment.token]);

    const formattedDate = booking?.appointment_date
        ? new Date(booking.appointment_date).toLocaleDateString('en-NZ', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
        : 'TBD';

    return (
        <div className="min-h-screen bg-[#f8f9fb] font-urbanist text-[#212121] overflow-x-hidden">
            <Head title={`Booking Confirmed — ${visaType.name}`} />
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-12">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/80 overflow-hidden">
                    <div className="px-8 py-14 text-center">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#00A693]/10 flex items-center justify-center mb-6">
                            <CheckCircle size={32} className="text-[#00A693]" />
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#00A693] mb-3">Booking Confirmed</p>
                        <h1 className="text-3xl font-black tracking-tight text-[#282728] mb-3">
                            See you soon, {assessment.first_name}.
                        </h1>
                        <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed mb-10">
                            Your {visaType.name} consultation is locked in. A confirmation email with the meeting link
                            is on its way to {assessment.email}.
                        </p>

                        <div className="inline-flex flex-col sm:flex-row gap-3 sm:gap-6 items-center justify-center mx-auto px-6 py-5 rounded-2xl bg-gray-50/60 border border-gray-100">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar size={16} className="text-[#00A693]" />
                                <span className="font-semibold text-[#282728]">{formattedDate}</span>
                            </div>
                            {booking?.appointment_time && (
                                <div className="hidden sm:block text-gray-200">·</div>
                            )}
                            {booking?.appointment_time && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="font-semibold text-[#282728]">{booking.appointment_time} NZT</span>
                                </div>
                            )}
                        </div>

                        <p className="text-[11px] text-gray-400 mt-8 flex items-center justify-center gap-2">
                            <Mail size={12} /> Need to reschedule? Reply to the confirmation email and we'll sort it.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
