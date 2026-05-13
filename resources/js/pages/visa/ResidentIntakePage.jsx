import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    ShieldCheck,
    User,
    Globe,
    Briefcase,
    GraduationCap,
    Award,
    Languages,
    FileCheck2,
    MessageSquare,
    Send,
    Plus,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const TEAL = '#00A693';
const TEAL_DARK = '#008c7c';
const DARK = '#0c1611';

const TOTAL_STEPS = 9;
const DRAFT_STORAGE_KEY = 'epathways_resident_intake_draft';

const freshDocumentFiles = () => ({
    passport: null,
    visa_copies: null,
    contracts: null,
    payslips: null,
    ird_summary: null,
    education_certs: null,
    cv: null,
});

const FORM_DEFAULTS = {
    terms_accepted: false,
    // Personal
    first_name: '',
    last_name: '',
    dob: '',
    nationality: '',
    email: '',
    phone: '',
    // Passport
    passport_number: '',
    passport_expiry: '',
    issuing_country: '',
    // Visa status
    current_visa_type: '',
    current_visa_other: '',
    current_visa_expiry: '',
    nz_arrival_date: '',
    previous_nz_visa_history: '',
    // Employment at Ergo
    job_title: '',
    employment_start: '',
    employment_type: '',
    hourly_rate: '',
    // Qualifications
    highest_qualification: '',
    institution_name: '',
    country_of_study: '',
    nzqa_status: '',
    nzqa_iqa_reference: '',
    // Work experience
    nz_skilled_years: '',
    total_skilled_years: '',
    career_summary: '',
    // English
    english_evidence: '',
    english_test_score: '',
    english_test_date: '',
    // Family
    include_family: '',
    family_members: [],
    // Documents checklist
    documents: {
        passport: false,
        visa_copies: false,
        contracts: false,
        payslips: false,
        ird_summary: false,
        education_certs: false,
        cv: false,
    },
    // Documents — actual uploaded PDFs (checklist key -> File). Never persisted.
    document_files: freshDocumentFiles(),
    // Disclosures
    character_health_disclosure: '',
    other_notes: '',
};

// Build the form's initial values, restoring a saved draft from this device if one exists.
function buildInitialFormData() {
    const base = {
        ...FORM_DEFAULTS,
        documents: { ...FORM_DEFAULTS.documents },
        document_files: freshDocumentFiles(),
        family_members: [],
    };
    try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object') {
                const { document_files, ...restorable } = parsed.data; // never restore File objects
                return { ...base, ...restorable, document_files: freshDocumentFiles() };
            }
        }
    } catch {
        /* corrupt / unavailable storage — fall through to defaults */
    }
    return base;
}

function loadDraftStep() {
    try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            const s = parsed?.step;
            if (Number.isInteger(s) && s >= 1 && s <= TOTAL_STEPS) return s;
        }
    } catch {
        /* ignore */
    }
    return 1;
}

