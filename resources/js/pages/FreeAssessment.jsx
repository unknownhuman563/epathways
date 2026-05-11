import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    Lock,
    ShieldCheck,
    User,
    GraduationCap,
    Briefcase,
    Wallet,
    MapPin,
    FileText,
    Upload,
    Globe,
    Shield,
    Heart,
    Users,
    Home,
    PenLine,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from "@/components/navigation-bar";
import Footer from "../components/footer";

const C = {
    primary: '#436235',
    primaryDark: '#354d2a',
    dark: '#282728',
    darkL: 'rgba(40,39,40,.05)',
    border: '#e5e7eb',
    textMuted: '#6b7280',
    white: '#ffffff',
    error: '#ef4444',
    bg: '#f9fafb'
};

export default function FreeAssessment() {
    const { flash } = usePage().props;
    const [step, setStep] = useState(1);
    const [isSuccess, setIsSuccess] = useState(false);
    const [leadId, setLeadId] = useState(null);
    const [modal, setModal] = useState({ show: false, message: '' });
    const [localErrors, setLocalErrors] = useState({});

    useEffect(() => {
        if (flash?.success) {
            setIsSuccess(true);
            if (flash?.lead_id) setLeadId(flash.lead_id);
            localStorage.removeItem('assessment_draft');
        }
    }, [flash]);

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        terms_accepted: false,
        // Personal
        first_name: '',
        last_name: '',
        has_other_names: '',
        other_names: '',
        gender: '',
        marital_status: '',
        phone: '',
        email: '',
        dob: '',
        country_of_birth: '',
        place_of_birth: '',
        citizenship: '',
        residence_city: '',
        residence_state: '',
        residence_country: '',
        has_passport: '',
        passport_number: '',
        passport_expiry: '',
        passport_pdf: null,
        // Study Plans
        study_plans: {
            preferred_course: '',
            qualification_level: '',
            preferred_city: '',
            preferred_intake: '',
            has_english_test: '',
            english_test_type: '',
            test_score_overall: '',
            test_score_reading: '',
            test_score_writing: '',
            test_score_listening: '',
            test_score_speaking: '',
            test_date: ''
        },
        // Education
        high_school_completed: '',
        high_school_level: '',
        high_school_institution: '',
        high_school_start: '',
        high_school_end: '',
        high_school_marks: '',
        education_background: [
            { level: 'Diploma', field_of_study: '', institution: '', start_date: '', end_date: '', marks_percentage: '', completed: false },
            { level: "Bachelor's Degree", field_of_study: '', institution: '', start_date: '', end_date: '', marks_percentage: '', completed: false },
            { level: "Master's Degree", field_of_study: '', institution: '', start_date: '', end_date: '', marks_percentage: '', completed: false },
            { level: 'Doctorate', field_of_study: '', institution: '', start_date: '', end_date: '', marks_percentage: '', completed: false },
        ],
        education_docs: [],
        has_gap: '',
        gap_length: '',
        gap_activities: [],
        gap_explanation: '',
        // Work
        work_experience: [
            {
                company_name: '',
                job_title: '',
                start_date: '',
                end_date: '',
                is_current: '',
                duties: '',
                has_supporting_docs: '',
                supporting_docs: []
            }
        ],
        // Financial
        financial_info: {
            can_cover_tuition: '',
            can_cover_living: '',
            funding_source: [],
            estimated_budget: '',
            has_sponsors: '',
            sponsor_relation: ''
        },
        // Source of Funds
        source_of_funds_info: {
            sources: [],
            will_self_fund: '',
            student_financial_docs: [],
            will_use_sponsor: '',
            sponsor_relation: '',
            sponsor_nz_based: '',
            sponsor_nz_resident: '',
            sponsor_occupation: '',
            sponsor_employer: '',
            sponsor_annual_income: '',
            sponsor_source_of_funds: [],
            sponsor_financial_docs: [],
            sponsor_identity_docs: []
        },
        // Immigration
        immigration_info: {
            has_travelled_overseas: '',
            overseas_travel_details: '',
            has_applied_nz_visa: '',
            nz_visa_details: '',
            total_nz_time_24_months: '',
            has_applied_other_visa: '',
            other_visa_details: '',
            has_visa_refusal: '',
            visa_refusal_details: '',
            submission_country: ''
        },
        // Character
        character_info: {
            has_conviction: '',
            under_investigation: '',
            has_deportation: '',
            has_visa_refusal_other: '',
            lived_5_years_since_17: ''
        },
        // Health
        health_info: {
            has_tuberculosis: '',
            has_renal_dialysis: '',
            needs_hospital_care: '',
            needs_residential_care: '',
            is_pregnant: ''
        },
        // Family
        family_info: {
            members: [
                { relation: 'Father', first_name: '', family_name: '', dob: '', partnership_status: '', country_of_residence: '', country_of_birth: '', occupation: '' },
                { relation: 'Mother', first_name: '', family_name: '', dob: '', partnership_status: '', country_of_residence: '', country_of_birth: '', occupation: '' },
                { relation: 'Spouse', first_name: '', family_name: '', dob: '', partnership_status: '', country_of_residence: '', country_of_birth: '', occupation: '' },
                { relation: 'Sibling', first_name: '', family_name: '', dob: '', partnership_status: '', country_of_residence: '', country_of_birth: '', occupation: '' },
                { relation: 'Child 1', first_name: '', family_name: '', dob: '', partnership_status: '', country_of_residence: '', country_of_birth: '', occupation: '' },
                { relation: 'Child 2', first_name: '', family_name: '', dob: '', partnership_status: '', country_of_residence: '', country_of_birth: '', occupation: '' },
            ]
        },
        // NZ Contacts
        nz_contacts_info: {
            has_nz_contacts: '',
            contact_first_name: '',
            contact_family_name: '',
            contact_relationship: '',
            contact_address: '',
            contact_number: ''
        },
        // Military
        military_info: {
            military_compulsory: '',
            has_military_service: ''
        },
        // Home Ties
        home_ties_info: {
            family_owns_property: '',
            property_type: '',
            property_location: '',
            property_owner: '',
            family_owns_business: '',
            business_type: '',
            business_involvement: ''
        },
        // Declaration
        declaration_accepted: false
    });

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!isSuccess) {
            const draft = localStorage.getItem('assessment_draft');
            if (draft) {
                try {
                    const parsed = JSON.parse(draft);
                    setData(prev => ({ ...prev, ...parsed }));
                } catch (e) {
                    console.error("Could not load draft", e);
                }
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded && !isSuccess) {
            localStorage.setItem('assessment_draft', JSON.stringify(data));
        }
    }, [data, isLoaded, isSuccess]);

    const steps = [
        { id: 1, title: 'Terms', icon: ShieldCheck },
        { id: 2, title: 'Personal', icon: User },
        { id: 3, title: 'Study Plans', icon: MapPin },
        { id: 4, title: 'Education', icon: GraduationCap },
        { id: 5, title: 'Work', icon: Briefcase },
        { id: 6, title: 'Financial', icon: Wallet },
        { id: 7, title: 'Funds', icon: Wallet },
        { id: 8, title: 'Immigration', icon: Globe },
        { id: 9, title: 'Character', icon: Shield },
        { id: 10, title: 'Family', icon: Users },
        { id: 11, title: 'Additional', icon: Home },
        { id: 12, title: 'Declaration', icon: PenLine },
    ];

    const formRef = useRef(null);

    const step2Keys = ['first_name', 'last_name', 'email', 'phone', 'gender', 'marital_status', 'dob', 'country_of_birth', 'place_of_birth', 'citizenship', 'residence_city', 'residence_state', 'residence_country', 'has_passport', 'passport_number', 'passport_expiry', 'passport_pdf', 'has_other_names', 'other_names'];

    const keyToStepNumber = (key) => {
        if (key === 'terms_accepted') return 1;
        if (step2Keys.includes(key)) return 2;
        if (key.startsWith('study_plans')) return 3;
        if (key.startsWith('education_background') || key.startsWith('high_school') || key.startsWith('education_docs') || key === 'has_gap' || key.startsWith('gap_')) return 4;
        if (key.startsWith('work_experience')) return 5;
        if (key.startsWith('financial_info')) return 6;
        if (key.startsWith('source_of_funds_info')) return 7;
        if (key.startsWith('immigration_info')) return 8;
        if (key.startsWith('character_info') || key.startsWith('health_info')) return 9;
        if (key.startsWith('family_info')) return 10;
        if (key.startsWith('nz_contacts_info') || key.startsWith('military_info') || key.startsWith('home_ties_info')) return 11;
        if (key === 'declaration_accepted') return 12;
        return null;
    };

    const findFirstErrorStep = (keys) => {
        let earliest = null;
        for (const k of keys) {
            const s = keyToStepNumber(k);
            if (s !== null && (earliest === null || s < earliest)) earliest = s;
        }
        return earliest;
    };

    const validateStep = (stepNum) => {
        const errs = {};

        switch (stepNum) {
            case 1:
                if (!data.terms_accepted) errs.terms_accepted = 'You must accept the terms and conditions';
                break;
            case 2:
                if (!data.first_name.trim()) errs.first_name = 'First name is required';
                if (!data.last_name.trim()) errs.last_name = 'Surname is required';
                if (!data.email.trim()) errs.email = 'Email is required';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Please enter a valid email address';
                if (!data.phone.trim()) errs.phone = 'Phone number is required';
                if (!data.gender) errs.gender = 'Gender is required';
                if (!data.dob) errs.dob = 'Date of birth is required';
                if (!data.country_of_birth.trim()) errs.country_of_birth = 'Country of birth is required';
                if (!data.citizenship.trim()) errs.citizenship = 'Citizenship is required';
                if (!data.residence_country.trim()) errs.residence_country = 'Country of residence is required';
                if (data.has_other_names === 'Yes' && !data.other_names.trim()) errs.other_names = 'Please provide your other name(s)';
                if (data.has_passport === 'Yes') {
                    if (!data.passport_number.trim()) errs.passport_number = 'Passport number is required';
                    if (!data.passport_expiry) errs.passport_expiry = 'Passport expiry date is required';
                }
                break;
            case 3:
                if (!data.study_plans.preferred_course.trim()) errs['study_plans.preferred_course'] = 'Preferred course is required';
                if (!data.study_plans.qualification_level) errs['study_plans.qualification_level'] = 'Qualification level is required';
                if (data.study_plans.has_english_test === 'Yes') {
                    if (!data.study_plans.english_test_type) errs['study_plans.english_test_type'] = 'Test type is required';
                    if (!data.study_plans.test_score_overall.trim()) errs['study_plans.test_score_overall'] = 'Overall score is required';
                }
                break;
            case 4:
                data.education_background.forEach((edu, i) => {
                    if (edu.completed) {
                        if (!edu.field_of_study.trim()) errs[`education_background.${i}.field_of_study`] = 'Field of study is required';
                        if (!edu.institution.trim()) errs[`education_background.${i}.institution`] = 'Name of institution is required';
                    }
                });
                if (data.has_gap === 'Yes') {
                    if (!data.gap_length.trim()) errs.gap_length = 'Gap length is required';
                    if (!data.gap_activities || !data.gap_activities.length) errs.gap_activities = 'Please select at least one activity';
                }
                break;
            case 5:
                if (!data.work_experience[0].company_name.trim()) errs['work_experience.company_name'] = 'Company name is required';
                if (!data.work_experience[0].job_title.trim()) errs['work_experience.job_title'] = 'Job title is required';
                break;
            case 6:
                if (!data.financial_info.funding_source.length) errs['financial_info.funding_source'] = 'Please select at least one funding source';
                if (!data.financial_info.estimated_budget.trim()) errs['financial_info.estimated_budget'] = 'Estimated budget is required';
                if (data.financial_info.has_sponsors === 'Yes' && !data.financial_info.sponsor_relation.trim()) {
                    errs['financial_info.sponsor_relation'] = 'Sponsor relation is required';
                }
                break;
            case 7:
                if (!data.source_of_funds_info.sources.length) errs['source_of_funds_info.sources'] = 'Please select at least one source of funds';
                if (data.source_of_funds_info.will_use_sponsor === 'Yes') {
                    if (!data.source_of_funds_info.sponsor_relation) errs['source_of_funds_info.sponsor_relation'] = 'Sponsor relation is required';
                    if (!data.source_of_funds_info.sponsor_occupation.trim()) errs['source_of_funds_info.sponsor_occupation'] = 'Sponsor occupation is required';
                    if (!data.source_of_funds_info.sponsor_annual_income.trim()) errs['source_of_funds_info.sponsor_annual_income'] = 'Sponsor annual income is required';
                }
                break;
            case 8:
                if (!data.immigration_info.submission_country.trim()) errs['immigration_info.submission_country'] = 'Submission country is required';
                if (data.immigration_info.has_travelled_overseas === 'Yes' && !data.immigration_info.overseas_travel_details.trim()) {
                    errs['immigration_info.overseas_travel_details'] = 'Please provide travel details';
                }
                if (data.immigration_info.has_applied_nz_visa === 'Yes' && !data.immigration_info.nz_visa_details.trim()) {
                    errs['immigration_info.nz_visa_details'] = 'Please provide NZ visa details';
                }
                if (data.immigration_info.has_applied_other_visa === 'Yes' && !data.immigration_info.other_visa_details.trim()) {
                    errs['immigration_info.other_visa_details'] = 'Please provide visa details';
                }
                if (data.immigration_info.has_visa_refusal === 'Yes' && !data.immigration_info.visa_refusal_details.trim()) {
                    errs['immigration_info.visa_refusal_details'] = 'Please provide visa refusal details';
                }
                break;
            case 9:
                break;
            case 10:
                break;
            case 11:
                if (data.nz_contacts_info.has_nz_contacts === 'Yes') {
                    if (!data.nz_contacts_info.contact_first_name.trim()) errs['nz_contacts_info.contact_first_name'] = 'Contact first name is required';
                    if (!data.nz_contacts_info.contact_family_name.trim()) errs['nz_contacts_info.contact_family_name'] = 'Contact family name is required';
                }
                break;
            case 12:
                if (!data.declaration_accepted) errs.declaration_accepted = 'You must accept the declaration';
                break;
        }

        return errs;
    };

    const validateRange = (fromStep, toStep) => {
        const aggregated = {};
        let firstInvalid = null;
        for (let n = fromStep; n <= toStep; n++) {
            const errs = validateStep(n);
            if (Object.keys(errs).length > 0 && firstInvalid === null) {
                firstInvalid = n;
            }
            Object.assign(aggregated, errs);
        }
        return { aggregated, firstInvalid };
    };

    const scrollFormToTop = () => {
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // As the user fills in fields, clear any "Field Required" markers that
    // are no longer accurate so the red border disappears immediately.
    useEffect(() => {
        const localKeys = Object.keys(localErrors);
        const serverKeys = Object.keys(errors);
        if (localKeys.length === 0 && serverKeys.length === 0) return;

        const { aggregated } = validateRange(1, 12);

        if (localKeys.length > 0) {
            const next = {};
            let changed = false;
            for (const k of localKeys) {
                if (aggregated[k]) next[k] = aggregated[k];
                else changed = true;
            }
            if (changed) setLocalErrors(next);
        }

        if (serverKeys.length > 0) {
            const stripIndex = (k) => k.replace(/\.\d+(?=\.)/g, '');
            const toClear = serverKeys.filter((k) => {
                if (keyToStepNumber(k) === null) return false;
                return !aggregated[k] && !aggregated[stripIndex(k)];
            });
            if (toClear.length > 0) clearErrors(...toClear);
        }
    }, [data]);

    const nextStep = () => {
        const errs = validateStep(step);
        if (Object.keys(errs).length > 0) {
            setLocalErrors(errs);
            setModal({
                show: true,
                message: `Please complete the required fields in Step ${step} (${steps[step - 1].title}) before proceeding.`,
            });
            scrollFormToTop();
            return;
        }
        setLocalErrors({});
        setStep(s => Math.min(s + 1, 12));
    };

    const prevStep = () => {
        setLocalErrors({});
        setStep(s => Math.max(s - 1, 1));
    };

    const handleSidebarClick = (targetStepId) => {
        if (targetStepId === step) return;
        if (targetStepId < step) {
            setLocalErrors({});
            setStep(targetStepId);
            return;
        }
        const { aggregated, firstInvalid } = validateRange(1, targetStepId - 1);
        if (firstInvalid !== null) {
            setLocalErrors(aggregated);
            setStep(firstInvalid);
            setModal({
                show: true,
                message: `Please complete the required fields in Step ${firstInvalid} (${steps[firstInvalid - 1].title}) before moving forward.`,
            });
            scrollFormToTop();
            return;
        }
        setLocalErrors({});
        setStep(targetStepId);
    };

    const normalizeServerErrors = (errs) => {
        const out = { ...errs };
        for (const k of Object.keys(errs)) {
            const stripped = k.replace(/\.\d+(?=\.)/g, '');
            if (stripped !== k && !out[stripped]) out[stripped] = errs[k];
        }
        return out;
    };

    const allErrors = { ...localErrors, ...normalizeServerErrors(errors) };

    const handleSubmit = (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();

        //submission only happens from step 12. If the form was submitted
        if (step !== 12) {
            nextStep();
            return;
        }

        submitFinal();
    };

    const submitFinal = () => {
        const { aggregated, firstInvalid } = validateRange(1, 12);
        if (firstInvalid !== null) {
            setLocalErrors(aggregated);
            setStep(firstInvalid);
            setModal({
                show: true,
                message: `Please complete the required fields in Step ${firstInvalid} (${steps[firstInvalid - 1].title}) before submitting.`,
            });
            scrollFormToTop();
            return;
        }
        setLocalErrors({});

        post('/free-assessment', {
            forceFormData: true,
            onSuccess: () => setIsSuccess(true),
            onError: (serverErrs) => {
                const keys = Object.keys(serverErrs || {});

                const fieldKeys = keys.filter(k => keyToStepNumber(k) !== null);
                const onlyServerError = fieldKeys.length === 0;

                if (onlyServerError) {
                    const msg = serverErrs?.error || 'Submission failed. Please try again or contact support.';
                    setModal({
                        show: true,
                        message: msg,
                    });
                    return;
                }

                const targetStep = findFirstErrorStep(fieldKeys) ?? 12;

                setModal({
                    show: true,
                    message: `There is some missing or invalid information in Step ${targetStep} (${steps[targetStep - 1].title}). Let's head over to fix it.`,
                    action: () => {
                        setStep(targetStep);
                        setModal({ show: false, message: '' });
                        scrollFormToTop();
                    }
                });
            }
        });
    };

    if (isSuccess) return <SuccessMessage leadId={leadId} />;

    const stepLabel = step < 10 ? `0${step}` : `${step}`;

    return (
        <div className="min-h-screen bg-white font-urbanist text-[#212121] overflow-x-hidden">
            <Head title="Free Assessment Eligibility" />

            <Navbar />

            {/* Hero Header — Site-Matching Editorial Style */}
            <div className="relative bg-white border-b border-gray-100 overflow-hidden">
                {/* Green top accent stripe */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#436235]" />

                {/* Faint background pattern */}
                <div className="absolute inset-0 opacity-[0.025]" style={{backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, #282728 40px, #282728 41px), repeating-linear-gradient(90deg, transparent, transparent 80px, #282728 80px, #282728 81px)'}} />

                <div className="container mx-auto px-6 py-24 lg:py-32 relative z-10">
                    <div className="max-w-5xl mx-auto">
                        {/* Eyebrow — matches site style */}
                        <span className="text-xs font-bold text-[#436235] uppercase tracking-[0.3em] mb-6 block">Free Immigration Assessment</span>

                        <h1 className="text-5xl lg:text-7xl font-black text-[#282728] uppercase tracking-tighter leading-[0.9] mb-8">
                            Enrolment<br/>
                            <span className="text-[#436235]">Eligibility</span><br/>
                            Assessment
                        </h1>

                        <div className="w-12 h-[2px] bg-[#282728]/20 my-8" />

                        <div className="flex flex-col md:flex-row md:items-end gap-10">
                            <p className="text-gray-600 text-sm leading-[1.9] font-light max-w-[400px] tracking-wide">
                                Your responses help us determine the best study pathway to New Zealand for you.
                            </p>
                            <div className="flex items-center gap-8 md:ml-auto flex-shrink-0">
                                <div className="text-center">
                                    <div className="text-4xl font-black text-[#282728]">~15</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-[0.3em] font-bold mt-1">Minutes</div>
                                </div>
                                <div className="w-[1px] h-10 bg-gray-200" />
                                <div className="text-center">
                                    <div className="text-4xl font-black text-[#436235]">Free</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-[0.3em] font-bold mt-1">No Cost</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-6 pb-32 pt-12 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">

                    {/* Sidebar Navigation — Premium Timeline */}
                    <div className="lg:w-[220px] sticky top-28 flex-shrink-0">
                        <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-xl shadow-gray-100/80">
                        {/* Sidebar header — matches site palette */}
                            <div className="px-6 pt-6 pb-5 bg-[#282728]">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-[0.4em] mb-1">Form Progress</p>
                                <div className="text-2xl font-black text-white">{Math.round((step / 12) * 100)}<span className="text-base text-white/30">%</span></div>
                                <div className="mt-3 h-0.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-[#436235]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(step / 12) * 100}%` }}
                                        transition={{ duration: 0.8, ease: 'circOut' }}
                                    />
                                </div>
                            </div>
                            {/* Steps list */}
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
                                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-[#282728]'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            {/* Icon badge */}
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                                                isActive
                                                    ? 'bg-[#436235]'
                                                    : isCompleted
                                                    ? 'bg-[#436235]/10'
                                                    : 'bg-gray-100'
                                            }`}>
                                                {isCompleted && !isActive ? (
                                                    <CheckCircle size={12} className="text-[#436235]" />
                                                ) : (
                                                    <Icon size={11} className={isActive ? 'text-white' : 'text-gray-500'} />
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={`text-xs font-black uppercase tracking-[0.25em] leading-none mb-0.5 ${
                                                    isActive ? 'text-white/40' : 'text-gray-300'
                                                }`}>{stepNum}</span>
                                                <span className={`text-xs font-black uppercase tracking-[0.12em] leading-none truncate ${
                                                    isActive ? 'text-white' : isCompleted ? 'text-[#436235]' : 'text-gray-500 group-hover:text-[#282728]'
                                                }`}>{s.title}</span>
                                            </div>
                                            {isActive && (
                                                <motion.div layoutId="sidebar-active" className="ml-auto w-1 h-4 rounded-full bg-[#436235]" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Form Content Area */}
                    <div className="flex-1 min-w-0 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/80 overflow-hidden">
                        {/* Form Top Bar */}
                        <div className="px-8 pt-8 pb-6 border-b border-gray-50">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-500 mb-1">Section {stepLabel} of 12</p>
                                    <p className="text-base font-black uppercase tracking-tight text-[#282728]">{steps[step - 1]?.title}</p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-[160px]">
                                    {steps.map((s) => (
                                        <div
                                            key={s.id}
                                            className={`transition-all duration-300 rounded-full ${
                                                s.id === step
                                                    ? 'w-5 h-2 bg-[#282728]'
                                                    : s.id < step
                                                    ? 'w-2 h-2 bg-[#436235]'
                                                    : 'w-2 h-2 bg-gray-100'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                            {/* Gradient progress bar */}
                            <div className="h-0.5 w-full bg-gray-100 overflow-hidden">
                                <motion.div
                                    className="h-full bg-[#436235]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(step / 12) * 100}%` }}
                                    transition={{ duration: 0.8, ease: 'circOut' }}
                                />
                            </div>
                        </div>

                        {/* Step Components */}
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
                                            {step === 1 && <StepTerms data={data} setData={setData} errors={allErrors} />}
                                            {step === 2 && <StepPersonal data={data} setData={setData} errors={allErrors} />}
                                            {step === 3 && <StepStudyPlans data={data} setData={setData} errors={allErrors} />}
                                            {step === 4 && <StepEducation data={data} setData={setData} errors={allErrors} />}
                                            {step === 5 && <StepWork data={data} setData={setData} errors={allErrors} />}
                                            {step === 6 && <StepFinancial data={data} setData={setData} errors={allErrors} />}
                                            {step === 7 && <StepSourceOfFunds data={data} setData={setData} errors={allErrors} />}
                                            {step === 8 && <StepImmigration data={data} setData={setData} errors={allErrors} />}
                                            {step === 9 && <StepCharacterHealth data={data} setData={setData} errors={allErrors} />}
                                            {step === 10 && <StepFamily data={data} setData={setData} errors={allErrors} />}
                                            {step === 11 && <StepAdditional data={data} setData={setData} errors={allErrors} />}
                                            {step === 12 && <StepDeclaration data={data} setData={setData} errors={allErrors} />}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Form Footer — Premium Controls */}
                                <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 bg-gray-50/40">
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        disabled={step === 1}
                                        className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.2em] transition-all border ${
                                            step === 1
                                                ? 'opacity-0 cursor-default border-transparent'
                                                : 'border-gray-300 text-gray-500 hover:border-[#282728] hover:text-[#282728]'
                                        }`}
                                    >
                                        <ChevronLeft size={13} /> Back
                                    </button>

                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-300">{stepLabel} / 12</span>
                                        {step < 12 ? (
                                            <button
                                                type="button"
                                                onClick={nextStep}
                                                className="group flex items-center gap-2 px-8 py-2.5 bg-[#282728] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#436235] active:scale-95"
                                            >
                                                Continue <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={submitFinal}
                                                disabled={processing}
                                                className="flex items-center gap-2 px-8 py-2.5 bg-[#436235] text-white text-xs font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#354d2a] active:scale-95 disabled:opacity-60"
                                            >
                                                <CheckCircle size={13} />
                                                {processing ? 'Finalizing...' : 'Submit Profile'}
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
                                onClick={() => {
                                    if (modal.action) modal.action();
                                    else setModal({ show: false, message: '' });
                                }}
                                className="w-full bg-[#282728] text-white py-5 rounded-2xl text-xs font-black uppercase tracking-[0.4em] shadow-xl hover:bg-black transition-all active:scale-95"
                            >
                                {modal.action ? 'Go to Section' : 'Acknowledge'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

{/* --- STEP COMPONENTS --- */}

function StepTerms({ data, setData, errors }) {
    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-8 leading-tight">Privacy & Terms</h2>
            <div className="bg-gray-50/50 rounded-3xl p-10 text-base text-gray-500 leading-[2] font-medium h-96 overflow-y-auto border border-gray-100/50">
                <p>Welcome to ePathways. By proceeding, you agree to the following terms. This assessment is designed to help us understand your immigration pathway to New Zealand and Australia.</p>
                <p>The information you provide will be used solely for the purpose of this assessment. Eligibility criteria and pathways are subject to change in accordance with government regulations.</p>
                <p>We are committed to protecting your privacy. All data submitted is encrypted and handled with the highest level of security. Please ensure that all information provided is accurate and complete to receive the most reliable evaluation.</p>
                <p>ePathways facilitates the connection between potential students and educational institutions. We do not guarantee visa approval, as final decisions rest with the respective immigration authorities.</p>
            </div>
            <div>
                <label className={`flex items-center gap-5 p-4 cursor-pointer group rounded-2xl transition-all ${errors.terms_accepted ? 'bg-red-50 ring-2 ring-red-500/20' : ''}`}>
                    <input
                        type="checkbox"
                        className={`w-6 h-6 rounded ${errors.terms_accepted ? 'border-red-500' : 'border-gray-300'} text-[#436235] focus:ring-[#436235] cursor-pointer transition-colors`}
                        checked={data.terms_accepted}
                        onChange={e => setData('terms_accepted', e.target.checked)}
                    />
                    <span className={`text-sm font-black uppercase tracking-[0.15em] transition-colors ${errors.terms_accepted ? 'text-red-500' : 'text-[#282728]'}`}>
                        I have read and agree to the terms and conditions *
                    </span>
                </label>
                {errors.terms_accepted && <p className="text-sm font-black text-red-500 uppercase tracking-widest mt-2 pl-4">{errors.terms_accepted}</p>}
            </div>
        </div>
    );
}

function StepPersonal({ data, setData, errors }) {
    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-10">Personal Profile</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="First Name *" error={errors.first_name}>
                    <input
                        type="text"
                        className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors"
                        value={data.first_name}
                        onChange={e => setData('first_name', e.target.value)}
                    />
                </Field>
                <Field label="Surname *" error={errors.last_name}>
                    <input
                        type="text"
                        className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors"
                        value={data.last_name}
                        onChange={e => setData('last_name', e.target.value)}
                    />
                </Field>

                <div className="col-span-full">
                    <Field label="Have you ever used any other names?">
                        <div className="flex gap-4 mt-2">
                            {['Yes', 'No'].map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setData('has_other_names', opt)}
                                    className={`px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${data.has_other_names === opt ? 'bg-[#282728] text-white border-[#282728]' : 'bg-white text-gray-500 border-gray-200'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </Field>
                    {data.has_other_names === 'Yes' && (
                        <div className="mt-4">
                            <Field label="Full Other Name *" error={errors.other_names}>
                                <input
                                    type="text"
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none"
                                    value={data.other_names}
                                    onChange={e => setData('other_names', e.target.value)}
                                />
                            </Field>
                        </div>
                    )}
                </div>

                <Field label="Gender *" error={errors.gender}>
                    <select
                        className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors"
                        value={data.gender}
                        onChange={e => setData('gender', e.target.value)}
                    >
                        <option value="">Select Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                    </select>
                </Field>

                <Field label="Marital Status">
                    <select
                        className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors"
                        value={data.marital_status}
                        onChange={e => setData('marital_status', e.target.value)}
                    >
                        <option value="">Select Status</option>
                        <option>Single</option>
                        <option>Married</option>
                        <option>Widow</option>
                        <option>Partnership</option>
                    </select>
                </Field>

                <Field label="Phone Number *" error={errors.phone}>
                    <input
                        type="tel"
                        className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors"
                        value={data.phone}
                        onChange={e => setData('phone', e.target.value)}
                    />
                </Field>

                <Field label="Email Address *" error={errors.email}>
                    <input
                        type="email"
                        className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                    />
                </Field>

                <Field label="Date of Birth *" error={errors.dob}>
                    <input
                        type="date"
                        className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors"
                        value={data.dob}
                        onChange={e => setData('dob', e.target.value)}
                    />
                </Field>

                <Field label="Country of Birth *" error={errors.country_of_birth}>
                    <input
                        type="text"
                        className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors"
                        value={data.country_of_birth}
                        onChange={e => setData('country_of_birth', e.target.value)}
                    />
                </Field>

                <Field label="Place of Birth">
                    <input
                        type="text"
                        className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors"
                        placeholder="e.g. City or Town"
                        value={data.place_of_birth}
                        onChange={e => setData('place_of_birth', e.target.value)}
                    />
                </Field>

                <Field label="Citizenship *" error={errors.citizenship}>
                    <input
                        type="text"
                        className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors"
                        value={data.citizenship}
                        onChange={e => setData('citizenship', e.target.value)}
                    />
                </Field>

                <div className="col-span-full border-t border-gray-50 pt-8 mt-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235] mb-6">Current Residence</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Field label="City">
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.residence_city} onChange={e => setData('residence_city', e.target.value)} />
                        </Field>
                        <Field label="State/Province">
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.residence_state} onChange={e => setData('residence_state', e.target.value)} />
                        </Field>
                        <Field label="Country *" error={errors.residence_country}>
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.residence_country} onChange={e => setData('residence_country', e.target.value)} />
                        </Field>
                    </div>
                </div>

                <div className="col-span-full border-t border-gray-50 pt-8 mt-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235] mb-6">Passport Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Do you have a valid passport?">
                           <div className="flex gap-4 mt-2">
                               {['Yes', 'No'].map(o => (
                                   <button key={o} type="button" onClick={() => setData('has_passport', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.has_passport === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                               ))}
                           </div>
                        </Field>
                        {data.has_passport === 'Yes' && (
                            <>
                                <Field label="Passport Number *" error={errors.passport_number}>
                                    <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.passport_number} onChange={e => setData('passport_number', e.target.value)} />
                                </Field>
                                <Field label="Expiry Date *" error={errors.passport_expiry}>
                                    <input type="date" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.passport_expiry} onChange={e => setData('passport_expiry', e.target.value)} />
                                </Field>
                                <div className="col-span-full">
                                    <Field label="Upload Passport Copy (PDF)">
                                        <div className="mt-2 flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-8 h-8 text-gray-500 mb-2" />
                                                    <p className="text-xs text-gray-600 font-bold uppercase tracking-[0.2em]">{data.passport_pdf ? data.passport_pdf.name : 'Select or drop PDF'}</p>
                                                </div>
                                                <input type="file" className="hidden" accept=".pdf" onChange={e => setData('passport_pdf', e.target.files[0])} />
                                            </label>
                                        </div>
                                    </Field>
                                </div>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

function StepStudyPlans({ data, setData, errors }) {
    const levels = ['Diploma (Level 5-6)', 'Bachelor Degree (Level 7)', 'Postgraduate Diploma (Level 8)', 'Master\'s Degree (Level 9)', 'Doctorate (Level 10)'];
    const updateNested = (key, val) => setData('study_plans', { ...data.study_plans, [key]: val });

    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-10">Study Aspirations</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Preferred Course/Program *" error={errors['study_plans.preferred_course']}>
                    <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.study_plans.preferred_course} onChange={e => updateNested('preferred_course', e.target.value)} />
                </Field>
                <Field label="Qualification Level *" error={errors['study_plans.qualification_level']}>
                    <select className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.study_plans.qualification_level} onChange={e => updateNested('qualification_level', e.target.value)}>
                        <option value="">Select Level</option>
                        {levels.map(l => <option key={l}>{l}</option>)}
                    </select>
                </Field>
                <Field label="Preferred City (if any)">
                    <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.study_plans.preferred_city} onChange={e => updateNested('preferred_city', e.target.value)} />
                </Field>
                <Field label="Preferred Intake">
                    <input type="text" placeholder="e.g. Feb 2025" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.study_plans.preferred_intake} onChange={e => updateNested('preferred_intake', e.target.value)} />
                </Field>

                <div className="col-span-full border-t border-gray-50 pt-8 mt-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235] mb-6">English Proficiency</h3>
                    <Field label="Have you taken an English test?">
                        <div className="flex gap-4 mt-2">
                             {['Yes', 'No'].map(o => (
                                 <button key={o} type="button" onClick={() => updateNested('has_english_test', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.study_plans.has_english_test === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                             ))}
                        </div>
                    </Field>

                    {data.study_plans.has_english_test === 'Yes' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                            <div className="md:col-span-3 lg:col-span-2">
                                <Field label="Test Type *" error={errors['study_plans.english_test_type']}>
                                    <select className="w-full px-4 py-2 bg-white border border-[#282728] rounded-lg" value={data.study_plans.english_test_type} onChange={e => updateNested('english_test_type', e.target.value)}>
                                        <option value="">Select Test</option>
                                        <option>IELTS Academic</option>
                                        <option>PTE Academic</option>
                                        <option>TOEFL iBT</option>
                                        <option>Other</option>
                                    </select>
                                </Field>
                            </div>
                            <Field label="Overall *" error={errors['study_plans.test_score_overall']}>
                                <input type="text" className="w-full px-4 py-2 bg-white border border-[#282728] rounded-lg" value={data.study_plans.test_score_overall} onChange={e => updateNested('test_score_overall', e.target.value)} />
                            </Field>
                            <Field label="Reading">
                                <input type="text" className="w-full px-4 py-2 bg-white border border-[#282728] rounded-lg" value={data.study_plans.test_score_reading} onChange={e => updateNested('test_score_reading', e.target.value)} />
                            </Field>
                            <Field label="Writing">
                                <input type="text" className="w-full px-4 py-2 bg-white border border-[#282728] rounded-lg" value={data.study_plans.test_score_writing} onChange={e => updateNested('test_score_writing', e.target.value)} />
                            </Field>
                            <Field label="Listening">
                                <input type="text" className="w-full px-4 py-2 bg-white border border-[#282728] rounded-lg" value={data.study_plans.test_score_listening} onChange={e => updateNested('test_score_listening', e.target.value)} />
                            </Field>
                            <Field label="Speaking">
                                <input type="text" className="w-full px-4 py-2 bg-white border border-[#282728] rounded-lg" value={data.study_plans.test_score_speaking} onChange={e => updateNested('test_score_speaking', e.target.value)} />
                            </Field>
                            <div className="md:col-span-3 lg:col-span-2">
                                <Field label="Test Date">
                                    <input type="date" className="w-full px-4 py-2 bg-white border border-[#282728] rounded-lg" value={data.study_plans.test_date} onChange={e => updateNested('test_date', e.target.value)} />
                                </Field>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StepEducation({ data, setData, errors }) {
    const eduDocs = ['Year 10th Certificate', 'Year 12th Certificate', "Vocational Certificate", "Bachelor's Certificate", "Master's Certificate", "Doctorate Certificate"];
    const transcriptDocs = ['Year 10th Transcript/Marks', 'Year 12th Transcript/Marks', "Vocational Transcript/Marks", "Bachelor's Transcript/Marks", "Master's Transcript/Marks", "Doctorate Transcript/Marks"];
    const gapActivities = ['Working', 'Family business', 'Preparing for exams', 'Looking for work', 'Other'];

    const toggleEduDoc = (doc) => {
        const current = data.education_docs || [];
        const next = current.includes(doc) ? current.filter(d => d !== doc) : [...current, doc];
        setData('education_docs', next);
    };

    const toggleGapActivity = (activity) => {
        const current = data.gap_activities || [];
        const next = current.includes(activity) ? current.filter(a => a !== activity) : [...current, activity];
        setData('gap_activities', next);
    };

    const updateEduLevel = (index, field, value) => {
        const edu = [...data.education_background];
        edu[index] = { ...edu[index], [field]: value };
        setData('education_background', edu);
    };

    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-10">Academic Background</h2>

            {/* High School Section */}
            <div className="bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235] mb-6">High School Education</h3>
                <Field label="Have you completed high school?">
                    <div className="flex gap-4 mt-2">
                        {['Yes', 'No'].map(o => (
                            <button key={o} type="button" onClick={() => setData('high_school_completed', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.high_school_completed === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                        ))}
                    </div>
                </Field>
                {data.high_school_completed === 'Yes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <Field label="Highest Level Completed">
                            <select className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.high_school_level} onChange={e => setData('high_school_level', e.target.value)}>
                                <option value="">Select Level</option>
                                <option>10th</option>
                                <option>12th</option>
                                <option>13th</option>
                            </select>
                        </Field>
                        <Field label="Name of Institution">
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.high_school_institution} onChange={e => setData('high_school_institution', e.target.value)} />
                        </Field>
                        <Field label="Start Date">
                            <input type="date" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.high_school_start} onChange={e => setData('high_school_start', e.target.value)} />
                        </Field>
                        <Field label="End Date">
                            <input type="date" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.high_school_end} onChange={e => setData('high_school_end', e.target.value)} />
                        </Field>
                        <Field label="Average Marks / Percentage">
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.high_school_marks} onChange={e => setData('high_school_marks', e.target.value)} />
                        </Field>
                    </div>
                )}
            </div>

            {/* Tertiary Education Section */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235] mb-6">Tertiary Education</h3>
                {data.education_background.map((edu, index) => (
                    <ExpandableEducationCard
                        key={edu.level}
                        edu={edu}
                        index={index}
                        updateEduLevel={updateEduLevel}
                        errors={errors}
                    />
                ))}
            </div>

            {/* Available Documents */}
            <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235]">Available Documents</h3>
                
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Certificates</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {eduDocs.map(doc => (
                            <label key={doc} className="flex items-center gap-3 p-4 bg-white border border-[#282728] rounded-xl cursor-pointer hover:border-[#436235] transition-colors">
                                <input type="checkbox" className="w-4 h-4 rounded text-[#436235]" checked={(data.education_docs || []).includes(doc)} onChange={() => toggleEduDoc(doc)} />
                                <span className="text-xs font-bold uppercase tracking-tight text-gray-600">{doc}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Transcripts</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {transcriptDocs.map(doc => (
                            <label key={doc} className="flex items-center gap-3 p-4 bg-white border border-[#282728] rounded-xl cursor-pointer hover:border-[#436235] transition-colors">
                                <input type="checkbox" className="w-4 h-4 rounded text-[#436235]" checked={(data.education_docs || []).includes(doc)} onChange={() => toggleEduDoc(doc)} />
                                <span className="text-xs font-bold uppercase tracking-tight text-gray-600">{doc}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Gap Section */}
            <div className="pt-8 border-t border-gray-100">
                <Field label="Has there been a gap in your study?">
                    <div className="flex gap-4 mt-2">
                        {['Yes', 'No'].map(o => (
                            <button key={o} type="button" onClick={() => setData('has_gap', o)} className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border ${data.has_gap === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                        ))}
                    </div>
                </Field>
                {data.has_gap === 'Yes' && (
                    <div className="mt-6 space-y-6">
                        <Field label="How long was the gap? *" error={errors.gap_length}>
                            <input type="text" placeholder="e.g. 2 years" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.gap_length} onChange={e => setData('gap_length', e.target.value)} />
                        </Field>
                        <Field label="What were you doing during this time? *" error={errors.gap_activities}>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                {gapActivities.map(activity => (
                                    <button
                                        key={activity}
                                        type="button"
                                        onClick={() => toggleGapActivity(activity)}
                                        className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all text-center ${(data.gap_activities || []).includes(activity) ? 'bg-[#436235] text-white border-[#436235]' : 'bg-white text-gray-500 border-gray-100 hover:border-[#436235]'}`}
                                    >
                                        {activity}
                                    </button>
                                ))}
                            </div>
                        </Field>
                        <Field label="Please explain further">
                            <textarea className="w-full px-5 py-4 bg-white border border-[#282728] rounded-2xl min-h-[100px]" placeholder="Explain your activities during the gap..." value={data.gap_explanation} onChange={e => setData('gap_explanation', e.target.value)} />
                        </Field>
                    </div>
                )}
            </div>
        </div>
    );
}

