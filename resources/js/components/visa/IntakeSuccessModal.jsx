import React from 'react';
import { CheckCircle, Mail, ArrowRight } from 'lucide-react';

/**
 * Persistent post-submit confirmation for the visa intake forms.
 *
 * Triggered by the `intake_submitted` flash key — see HandleInertiaRequests
 * and the four visa intake controllers. Does NOT auto-dismiss. The user
 * either clicks "Done" (navigates to /immigration) or "Back to form" to
 * close the modal and stay on the page (useful if they want to take a
 * screenshot of what they submitted).
 *
 * Props:
 *   open          — boolean, controls visibility
 *   onClose       — called when the user clicks "Back to form"
 *   onContinue    — called when the user clicks "Done" (default: navigate
 *                   to /immigration)
 *   visaLabel     — visa name printed in the success copy
 *   accent        — accent colour (defaults to the teal used across the
 *                   intake shell)
 */
export default function IntakeSuccessModal({
    open,
    onClose,
    onContinue,
    visaLabel = 'visa',
    accent = '#00A693',
    accentDark = '#008c7c',
}) {
    if (!open) return null;

    const handleContinue = () => {
        if (onContinue) return onContinue();
        window.location.href = '/immigration';
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            style={{ '--accent': accent, '--accent-dark': accentDark }}
        >
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header band — uses the accent colour so each visa keeps
                    its visual identity. */}
                <div
                    className="h-1.5"
                    style={{ background: `linear-gradient(90deg, ${accent}, ${accentDark})` }}
                />

                <div className="px-7 pt-8 pb-6 text-center">
                    <div
                        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-lg"
                        style={{ backgroundColor: accent }}
                    >
                        <CheckCircle size={32} strokeWidth={2.2} className="text-white" />
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
                        Thanks — we've got it.
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Your <span className="font-semibold text-gray-800">{visaLabel}</span> details
                        have been submitted to our immigration team. We'll review them and follow up
                        with next steps within 1–2 business days.
                    </p>

                    {/* Next-step hint — sets expectations so the applicant
                        doesn't wonder if anything's pending on their side. */}
                    <div className="mt-5 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-left">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500 mb-1.5">
                            What happens next
                        </p>
                        <div className="flex items-start gap-2.5 text-xs text-gray-700">
                            <Mail size={14} className="mt-0.5 flex-shrink-0" style={{ color: accent }} />
                            <p className="leading-relaxed">
                                Look out for an email confirming receipt. A licensed adviser will
                                reach out to schedule your consultation.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-7 pb-7 flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={handleContinue}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm hover:shadow-md transition-all"
                        style={{ backgroundColor: accent }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentDark)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accent)}
                    >
                        Done
                        <ArrowRight size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        Back to form
                    </button>
                </div>
            </div>
        </div>
    );
}