export default function ResidentIntakePage() {
    const { flash } = usePage().props;
    const [step, setStep] = useState(loadDraftStep);
    const [isSuccess, setIsSuccess] = useState(false);
    const [intakeId, setIntakeId] = useState(null);
    const [modal, setModal] = useState({ show: false, message: '' });
    const [localErrors, setLocalErrors] = useState({});

    useEffect(() => {
        if (flash?.success) {
            setIsSuccess(true);
            if (flash?.intake_id) setIntakeId(flash.intake_id);
        }
    }, [flash]);

    const [initialFormData] = useState(buildInitialFormData); // restored draft or defaults, computed once
    const { data, setData, post, processing, transform } = useForm(initialFormData);

    // Auto-save a draft to this device on every change so a refresh keeps everything.
    // Uploaded PDF files can't be serialised, so they're left out (the checklist ticks are kept).
    useEffect(() => {
        if (isSuccess) {
            try { window.localStorage.removeItem(DRAFT_STORAGE_KEY); } catch { /* ignore */ }
            return;
        }
        try {
            const { document_files, ...persistable } = data;
            window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ data: persistable, step, savedAt: Date.now() }));
        } catch {
            /* storage full or unavailable — non-fatal */
        }
    }, [data, step, isSuccess]);

    const handleStartOver = () => {
        if (!window.confirm('Clear everything you have entered and start over?')) return;
        try { window.localStorage.removeItem(DRAFT_STORAGE_KEY); } catch { /* ignore */ }
        setData({
            ...FORM_DEFAULTS,
            documents: { ...FORM_DEFAULTS.documents },
            document_files: freshDocumentFiles(),
            family_members: [],
        });
        setStep(1);
        setLocalErrors({});
        setModal({ show: false, message: '' });
    };

    const steps = [
        { id: 1, title: 'Terms', icon: ShieldCheck },
        { id: 2, title: 'Personal', icon: User },
        { id: 3, title: 'Passport & Visa', icon: Globe },
        { id: 4, title: 'Employment', icon: Briefcase },
        { id: 5, title: 'Qualifications', icon: GraduationCap },
        { id: 6, title: 'Experience', icon: Award },
        { id: 7, title: 'English & Family', icon: Languages },
        { id: 8, title: 'Documents', icon: FileCheck2 },
        { id: 9, title: 'Additional Info', icon: MessageSquare },
    ];

    const formRef = useRef(null);

    const validateStep = (n) => {
        const errs = {};
        switch (n) {
            case 1:
                if (!data.terms_accepted) errs.terms_accepted = 'You must accept the terms to continue';
                break;
            case 2:
                if (!data.first_name.trim()) errs.first_name = 'First name is required';
                if (!data.last_name.trim()) errs.last_name = 'Last name is required';
                if (!data.dob) errs.dob = 'Date of birth is required';
                if (!data.nationality.trim()) errs.nationality = 'Nationality is required';
                if (!data.email.trim()) errs.email = 'Email is required';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Enter a valid email address';
                if (!data.phone.trim()) errs.phone = 'Phone number is required';
                break;
            case 3:
                if (!data.passport_number.trim()) errs.passport_number = 'Passport number is required';
                if (!data.passport_expiry) errs.passport_expiry = 'Passport expiry is required';
                if (!data.issuing_country.trim()) errs.issuing_country = 'Issuing country is required';
                if (!data.current_visa_type) errs.current_visa_type = 'Select your current NZ visa type';
                if (data.current_visa_type === 'Other' && !data.current_visa_other.trim()) errs.current_visa_other = 'Please describe the visa type';
                if (!data.current_visa_expiry) errs.current_visa_expiry = 'Current visa expiry is required';
                if (!data.nz_arrival_date) errs.nz_arrival_date = 'NZ arrival date is required';
                break;
            case 4:
                if (!data.job_title.trim()) errs.job_title = 'Job title is required';
                if (!data.employment_start) errs.employment_start = 'Employment start date is required';
                if (!data.employment_type) errs.employment_type = 'Employment type is required';
                if (!data.hourly_rate.toString().trim()) errs.hourly_rate = 'Hourly rate is required';
                break;
            case 5:
                if (!data.highest_qualification) errs.highest_qualification = 'Highest qualification is required';
                if (data.nzqa_status === 'Yes — IQA completed' && !data.nzqa_iqa_reference.trim()) {
                    errs.nzqa_iqa_reference = 'IQA reference number is required';
                }
                break;
            case 6:
                if (!data.nz_skilled_years.toString().trim()) errs.nz_skilled_years = 'NZ skilled years is required';
                if (!data.total_skilled_years.toString().trim()) errs.total_skilled_years = 'Total years is required';
                break;
            case 7:
                if (!data.english_evidence) errs.english_evidence = 'Please select an English evidence type';
                if (['IELTS', 'TOEFL', 'PTE Academic'].includes(data.english_evidence)) {
                    if (!data.english_test_score.toString().trim()) errs.english_test_score = 'Test score is required';
                    if (!data.english_test_date) errs.english_test_date = 'Test date is required';
                }
                if (!data.include_family) errs.include_family = 'Please indicate whether family will be included';
                if (data.include_family === 'Yes') {
                    if (!data.family_members || data.family_members.length === 0) {
                        errs.family_members = 'Add at least one family member';
                    } else {
                        data.family_members.forEach((m, i) => {
                            if (!m.full_name || !m.full_name.trim()) errs[`family_members.${i}.full_name`] = 'Full name is required';
                            if (!m.relationship) errs[`family_members.${i}.relationship`] = 'Relationship is required';
                        });
                    }
                }
                break;
        }
        return errs;
    };

    const validateRange = (from, to) => {
        const aggregated = {};
        let firstInvalid = null;
        for (let n = from; n <= to; n++) {
            const errs = validateStep(n);
            if (Object.keys(errs).length > 0 && firstInvalid === null) firstInvalid = n;
            Object.assign(aggregated, errs);
        }
        return { aggregated, firstInvalid };
    };

    const scrollFormToTop = () => {
        if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    useEffect(() => {
        if (Object.keys(localErrors).length === 0) return;
        const { aggregated } = validateRange(1, TOTAL_STEPS);
        const next = {};
        let changed = false;
        for (const k of Object.keys(localErrors)) {
            if (aggregated[k]) next[k] = aggregated[k];
            else changed = true;
        }
        if (changed) setLocalErrors(next);
    }, [data]);

    const nextStep = () => {
        const errs = validateStep(step);
        if (Object.keys(errs).length > 0) {
            setLocalErrors(errs);
            setModal({ show: true, message: `Please complete the required fields in Step ${step} (${steps[step - 1].title}) before proceeding.` });
            scrollFormToTop();
            return;
        }
        setLocalErrors({});
        setStep(s => Math.min(s + 1, TOTAL_STEPS));
    };

    const prevStep = () => {
        setLocalErrors({});
        setStep(s => Math.max(s - 1, 1));
    };

    const handleSidebarClick = (id) => {
        if (id === step) return;
        if (id < step) {
            setLocalErrors({});
            setStep(id);
            return;
        }
        const { aggregated, firstInvalid } = validateRange(1, id - 1);
        if (firstInvalid !== null) {
            setLocalErrors(aggregated);
            setStep(firstInvalid);
            setModal({ show: true, message: `Please complete the required fields in Step ${firstInvalid} (${steps[firstInvalid - 1].title}) before moving forward.` });
            scrollFormToTop();
            return;
        }
        setLocalErrors({});
        setStep(id);
    };

    const submitFinal = () => {
        const { aggregated, firstInvalid } = validateRange(1, TOTAL_STEPS);
        if (firstInvalid !== null) {
            setLocalErrors(aggregated);
            setStep(firstInvalid);
            setModal({ show: true, message: `Please complete the required fields in Step ${firstInvalid} (${steps[firstInvalid - 1].title}) before submitting.` });
            scrollFormToTop();
            return;
        }
        setLocalErrors({});

        // Only send document_files entries that actually hold a File.
        transform((d) => ({
            ...d,
            document_files: Object.fromEntries(
                Object.entries(d.document_files || {}).filter(([, f]) => f instanceof File)
            ),
        }));

        post('/resident-intake', {
            forceFormData: true, // always multipart so attached PDFs are sent reliably
            onSuccess: () => setIsSuccess(true),
            onError: (errs) => {
                setModal({
                    show: true,
                    message: errs?.error
                        || Object.values(errs || {})[0]
                        || 'Submission failed. Please review your details and try again.',
                });
            },
        });
    };

    const handleSubmit = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (step !== TOTAL_STEPS) return nextStep();
        submitFinal();
    };

    if (isSuccess) return <SuccessMessage intakeId={intakeId} />;

    const stepLabel = step < 10 ? `0${step}` : `${step}`;
    const docTotal = Object.keys(data.documents).length;
    const docChecked = Object.values(data.documents).filter(Boolean).length;

    return (
        <div className="min-h-screen bg-white font-urbanist text-[#212121] overflow-x-hidden">
            <Head title="NZ Resident Visa — Client Intake" />
            <Navbar />

            {/* Hero Header */}
            <div className="relative bg-white border-b border-gray-100 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#00A693]" />
                <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, #282728 40px, #282728 41px), repeating-linear-gradient(90deg, transparent, transparent 80px, #282728 80px, #282728 81px)' }} />

                <div className="container mx-auto px-6 py-24 lg:py-28 relative z-10">
                    <div className="max-w-5xl mx-auto">
                        <span className="text-xs font-bold text-[#00A693] uppercase tracking-[0.3em] mb-6 block">
                            Skilled Migrant Category — Resident Visa
                        </span>
                        <h1 className="text-5xl lg:text-7xl font-black text-[#282728] uppercase tracking-tighter leading-[0.9] mb-8">
                            New Zealand<br />
                            <span className="text-[#00A693]">Resident Visa</span><br />
                            Client Intake
                        </h1>
                        <div className="w-12 h-[2px] bg-[#282728]/20 my-8" />
                        <div className="flex flex-col md:flex-row md:items-end gap-10">
                            <p className="text-gray-600 text-sm leading-[1.9] font-light max-w-[480px] tracking-wide">
                                Client information & document checklist for your SMC Resident Visa application — initial
                                intake prior to engagement agreement. All fields marked * are required.
                            </p>
                            <div className="flex items-center gap-8 md:ml-auto flex-shrink-0">
                                <div className="text-center">
                                    <div className="text-4xl font-black text-[#282728]">~10</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-[0.3em] font-bold mt-1">Minutes</div>
                                </div>
                                <div className="w-[1px] h-10 bg-gray-200" />
                                <div className="text-center">
                                    <div className="text-4xl font-black text-[#00A693]">$35</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-[0.3em] font-bold mt-1">Median / hr</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-6 pb-32 pt-12 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">

                    {/* Sidebar */}
                    <div className="lg:w-[220px] sticky top-28 flex-shrink-0">
                        <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-xl shadow-gray-100/80">
                            <div className="px-6 pt-6 pb-5 bg-[#282728]">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-[0.4em] mb-1">Form Progress</p>
                                <div className="text-2xl font-black text-white">{Math.round((step / TOTAL_STEPS) * 100)}<span className="text-base text-white/30">%</span></div>
                                <div className="mt-3 h-0.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-[#00A693]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                                        transition={{ duration: 0.8, ease: 'circOut' }}
                                    />
                                </div>
                            </div>
                            <div className="bg-white px-3 py-4 space-y-0.5">
                                {steps.map((s) => {
                                    const isActive = step === s.id;
                                    const isCompleted = step > s.id;
                                    const Icon = s.icon;
                                    const stepNum = s.id < 10 ? `0${s.id}` : `${s.id}`;
                                    return (
                                        <div
                                            key={s.id}
                                            onClick={() => handleSidebarClick(s.id)}
                                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'bg-[#282728]' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isActive ? 'bg-[#00A693]' : isCompleted ? 'bg-[#00A693]/10' : 'bg-gray-100'}`}>
                                                {isCompleted && !isActive ? (
                                                    <CheckCircle size={12} className="text-[#00A693]" />
                                                ) : (
                                                    <Icon size={11} className={isActive ? 'text-white' : 'text-gray-500'} />
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={`text-xs font-black uppercase tracking-[0.25em] leading-none mb-0.5 ${isActive ? 'text-white/40' : 'text-gray-300'}`}>{stepNum}</span>
                                                <span className={`text-xs font-black uppercase tracking-[0.12em] leading-none truncate ${isActive ? 'text-white' : isCompleted ? 'text-[#00A693]' : 'text-gray-500 group-hover:text-[#282728]'}`}>{s.title}</span>
                                            </div>
                                            {isActive && (
                                                <motion.div layoutId="sidebar-active" className="ml-auto w-1 h-4 rounded-full bg-[#00A693]" />
                                            )}
                                        </div>
                                    );
                                })}

                                <div className="mt-3 pt-3 px-2 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={handleStartOver}
                                        className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        Start over
                                    </button>
                                    <p className="text-[10px] text-gray-400 leading-relaxed mt-2">
                                        Your answers are saved on this device automatically — you can close or refresh this page and pick up where you left off.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="flex-1 min-w-0 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/80 overflow-hidden">
                        <div className="px-8 pt-8 pb-6 border-b border-gray-50">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-500 mb-1">Section {stepLabel} of {TOTAL_STEPS}</p>
                                    <p className="text-base font-black uppercase tracking-tight text-[#282728]">{steps[step - 1]?.title}</p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-[160px]">
                                    {steps.map((s) => (
                                        <div
                                            key={s.id}
                                            className={`transition-all duration-300 rounded-full ${s.id === step ? 'w-5 h-2 bg-[#282728]' : s.id < step ? 'w-2 h-2 bg-[#00A693]' : 'w-2 h-2 bg-gray-100'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="h-0.5 w-full bg-gray-100 overflow-hidden">
                                <motion.div
                                    className="h-full bg-[#00A693]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                                    transition={{ duration: 0.8, ease: 'circOut' }}
                                />
                            </div>
                        </div>

                        <div className="flex-1">
                            <form ref={formRef} onSubmit={handleSubmit} className="h-full flex flex-col">
                                <div className="flex-1 px-8 py-10">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={step}
                                            initial={{ opacity: 0, y: 14 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -14 }}
                                            transition={{ duration: 0.35, ease: 'easeOut' }}
                                        >
                                            {step === 1 && <StepTerms data={data} setData={setData} errors={localErrors} />}
                                            {step === 2 && <StepPersonal data={data} setData={setData} errors={localErrors} />}
                                            {step === 3 && <StepPassportVisa data={data} setData={setData} errors={localErrors} />}
                                            {step === 4 && <StepEmployment data={data} setData={setData} errors={localErrors} />}
                                            {step === 5 && <StepQualifications data={data} setData={setData} errors={localErrors} />}
                                            {step === 6 && <StepExperience data={data} setData={setData} errors={localErrors} />}
                                            {step === 7 && <StepEnglishFamily data={data} setData={setData} errors={localErrors} />}
                                            {step === 8 && <StepDocuments data={data} setData={setData} docChecked={docChecked} docTotal={docTotal} />}
                                            {step === 9 && <StepDisclosures data={data} setData={setData} />}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 bg-gray-50/40">
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        disabled={step === 1}
                                        className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.2em] transition-all border ${step === 1 ? 'opacity-0 cursor-default border-transparent' : 'border-gray-300 text-gray-500 hover:border-[#282728] hover:text-[#282728]'}`}
                                    >
                                        <ChevronLeft size={13} /> Back
                                    </button>

                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-300">{stepLabel} / {TOTAL_STEPS}</span>
                                        {step < TOTAL_STEPS ? (
                                            <button
                                                type="button"
                                                onClick={nextStep}
                                                className="group flex items-center gap-2 px-8 py-2.5 bg-[#282728] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#00A693] active:scale-95"
                                            >
                                                Continue <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={submitFinal}
                                                disabled={processing}
                                                className="flex items-center gap-2 px-8 py-2.5 bg-[#00A693] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#008c7c] active:scale-95 disabled:opacity-60"
                                            >
                                                <Send size={13} />
                                                {processing ? 'Submitting...' : 'Submit Intake Form'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            <AnimatePresence>
                {modal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#282728]/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-[400px] rounded-[2.5rem] shadow-[0_64px_128px_-24px_rgba(40,39,40,0.15)] p-12 text-center"
                        >
                            <div className="w-16 h-16 bg-[#282728]/5 rounded-[1.5rem] flex items-center justify-center text-[#282728] mx-auto mb-8">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-xl font-black text-[#282728] uppercase tracking-tighter mb-4">Action Required</h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-10 font-medium px-4 whitespace-pre-wrap">{modal.message}</p>
                            <button
                                type="button"
                                onClick={() => setModal({ show: false, message: '' })}
                                className="w-full bg-[#282728] text-white py-5 rounded-2xl text-xs font-black uppercase tracking-[0.4em] shadow-xl hover:bg-black transition-all active:scale-95"
                            >
                                Acknowledge
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Helper components ──────────────────────────────────────────────── */

function Field({ label, error, hint, children, full }) {
    const hasError = !!error;
    return (
        <div className={`space-y-2 ${full ? 'col-span-full' : ''}`}>
            <div className="flex justify-between items-end px-1">
                <label className={`text-xs font-bold uppercase tracking-[0.2em] transition-colors ${hasError ? 'text-red-500' : 'text-gray-500'}`}>
                    {label}
                </label>
                {hint && <span className="text-[10px] text-gray-400 normal-case tracking-normal">{hint}</span>}
            </div>
            {children}
            {hasError && (
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1.5 pl-1">{error}</p>
            )}
        </div>
    );
}

const inputCls = "w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#00A693] transition-colors";

function PillRadio({ value, current, onClick, children }) {
    const active = current === value;
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${active ? 'bg-[#282728] text-white border-[#282728]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#00A693] hover:text-[#00A693]'}`}
        >
            {children}
        </button>
    );
}

/* ─── Step components ────────────────────────────────────────────────── */

function StepTerms({ data, setData, errors }) {
    return (
        <div className="space-y-10">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter leading-tight">Privacy & Terms</h2>
            <div className="bg-gray-50/50 rounded-3xl p-10 text-sm text-gray-600 leading-[2] font-medium h-80 overflow-y-auto border border-gray-100/50 space-y-4">
                <p>This Skilled Migrant Category (SMC) Resident Visa intake form collects the information our licensed advisers need to assess your eligibility prior to engagement.</p>
                <p>Information you provide will be held in confidence and used only to prepare your engagement agreement and assess your visa pathway. The current median wage benchmark is NZD $35.00/hr (2025).</p>
                <p>Submitting this form does not constitute legal advice or an engagement. A formal engagement agreement will be issued upon review.</p>
                <p>All data is handled in line with our Privacy Policy and IAA Code of Conduct.</p>
            </div>
            <label className={`flex items-center gap-5 p-4 cursor-pointer group rounded-2xl transition-all ${errors.terms_accepted ? 'bg-red-50 ring-2 ring-red-500/20' : ''}`}>
                <input
                    type="checkbox"
                    className={`w-6 h-6 rounded ${errors.terms_accepted ? 'border-red-500' : 'border-gray-300'} text-[#00A693] focus:ring-[#00A693] cursor-pointer`}
                    checked={data.terms_accepted}
                    onChange={e => setData('terms_accepted', e.target.checked)}
                />
                <span className={`text-sm font-black uppercase tracking-[0.15em] ${errors.terms_accepted ? 'text-red-500' : 'text-[#282728]'}`}>
                    I have read and agree to the intake terms *
                </span>
            </label>
            {errors.terms_accepted && <p className="text-sm font-black text-red-500 uppercase tracking-widest mt-2 pl-4">{errors.terms_accepted}</p>}
        </div>
    );
}

function StepPersonal({ data, setData, errors }) {
    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-3">Personal Details</h2>
                <p className="text-sm text-gray-500">As per your passport.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="First Name *" error={errors.first_name} hint="As per passport">
                    <input type="text" className={inputCls} value={data.first_name} onChange={e => setData('first_name', e.target.value)} />
                </Field>
                <Field label="Last Name *" error={errors.last_name} hint="As per passport">
                    <input type="text" className={inputCls} value={data.last_name} onChange={e => setData('last_name', e.target.value)} />
                </Field>
                <Field label="Date of Birth *" error={errors.dob}>
                    <input type="date" className={inputCls} value={data.dob} onChange={e => setData('dob', e.target.value)} />
                </Field>
                <Field label="Nationality *" error={errors.nationality} hint="Country of citizenship">
                    <input type="text" className={inputCls} value={data.nationality} onChange={e => setData('nationality', e.target.value)} />
                </Field>
                <Field label="Email Address *" error={errors.email}>
                    <input type="email" className={inputCls} placeholder="email@example.com" value={data.email} onChange={e => setData('email', e.target.value)} />
                </Field>
                <Field label="Phone Number *" error={errors.phone}>
                    <input type="tel" className={inputCls} placeholder="+64 ..." value={data.phone} onChange={e => setData('phone', e.target.value)} />
                </Field>
            </div>
        </div>
    );
}