function ExpandableEducationCard({ edu, index, updateEduLevel, errors }) {
    const [expanded, setExpanded] = useState(edu.completed);
    const fieldOfStudyErr = errors?.[`education_background.${index}.field_of_study`];
    const institutionErr = errors?.[`education_background.${index}.institution`];

    return (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => {
                    const newCompleted = !edu.completed;
                    updateEduLevel(index, 'completed', newCompleted);
                    setExpanded(newCompleted);
                }}
            >
                <div className="flex items-center gap-4">
                    <input
                        type="checkbox"
                        className="w-5 h-5 rounded text-[#436235] focus:ring-[#436235] cursor-pointer"
                        checked={edu.completed}
                        onChange={(e) => {
                            e.stopPropagation();
                            const newCompleted = !edu.completed;
                            updateEduLevel(index, 'completed', newCompleted);
                            setExpanded(newCompleted);
                        }}
                    />
                    <span className="text-sm font-black uppercase tracking-[0.15em] text-[#282728]">{edu.level}</span>
                </div>
                {edu.completed ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </div>
            {edu.completed && expanded && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Field of Study *" error={fieldOfStudyErr}>
                            <input type="text" className={`w-full bg-transparent border-b py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors ${fieldOfStudyErr ? "border-red-500" : "border-gray-200"}`} value={edu.field_of_study} onChange={e => updateEduLevel(index, 'field_of_study', e.target.value)} />
                        </Field>
                        <Field label="Name of Institution *" error={institutionErr}>
                            <input type="text" className={`w-full bg-transparent border-b py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors ${institutionErr ? "border-red-500" : "border-gray-200"}`} value={edu.institution} onChange={e => updateEduLevel(index, 'institution', e.target.value)} />
                        </Field>
                        <Field label="Start Date">
                            <input type="date" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={edu.start_date} onChange={e => updateEduLevel(index, 'start_date', e.target.value)} />
                        </Field>
                        <Field label="End Date">
                            <input type="date" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={edu.end_date} onChange={e => updateEduLevel(index, 'end_date', e.target.value)} />
                        </Field>
                        <Field label="Average Marks / Percentage">
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={edu.marks_percentage} onChange={e => updateEduLevel(index, 'marks_percentage', e.target.value)} />
                        </Field>
                    </div>
                </div>
            )}
        </div>
    );
}

