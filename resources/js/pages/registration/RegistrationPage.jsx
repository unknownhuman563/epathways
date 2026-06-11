import React, { useState, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    CheckCircle, AlertCircle, ChevronRight, Lock, Calendar, MapPin,
    Mail, Phone, Clock, FileText, Sparkles, Users, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Event registration page — public, served at /register/{event_code}.
// Redesigned for clarity: cleaner typography, generous breathing room,
// premium card surfaces, and labels that read like a polished product
// instead of a wall of uppercase tracking-widest.

const BRAND = '#282728';

// Reusable form field — clean label above the control, error state
// surfaced inline so the form stays visually quiet until something
// actually breaks.
function Field({ label, error, required, children }) {
    const hasError = !! error;
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 px-0.5">
                <label className={`text-[11px] font-semibold uppercase tracking-wider ${hasError ? 'text-red-600' : 'text-gray-500'}`}>
                    {label}
                    {required && <span className={`ml-0.5 ${hasError ? 'text-red-600' : 'text-gray-400'}`}>*</span>}
                </label>
                {hasError && (
                    <span className="text-[10px] font-semibold text-red-600 inline-flex items-center gap-1">
                        <AlertCircle size={10} /> {typeof error === 'string' ? error : 'Required'}
                    </span>
                )}
            </div>
            <div className={hasError ? 'rounded-xl ring-2 ring-red-200' : ''}>
                {children}
            </div>
        </div>
    );
}

