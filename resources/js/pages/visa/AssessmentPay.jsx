import React, { useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { CreditCard, Lock, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ResidentIntakeStepper from '@/components/visa/ResidentIntakeStepper';

const fmt = (n) => Number(n).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
const PENDING_ASSESSMENT_KEY = 'epathways_pending_assessment';

export default function AssessmentPay({ assessment, visaType, priceRefreshed, previousPrice, previousLockedAt }) {
    const { post, processing } = useForm();
    const alreadyPaid = assessment.payment_status === 'paid';

    // Mark this assessment as the applicant's in-flight one. /resident-interest
    // reads this and forwards them straight to /pay (or /book if already paid)
    // instead of showing them the form again.
    useEffect(() => {
        try {
            window.localStorage.setItem(PENDING_ASSESSMENT_KEY, JSON.stringify({
                token:  assessment.token,
                status: assessment.payment_status === 'paid' ? 'paid' : 'pending',
            }));
        } catch { /* ignore — private mode etc. */ }
    }, [assessment.token, assessment.payment_status]);

    useEffect(() => {
        if (priceRefreshed) {
            toast.warning('Your locked price has expired — updated to the current rate.');
        }
    }, [priceRefreshed]);

    const submit = (e) => {
        e.preventDefault();
        post(`/assessment/${assessment.token}/pay`, {
            preserveScroll: true,
            onError: () => toast.error('Could not start the payment — please try again.'),
        });
    };

    return (
        <div className="min-h-screen bg-[#f8f9fb] font-urbanist text-[#212121] overflow-x-hidden">
            <Head title={`Pay — ${visaType.name}`} />
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-12">
                <div className="mb-10">
                    <ResidentIntakeStepper
                        currentStep={10}
                        completedSteps={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
                    />
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/80 overflow-hidden">
                    <div className="px-8 pt-8 pb-6 border-b border-gray-50">
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-500 mb-1">Section 10 of 10</p>
                        <p className="text-base font-black uppercase tracking-tight text-[#282728]">Consultation Payment</p>
                    </div>

                    {priceRefreshed && (
                        <div className="mx-8 mt-6 rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-amber-800">
                                        Your original quote of ${fmt(previousPrice)} NZD was given on {fmtDate(previousLockedAt)}.
                                    </p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        Current price is ${fmt(assessment.locked_price_nzd)} NZD. Please review and continue.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={submit} className="px-8 py-12">
                        <div className="max-w-xl mx-auto">
                            {/* Centered intro */}
                            <div className="text-center mb-10">
                                <div className="w-14 h-14 rounded-2xl bg-[#00A693]/10 flex items-center justify-center mx-auto mb-5">
                                    <CreditCard size={24} className="text-[#00A693]" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight text-[#282728] mb-3">
                                    Almost there, {assessment.first_name}.
                                </h2>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Pay the consultation fee to unlock the booking step. Once paid you'll
                                    pick a time slot with one of our licensed immigration advisers.
                                </p>
                            </div>

                            {/* Centered summary card */}
                            <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-6 mb-8 text-center">
                                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-1">Applicant</p>
                                <p className="text-sm font-semibold text-[#282728] mb-5">{assessment.first_name} {assessment.last_name}</p>

                                <div className="border-t border-gray-200 pt-5">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-1">Total</p>
                                    <p className="text-3xl font-black text-[#282728]">
                                        NZD <span className="text-[#00A693]">${fmt(assessment.locked_price_nzd)}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-6">
                                <Lock size={13} />
                                <span>Payments processed securely. We never store full card details.</span>
                            </div>

                            {alreadyPaid ? (
                                <a
                                    href={`/assessment/${assessment.token}/book`}
                                    className="w-full flex items-center justify-center gap-2 bg-[#00A693] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.3em] hover:bg-[#008c7c] transition-all active:scale-[0.99]"
                                >
                                    <ShieldCheck size={15} /> Payment received — continue to booking <ArrowRight size={15} />
                                </a>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex items-center justify-center gap-2 bg-[#282728] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.3em] hover:bg-[#00A693] transition-all active:scale-[0.99] disabled:opacity-60"
                                >
                                    <CreditCard size={15} />
                                    {processing ? 'Processing…' : `Continue to payment — NZD $${fmt(assessment.locked_price_nzd)}`}
                                    <ArrowRight size={15} />
                                </button>
                            )}

                            <p className="text-[10px] text-gray-400 text-center mt-4">
                                By continuing you agree to ePathways' terms of engagement. A receipt will be emailed to {assessment.email}.
                            </p>
                        </div>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}