function StepWork({ data, setData, errors }) {
    const selfEmployedDocs = ['Certificate of Employment', 'Work Experience Letter', 'Salary slips', 'Work contract', 'Salary certificate'];
    const businessDocs = ['Business certificate', 'Income tax return', 'DTI certificate', 'Mayors permit'];

    const updateWork = (field, value) => {
        const copy = [...data.work_experience];
        copy[0] = { ...copy[0], [field]: value };
        setData('work_experience', copy);
    };

    const toggleWorkDoc = (doc) => {
        const copy = [...data.work_experience];
        const current = copy[0].supporting_docs || [];
        const next = current.includes(doc) ? current.filter(d => d !== doc) : [...current, doc];
        copy[0] = { ...copy[0], supporting_docs: next };
        setData('work_experience', copy);
    };

    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-10">Professional History</h2>

            <div className="space-y-8">
                <div className="p-8 rounded-[2rem] border-2 border-dashed border-gray-100 bg-gray-50/20 text-center">
                    <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-sm font-bold text-[#282728] uppercase tracking-widest mb-2">Detailed Work History</h4>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mx-auto max-w-[240px]">This section will be used to assess your job relevance to your chosen study pathway.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Current Company / Organization *" error={errors['work_experience.company_name']}>
                        <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.work_experience[0].company_name} onChange={e => updateWork('company_name', e.target.value)} />
                    </Field>
                    <Field label="Job Title / Role *" error={errors['work_experience.job_title']}>
                        <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.work_experience[0].job_title} onChange={e => updateWork('job_title', e.target.value)} />
                    </Field>
                    <Field label="Start Date">
                        <input type="date" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.work_experience[0].start_date} onChange={e => updateWork('start_date', e.target.value)} />
                    </Field>
                    <Field label="Still working here?">
                        <div className="flex gap-4 mt-2">
                             <button type="button" onClick={() => updateWork('is_current', 'Yes')} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.work_experience[0].is_current === 'Yes' ? 'bg-[#282728] text-white' : 'bg-white text-gray-500 border-gray-100'}`}>Yes</button>
                             <button type="button" onClick={() => updateWork('is_current', 'No')} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.work_experience[0].is_current === 'No' ? 'bg-[#282728] text-white' : 'bg-white text-gray-500 border-gray-100'}`}>No</button>
                        </div>
                    </Field>
                    {data.work_experience[0].is_current === 'No' && (
                        <Field label="End Date">
                            <input type="date" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.work_experience[0].end_date} onChange={e => updateWork('end_date', e.target.value)} />
                        </Field>
                    )}
                    <div className="col-span-full">
                        <Field label="Key Responsibilities & Duties">
                            <textarea className="w-full px-5 py-4 bg-white border border-[#282728] rounded-2xl min-h-[120px]" placeholder="Briefly describe your main tasks..." value={data.work_experience[0].duties} onChange={e => updateWork('duties', e.target.value)} />
                        </Field>
                    </div>

                    <div className="col-span-full border-t border-gray-50 pt-8 mt-4">
                        <Field label="Can you provide supporting documents?">
                            <div className="flex gap-4 mt-2">
                                {['Yes', 'No'].map(o => (
                                    <button key={o} type="button" onClick={() => updateWork('has_supporting_docs', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.work_experience[0].has_supporting_docs === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                                ))}
                            </div>
                        </Field>
                        
                        <div className="mt-8 mb-4">
                            <Field label="Work environment">
                                <div className="flex gap-4 mt-2">
                                    {['Private / Government Employee', 'Business Owner / Self-Employed'].map(o => (
                                        <button key={o} type="button" onClick={() => updateWork('work_environment', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.work_experience[0].work_environment === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                                    ))}
                                </div>
                            </Field>
                        </div>

                        {data.work_experience[0].has_supporting_docs === 'Yes' && data.work_experience[0].work_environment && (
                            <div className="mt-6 space-y-4 pt-4 border-t border-gray-50">
                                <div className="grid grid-cols-2 gap-3">
                                    {(data.work_experience[0].work_environment === 'Private / Government Employee' ? selfEmployedDocs : businessDocs).map(doc => (
                                        <label key={doc} className="flex items-center gap-3 p-4 bg-white border border-[#282728] rounded-xl cursor-pointer hover:border-[#436235] transition-colors">
                                            <input type="checkbox" className="w-4 h-4 rounded text-[#436235]" checked={(data.work_experience[0].supporting_docs || []).includes(doc)} onChange={() => toggleWorkDoc(doc)} />
                                            <span className="text-xs font-bold uppercase tracking-tight text-gray-600">{doc}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepFinancial({ data, setData, errors }) {
    const sources = ['Personal Savings', 'Family Support', 'Bank Loan', 'Scholarship', 'Employer Sponsored', 'Property/Investments'];
    const updateFinancial = (key, val) => setData('financial_info', { ...data.financial_info, [key]: val });
    const toggleSource = (src) => {
        const current = data.financial_info.funding_source;
        const next = current.includes(src) ? current.filter(s => s !== src) : [...current, src];
        updateFinancial('funding_source', next);
    };

    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-10">Financial Capability</h2>

            <div className="space-y-8">
                <Field label="Do you have enough funds to cover the tuition/school fee?">
                    <div className="flex gap-4 mt-2">
                        {['Yes', 'No'].map(o => (
                            <button key={o} type="button" onClick={() => updateFinancial('can_cover_tuition', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.financial_info.can_cover_tuition === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                        ))}
                    </div>
                </Field>

                <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 text-sm text-gray-600 leading-relaxed">
                    <h4 className="text-sm font-black uppercase tracking-[0.3em] text-[#436235] mb-4">Estimated Tuition Ranges (per year)</h4>
                    <ul className="space-y-2 text-base text-gray-500 font-medium">
                        <li>Diploma (Level 5-6): NZ$18,000 - NZ$26,000</li>
                        <li>Bachelor Degree (Level 7): NZ$22,000 - NZ$32,000</li>
                        <li>Postgraduate Diploma (Level 8): NZ$25,000 - NZ$35,000</li>
                        <li>Master's Degree (Level 9): NZ$28,000 - NZ$40,000</li>
                        <li>Doctorate (Level 10): NZ$6,500 - NZ$9,000 (domestic rate for many programs)</li>
                    </ul>
                </div>

                <Field label="Do you have NZ$20,000 to cover living expenses for a year?">
                    <div className="flex gap-4 mt-2">
                        {['Yes', 'No'].map(o => (
                            <button key={o} type="button" onClick={() => updateFinancial('can_cover_living', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.financial_info.can_cover_living === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                        ))}
                    </div>
                </Field>

                <Field label="How will you fund your studies and living costs? *" error={errors['financial_info.funding_source']}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {sources.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => toggleSource(s)}
                                className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all text-center ${data.financial_info.funding_source.includes(s) ? 'bg-[#436235] text-white border-[#436235]' : 'bg-white text-gray-500 border-gray-100 hover:border-[#436235]'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </Field>

                <Field label="Estimated Available Funds (in PHP or NZD) *" error={errors['financial_info.estimated_budget']}>
                    <input
                        type="text"
                        placeholder="e.g. 2,000,000 PHP"
                        className="w-full px-5 py-4 bg-white border border-[#282728] rounded-2xl outline-none"
                        value={data.financial_info.estimated_budget}
                        onChange={e => updateFinancial('estimated_budget', e.target.value)}
                    />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Field label="Do you have financial sponsors?">
                         <div className="flex gap-4 mt-2">
                             {['Yes', 'No'].map(o => (
                                 <button key={o} type="button" onClick={() => updateFinancial('has_sponsors', o)} className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border ${data.financial_info.has_sponsors === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                             ))}
                         </div>
                    </Field>
                    {data.financial_info.has_sponsors === 'Yes' && (
                        <Field label="Relation to Sponsor(s) *" error={errors['financial_info.sponsor_relation']}>
                            <input type="text" placeholder="e.g. Parents" className="w-full px-5 py-3.5 bg-white border border-[#282728] rounded-xl" value={data.financial_info.sponsor_relation} onChange={e => updateFinancial('sponsor_relation', e.target.value)} />
                        </Field>
                    )}
                </div>

                <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 text-sm text-gray-600 leading-relaxed">
                    <h4 className="text-sm font-black uppercase tracking-[0.3em] text-[#436235] mb-4">Additional Costs to Consider</h4>
                    <ul className="space-y-2 text-base text-gray-500 font-medium">
                        <li>Travel & Medical Insurance: NZ$1,000 - NZ$1,600 per year</li>
                        <li>Visa Application Fee (INZ): NZ$850</li>
                        <li>Visa Application Fee (Professional/Agent): NZ$1,500</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

function StepSourceOfFunds({ data, setData, errors }) {
    const fundSources = ['Family savings', 'Fixed deposits', 'Education loan', 'Property sale', 'Personal savings'];
    const studentDocs = ['Bank statements (6 months)', 'Fixed deposit certificates', 'Salary slips (3-6 months)', 'Employment letter', 'Business registration/permit'];
    const sponsorRelations = ['Father', 'Mother', 'Both parents', 'Spouse', 'Brother-Sister', 'Uncle-Aunt', 'Grandparents'];
    const sponsorFundSources = ['Savings', 'Fixed Deposits', 'Income from business', 'Income from sale of property', 'Loan'];
    const sponsorFinDocs = ['Bank statements', 'Fixed deposit certificates', 'Salary slips', 'Employment letter', 'Business registration', 'Income Tax Return'];
    const sponsorIdDocs = ['Passport', 'Aadhaar card', 'PAN card'];

    const update = (key, val) => setData('source_of_funds_info', { ...data.source_of_funds_info, [key]: val });

    const toggleArrayItem = (key, item) => {
        const current = data.source_of_funds_info[key] || [];
        const next = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
        update(key, next);
    };

    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-10">Source of Funds & Sponsors</h2>

            <div className="space-y-8">
                <Field label="Source of Funds *" error={errors['source_of_funds_info.sources']}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        {fundSources.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => toggleArrayItem('sources', s)}
                                className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all text-center ${(data.source_of_funds_info.sources || []).includes(s) ? 'bg-[#436235] text-white border-[#436235]' : 'bg-white text-gray-500 border-gray-100 hover:border-[#436235]'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </Field>

                <Field label="Will you fund your studies yourself?">
                    <div className="flex gap-4 mt-2">
                        {['Yes', 'No'].map(o => (
                            <button key={o} type="button" onClick={() => update('will_self_fund', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.source_of_funds_info.will_self_fund === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                        ))}
                    </div>
                </Field>

                <div className="border-t border-gray-50 pt-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235] mb-6">Student Financial Documents Available</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {studentDocs.map(doc => (
                            <label key={doc} className="flex items-center gap-3 p-4 bg-white border border-[#282728] rounded-xl cursor-pointer hover:border-[#436235] transition-colors">
                                <input type="checkbox" className="w-4 h-4 rounded text-[#436235]" checked={(data.source_of_funds_info.student_financial_docs || []).includes(doc)} onChange={() => toggleArrayItem('student_financial_docs', doc)} />
                                <span className="text-xs font-bold uppercase tracking-tight text-gray-600">{doc}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="border-t border-gray-50 pt-8">
                    <Field label="Will you be using someone to sponsor your studies?">
                        <div className="flex gap-4 mt-2">
                            {['Yes', 'No'].map(o => (
                                <button key={o} type="button" onClick={() => update('will_use_sponsor', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.source_of_funds_info.will_use_sponsor === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                            ))}
                        </div>
                    </Field>

                    {data.source_of_funds_info.will_use_sponsor === 'Yes' && (
                        <div className="mt-8 space-y-8 bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-[#436235]">Sponsor Details</h4>

                            <Field label="Relation to Sponsor *" error={errors['source_of_funds_info.sponsor_relation']}>
                                <select className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.source_of_funds_info.sponsor_relation} onChange={e => update('sponsor_relation', e.target.value)}>
                                    <option value="">Select Relation</option>
                                    {sponsorRelations.map(r => <option key={r}>{r}</option>)}
                                </select>
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field label="Is the sponsor NZ based?">
                                    <div className="flex gap-4 mt-2">
                                        {['Yes', 'No'].map(o => (
                                            <button key={o} type="button" onClick={() => update('sponsor_nz_based', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.source_of_funds_info.sponsor_nz_based === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                                        ))}
                                    </div>
                                </Field>
                                <Field label="Is the sponsor an NZ resident/citizen?">
                                    <div className="flex gap-4 mt-2">
                                        {['Yes', 'No'].map(o => (
                                            <button key={o} type="button" onClick={() => update('sponsor_nz_resident', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.source_of_funds_info.sponsor_nz_resident === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                                        ))}
                                    </div>
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field label="Sponsor Occupation *" error={errors['source_of_funds_info.sponsor_occupation']}>
                                    <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.source_of_funds_info.sponsor_occupation} onChange={e => update('sponsor_occupation', e.target.value)} />
                                </Field>
                                <Field label="Employer / Business Name">
                                    <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.source_of_funds_info.sponsor_employer} onChange={e => update('sponsor_employer', e.target.value)} />
                                </Field>
                                <Field label="Estimated Annual Income *" error={errors['source_of_funds_info.sponsor_annual_income']}>
                                    <input type="text" placeholder="e.g. NZ$80,000" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.source_of_funds_info.sponsor_annual_income} onChange={e => update('sponsor_annual_income', e.target.value)} />
                                </Field>
                            </div>

                            <Field label="Sponsor's Source of Funds">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                    {sponsorFundSources.map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => toggleArrayItem('sponsor_source_of_funds', s)}
                                            className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all text-center ${(data.source_of_funds_info.sponsor_source_of_funds || []).includes(s) ? 'bg-[#436235] text-white border-[#436235]' : 'bg-white text-gray-500 border-gray-100 hover:border-[#436235]'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            <div className="space-y-6">
                                <h5 className="text-sm font-black uppercase tracking-[0.3em] text-[#282728] opacity-60">Sponsor Financial Documents Available</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {sponsorFinDocs.map(doc => (
                                        <label key={doc} className="flex items-center gap-3 p-4 bg-white border border-[#282728] rounded-xl cursor-pointer hover:border-[#436235] transition-colors">
                                            <input type="checkbox" className="w-4 h-4 rounded text-[#436235]" checked={(data.source_of_funds_info.sponsor_financial_docs || []).includes(doc)} onChange={() => toggleArrayItem('sponsor_financial_docs', doc)} />
                                            <span className="text-xs font-bold uppercase tracking-tight text-gray-600">{doc}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h5 className="text-sm font-black uppercase tracking-[0.3em] text-[#282728] opacity-60">Can the sponsor provide these identity documents?</h5>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {sponsorIdDocs.map(doc => (
                                        <label key={doc} className="flex items-center gap-3 p-4 bg-white border border-[#282728] rounded-xl cursor-pointer hover:border-[#436235] transition-colors">
                                            <input type="checkbox" className="w-4 h-4 rounded text-[#436235]" checked={(data.source_of_funds_info.sponsor_identity_docs || []).includes(doc)} onChange={() => toggleArrayItem('sponsor_identity_docs', doc)} />
                                            <span className="text-xs font-bold uppercase tracking-tight text-gray-600">{doc}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StepImmigration({ data, setData, errors }) {
    const update = (key, val) => setData('immigration_info', { ...data.immigration_info, [key]: val });

    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-10">Immigration / Travel History</h2>

            <div className="space-y-8">
                <Field label="Have you previously travelled overseas?">
                    <div className="flex gap-4 mt-2">
                        {['Yes', 'No'].map(o => (
                            <button key={o} type="button" onClick={() => update('has_travelled_overseas', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.immigration_info.has_travelled_overseas === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                        ))}
                    </div>
                </Field>
                {data.immigration_info.has_travelled_overseas === 'Yes' && (
                    <Field label="Please provide details (country, visa type, result, dates) *" error={errors['immigration_info.overseas_travel_details']}>
                        <textarea className="w-full px-5 py-4 bg-white border border-[#282728] rounded-2xl min-h-[100px]" placeholder="e.g. Australia, Tourist Visa, Approved, Jan 2023 - Feb 2023" value={data.immigration_info.overseas_travel_details} onChange={e => update('overseas_travel_details', e.target.value)} />
                    </Field>
                )}

                <div className="border-t border-gray-50 pt-8">
                    <Field label="Have you ever applied for a visa to New Zealand?">
                        <div className="flex gap-4 mt-2">
                            {['Yes', 'No'].map(o => (
                                <button key={o} type="button" onClick={() => update('has_applied_nz_visa', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.immigration_info.has_applied_nz_visa === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                            ))}
                        </div>
                    </Field>
                    {data.immigration_info.has_applied_nz_visa === 'Yes' && (
                        <div className="mt-4">
                            <Field label="Please provide details *" error={errors['immigration_info.nz_visa_details']}>
                                <textarea className="w-full px-5 py-4 bg-white border border-[#282728] rounded-2xl min-h-[100px]" placeholder="Type of visa, date, outcome..." value={data.immigration_info.nz_visa_details} onChange={e => update('nz_visa_details', e.target.value)} />
                            </Field>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-50 pt-8">
                    <Field label="Will your total time in New Zealand equal 24 months or more?">
                        <div className="flex gap-4 mt-2">
                            {['Yes', 'No'].map(o => (
                                <button key={o} type="button" onClick={() => update('total_nz_time_24_months', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.immigration_info.total_nz_time_24_months === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                            ))}
                        </div>
                    </Field>
                </div>

                <div className="border-t border-gray-50 pt-8">
                    <Field label="Have you ever applied for a visa to another country?">
                        <div className="flex gap-4 mt-2">
                            {['Yes', 'No'].map(o => (
                                <button key={o} type="button" onClick={() => update('has_applied_other_visa', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.immigration_info.has_applied_other_visa === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                            ))}
                        </div>
                    </Field>
                    {data.immigration_info.has_applied_other_visa === 'Yes' && (
                        <div className="mt-4">
                            <Field label="Please provide details *" error={errors['immigration_info.other_visa_details']}>
                                <textarea className="w-full px-5 py-4 bg-white border border-[#282728] rounded-2xl min-h-[100px]" placeholder="Country, type, date, outcome..." value={data.immigration_info.other_visa_details} onChange={e => update('other_visa_details', e.target.value)} />
                            </Field>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-50 pt-8">
                    <Field label="Have you ever had a visa refusal?">
                        <div className="flex gap-4 mt-2">
                            {['Yes', 'No'].map(o => (
                                <button key={o} type="button" onClick={() => update('has_visa_refusal', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.immigration_info.has_visa_refusal === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                            ))}
                        </div>
                    </Field>
                    {data.immigration_info.has_visa_refusal === 'Yes' && (
                        <div className="mt-4">
                            <Field label="Please provide details (country, type, reason) *" error={errors['immigration_info.visa_refusal_details']}>
                                <textarea className="w-full px-5 py-4 bg-white border border-[#282728] rounded-2xl min-h-[100px]" placeholder="Country, visa type, reason for refusal..." value={data.immigration_info.visa_refusal_details} onChange={e => update('visa_refusal_details', e.target.value)} />
                            </Field>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-50 pt-8">
                    <Field label="What country will you be in when this application is submitted? *" error={errors['immigration_info.submission_country']}>
                        <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.immigration_info.submission_country} onChange={e => update('submission_country', e.target.value)} />
                    </Field>
                </div>
            </div>
        </div>
    );
}

function StepCharacterHealth({ data, setData, errors }) {
    const updateCharacter = (key, val) => setData('character_info', { ...data.character_info, [key]: val });
    const updateHealth = (key, val) => setData('health_info', { ...data.health_info, [key]: val });

    const characterQuestions = [
        { key: 'has_conviction', label: 'Have you ever been convicted of any offense, including driving offenses?' },
        { key: 'under_investigation', label: 'Are you currently under investigation, wanted, or facing charges for any offense?' },
        { key: 'has_deportation', label: 'Have you ever been expelled, deported, removed, or refused entry to any country?' },
        { key: 'has_visa_refusal_other', label: 'Have you ever been refused a visa by any country (excluding New Zealand)?' },
        { key: 'lived_5_years_since_17', label: 'Have you lived in any country for 5 or more years since the age of 17?' },
    ];

    const healthQuestions = [
        { key: 'has_tuberculosis', label: 'Do you have tuberculosis?' },
        { key: 'has_renal_dialysis', label: 'Do you require renal dialysis?' },
        { key: 'needs_hospital_care', label: 'Do you require hospital care?' },
        { key: 'needs_residential_care', label: 'Do you require residential care?' },
        { key: 'is_pregnant', label: 'Are you pregnant?' },
    ];

    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-10">Character & Health</h2>

            <div className="space-y-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235] mb-6">Character Details</h3>
                {characterQuestions.map(q => (
                    <Field key={q.key} label={q.label}>
                        <div className="flex gap-4 mt-2">
                            {['Yes', 'No'].map(o => (
                                <button key={o} type="button" onClick={() => updateCharacter(q.key, o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.character_info[q.key] === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                            ))}
                        </div>
                    </Field>
                ))}
            </div>

            <div className="space-y-8 border-t border-gray-50 pt-12">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235] mb-6">Health Details</h3>
                {healthQuestions.map(q => (
                    <Field key={q.key} label={q.label}>
                        <div className="flex gap-4 mt-2">
                            {['Yes', 'No'].map(o => (
                                <button key={o} type="button" onClick={() => updateHealth(q.key, o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.health_info[q.key] === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                            ))}
                        </div>
                    </Field>
                ))}
            </div>
        </div>
    );
}

function StepFamily({ data, setData, errors }) {
    const partnershipStatuses = ['Single', 'Married', 'De Facto', 'Separated', 'Divorced', 'Widowed'];

    const updateMember = (index, field, value) => {
        const members = [...data.family_info.members];
        members[index] = { ...members[index], [field]: value };
        setData('family_info', { ...data.family_info, members });
    };

    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-10">Family Information</h2>

            <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 text-sm text-gray-600 leading-relaxed">
                <p className="text-base text-gray-500 font-medium">No need to include deceased family members. Please provide information for living family members only.</p>
            </div>

            <div className="space-y-4">
                {data.family_info.members.map((member, index) => (
                    <FamilyMemberCard
                        key={member.relation}
                        member={member}
                        index={index}
                        updateMember={updateMember}
                        partnershipStatuses={partnershipStatuses}
                    />
                ))}
            </div>
        </div>
    );
}

function FamilyMemberCard({ member, index, updateMember, partnershipStatuses }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <span className="text-sm font-black uppercase tracking-[0.15em] text-[#282728]">{member.relation}</span>
                {expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </div>
            {expanded && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="First Name">
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={member.first_name} onChange={e => updateMember(index, 'first_name', e.target.value)} />
                        </Field>
                        <Field label="Family Name">
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={member.family_name} onChange={e => updateMember(index, 'family_name', e.target.value)} />
                        </Field>
                        <Field label="Date of Birth">
                            <input type="date" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={member.dob} onChange={e => updateMember(index, 'dob', e.target.value)} />
                        </Field>
                        <Field label="Partnership Status">
                            <select className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={member.partnership_status} onChange={e => updateMember(index, 'partnership_status', e.target.value)}>
                                <option value="">Select Status</option>
                                {partnershipStatuses.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </Field>
                        <Field label="Country of Residence">
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={member.country_of_residence} onChange={e => updateMember(index, 'country_of_residence', e.target.value)} />
                        </Field>
                        <Field label="Country of Birth">
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={member.country_of_birth} onChange={e => updateMember(index, 'country_of_birth', e.target.value)} />
                        </Field>
                        <Field label="Occupation">
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={member.occupation} onChange={e => updateMember(index, 'occupation', e.target.value)} />
                        </Field>
                    </div>
                </div>
            )}
        </div>
    );
}

function StepAdditional({ data, setData, errors }) {
    const updateNzContacts = (key, val) => setData('nz_contacts_info', { ...data.nz_contacts_info, [key]: val });
    const updateMilitary = (key, val) => setData('military_info', { ...data.military_info, [key]: val });
    const updateHomeTies = (key, val) => setData('home_ties_info', { ...data.home_ties_info, [key]: val });

    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-10">Additional Information</h2>

            {/* NZ Contacts */}
            <div className="space-y-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235] mb-6">NZ Contacts</h3>
                <Field label="Do you have any contacts in New Zealand?">
                    <div className="flex gap-4 mt-2">
                        {['Yes', 'No'].map(o => (
                            <button key={o} type="button" onClick={() => updateNzContacts('has_nz_contacts', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.nz_contacts_info.has_nz_contacts === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                        ))}
                    </div>
                </Field>
                {data.nz_contacts_info.has_nz_contacts === 'Yes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
                        <Field label="First Name *" error={errors['nz_contacts_info.contact_first_name']}>
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.nz_contacts_info.contact_first_name} onChange={e => updateNzContacts('contact_first_name', e.target.value)} />
                        </Field>
                        <Field label="Family Name *" error={errors['nz_contacts_info.contact_family_name']}>
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.nz_contacts_info.contact_family_name} onChange={e => updateNzContacts('contact_family_name', e.target.value)} />
                        </Field>
                        <Field label="Relationship">
                            <select className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.nz_contacts_info.contact_relationship} onChange={e => updateNzContacts('contact_relationship', e.target.value)}>
                                <option value="">Select Relationship</option>
                                <option>Family</option>
                                <option>Friend</option>
                                <option>Other</option>
                            </select>
                        </Field>
                        <Field label="Contact Number">
                            <input type="tel" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.nz_contacts_info.contact_number} onChange={e => updateNzContacts('contact_number', e.target.value)} />
                        </Field>
                        <div className="col-span-full">
                            <Field label="Address in New Zealand">
                                <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.nz_contacts_info.contact_address} onChange={e => updateNzContacts('contact_address', e.target.value)} />
                            </Field>
                        </div>
                    </div>
                )}
            </div>

            {/* Military Service */}
            <div className="space-y-8 border-t border-gray-50 pt-12">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235] mb-6">Military Service</h3>
                <Field label="Has military service been compulsory in your home country?">
                    <div className="flex gap-4 mt-2">
                        {['Yes', 'No'].map(o => (
                            <button key={o} type="button" onClick={() => updateMilitary('military_compulsory', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.military_info.military_compulsory === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                        ))}
                    </div>
                </Field>
                <Field label="Have you ever undertaken military service?">
                    <div className="flex gap-4 mt-2">
                        {['Yes', 'No'].map(o => (
                            <button key={o} type="button" onClick={() => updateMilitary('has_military_service', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.military_info.has_military_service === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                        ))}
                    </div>
                </Field>
            </div>

            {/* Home Ties */}
            <div className="space-y-8 border-t border-gray-50 pt-12">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235] mb-6">Home Ties</h3>
                <Field label="Does your family own property?">
                    <div className="flex gap-4 mt-2">
                        {['Yes', 'No'].map(o => (
                            <button key={o} type="button" onClick={() => updateHomeTies('family_owns_property', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.home_ties_info.family_owns_property === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                        ))}
                    </div>
                </Field>
                {data.home_ties_info.family_owns_property === 'Yes' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
                        <Field label="Property Type">
                            <select className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.home_ties_info.property_type} onChange={e => updateHomeTies('property_type', e.target.value)}>
                                <option value="">Select Type</option>
                                <option>House</option>
                                <option>Apartment</option>
                                <option>Land</option>
                                <option>Farm</option>
                            </select>
                        </Field>
                        <Field label="Location">
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.home_ties_info.property_location} onChange={e => updateHomeTies('property_location', e.target.value)} />
                        </Field>
                        <Field label="Owner">
                            <select className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.home_ties_info.property_owner} onChange={e => updateHomeTies('property_owner', e.target.value)}>
                                <option value="">Select Owner</option>
                                <option>Self</option>
                                <option>Parents</option>
                                <option>Family</option>
                                <option>Spouse</option>
                                <option>In-Laws</option>
                            </select>
                        </Field>
                    </div>
                )}

                <Field label="Does your family own a business?">
                    <div className="flex gap-4 mt-2">
                        {['Yes', 'No'].map(o => (
                            <button key={o} type="button" onClick={() => updateHomeTies('family_owns_business', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.home_ties_info.family_owns_business === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-500'}`}>{o}</button>
                        ))}
                    </div>
                </Field>
                {data.home_ties_info.family_owns_business === 'Yes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
                        <Field label="Type of Business">
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.home_ties_info.business_type} onChange={e => updateHomeTies('business_type', e.target.value)} />
                        </Field>
                        <Field label="Your Involvement">
                            <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" placeholder="e.g. Manager, Employee, None" value={data.home_ties_info.business_involvement} onChange={e => updateHomeTies('business_involvement', e.target.value)} />
                        </Field>
                    </div>
                )}
            </div>
        </div>
    );
}

function StepDeclaration({ data, setData, errors }) {
    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-8 leading-tight">Declaration</h2>
            <div className="bg-gray-50/50 rounded-3xl p-10 text-base text-gray-500 leading-[2] font-medium h-96 overflow-y-auto border border-gray-100/50">
                <p className="mb-4">I declare that the above information I provide is true, correct and complete. I understand that I must inform Immigration New Zealand (INZ) of any relevant fact or change of circumstances that may affect this application, including changes that occur after this form is submitted and before the application is decided.</p>
                <p className="mb-4">I understand that INZ may verify the information I have provided and may request further documentation to support my application.</p>
                <p className="mb-4"><strong className="text-[#282728]">Examples of relevant facts include but are not limited to:</strong></p>
                <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Changes to your relationship status</li>
                    <li>Changes to your employment or financial situation</li>
                    <li>Changes to your health condition</li>
                    <li>Any criminal charges or convictions</li>
                    <li>Changes to your travel or immigration status in any country</li>
                    <li>Changes to your study plans or institution</li>
                </ul>
                <p className="mb-4"><strong className="text-[#282728]">Warning:</strong> It is an offense to provide false or misleading information to INZ. Providing false or misleading information may result in the decline of your application, the revocation of any visa granted, deportation from New Zealand, and/or criminal prosecution.</p>
                <p>I acknowledge that ePathways acts as a facilitator and that the final decision on any visa application rests with Immigration New Zealand or the relevant immigration authority.</p>
            </div>
            <div>
                <label className={`flex items-center gap-5 p-4 cursor-pointer group rounded-2xl transition-all ${errors.declaration_accepted ? 'bg-red-50 ring-2 ring-red-500/20' : ''}`}>
                    <input
                        type="checkbox"
                        className={`w-6 h-6 rounded ${errors.declaration_accepted ? 'border-red-500' : 'border-gray-300'} text-[#436235] focus:ring-[#436235] cursor-pointer transition-colors`}
                        checked={data.declaration_accepted}
                        onChange={e => setData('declaration_accepted', e.target.checked)}
                    />
                    <span className={`text-sm font-black uppercase tracking-[0.15em] transition-colors ${errors.declaration_accepted ? 'text-red-500' : 'text-[#282728]'}`}>
                        I have read, understood and agree to the declaration above *
                    </span>
                </label>
                {errors.declaration_accepted && <p className="text-sm font-black text-red-500 uppercase tracking-widest mt-2 pl-4">{errors.declaration_accepted}</p>}
            </div>
        </div>
    );
}

function Field({ label, error, children }) {
    const hasError = !!error;
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end px-1">
                <label className={`text-xs font-bold uppercase tracking-[0.2em] transition-colors ${hasError ? 'text-red-500' : 'text-gray-500'}`}>
                    {label}
                </label>
            </div>
            {children}
            {hasError && (
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1.5 pl-1">
                    {error}
                </p>
            )}
        </div>
    );
}

function SuccessMessage({ leadId }) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 font-urbanist">
            <div className="max-w-[480px] w-full bg-white rounded-[3rem] shadow-[0_64px_128px_-24px_rgba(40,39,40,0.08)] p-16 text-center border border-[#282728]/5">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-[#282728] rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-[#282728]/20"
                >
                    <CheckCircle size={48} />
                </motion.div>
                <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-6">Success</h2>
                <p className="text-gray-500 text-sm leading-[2] mb-12 font-medium px-4">
                    Your profile has been securely received. Our AI is now analyzing your eligibility. View your results using the link below.
                </p>
                <div className="bg-gray-50/50 rounded-2xl p-8 mb-8 border border-gray-100/50">
                    <p className="text-sm font-black text-gray-300 uppercase tracking-[0.4em] mb-3 text-center">Protocol ID</p>
                    <p className="text-lg font-mono font-black text-[#282728]">{leadId || '---'}</p>
                </div>
                {leadId && (
                    <a
                        href={`/assessment-result/${leadId}`}
                        className="inline-block w-full bg-[#436235] text-white py-6 rounded-2xl text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-[#436235]/10 hover:bg-[#354d2a] transition-all active:scale-95 mb-4"
                    >
                        View Assessment Result
                    </a>
                )}
                <a href="/" className="inline-block w-full bg-[#282728] text-white py-6 rounded-2xl text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-[#282728]/10 hover:bg-black transition-all active:scale-95">
                    Return to Portal
                </a>
            </div>
        </div>
    );
}
