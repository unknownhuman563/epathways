import React, { useState, useMemo, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Calendar, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const PENDING_ASSESSMENT_KEY = 'epathways_pending_assessment';

export default function AssessmentBook({ assessment, visaType, slots }) {
    const [selectedDate, setSelectedDate] = useState(slots[0]?.date || null);
    const [selectedTime, setSelectedTime] = useState(null);

    // Bump the pending-assessment marker to status='paid' so that revisiting
    // /resident-interest forwards to /book instead of /pay.
    useEffect(() => {
        try {
            window.localStorage.setItem(PENDING_ASSESSMENT_KEY, JSON.stringify({
                token:  assessment.token,
                status: 'paid',
            }));
        } catch { /* ignore */ }
    }, [assessment.token]);

    const { post, processing, errors } = useForm({ date: '', time: '' });

    const activeDay = useMemo(
        () => slots.find((d) => d.date === selectedDate) || null,
        [selectedDate, slots]
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedDate || !selectedTime) {
            toast.error('Pick a date and time before confirming.');
            return;
        }
        post(`/assessment/${assessment.token}/book`, {
            data: { date: selectedDate, time: selectedTime },
            onError: (err) => {
                if (err.slot) toast.error(err.slot);
            },
        });
    };

    return (
        <div className="min-h-screen bg-[#f8f9fb] font-urbanist text-[#212121] overflow-x-hidden">
            <Head title={`Book — ${visaType.name}`} />
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-12">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/80 overflow-hidden">
                    <div className="px-8 pt-8 pb-6 border-b border-gray-50">
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-[#00A693] mb-1">Payment received</p>
                        <p className="text-base font-black uppercase tracking-tight text-[#282728]">
                            Book your {visaType.name} consultation
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="px-8 py-10">
                            <div className="flex items-start gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-[#00A693]/10 flex items-center justify-center flex-shrink-0">
                                    <Calendar size={22} className="text-[#00A693]" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-[#282728] mb-2">
                                        Pick a time, {assessment.first_name}.
                                    </h2>
                                    <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                                        Times shown are NZT. Each consultation is {visaType.consultation_duration_minutes || 30} minutes.
                                        A confirmation email will follow.
                                    </p>
                                </div>
                            </div>

                            {slots.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                                    <p className="text-sm font-semibold text-[#282728]">No slots available right now</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Our team will reach out at {assessment.email} within one business day to confirm a time.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid lg:grid-cols-[260px_1fr] gap-6">
                                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-3">Select date</p>
                                        {slots.map((day) => {
                                            const isActive = day.date === selectedDate;
                                            return (
                                                <button
                                                    type="button"
                                                    key={day.date}
                                                    onClick={() => { setSelectedDate(day.date); setSelectedTime(null); }}
                                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors ${
                                                        isActive
                                                            ? 'border-[#00A693] bg-[#00A693]/5'
                                                            : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                                >
                                                    <div>
                                                        <p className="text-sm font-bold text-[#282728]">{day.label}</p>
                                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                                            {day.weekday} · {day.slots.length} slot{day.slots.length === 1 ? '' : 's'}
                                                        </p>
                                                    </div>
                                                    {isActive && <CheckCircle size={16} className="text-[#00A693]" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-3 flex items-center gap-2">
                                            <Clock size={13} /> Select time
                                        </p>
                                        {activeDay ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                {activeDay.slots.map((s) => {
                                                    const isActive = selectedTime === s.time;
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={s.time}
                                                            onClick={() => setSelectedTime(s.time)}
                                                            className={`px-3 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                                                                isActive
                                                                    ? 'bg-[#00A693] border-[#00A693] text-white'
                                                                    : 'bg-white border-gray-100 text-[#282728] hover:border-[#00A693]'
                                                            }`}
                                                        >
                                                            {s.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400">Pick a date first.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 bg-gray-50/40">
                            <div>
                                {selectedDate && selectedTime ? (
                                    <p className="text-xs text-gray-500">
                                        Selected:&nbsp;
                                        <span className="font-bold text-[#282728]">
                                            {slots.find(d => d.date === selectedDate)?.label} at {activeDay?.slots.find(s => s.time === selectedTime)?.label}
                                        </span>
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-400">No slot selected yet.</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={processing || !selectedDate || !selectedTime}
                                className="flex items-center gap-2 px-8 py-2.5 bg-[#00A693] text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#008c7c] active:scale-95 transition-all disabled:opacity-60"
                            >
                                {processing ? 'Confirming…' : 'Confirm booking'} <ArrowRight size={13} />
                            </button>
                        </div>

                        {errors.slot && (
                            <p className="px-8 pb-6 text-xs text-red-500">{errors.slot}</p>
                        )}
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}
