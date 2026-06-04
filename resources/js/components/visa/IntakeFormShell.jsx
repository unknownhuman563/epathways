import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Send, Check, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

/**
 * Shared shell for the Work / Student / Visitor visa intake forms. Owns the
 * stepper, step navigation, submit, and draft auto-save. Each visa-specific
 * page passes:
 *
 *   - title         page <Head> title
 *   - visaLabel     short label shown in the section header
 *   - steps         [{ title, render: (form) => JSX }]
 *   - onSubmit      () => void
 *   - processing    boolean from the parent's useForm
 *   - submitLabel   optional, defaults to "Submit"
 *   - data          live form values (for auto-save)
 *   - draftKey      localStorage key — when set, enables auto-save + the
 *                   "Save draft" button + the "Draft saved …" indicator.
 *   - step          controlled step (optional — defaults to internal state)
 *   - setStep       setter for controlled step
 *   - visitedSteps  Set<number> of steps the applicant has actually opened
 *   - validateStep  optional (n) => errors. When BOTH visitedSteps and
 *                   validateStep are supplied, the stepper only shows a
 *                   checkmark for a step that's been visited AND validates
 *                   — same behaviour as the resident-intake form, so
 *                   "moved past" doesn't imply "complete".
 */
export default function IntakeFormShell({
    title,
    visaLabel,
    steps,
    onSubmit,
    processing,
    submitLabel = 'Submit',
    data,
    draftKey,
    step: stepProp,
    setStep: setStepProp,
    visitedSteps,
    validateStep,
    // CSS-variable accent — every internal use of "the brand colour" reads
    // `var(--accent)` / `var(--accent-dark)`, so a page can pass a different
    // shade (e.g. the green #436235 used by the Education brand) without
    // rebuilding the shell.
    accent = '#00A693',
    accentDark = '#008c7c',
    // Optional server-side draft save. When provided, the "Save draft"
    // button calls this AFTER persisting locally — the page can use it to
    // POST the in-progress data to a controller so the lead appears in
    // staff dashboards.
    onSaveDraft,
}) {
    const [internalStep, setInternalStep] = useState(1);
    const step = stepProp ?? internalStep;
    const setStep = setStepProp ?? setInternalStep;
    const skipFirstSave = useRef(true);
    const total = steps.length;
    const current = steps[step - 1];

    const isStepCompleted = (idx0) => {
        const id = idx0 + 1;
        if (id === step) return false;
        // No visited tracking → fall back to position (legacy behaviour).
        if (!visitedSteps) return step > id;
        if (!visitedSteps.has(id)) return false;
        if (!validateStep) return true;
        return Object.keys(validateStep(id) || {}).length === 0;
    };

    // Auto-save: persists the form to localStorage 800ms after the last edit.
    // The very first effect run (which fires on mount with the initial data)
    // is skipped so we don't overwrite the restored draft before the user
    // touches anything.
    useEffect(() => {
        if (!draftKey || !data) return;
        if (skipFirstSave.current) {
            skipFirstSave.current = false;
            return;
        }
        const t = setTimeout(() => {
            try {
                window.localStorage.setItem(draftKey, JSON.stringify(data));
            } catch { /* private mode etc. */ }
        }, 800);
        return () => clearTimeout(t);
    }, [data, draftKey]);

    const saveDraftNow = () => {
        if (!data) return;
        if (draftKey) {
            try { window.localStorage.setItem(draftKey, JSON.stringify(data)); } catch {}
        }
        // If the parent wants to also persist to the server (so the draft
        // appears in staff dashboards) it provides onSaveDraft. Otherwise
        // fall back to a plain local-only confirmation toast.
        if (typeof onSaveDraft === 'function') {
            onSaveDraft(data);
        } else {
            toast.success('Draft saved');
        }
    };

    const next = () => setStep((s) => Math.min(s + 1, total));
    const prev = () => setStep((s) => Math.max(s - 1, 1));
    const goTo = (n) => setStep(Math.min(Math.max(1, n), total));

    return (
        <div
            className="min-h-screen bg-[#f8f9fb] font-urbanist text-[#212121] overflow-x-hidden"
            style={{ '--accent': accent, '--accent-dark': accentDark }}
        >
            <Head title={title} />
            <Navbar />

            {/* Match the Navbar's container so the form edges line up with
                the brand/Login button at every breakpoint. */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-12">
                {/* Stepper */}
                <div className="mb-10 overflow-x-auto pb-2 -mx-2 px-2">
                    <div className="min-w-[640px]">
                        <ol className="flex items-start justify-between">
                            {steps.map((s, idx) => {
                                const isActive = step === idx + 1;
                                const isCompleted = isStepCompleted(idx);
                                const isLast = idx === steps.length - 1;
                                return (
                                    <React.Fragment key={idx}>
                                        <li className="flex flex-col items-center w-20 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => goTo(idx + 1)}
                                                className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors ${
                                                    isCompleted
                                                        ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)]'
                                                        : isActive
                                                            ? 'bg-white border-2 border-[var(--accent)] text-[var(--accent)]'
                                                            : 'bg-white border border-gray-200 text-gray-400 hover:border-gray-300'
                                                }`}
                                            >
                                                {isCompleted ? <Check size={16} strokeWidth={3} /> : idx + 1}
                                            </button>
                                            <p className={`mt-2.5 text-[11px] leading-tight text-center px-1 transition-colors ${
                                                isActive ? 'text-[#282728] font-semibold'
                                                    : isCompleted ? 'text-[var(--accent)] font-medium'
                                                        : 'text-gray-400'
                                            }`}>
                                                {s.title}
                                            </p>
                                        </li>
                                        {!isLast && (
                                            <li
                                                aria-hidden="true"
                                                className={`flex-1 h-px mt-[18px] transition-colors ${
                                                    isCompleted ? 'bg-[var(--accent)]' : 'bg-gray-200'
                                                }`}
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </ol>
                    </div>
                </div>

                {/* Form card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/80 overflow-hidden">
                    <div className="px-8 pt-8 pb-6 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-500 mb-1">
                                Section {step.toString().padStart(2, '0')} of {total.toString().padStart(2, '0')}
                            </p>
                            <p className="text-base font-black uppercase tracking-tight text-[#282728]">{current?.title}</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hidden sm:inline">
                            {visaLabel}
                        </span>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="flex flex-col">
                        <div className="px-8 py-10 min-h-[420px]">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {current?.render?.()}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 bg-gray-50/40 gap-3 flex-wrap">
                            <button
                                type="button"
                                onClick={prev}
                                disabled={step === 1}
                                className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.2em] transition-all border ${
                                    step === 1
                                        ? 'opacity-0 cursor-default border-transparent'
                                        : 'border-gray-300 text-gray-500 hover:border-[#282728] hover:text-[#282728]'
                                }`}
                            >
                                <ChevronLeft size={13} /> Back
                            </button>

                            <div className="flex items-center gap-3 flex-wrap justify-end">
                                {draftKey && (
                                    <button
                                        type="button"
                                        onClick={saveDraftNow}
                                        className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.2em] border border-gray-200 text-gray-600 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                                        title="Your progress is also auto-saved on this device"
                                    >
                                        <Save size={12} /> Save draft
                                    </button>
                                )}
                                {step < total ? (
                                    <button
                                        type="button"
                                        onClick={next}
                                        className="group flex items-center gap-2 px-8 py-2.5 bg-[#282728] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all hover:bg-[var(--accent)] active:scale-95"
                                    >
                                        Continue <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex items-center gap-2 px-8 py-2.5 bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all hover:bg-[var(--accent-dark)] active:scale-95 disabled:opacity-60"
                                    >
                                        <Send size={13} />
                                        {processing ? 'Submitting…' : submitLabel}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}