function StepPassportVisa({ data, setData, errors }) {
    const visaTypes = ['AEWV', 'Essential Skills', 'Work to Residence', 'Other'];
    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-3">Passport & Visa Details</h2>
                <p className="text-sm text-gray-500">Travel document and current NZ immigration status.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Passport Number *" error={errors.passport_number}>
                    <input type="text" className={inputCls} placeholder="e.g. A12345678" value={data.passport_number} onChange={e => setData('passport_number', e.target.value)} />
                </Field>
                <Field label="Passport Expiry *" error={errors.passport_expiry}>
                    <input type="date" className={inputCls} value={data.passport_expiry} onChange={e => setData('passport_expiry', e.target.value)} />
                </Field>
                <Field label="Issuing Country *" error={errors.issuing_country} full>
                    <input type="text" className={inputCls} value={data.issuing_country} onChange={e => setData('issuing_country', e.target.value)} />
                </Field>
            </div>

            <Field label="Current NZ Visa Type *" error={errors.current_visa_type}>
                <div className="flex flex-wrap gap-3 mt-2">
                    {visaTypes.map(v => (
                        <PillRadio key={v} value={v} current={data.current_visa_type} onClick={() => setData('current_visa_type', v)}>{v}</PillRadio>
                    ))}
                </div>
            </Field>

            {data.current_visa_type === 'Other' && (
                <Field label="Please specify *" error={errors.current_visa_other}>
                    <input type="text" className={inputCls} value={data.current_visa_other} onChange={e => setData('current_visa_other', e.target.value)} />
                </Field>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Current Visa Expiry Date *" error={errors.current_visa_expiry}>
                    <input type="date" className={inputCls} value={data.current_visa_expiry} onChange={e => setData('current_visa_expiry', e.target.value)} />
                </Field>
                <Field label="NZ Arrival Date *" error={errors.nz_arrival_date}>
                    <input type="date" className={inputCls} value={data.nz_arrival_date} onChange={e => setData('nz_arrival_date', e.target.value)} />
                </Field>
            </div>

            <Field label="Previous NZ Visa History" hint="List any prior visa types and dates">
                <textarea
                    rows={4}
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl p-4 text-sm text-[#282728] focus:outline-none focus:border-[#00A693] transition-colors"
                    placeholder="e.g. Student Visa 2019–2021, Work Visa 2021–present"
                    value={data.previous_nz_visa_history}
                    onChange={e => setData('previous_nz_visa_history', e.target.value)}
                />
            </Field>
        </div>
    );
}

function StepEmployment({ data, setData, errors }) {
    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-3">Employment at Ergo</h2>
                <p className="text-sm text-gray-500">Your current role with Ergo in New Zealand.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Job Title *" error={errors.job_title}>
                    <input type="text" className={inputCls} value={data.job_title} onChange={e => setData('job_title', e.target.value)} />
                </Field>
                <Field label="Employment Start Date *" error={errors.employment_start}>
                    <input type="date" className={inputCls} value={data.employment_start} onChange={e => setData('employment_start', e.target.value)} />
                </Field>
                <Field label="Employment Type *" error={errors.employment_type}>
                    <select className={inputCls} value={data.employment_type} onChange={e => setData('employment_type', e.target.value)}>
                        <option value="">Select...</option>
                        <option value="Permanent full-time">Permanent full-time</option>
                        <option value="Fixed-term (12+ months)">Fixed-term (12+ months)</option>
                        <option value="Contract">Contract</option>
                    </select>
                </Field>
                <Field label="Hourly Rate (NZD) *" error={errors.hourly_rate} hint="Median: $35.00">
                    <input type="number" step="0.01" min="0" className={inputCls} placeholder="e.g. 45.00" value={data.hourly_rate} onChange={e => setData('hourly_rate', e.target.value)} />
                </Field>
            </div>
        </div>
    );
}

function StepQualifications({ data, setData, errors }) {
    const nzqaOptions = [
        { value: 'Yes — IQA completed', label: 'Yes — IQA completed' },
        { value: 'No', label: 'No' },
        { value: 'On LQEA (exempt)', label: 'On LQEA (exempt)' },
        { value: 'Not sure', label: 'Not sure' },
    ];
    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-3">Qualifications</h2>
                <p className="text-sm text-gray-500">Your highest completed qualification.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Highest Qualification *" error={errors.highest_qualification}>
                    <select className={inputCls} value={data.highest_qualification} onChange={e => setData('highest_qualification', e.target.value)}>
                        <option value="">Select...</option>
                        <option value="phd">Doctoral degree (PhD) — Level 10</option>
                        <option value="masters">Master's degree — Level 9</option>
                        <option value="postgrad">Postgraduate diploma/certificate — Level 8</option>
                        <option value="bachelor">Bachelor's degree — Level 7</option>
                        <option value="diploma">Diploma/Certificate — Level 5–6</option>
                        <option value="none">No tertiary qualification</option>
                    </select>
                </Field>
                <Field label="Institution Name" hint="University / polytechnic">
                    <input type="text" className={inputCls} value={data.institution_name} onChange={e => setData('institution_name', e.target.value)} />
                </Field>
                <Field label="Country of Study" hint="New Zealand or overseas" full>
                    <input type="text" className={inputCls} value={data.country_of_study} onChange={e => setData('country_of_study', e.target.value)} />
                </Field>
            </div>

            <Field label="Has the qualification been assessed by NZQA (IQA)?">
                <div className="flex flex-wrap gap-3 mt-2">
                    {nzqaOptions.map(o => (
                        <PillRadio key={o.value} value={o.value} current={data.nzqa_status} onClick={() => setData('nzqa_status', o.value)}>
                            {o.label}
                        </PillRadio>
                    ))}
                </div>
            </Field>

            {data.nzqa_status === 'Yes — IQA completed' && (
                <Field label="NZQA IQA Reference Number *" error={errors.nzqa_iqa_reference}>
                    <input
                        type="text"
                        className={inputCls}
                        placeholder="IQA-XXXXXXXX"
                        value={data.nzqa_iqa_reference}
                        onChange={e => setData('nzqa_iqa_reference', e.target.value)}
                    />
                </Field>
            )}
        </div>
    );
}

