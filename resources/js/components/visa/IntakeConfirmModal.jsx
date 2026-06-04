import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Send } from 'lucide-react';

/**
 * Shared pre-submit confirmation modal used by the Work / Student / Visitor
 * intake forms. Mirrors the resident-intake modal's tone — frames the step
 * as a *review*, not a confirmation, so applicants don't think they've
 * already submitted.
 */
export default function IntakeConfirmModal({
    open,
    onClose,
    onConfirm,
    processing,
    visaLabel,
    summaryItems = [],
    submitLabel = 'Submit intake',
    accent = '#00A693',
    accentDark = '#008c7c',
}) {
    return (
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-[#282728]/60 backdrop-blur-sm"
                    style={{ '--accent': accent, '--accent-dark': accentDark }}
                    onClick={() => { if (!processing) onClose(); }}
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 24 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 24 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white max-h-[90vh] overflow-y-auto"
                    >
                        {/* Light "review" header — intentionally NOT a dark
                            success hero so users don't think they're done. */}
                        <div className="bg-amber-50/70 border-b border-amber-100 px-8 pt-8 pb-6">
                            <div className="flex items-center justify-end mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700/60">
                                    Last step{visaLabel ? ` · ${visaLabel}` : ''}
                                </span>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 bg-white border border-amber-200 rounded-xl flex items-center justify-center text-amber-700 flex-shrink-0">
                                    <Eye size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-[#282728] tracking-tight mb-1">
                                        Review your details before submitting
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Take a quick look below. Nothing is submitted until you click "{submitLabel}".
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white px-8 py-8">
                            {/* Legal notice */}
                            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-6">
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    By submitting this intake you confirm the information provided is{' '}
                                    <span className="text-[#282728] font-bold">true, complete and accurate</span>.
                                    Providing false or misleading information may affect your visa eligibility.
                                </p>
                            </div>

                            {/* Summary grid */}
                            {summaryItems.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3">Your details</p>
                                    <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
                                        {summaryItems.map(([label, value]) => (
                                            <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex-shrink-0">{label}</span>
                                                <span className="text-sm text-[#282728] font-medium text-right truncate">{value || '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col-reverse sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={processing}
                                    className="flex-1 py-4 rounded-xl border border-gray-200 text-[#282728] text-[10px] font-black uppercase tracking-[0.25em] hover:border-[#282728] transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    Keep editing
                                </button>
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    disabled={processing}
                                    className="flex-1 py-4 rounded-xl bg-[#282728] text-white text-[10px] font-black uppercase tracking-[0.25em] hover:bg-[var(--accent)] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-xl shadow-[#282728]/15"
                                >
                                    <Send size={12} />
                                    {processing ? 'Submitting…' : submitLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
