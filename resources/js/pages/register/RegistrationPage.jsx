import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    ShieldCheck, User, MapPin, GraduationCap, Briefcase, Wallet,
    Upload, PenLine, ChevronLeft, ChevronRight, FileText, X, AlertCircle,
} from 'lucide-react';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
    StepTerms, StepPersonal, StepStudyPlans, StepEducation, StepWork,
    StepFinancial, StepSourceOfFunds, StepDeclaration, SuccessMessage,
} from '@/pages/free-assessment/FreeAssessmentPage';

const C = { primary: '#436235', dark: '#282728' };

// Short "registration" form — the Pre-Assessment with the Immigration,
// Character/Health, Family and Additional sections removed, plus a Documents
// step that captures the important CV + Passport uploads. Reuses the exact
// step components from the full assessment so the kept fields stay identical.
const STEPS = [
    { key: 'terms',       title: 'Terms',       icon: ShieldCheck,   Comp: StepTerms },
    { key: 'personal',    title: 'Personal',    icon: User,          Comp: StepPersonal },
    { key: 'study',       title: 'Study Plans', icon: MapPin,        Comp: StepStudyPlans },
    { key: 'education',   title: 'Education',    icon: GraduationCap, Comp: StepEducation },
    { key: 'work',        title: 'Work',        icon: Briefcase,     Comp: StepWork },
    { key: 'financial',   title: 'Financial',   icon: Wallet,        Comp: StepFinancial },
    { key: 'funds',       title: 'Funds',       icon: Wallet,        Comp: StepSourceOfFunds },
    { key: 'documents',   title: 'Documents',   icon: Upload,        Comp: DocumentsStep },
    { key: 'declaration', title: 'Declaration', icon: PenLine,       Comp: StepDeclaration },
];