function StepExperience({ data, setData, errors }) {
    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-3">Work Experience</h2>
                <p className="text-sm text-gray-500">Skilled experience in NZ and overseas.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Years of NZ Skilled Work Experience *" error={errors.nz_skilled_years}>
                    <input type="number" step="0.5" min="0" className={inputCls} placeholder="e.g. 2" value={data.nz_skilled_years} onChange={e => setData('nz_skilled_years', e.target.value)} />
                </Field>
                <Field label="Total Years Skilled Work Experience *" error={errors.total_skilled_years}>
                    <input type="number" step="0.5" min="0" className={inputCls} placeholder="e.g. 7" value={data.total_skilled_years} onChange={e => setData('total_skilled_years', e.target.value)} />
                </Field>
            </div>
            <Field label="Brief Career Summary" hint="NZ and overseas history">
                <textarea
                    rows={5}
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl p-4 text-sm text-[#282728] focus:outline-none focus:border-[#00A693] transition-colors"
                    placeholder="e.g. 3 years as software engineer in India, 2 years at Ergo as senior developer in Auckland..."
                    value={data.career_summary}
                    onChange={e => setData('career_summary', e.target.value)}
                />
            </Field>
        </div>
    );
}

function StepEnglishFamily({ data, setData, errors }) {
    const options = ['IELTS', 'TOEFL', 'PTE Academic', 'Passport (exempt country)', 'Occupational registration'];
    return (
        <div className="space-y-12">
            <section className="space-y-8">
                <div>
                    <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-3">English Language</h2>
                    <p className="text-sm text-gray-500">Evidence you can rely on for the application.</p>
                </div>
                <Field label="English Language Evidence *" error={errors.english_evidence}>
                    <div className="flex flex-wrap gap-3 mt-2">
                        {options.map(o => (
                            <PillRadio key={o} value={o} current={data.english_evidence} onClick={() => setData('english_evidence', o)}>{o}</PillRadio>
                        ))}
                    </div>
                </Field>

                {['IELTS', 'TOEFL', 'PTE Academic'].includes(data.english_evidence) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Test Score / Band *" error={errors.english_test_score}>
                            <input
                                type="text"
                                className={inputCls}
                                placeholder="e.g. 7.0"
                                value={data.english_test_score}
                                onChange={e => setData('english_test_score', e.target.value)}
                            />
                        </Field>
                        <Field label="Test Date *" error={errors.english_test_date}>
                            <input
                                type="date"
                                className={inputCls}
                                value={data.english_test_date}
                                onChange={e => setData('english_test_date', e.target.value)}
                            />
                        </Field>
                    </div>
                )}
            </section>

            <section className="space-y-8 pt-8 border-t border-gray-100">
                <div>
                    <h2 className="text-2xl font-black text-[#282728] uppercase tracking-tighter mb-3">Family Members to Include</h2>
                    <p className="text-sm text-gray-500">Indicate if family will be part of this application.</p>
                </div>
                <Field label="Will any family members be included in this application? *" error={errors.include_family}>
                    <div className="flex flex-wrap gap-3 mt-2">
                        <PillRadio
                            value="No — applying alone"
                            current={data.include_family}
                            onClick={() => {
                                setData((prev) => ({ ...prev, include_family: 'No — applying alone', family_members: [] }));
                            }}
                        >
                            No — applying alone
                        </PillRadio>
                        <PillRadio
                            value="Yes"
                            current={data.include_family}
                            onClick={() => {
                                setData((prev) => ({
                                    ...prev,
                                    include_family: 'Yes',
                                    family_members: prev.family_members && prev.family_members.length > 0
                                        ? prev.family_members
                                        : [{ full_name: '', relationship: '', dob: '', passport_number: '' }],
                                }));
                            }}
                        >
                            Yes
                        </PillRadio>
                    </div>
                </Field>

                {data.include_family === 'Yes' && (
                    <FamilyMembersList data={data} setData={setData} errors={errors} />
                )}
            </section>
        </div>
    );
}