// Pill multi-choice — clean rounded-xl pills with a subtle hover, and
// a clear selected state.
function PillGroup({ options, value, onChange }) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
                const selected = value === opt;
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className={`px-4 py-2 rounded-xl text-[12px] font-semibold border transition-colors ${
                            selected
                                ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                    >
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}

// Section header with subtle numbering — replaces the noisy
// uppercase tracking-[0.3em] strip.
function SectionTitle({ index, title, subtitle }) {
    return (
        <header className="border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-[11px] font-bold text-gray-700 tabular-nums">
                    {String(index).padStart(2, '0')}
                </span>
                <div>
                    <h3 className="text-base font-bold text-gray-900 tracking-tight">{title}</h3>
                    {subtitle && <p className="text-[12px] text-gray-500 mt-0.5">{subtitle}</p>}
                </div>
            </div>
        </header>
    );
}

// Success view — premium, calm, single call-to-action.
function SuccessScreen({ eventName }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 px-10 pt-12 pb-8 text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-5"
                    >
                        <CheckCircle size={28} />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">You're registered</h2>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        Your seat for <span className="font-semibold text-gray-900">{eventName}</span> is confirmed.
                        We'll be in touch with the details shortly.
                    </p>
                </div>
                <div className="px-10 pb-10 pt-6">
                    <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 mb-6 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Registration ID</p>
                        <p className="text-base font-mono font-semibold text-gray-900 tabular-nums">
                            EV-{Math.floor(Math.random() * 90000) + 10000}
                        </p>
                    </div>
                    <a
                        href="/"
                        className="inline-flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        Return to home <ArrowRight size={14} />
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function Registration({ event }) {
    if (! event) {
        return (
            <div className="min-h-screen flex items-center justify-center p-10 text-center">
                <div>
                    <AlertCircle size={28} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-sm font-semibold text-gray-700">Event data missing.</p>
                </div>
            </div>
        );
    }

    const [success, setSuccess] = useState(false);
    const [modal, setModal] = useState({ show: false, message: '' });
    const formRef = useRef(null);

    const { data, setData, post, processing, errors } = useForm({
        first_name: '', last_name: '', email: '', phone: '', city: '', country: '',
        employment_status: '', interest: '', education_level: '',
        field_of_study: '', planning_timeline: '', funding_source: '',
        event_session_id: '', remarks: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formRef.current && ! formRef.current.reportValidity()) return;
        post(`/register/${event.event_code}`, {
            onSuccess: () => setSuccess(true),
            preserveScroll: true,
            onError: (errs) => {
                const message = Object.values(errs).join('\n');
                setModal({
                    show: true,
                    message: 'Some information is missing or invalid. Please review the highlighted fields.\n\n' + message,
                });
            },
        });
    };

    if (success) return <SuccessScreen eventName={event.name} />;

    const inputClass = 'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5 outline-none transition-colors';

    const bannerSrc = event.banner_image && event.banner_image.trim() !== ''
        ? (event.banner_image.startsWith('http') ? event.banner_image : `/storage/${event.banner_image}`)
        : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop';

    const fmtDate = (iso) => iso
        ? new Date(iso).toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    return (
        <div className="min-h-screen bg-gray-50/60 text-gray-900">
            <Head title={`Register — ${event.name}`} />

            {/* ── HERO ──────────────────────────────────────────────── */}
            <section className="relative overflow-hidden">
                <img
                    src={bannerSrc}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop';
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-900/70 to-gray-900/50" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent" />

                <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 sm:pt-32 sm:pb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-white/90 text-[11px] font-semibold tracking-wide mb-6"
                    >
                        <Sparkles size={12} />
                        {event.type || 'Upcoming event'}
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.05] max-w-3xl"
                    >
                        {event.name || 'Register for our event'}
                    </motion.h1>

                    {event.description && (
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="mt-5 text-base sm:text-lg text-gray-200 max-w-2xl leading-relaxed"
                        >
                            {event.description}
                        </motion.p>
                    )}

                    {/* Meta strip — date / mode / sessions count */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mt-10 flex flex-wrap items-center gap-2"
                    >
                        {event.date_from && (
                            <MetaChip icon={<Calendar size={14} />}>{fmtDate(event.date_from)}</MetaChip>
                        )}
                        {event.mode && (
                            <MetaChip icon={<MapPin size={14} />}>{event.mode}</MetaChip>
                        )}
                        {event.sessions && event.sessions.length > 0 && (
                            <MetaChip icon={<Users size={14} />}>
                                {event.sessions.length} session{event.sessions.length === 1 ? '' : 's'} available
                            </MetaChip>
                        )}
                        <MetaChip icon={<Clock size={14} />} accent>Registration open</MetaChip>
                    </motion.div>
                </div>
            </section>

            {/* ── BODY ──────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-10 items-start">

                    {/* ─ FORM ─────────────────────────────────────── */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 sm:px-10 sm:py-7 border-b border-gray-100 bg-gradient-to-br from-gray-50/60 to-white">
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Reserve your seat</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                A few quick details so we can tailor the session to you.
                            </p>
                        </div>

                        <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-7 sm:px-10 sm:py-9 space-y-10">

                            {/* 1. Personal */}
                            <section className="space-y-5">
                                <SectionTitle
                                    index={1}
                                    title="Personal information"
                                    subtitle="Who should we expect at the session?"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="First name" required error={errors.first_name}>
                                        <input required type="text" className={inputClass} value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} placeholder="e.g. Maria" />
                                    </Field>
                                    <Field label="Last name" required error={errors.last_name}>
                                        <input required type="text" className={inputClass} value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} placeholder="e.g. Santos" />
                                    </Field>
                                    <Field label="Email address" required error={errors.email}>
                                        <input required type="email" className={inputClass} value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="you@example.com" />
                                    </Field>
                                    <Field label="Phone number" required error={errors.phone}>
                                        <input required type="tel" className={inputClass} value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+63 …" />
                                    </Field>
                                    <Field label="City" required>
                                        <input required type="text" className={inputClass} value={data.city} onChange={(e) => setData('city', e.target.value)} />
                                    </Field>
                                    <Field label="Current country" required>
                                        <input required type="text" className={inputClass} value={data.country} onChange={(e) => setData('country', e.target.value)} />
                                    </Field>

                                    {event.sessions && event.sessions.length > 0 && (
                                        <div className="sm:col-span-2">
                                            <Field label="Preferred session" error={errors.event_session_id}>
                                                <select
                                                    className={inputClass}
                                                    value={data.event_session_id}
                                                    onChange={(e) => setData('event_session_id', e.target.value)}
                                                >
                                                    <option value="">Pick a session (optional)</option>
                                                    {event.sessions.map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.venue_name || s.city}
                                                            {s.time_start ? ` — ${s.time_start.slice(0, 5)}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </Field>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* 2. Background */}
                            <section className="space-y-5">
                                <SectionTitle
                                    index={2}
                                    title="Background"
                                    subtitle="Helps our advisers map the right pathway for you."
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Highest education level" required error={errors.education_level}>
                                        <select required className={inputClass} value={data.education_level} onChange={(e) => setData('education_level', e.target.value)}>
                                            <option value="">Select level</option>
                                            <option>High School Graduate</option>
                                            <option>Associate / Vocational</option>
                                            <option>Bachelor's Degree</option>
                                            <option>Master's Degree</option>
                                            <option>Doctorate / PhD</option>
                                        </select>
                                    </Field>
                                    <Field label="Field of study or profession" required error={errors.field_of_study}>
                                        <input required type="text" className={inputClass} value={data.field_of_study} onChange={(e) => setData('field_of_study', e.target.value)} placeholder="e.g. Nursing, IT, Engineering" />
                                    </Field>
                                    <div className="sm:col-span-2">
                                        <Field label="Employment status" required error={errors.employment_status}>
                                            <PillGroup
                                                options={['Employed', 'Self-Employed', 'Unemployed', 'Student', 'OFW']}
                                                value={data.employment_status}
                                                onChange={(v) => setData('employment_status', v)}
                                            />
                                            {! data.employment_status && (
                                                <input
                                                    type="text"
                                                    required
                                                    aria-hidden
                                                    tabIndex={-1}
                                                    style={{ opacity: 0, height: 0, padding: 0, border: 'none', position: 'absolute', zIndex: -1 }}
                                                />
                                            )}
                                        </Field>
                                    </div>
                                </div>
                            </section>

                            {/* 3. Pathway */}
                            <section className="space-y-5">
                                <SectionTitle
                                    index={3}
                                    title="NZ pathway"
                                    subtitle="Tell us about your move and timeline."
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Pathway of interest" required error={errors.interest}>
                                        <select required className={inputClass} value={data.interest} onChange={(e) => setData('interest', e.target.value)}>
                                            <option value="">Select pathway</option>
                                            <option value="Work Visa / Job Support">Work Visa / Job Support</option>
                                            <option value="Student Visa">Student Visa</option>
                                            <option value="Skilled Migrant">Skilled Migrant</option>
                                            <option value="Partner / Family Visa">Partner / Family Visa</option>
                                            <option value="Investor Visa">Investor Visa</option>
                                            <option value="Not sure yet">Not sure yet</option>
                                        </select>
                                    </Field>
                                    <Field label="Planning timeline" required error={errors.planning_timeline}>
                                        <select required className={inputClass} value={data.planning_timeline} onChange={(e) => setData('planning_timeline', e.target.value)}>
                                            <option value="">When are you planning?</option>
                                            <option>Within 3 months</option>
                                            <option>3–6 months</option>
                                            <option>6–12 months</option>
                                            <option>1–2 years</option>
                                            <option>Just exploring</option>
                                        </select>
                                    </Field>
                                    <div className="sm:col-span-2">
                                        <Field label="How will you fund your move?" required error={errors.funding_source}>
                                            <PillGroup
                                                options={['Personal Savings', 'Family Support', 'Scholarship', 'Student Loan', 'Employer-Sponsored', 'Not yet decided']}
                                                value={data.funding_source}
                                                onChange={(v) => setData('funding_source', v)}
                                            />
                                            {! data.funding_source && (
                                                <input
                                                    type="text"
                                                    required
                                                    aria-hidden
                                                    tabIndex={-1}
                                                    style={{ opacity: 0, height: 0, padding: 0, border: 'none', position: 'absolute', zIndex: -1 }}
                                                />
                                            )}
                                        </Field>
                                    </div>
                                </div>
                            </section>

                            {/* 4. Remarks */}
                            <section className="space-y-5">
                                <SectionTitle
                                    index={4}
                                    title="Anything else?"
                                    subtitle="Optional — share questions or goals you want to cover."
                                />
                                <Field label="Questions or goals">
                                    <textarea
                                        placeholder="Anything specific you want addressed during the session…"
                                        rows={4}
                                        className={`${inputClass} resize-y leading-relaxed`}
                                        value={data.remarks}
                                        onChange={(e) => setData('remarks', e.target.value)}
                                    />
                                </Field>
                            </section>

                            {/* Submit */}
                            <div className="pt-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
                                <p className="text-[11px] text-gray-400 inline-flex items-center gap-1.5">
                                    <Lock size={11} /> Your details are secured and never sold.
                                </p>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gray-900 text-white text-sm font-semibold shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? 'Submitting…' : 'Confirm registration'}
                                    {! processing && <ChevronRight size={15} />}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* ─ SIDEBAR ──────────────────────────────────── */}
                    <aside className="space-y-4">

                        {/* Free Assessment */}
                        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-br from-emerald-50/70 to-white">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                        <FileText size={16} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md">
                                        Free
                                    </span>
                                </div>
                                <h3 className="mt-4 text-base font-bold text-gray-900">Free assessment</h3>
                                <p className="mt-1 text-[12.5px] text-gray-500 leading-relaxed">
                                    A personalised eligibility read on your NZ pathway.
                                </p>
                            </div>
                            <ul className="px-6 py-4 space-y-2.5">
                                {['Visa eligibility mapping', 'Qualification recognition check', 'Step-by-step action plan'].map((txt) => (
                                    <li key={txt} className="flex items-start gap-2 text-[12.5px] text-gray-700">
                                        <CheckCircle size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                                        <span>{txt}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="px-6 pb-5">
                                <a
                                    href="/free-assessment"
                                    className="inline-flex items-center justify-between w-full px-4 py-3 rounded-xl border border-gray-900 text-gray-900 text-sm font-semibold hover:bg-gray-900 hover:text-white transition-colors"
                                >
                                    Start assessment
                                    <ChevronRight size={14} />
                                </a>
                            </div>
                        </article>

                        {/* Free Consultation */}
                        <article className="rounded-2xl shadow-md overflow-hidden text-white" style={{ backgroundColor: BRAND }}>
                            <div className="px-6 py-5 border-b border-white/10">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                                        <Calendar size={16} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/90 bg-white/10 border border-white/15 px-2 py-1 rounded-md">
                                        No cost
                                    </span>
                                </div>
                                <h3 className="mt-4 text-base font-bold">Book a consultation</h3>
                                <p className="mt-1 text-[12.5px] text-white/70 leading-relaxed">
                                    A 30-minute private session with a certified ePathways adviser.
                                </p>
                            </div>
                            <ul className="px-6 py-4 space-y-2.5">
                                {['30-min private session', 'Discuss your specific situation', 'No sales pressure'].map((txt) => (
                                    <li key={txt} className="flex items-start gap-2 text-[12.5px] text-white/90">
                                        <CheckCircle size={13} className="text-emerald-300 shrink-0 mt-0.5" />
                                        <span>{txt}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="px-6 pb-5">
                                <a
                                    href="/booking"
                                    className="inline-flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-colors"
                                >
                                    View schedule
                                    <ChevronRight size={14} />
                                </a>
                            </div>
                        </article>

                        {/* Contact */}
                        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-4">
                                Get in touch
                            </h3>
                            <ul className="space-y-3.5">
                                <li className="flex items-start gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                                        <MapPin size={14} />
                                    </span>
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Location</p>
                                        <p className="text-[13px] text-gray-800 leading-snug">
                                            2F Landco Center<br />
                                            Davao City, PH
                                        </p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                                        <Phone size={14} />
                                    </span>
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Phone</p>
                                        <p className="text-[13px] text-gray-800 leading-snug">+63 (82) 297-5000</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                                        <Mail size={14} />
                                    </span>
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Email</p>
                                        <p className="text-[13px] text-gray-800 leading-snug">hello@epathways.com.ph</p>
                                    </div>
                                </li>
                            </ul>
                        </article>
                    </aside>
                </div>
            </div>

            {/* ── VALIDATION MODAL ─────────────────────────────────── */}
            <AnimatePresence>
                {modal.show && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/50 backdrop-blur-sm"
                        onClick={(e) => { if (e.target === e.currentTarget) setModal({ show: false, message: '' }); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 8 }}
                            className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="px-7 pt-8 pb-6 text-center">
                                <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                                    <AlertCircle size={22} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Almost there</h3>
                                <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                                    {modal.message}
                                </p>
                            </div>
                            <div className="px-7 pb-7">
                                <button
                                    type="button"
                                    onClick={() => setModal({ show: false, message: '' })}
                                    className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                                >
                                    Got it
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Hero meta chip — small rounded pill in the dark hero. Accent variant
// for the "Registration open" state.
function MetaChip({ icon, children, accent = false }) {
    return (
        <span
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px] font-semibold ${
                accent
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-white/95 text-gray-800 shadow-md shadow-black/10'
            }`}
        >
            <span className={accent ? 'text-white/90' : 'text-gray-500'}>{icon}</span>
            {children}
        </span>
    );
}