export default function RegistrationPage({ programs = [] }) {
    const { flash } = usePage().props;
    const [stepIndex, setStepIndex] = useState(0);
    const [isSuccess, setIsSuccess] = useState(false);
    const [leadId, setLeadId] = useState(null);
    const [localErrors, setLocalErrors] = useState({});
    const [banner, setBanner] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        terms_accepted: false,
        // Personal
        first_name: '', last_name: '', has_other_names: '', other_names: '',
        gender: '', marital_status: '', phone: '', email: '', dob: '',
        country_of_birth: '', place_of_birth: '', citizenship: '',
        residence_city: '', residence_state: '', residence_country: '',
        has_passport: '', passport_number: '', passport_expiry: '', passport_pdf: null,
        // Study plans
        study_plans: {
            preferred_course: '', qualification_level: '', preferred_city: '',
            preferred_intake: '', has_english_test: '', english_test_type: '',
            test_score_overall: '', test_score_reading: '', test_score_writing: '',
            test_score_listening: '', test_score_speaking: '', test_date: '',
        },
        // Education
        high_school_completed: '', high_school_level: '', high_school_institution: '',
        high_school_start: '', high_school_end: '', high_school_marks: '',
        education_background: [
            { level: 'Diploma', field_of_study: '', institution: '', start_date: '', end_date: '', marks_percentage: '', completed: false },
            { level: "Bachelor's Degree", field_of_study: '', institution: '', start_date: '', end_date: '', marks_percentage: '', completed: false },
            { level: "Master's Degree", field_of_study: '', institution: '', start_date: '', end_date: '', marks_percentage: '', completed: false },
            { level: 'Doctorate', field_of_study: '', institution: '', start_date: '', end_date: '', marks_percentage: '', completed: false },
        ],
        education_docs: [], has_gap: '', gap_length: '', gap_activities: [], gap_explanation: '',
        // Work
        work_experience: [
            { company_name: '', job_title: '', start_date: '', end_date: '', is_current: '', duties: '', has_supporting_docs: '', supporting_docs: [] },
        ],
        // Financial
        financial_info: { can_cover_tuition: '', can_cover_living: '', funding_source: [], estimated_budget: '', has_sponsors: '', sponsor_relation: '' },
        // Source of funds
        source_of_funds_info: {
            sources: [], will_self_fund: '', student_financial_docs: [], will_use_sponsor: '',
            sponsor_relation: '', sponsor_nz_based: '', sponsor_nz_resident: '', sponsor_occupation: '',
            sponsor_employer: '', sponsor_annual_income: '', sponsor_source_of_funds: [],
            sponsor_financial_docs: [], sponsor_identity_docs: [],
        },
        // Documents (the important bit)
        cv_files: [],
        passport_files: [],
        // Declaration
        declaration_accepted: false,
    });

    useEffect(() => {
        if (flash?.success) {
            setIsSuccess(true);
            if (flash?.lead_id) setLeadId(flash.lead_id);
        }
    }, [flash]);

    const allErrors = { ...errors, ...localErrors };
    const current = STEPS[stepIndex];

    const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    // Light, low-friction validation — only the essentials are required so a
    // marketing lead can register quickly.
    const validateStep = () => {
        const e = {};
        if (current.key === 'terms' && !data.terms_accepted) e.terms_accepted = 'Please accept to continue.';
        if (current.key === 'personal') {
            if (!data.first_name) e.first_name = 'Required';
            if (!data.last_name) e.last_name = 'Required';
            if (!data.email) e.email = 'Required';
            if (!data.phone) e.phone = 'Required';
        }
        if (current.key === 'study') {
            if (!data.study_plans?.preferred_course) e['study_plans.preferred_course'] = 'Required';
            if (!data.study_plans?.qualification_level) e['study_plans.qualification_level'] = 'Required';
        }
        if (current.key === 'declaration' && !data.declaration_accepted) e.declaration_accepted = 'Please confirm to submit.';
        setLocalErrors(e);
        if (Object.keys(e).length) {
            setBanner('Please complete the required fields before continuing.');
            return false;
        }
        setBanner(null);
        return true;
    };

    const next = () => {
        if (!validateStep()) return;
        setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
        scrollTop();
    };
    const back = () => {
        setBanner(null);
        setLocalErrors({});
        setStepIndex((i) => Math.max(i - 1, 0));
        scrollTop();
    };

    const submit = () => {
        if (!validateStep()) return;
        post('/register', {
            forceFormData: true,
            onSuccess: () => setIsSuccess(true),
            onError: (serverErrs) => {
                setLocalErrors(serverErrs || {});
                setBanner('Some details need attention — please review the highlighted fields.');
                scrollTop();
            },
        });
    };

    if (isSuccess) return <SuccessMessage leadId={leadId} />;

    const StepComp = current.Comp;
    const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

    return (
        <div className="min-h-screen bg-white font-urbanist text-[#212121]">
            <Head title="Register — ePathways" />
            <Navbar />

            {/* Header */}
            <div className="relative bg-white border-b border-gray-100">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#436235]" />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
                    <span className="text-[11px] font-bold tracking-[0.3em] text-[#436235] uppercase">Quick Registration</span>
                    <h1 className="text-3xl sm:text-4xl font-medium text-[#282728] mt-2">Register your interest</h1>
                    <p className="text-gray-500 mt-2 max-w-2xl">A short version of our assessment — tell us about your goals and upload your CV &amp; passport, and our team will reach out.</p>
                </div>
            </div>

            {/* Stepper */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const active = i === stepIndex;
                        const done = i < stepIndex;
                        return (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => i <= stepIndex && setStepIndex(i)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-colors ${
                                    active ? 'bg-[#436235] text-white border-[#436235]'
                                    : done ? 'bg-[#436235]/10 text-[#436235] border-[#436235]/20'
                                    : 'bg-white text-gray-400 border-gray-200'
                                }`}
                            >
                                <Icon size={13} /> {s.title}
                            </button>
                        );
                    })}
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-[#436235] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Step body */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {banner && (
                    <div className="mb-6 flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> {banner}
                    </div>
                )}

                <StepComp data={data} setData={setData} errors={allErrors} programs={programs} />

                {/* Nav */}
                <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={back}
                        disabled={stepIndex === 0}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} /> Back
                    </button>

                    {stepIndex < STEPS.length - 1 ? (
                        <button
                            type="button"
                            onClick={next}
                            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-[#436235] text-white text-sm font-bold hover:bg-[#354d2a] transition-colors"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={submit}
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-[#436235] text-white text-sm font-bold hover:bg-[#354d2a] transition-colors disabled:opacity-50"
                        >
                            {processing ? 'Submitting…' : 'Submit registration'}
                        </button>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}

// Documents step — captures the important CV + Passport uploads. Multiple
// files each; stored against the lead as cv / passport on submit.
function DocumentsStep({ data, setData }) {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-medium text-[#282728]">Documents</h2>
                <p className="text-gray-500 text-sm mt-1">Upload your CV and a copy of your passport — these help us assess you faster. You can add more than one file.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileDrop
                    label="CV / Résumé"
                    hint="PDF, DOC, DOCX or image · up to 10MB each"
                    files={data.cv_files}
                    onChange={(files) => setData('cv_files', files)}
                />
                <FileDrop
                    label="Passport copy"
                    hint="PDF or image · up to 10MB each"
                    files={data.passport_files}
                    onChange={(files) => setData('passport_files', files)}
                />
            </div>
        </div>
    );
}

function FileDrop({ label, hint, files = [], onChange }) {
    const inputId = `file-${label.replace(/\W+/g, '-').toLowerCase()}`;
    const add = (picked) => onChange([...(files || []), ...Array.from(picked)].slice(0, 10));
    const remove = (idx) => onChange((files || []).filter((_, i) => i !== idx));

    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">{label}</label>
            <label
                htmlFor={inputId}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-4 py-8 text-center cursor-pointer hover:border-[#436235] hover:bg-[#436235]/[0.03] transition-colors"
            >
                <Upload size={20} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Select or drop files</span>
                <span className="text-[11px] text-gray-400">{hint}</span>
                <input
                    id={inputId}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.csv,.jpg,.jpeg,.png,.gif"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.length) add(e.target.files); e.target.value = ''; }}
                />
            </label>
            {(files || []).length > 0 && (
                <ul className="mt-3 space-y-1.5">
                    {files.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                            <FileText size={13} className="text-gray-400 flex-shrink-0" />
                            <span className="flex-1 truncate text-gray-700">{f.name}</span>
                            <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-600">
                                <X size={13} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