function FamilyMembersList({ data, setData, errors }) {
    const members = data.family_members || [];

    const updateMember = (i, key, value) => {
        const next = members.map((m, idx) => (idx === i ? { ...m, [key]: value } : m));
        setData('family_members', next);
    };

    const addMember = () => {
        setData('family_members', [
            ...members,
            { full_name: '', relationship: '', dob: '', passport_number: '' },
        ]);
    };

    const removeMember = (i) => {
        setData('family_members', members.filter((_, idx) => idx !== i));
    };

    return (
        <div className="space-y-5">
            {errors.family_members && (
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{errors.family_members}</p>
            )}

            {members.map((m, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50/40 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#00A693]">
                            Family Member {i + 1}
                        </h3>
                        {members.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeMember(i)}
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={12} /> Remove
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Full Name" hint="As per passport" error={errors[`family_members.${i}.full_name`]}>
                            <input
                                type="text"
                                className={inputCls}
                                value={m.full_name || ''}
                                onChange={(e) => updateMember(i, 'full_name', e.target.value)}
                            />
                        </Field>
                        <Field label="Relationship" error={errors[`family_members.${i}.relationship`]}>
                            <select
                                className={inputCls}
                                value={m.relationship || ''}
                                onChange={(e) => updateMember(i, 'relationship', e.target.value)}
                            >
                                <option value="">Select...</option>
                                <option value="Spouse / partner">Spouse / partner</option>
                                <option value="Dependent child">Dependent child</option>
                            </select>
                        </Field>
                        <Field label="Date of Birth">
                            <input
                                type="date"
                                className={inputCls}
                                value={m.dob || ''}
                                onChange={(e) => updateMember(i, 'dob', e.target.value)}
                            />
                        </Field>
                        <Field label="Passport Number">
                            <input
                                type="text"
                                className={inputCls}
                                placeholder="Passport number"
                                value={m.passport_number || ''}
                                onChange={(e) => updateMember(i, 'passport_number', e.target.value)}
                            />
                        </Field>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={addMember}
                className="inline-flex items-center gap-2 px-5 py-3 border border-dashed border-gray-300 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-600 hover:border-[#00A693] hover:text-[#00A693] hover:bg-[#00A693]/5 rounded-xl transition-all"
            >
                <Plus size={14} /> Add Family Member
            </button>
        </div>
    );
}

function StepDocuments({ data, setData, docChecked, docTotal }) {
    const items = [
        { key: 'passport', title: 'Passport', desc: 'Valid passport, all pages including blank pages' },
        { key: 'visa_copies', title: 'All NZ visa copies', desc: 'Every visa label or e-visa received in New Zealand' },
        { key: 'contracts', title: 'All NZ employment contracts with Ergo + job description', desc: 'Original contract and any variations or renewals' },
        { key: 'payslips', title: 'Payslips — first 2 months at Ergo + latest 1 month', desc: '3 payslips total showing gross/net pay and hours' },
        { key: 'ird_summary', title: 'IRD summary of earnings (monthly breakdown)', desc: 'Available from myIR — select monthly breakdown version' },
        { key: 'education_certs', title: 'Education certificates, transcripts, graduation documents', desc: 'All degrees and postgraduate qualifications if applicable' },
        { key: 'cv', title: 'CV covering both NZ and overseas employment', desc: 'Dates, employer names, roles and key responsibilities' },
    ];

    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
    const [fileErrors, setFileErrors] = useState({});

    const toggle = (k) => setData('documents', { ...data.documents, [k]: !data.documents[k] });

    const clearFileError = (k) => setFileErrors((p) => { const n = { ...p }; delete n[k]; return n; });

    const handleFile = (k, fileList) => {
        const file = fileList && fileList[0] ? fileList[0] : null;
        if (!file) return;
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
            setFileErrors((p) => ({ ...p, [k]: 'Only PDF files can be uploaded.' }));
            return;
        }
        if (file.size > MAX_BYTES) {
            setFileErrors((p) => ({ ...p, [k]: 'File is too large — maximum 10 MB.' }));
            return;
        }
        clearFileError(k);
        setData((prev) => ({
            ...prev,
            document_files: { ...prev.document_files, [k]: file },
            documents: { ...prev.documents, [k]: true },
        }));
    };

    const removeFile = (k) => {
        clearFileError(k);
        setData((prev) => ({ ...prev, document_files: { ...prev.document_files, [k]: null } }));
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    const uploadedCount = Object.values(data.document_files || {}).filter(Boolean).length;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-3">Document Checklist</h2>
                    <p className="text-sm text-gray-500">Tick each item you have, and attach a PDF where you can — uploads (max 10 MB each) speed up your assessment.</p>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-center">
                        <div className="text-3xl font-black text-[#00A693]">{docChecked}<span className="text-base text-gray-300"> / {docTotal}</span></div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">ticked</span>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-black text-[#282728]">{uploadedCount}<span className="text-base text-gray-300"> / {docTotal}</span></div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">uploaded</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {items.map((it) => {
                    const checked = !!data.documents[it.key];
                    const file = data.document_files?.[it.key] || null;
                    const err = fileErrors[it.key];
                    const active = checked || !!file;
                    return (
                        <div
                            key={it.key}
                            className={`p-5 border rounded-2xl transition-all ${active ? 'border-[#00A693] bg-[#00A693]/5' : 'border-gray-100 bg-white'}`}
                        >
                            <div className="flex items-start gap-4">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 mt-0.5 text-[#00A693] focus:ring-[#00A693] cursor-pointer rounded"
                                    checked={checked}
                                    onChange={() => toggle(it.key)}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold uppercase tracking-wide leading-tight text-[#282728]">{it.title}</div>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{it.desc}</p>

                                    <div className="mt-3">
                                        {file ? (
                                            <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-3 py-2 max-w-full">
                                                <FileCheck2 size={14} className="text-[#00A693] flex-shrink-0" />
                                                <span className="text-xs text-gray-700 truncate max-w-[200px]">{file.name}</span>
                                                <span className="text-[10px] text-gray-400 flex-shrink-0">{formatSize(file.size)}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(it.key)}
                                                    className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] text-gray-600 hover:border-[#00A693] hover:text-[#00A693] hover:bg-[#00A693]/5 cursor-pointer transition-all">
                                                <Plus size={14} /> Attach PDF
                                                <input
                                                    type="file"
                                                    accept="application/pdf,.pdf"
                                                    className="hidden"
                                                    onChange={(e) => { handleFile(it.key, e.target.files); e.target.value = ''; }}
                                                />
                                            </label>
                                        )}
                                        {err && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-2">{err}</p>}
                                    </div>
                                </div>
                                {active && <CheckCircle size={18} className="text-[#00A693] flex-shrink-0 mt-0.5" />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function StepDisclosures({ data, setData }) {
    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-3">Additional Information</h2>
                <p className="text-sm text-gray-500">Anything else your adviser should know.</p>
            </div>
            <Field label="Character / Health Matters to Disclose" hint="Confidential">
                <textarea
                    rows={4}
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl p-4 text-sm text-[#282728] focus:outline-none focus:border-[#00A693] transition-colors"
                    placeholder="Please disclose any relevant character or health matters. These will be assessed in confidence."
                    value={data.character_health_disclosure}
                    onChange={e => setData('character_health_disclosure', e.target.value)}
                />
            </Field>
            <Field label="Other Notes or Questions for Your Adviser">
                <textarea
                    rows={4}
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl p-4 text-sm text-[#282728] focus:outline-none focus:border-[#00A693] transition-colors"
                    placeholder="Anything else you'd like us to know before we send the engagement agreement..."
                    value={data.other_notes}
                    onChange={e => setData('other_notes', e.target.value)}
                />
            </Field>
        </div>
    );
}

function SuccessMessage({ intakeId }) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 font-urbanist">
            <div className="max-w-[480px] w-full bg-white rounded-[3rem] shadow-[0_64px_128px_-24px_rgba(40,39,40,0.08)] p-16 text-center border border-[#282728]/5">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-[#00A693] rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-[#00A693]/20"
                >
                    <CheckCircle size={48} />
                </motion.div>
                <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-6">Interest Received</h2>
                <p className="text-gray-500 text-sm leading-[2] mb-10 font-medium px-4">
                    Thank you. Your Resident Visa interest has been received. A licensed adviser will review your information
                    and follow up with your engagement agreement.
                </p>
                {intakeId && (
                    <div className="bg-gray-50/50 rounded-2xl p-6 mb-8 border border-gray-100/50">
                        <p className="text-xs font-black text-gray-300 uppercase tracking-[0.4em] mb-2">Reference ID</p>
                        <p className="text-base font-mono font-black text-[#282728]">{intakeId}</p>
                    </div>
                )}
                <a href="/" className="inline-block w-full bg-[#282728] text-white py-6 rounded-2xl text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-[#282728]/10 hover:bg-black transition-all active:scale-95">
                    Return to Portal
                </a>
            </div>
        </div>
    );
}
