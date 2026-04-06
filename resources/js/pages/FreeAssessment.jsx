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
    Upload
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
    const [modal, setModal] = useState({ show: false, message: '' });
    const [localErrors, setLocalErrors] = useState({});

    useEffect(() => {
        if (flash?.success) {
            setIsSuccess(true);
        }
    }, [flash]);

    const { data, setData, post, processing, errors } = useForm({
        terms_accepted: false,
        first_name: '',
        last_name: '',
        has_other_names: 'No',
        other_names: '',
        gender: '',
        marital_status: '',
        phone: '',
        email: '',
        dob: '',
        country_of_birth: '',
        residence_city: '',
        residence_state: '',
        residence_country: '',
        has_passport: 'No',
        passport_number: '',
        passport_expiry: '',
        passport_pdf: null,
        study_plans: {
            preferred_course: '',
            qualification_level: '',
            preferred_city: '',
            preferred_intake: '',
            has_english_test: 'No',
            english_test_type: '',
            test_score_overall: '',
            test_score_reading: '',
            test_score_writing: '',
            test_score_listening: '',
            test_score_speaking: '',
            test_date: ''
        },
        financial_info: {
            funding_source: [],
            estimated_budget: '',
            has_sponsors: 'No',
            sponsor_relation: ''
        },
        has_gap: 'No',
        gap_explanation: '',
        education_background: [
            {
                highest_qualification: '',
                institution: '',
                start_date: '',
                passing_year: '',
                marks_percentage: '',
                docs: []
            }
        ],
        work_experience: [
            {
                company_name: '',
                job_title: '',
                start_date: '',
                is_current: 'Yes',
                duties: ''
            }
        ]
    });

    const steps = [
        { id: 1, title: 'Terms', icon: ShieldCheck },
        { id: 2, title: 'Personal', icon: User },
        { id: 3, title: 'Study Plans', icon: MapPin },
        { id: 4, title: 'Financial', icon: Wallet },
        { id: 5, title: 'Education', icon: GraduationCap },
        { id: 6, title: 'Work', icon: Briefcase },
    ];

    const formRef = useRef(null);

    const nextStep = () => {
        if (formRef.current && !formRef.current.reportValidity()) {
            return;
        }
        setStep(s => Math.min(s + 1, 6));
    };
    
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (formRef.current && !formRef.current.reportValidity()) {
            return;
        }

        // If the user triggers form submission (e.g., pressing Enter) before the last step
        if (step !== 6) {
            setStep(s => Math.min(s + 1, 6));
            return;
        }

        post('/free-assessment', {
            onSuccess: () => setIsSuccess(true),
            onError: (errs) => {
                let targetStep = 6;
                const keys = Object.keys(errs);
                const step2Keys = ['first_name', 'last_name', 'email', 'phone', 'gender', 'marital_status', 'dob', 'country_of_birth', 'residence_city', 'residence_state', 'residence_country', 'has_passport', 'passport_number', 'passport_expiry', 'passport_pdf', 'has_other_names', 'other_names'];
                
                if (keys.includes('terms_accepted')) targetStep = 1;
                else if (keys.some(k => step2Keys.includes(k))) targetStep = 2;
                else if (keys.some(k => k.startsWith('study_plans'))) targetStep = 3;
                else if (keys.some(k => k.startsWith('financial_info'))) targetStep = 4;
                else if (keys.some(k => k.startsWith('education_background') || k === 'has_gap' || k === 'gap_explanation')) targetStep = 5;

                setModal({ 
                    show: true, 
                    message: "There is some missing or invalid information. Let's head over to that section to complete it.",
                    action: () => {
                        setStep(targetStep);
                        setModal({ show: false, message: '' });
                    }
                });
            }
        });
    };

    if (isSuccess) return <SuccessMessage />;

    return (
        <div className="min-h-screen bg-white font-urbanist text-[#212121] overflow-x-hidden">
            <Head title="Free Assessment Eligibility" />
            
            <Navbar />

            {/* Header/Title - Minimal Gallery Style */}
            <div className="bg-white py-32 border-b border-gray-100">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
                        <h1 className="text-4xl lg:text-5xl font-black text-[#282728] uppercase tracking-tighter mb-6 leading-[1.1]">
                            Enrolment Eligibility<br className="hidden lg:block"/> Assessment Form
                        </h1>
                        <h2 className="text-[11px] font-black text-[#436235] uppercase tracking-[0.6em] mb-12 opacity-80">
                            Pre-Screening & Study Planning
                        </h2>
                        
                        <div className="w-8 h-[2px] bg-[#282728]/20 mb-12" />
                        
                        <p className="text-gray-400 text-sm leading-[2.2] font-medium max-w-[440px] px-4 uppercase tracking-widest">
                            Assess your eligibility for studying in New Zealand and prepare your pathway.
                        </p>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-6 py-24 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-20 items-start">
                    
                    {/* Sidebar Navigation - Zen Minimalist */}
                    <div className="lg:w-[240px] sticky top-32 flex-shrink-0">
                        <div className="space-y-4">
                            {steps.map((s) => {
                                const isActive = step === s.id;
                                const isCompleted = step > s.id;
                                return (
                                    <div 
                                        key={s.id}
                                        onClick={() => setStep(s.id)}
                                        className="group cursor-pointer py-2 pl-4 relative"
                                    >
                                        <div className="flex items-center gap-6">
                                            {/* Dot Indicator */}
                                            <div className="relative">
                                                <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isActive ? 'bg-[#282728] scale-150' : (isCompleted ? 'bg-[#436235]' : 'bg-gray-200')}`} />
                                                {isActive && (
                                                    <motion.div 
                                                        layoutId="active-dot"
                                                        className="absolute -inset-1.5 border border-[#282728]/20 rounded-full"
                                                    />
                                                )}
                                            </div>
                                            
                                            <div className="flex flex-col">
                                                <span className={`text-[8px] font-black uppercase tracking-[0.3em] leading-none mb-2 transition-colors ${isActive ? 'text-[#282728]' : 'text-gray-300'}`}>Step 0{s.id}</span>
                                                <span className={`text-[10px] font-black leading-none uppercase tracking-[0.2em] transition-all ${isActive ? 'text-[#282728] translate-x-1' : 'text-gray-400 group-hover:text-[#282728]'}`}>{s.title}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Form Content Area - Pure Whitespace */}
                    <div className="flex-1 max-w-3xl bg-white">
                        {/* Elegant Progress Line */}
                        <div className="mb-20">
                            <div className="h-[2px] w-full bg-gray-50 rounded-full mb-6 overflow-hidden">
                                <motion.div 
                                    className="h-full bg-[#282728]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(step / 6) * 100}%` }}
                                    transition={{ duration: 0.8, ease: "circOut" }}
                                />
                            </div>
                            <div className="flex justify-between items-center pr-1">
                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#282728]">Questionnaire Stage</span>
                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">Section 0{step} / 06</span>
                            </div>
                        </div>

                        {/* Step Components */}
                        <div className="flex-1">
                            <form ref={formRef} onSubmit={handleSubmit} className="h-full flex flex-col">
                                <div className="flex-1">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={step}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {step === 1 && <StepTerms data={data} setData={setData} />}
                                            {step === 2 && <StepPersonal data={data} setData={setData} errors={errors} />}
                                            {step === 3 && <StepStudyPlans data={data} setData={setData} errors={errors} />}
                                            {step === 4 && <StepFinancial data={data} setData={setData} errors={errors} />}
                                            {step === 5 && <StepEducation data={data} setData={setData} errors={errors} />}
                                            {step === 6 && <StepWork data={data} setData={setData} errors={errors} />}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                 {/* Form Footer Control - Discreet */}
                                <div className="mt-24 flex items-center justify-between pt-12 border-t border-gray-50">
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        disabled={step === 1}
                                        className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all border border-transparent rounded-xl ${step === 1 ? 'opacity-0 cursor-default' : 'text-gray-300 hover:text-[#282728]'}`}
                                    >
                                        &larr; Back
                                    </button>

                                    {step < 6 ? (
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="group relative px-12 py-5 bg-[#282728] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl shadow-[#282728]/10 active:scale-95 overflow-hidden"
                                        >
                                            <span className="relative z-10">Next Sequence</span>
                                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-12 py-5 bg-[#436235] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#354d2a] transition-all shadow-2xl shadow-[#436235]/10 active:scale-95"
                                        >
                                            {processing ? 'Finalizing...' : 'Submit Profile'}
                                        </button>
                                    )}
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
                            <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium px-4 whitespace-pre-wrap">{modal.message}</p>
                            <button 
                                type="button"
                                onClick={() => {
                                    if (modal.action) modal.action();
                                    else setModal({ show: false, message: '' });
                                }}
                                className="w-full bg-[#282728] text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-black transition-all active:scale-95"
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

function StepTerms({ data, setData }) {
    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-8 leading-tight">Privacy & Terms</h2>
            <div className="bg-gray-50/50 rounded-3xl p-10 text-[13px] text-gray-400 leading-[2] font-medium h-96 overflow-y-auto border border-gray-100/50">
                <p>Welcome to Pathway's free assessment. By proceeding, you agree to the following terms. This assessment is designed to help us understand your immigration pathway to New Zealand, Australia, Canada, Singapore, and the United Kingdom.</p>
                <p>The information you provide will be used solely for the purpose of this assessment. Eligibility criteria and pathways are subject to change in accordance with government regulations.</p>
                <p>We are committed to protecting your privacy. All data submitted is encrypted and handled with the highest level of security. Please ensure that all information provided is accurate and complete to receive the most reliable evaluation.</p>
                <p>ePathways facilitates the connection between potential students and educational institutions. We do not guarantee visa approval, as final decisions rest with the respective immigration authorities.</p>
            </div>
            <label className="flex items-center gap-5 p-2 cursor-pointer group rounded-2xl transition-all">
                <input 
                    type="checkbox" 
                    required
                    className="w-6 h-6 rounded border-gray-300 text-[#436235] focus:ring-[#436235] cursor-pointer transition-colors"
                    checked={data.terms_accepted}
                    onChange={e => setData('terms_accepted', e.target.checked)}
                />
                <span className="text-[11px] font-black uppercase tracking-[0.15em] transition-colors text-[#282728]">
                    I have read and agree to the terms and conditions *
                </span>
            </label>
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
                        required
                        className="w-full px-5 py-3.5 bg-white border border-[#282728] rounded-xl focus:ring-2 focus:ring-[#436235]/20 focus:border-[#436235] transition-all outline-none"
                        value={data.first_name}
                        onChange={e => setData('first_name', e.target.value)}
                    />
                </Field>
                <Field label="Surname *" error={errors.last_name}>
                    <input 
                        type="text" 
                        required
                        className="w-full px-5 py-3.5 bg-white border border-[#282728] rounded-xl focus:ring-2 focus:ring-[#436235]/20 focus:border-[#436235] transition-all outline-none"
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
                                    className={`px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${data.has_other_names === opt ? 'bg-[#282728] text-white border-[#282728]' : 'bg-white text-gray-400 border-gray-200'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </Field>
                    {data.has_other_names === 'Yes' && (
                        <div className="mt-4">
                            <Field label="Full Other Name">
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

                <Field label="Gender">
                    <select 
                        className="w-full px-5 py-3.5 bg-white border border-[#282728] rounded-xl outline-none"
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
                        className="w-full px-5 py-3.5 bg-white border border-[#282728] rounded-xl outline-none"
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
                        required
                        className="w-full px-5 py-3.5 bg-white border border-[#282728] rounded-xl outline-none"
                        value={data.phone}
                        onChange={e => setData('phone', e.target.value)}
                    />
                </Field>

                <Field label="Email Address *" error={errors.email}>
                    <input 
                        type="email" 
                        required
                        className="w-full px-5 py-3.5 bg-white border border-[#282728] rounded-xl outline-none"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                    />
                </Field>

                <Field label="Date of Birth">
                    <input 
                        type="date" 
                        className="w-full px-5 py-3.5 bg-white border border-[#282728] rounded-xl outline-none"
                        value={data.dob}
                        onChange={e => setData('dob', e.target.value)}
                    />
                </Field>

                <Field label="Country of Birth">
                    <input 
                        type="text" 
                        className="w-full px-5 py-3.5 bg-white border border-[#282728] rounded-xl outline-none"
                        value={data.country_of_birth}
                        onChange={e => setData('country_of_birth', e.target.value)}
                    />
                </Field>

                <div className="col-span-full border-t border-gray-50 pt-8 mt-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235] mb-6">Current Residence</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Field label="City">
                            <input type="text" className="w-full px-5 py-3 bg-white border border-[#282728] rounded-xl" value={data.residence_city} onChange={e => setData('residence_city', e.target.value)} />
                        </Field>
                        <Field label="State/Province">
                            <input type="text" className="w-full px-5 py-3 bg-white border border-[#282728] rounded-xl" value={data.residence_state} onChange={e => setData('residence_state', e.target.value)} />
                        </Field>
                        <Field label="Country">
                            <input type="text" className="w-full px-5 py-3 bg-white border border-[#282728] rounded-xl" value={data.residence_country} onChange={e => setData('residence_country', e.target.value)} />
                        </Field>
                    </div>
                </div>

                <div className="col-span-full border-t border-gray-50 pt-8 mt-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235] mb-6">Passport Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Do you have a valid passport?">
                           <div className="flex gap-4 mt-2">
                               {['Yes', 'No'].map(o => (
                                   <button key={o} type="button" onClick={() => setData('has_passport', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.has_passport === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-400'}`}>{o}</button>
                               ))}
                           </div>
                        </Field>
                        {data.has_passport === 'Yes' && (
                            <>
                                <Field label="Passport Number">
                                    <input type="text" className="w-full px-5 py-3 bg-white border border-[#282728] rounded-xl" value={data.passport_number} onChange={e => setData('passport_number', e.target.value)} />
                                </Field>
                                <Field label="Expiry Date">
                                    <input type="date" className="w-full px-5 py-3 bg-white border border-[#282728] rounded-xl" value={data.passport_expiry} onChange={e => setData('passport_expiry', e.target.value)} />
                                </Field>
                                <div className="col-span-full">
                                    <Field label="Upload Passport Copy (PDF)">
                                        <div className="mt-2 flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">{data.passport_pdf ? data.passport_pdf.name : 'Select or drop PDF'}</p>
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
                <Field label="Preferred Course/Program">
                    <input type="text" className="w-full px-5 py-3 bg-white border border-[#282728] rounded-xl" value={data.study_plans.preferred_course} onChange={e => updateNested('preferred_course', e.target.value)} />
                </Field>
                <Field label="Qualification Level">
                    <select className="w-full px-5 py-3 bg-white border border-[#282728] rounded-xl" value={data.study_plans.qualification_level} onChange={e => updateNested('qualification_level', e.target.value)}>
                        <option value="">Select Level</option>
                        {levels.map(l => <option key={l}>{l}</option>)}
                    </select>
                </Field>
                <Field label="Preferred City (if any)">
                    <input type="text" className="w-full px-5 py-3 bg-white border border-[#282728] rounded-xl" value={data.study_plans.preferred_city} onChange={e => updateNested('preferred_city', e.target.value)} />
                </Field>
                <Field label="Preferred Intake">
                    <input type="text" placeholder="e.g. Feb 2025" className="w-full px-5 py-3 bg-white border border-[#282728] rounded-xl" value={data.study_plans.preferred_intake} onChange={e => updateNested('preferred_intake', e.target.value)} />
                </Field>

                <div className="col-span-full border-t border-gray-50 pt-8 mt-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235] mb-6">English Proficiency</h3>
                    <Field label="Have you taken an English test?">
                        <div className="flex gap-4 mt-2">
                             {['Yes', 'No'].map(o => (
                                 <button key={o} type="button" onClick={() => updateNested('has_english_test', o)} className={`px-6 py-2 rounded-lg text-xs font-bold border ${data.study_plans.has_english_test === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-400'}`}>{o}</button>
                             ))}
                        </div>
                    </Field>
                    
                    {data.study_plans.has_english_test === 'Yes' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                            <div className="md:col-span-3 lg:col-span-2">
                                <Field label="Test Type">
                                    <select className="w-full px-4 py-2 bg-white border border-[#282728] rounded-lg" value={data.study_plans.english_test_type} onChange={e => updateNested('english_test_type', e.target.value)}>
                                        <option value="">Select Test</option>
                                        <option>IELTS Academic</option>
                                        <option>PTE Academic</option>
                                        <option>TOEFL iBT</option>
                                        <option>Other</option>
                                    </select>
                                </Field>
                            </div>
                            <Field label="Overall">
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
                <Field label="How will you fund your studies and living costs?">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {sources.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => toggleSource(s)}
                                className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all text-center ${data.financial_info.funding_source.includes(s) ? 'bg-[#436235] text-white border-[#436235]' : 'bg-white text-gray-400 border-gray-100 hover:border-[#436235]'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </Field>

                <Field label="Estimated Available Funds (in PHP or NZD)">
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
                                 <button key={o} type="button" onClick={() => updateFinancial('has_sponsors', o)} className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${data.financial_info.has_sponsors === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-400'}`}>{o}</button>
                             ))}
                         </div>
                    </Field>
                    {data.financial_info.has_sponsors === 'Yes' && (
                        <Field label="Relation to Sponsor(s)">
                            <input type="text" placeholder="e.g. Parents" className="w-full px-5 py-3.5 bg-white border border-[#282728] rounded-xl" value={data.financial_info.sponsor_relation} onChange={e => updateFinancial('sponsor_relation', e.target.value)} />
                        </Field>
                    )}
                </div>
            </div>
        </div>
    );
}

function StepEducation({ data, setData, errors }) {
    const docs = ['10th Certificate', '12th Certificate', 'Diploma Certificate', 'Bachelor\'s Degree', 'Master\'s Degree', 'Academic Transcripts'];
    
    const updateEdu = (field, value) => {
        const edu = [...data.education_background];
        edu[0] = { ...edu[0], [field]: value };
        setData('education_background', edu);
    };

    const toggleDoc = (doc) => {
        const edu = [...data.education_background];
        let currentDocs = edu[0].docs || [];
        if (currentDocs.includes(doc)) {
            currentDocs = currentDocs.filter(d => d !== doc);
        } else {
            currentDocs = [...currentDocs, doc];
        }
        edu[0] = { ...edu[0], docs: currentDocs };
        setData('education_background', edu);
    };
    
    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-10">Academic Background</h2>

            {/* In a real app, you'd map through a list. For now, following the simple grid from the image */}
            <div className="space-y-12">
                <div className="bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235] mb-6">Tertiary Education (Highest)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Degree/Qualification *">
                            <input type="text" required className="w-full px-5 py-3 bg-white border border-[#282728] rounded-xl" placeholder="e.g. BS Nursing" value={data.education_background[0].highest_qualification} onChange={e => updateEdu('highest_qualification', e.target.value)} />
                        </Field>
                        <Field label="Name of Institution *">
                            <input type="text" required className="w-full px-5 py-3 bg-white border border-[#282728] rounded-xl" value={data.education_background[0].institution} onChange={e => updateEdu('institution', e.target.value)} />
                        </Field>
                        <Field label="Start Date">
                            <input type="date" className="w-full px-5 py-3 bg-white border border-[#282728] rounded-xl" value={data.education_background[0].start_date} onChange={e => updateEdu('start_date', e.target.value)} />
                        </Field>
                        <Field label="Completion Date">
                            <input type="date" className="w-full px-5 py-3 bg-white border border-[#282728] rounded-xl" value={data.education_background[0].passing_year} onChange={e => updateEdu('passing_year', e.target.value)} />
                        </Field>
                        <Field label="Average Marks / Percentage">
                            <input type="text" className="w-full px-5 py-3 bg-white border border-[#282728] rounded-xl" value={data.education_background[0].marks_percentage} onChange={e => updateEdu('marks_percentage', e.target.value)} />
                        </Field>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#436235]">Available Documents</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {docs.map(doc => (
                            <label key={doc} className="flex items-center gap-3 p-4 bg-white border border-[#282728] rounded-xl cursor-pointer hover:border-[#436235] transition-colors">
                                <input type="checkbox" className="w-4 h-4 rounded text-[#436235]" checked={(data.education_background[0].docs || []).includes(doc)} onChange={() => toggleDoc(doc)} />
                                <span className="text-[10px] font-bold uppercase tracking-tight text-gray-500">{doc}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100">
                    <Field label="Has there been a gap in your study?">
                        <div className="flex gap-4 mt-2">
                             {['Yes', 'No'].map(o => (
                                 <button key={o} type="button" onClick={() => setData('has_gap', o)} className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${data.has_gap === o ? 'bg-[#282728] text-white' : 'bg-white text-gray-400'}`}>{o}</button>
                             ))}
                        </div>
                    </Field>
                    {data.has_gap === 'Yes' && (
                        <div className="mt-6">
                            <Field label="What have you been doing during this time?">
                                <textarea className="w-full px-5 py-4 bg-white border border-[#282728] rounded-2xl min-h-[100px]" placeholder="Explain your activities during the gap..." value={data.gap_explanation} onChange={e => setData('gap_explanation', e.target.value)} />
                            </Field>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StepWork({ data, setData, errors }) {
    const updateWork = (field, value) => {
        const copy = [...data.work_experience];
        copy[0] = { ...copy[0], [field]: value };
        setData('work_experience', copy);
    };

    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-10">Professional History</h2>

            <div className="space-y-8">
                <div className="p-8 rounded-[2rem] border-2 border-dashed border-gray-100 bg-gray-50/20 text-center">
                    <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-sm font-bold text-[#282728] uppercase tracking-widest mb-2">Detailed Work History</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mx-auto max-w-[240px]">This section will be used to assess your job relevance to your chosen study pathway.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Current Company / Organization *">
                        <input type="text" required className="w-full px-5 py-3.5 bg-white border border-[#282728] rounded-xl outline-none" value={data.work_experience[0].company_name} onChange={e => updateWork('company_name', e.target.value)} />
                    </Field>
                    <Field label="Job Title / Role *">
                        <input type="text" required className="w-full px-5 py-3.5 bg-white border border-[#282728] rounded-xl outline-none" value={data.work_experience[0].job_title} onChange={e => updateWork('job_title', e.target.value)} />
                    </Field>
                    <Field label="Start Date">
                        <input type="date" className="w-full px-5 py-3.5 bg-white border border-[#282728] rounded-xl outline-none" value={data.work_experience[0].start_date} onChange={e => updateWork('start_date', e.target.value)} />
                    </Field>
                    <Field label="Still working here?">
                        <div className="flex gap-4 mt-2">
                             <button type="button" onClick={() => updateWork('is_current', 'Yes')} className={`px-6 py-2 rounded-lg text-xs font-bold ${data.work_experience[0].is_current === 'Yes' ? 'bg-[#282728] text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>Yes</button>
                             <button type="button" onClick={() => updateWork('is_current', 'No')} className={`px-6 py-2 rounded-lg text-xs font-bold ${data.work_experience[0].is_current === 'No' ? 'bg-[#282728] text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>No</button>
                        </div>
                    </Field>
                    <div className="col-span-full">
                        <Field label="Key Responsibilities & Duties">
                            <textarea className="w-full px-5 py-4 bg-white border border-[#282728] rounded-2xl min-h-[120px]" placeholder="Briefly describe your main tasks..." value={data.work_experience[0].duties} onChange={e => updateWork('duties', e.target.value)} />
                        </Field>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, error, children }) {
    const hasError = !!error;
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
                <label className={`text-[9px] font-black uppercase tracking-[0.3em] transition-colors ${hasError ? 'text-red-500' : 'text-[#282728] opacity-60'}`}>{label}</label>
                {hasError && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest leading-none">Field Required</span>}
            </div>
            <div className={`transition-all duration-300 ${hasError ? 'scale-[1.01]' : ''}`}>
                <div className={hasError ? 'p-[1px] bg-red-500 rounded-xl overflow-hidden ring-4 ring-red-500/10' : ''}>
                    {children}
                </div>
            </div>
        </div>
    );
}

function SuccessMessage() {
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
                <p className="text-gray-400 text-sm leading-[2] mb-12 font-medium px-4">
                    Your profile has been securely received. Our specialists will evaluate your pathway and reach out shortly.
                </p>
                <div className="bg-gray-50/50 rounded-2xl p-8 mb-12 border border-gray-100/50">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] mb-3 text-center">Protocol ID</p>
                    <p className="text-lg font-mono font-black text-[#282728]">NZ-{Math.floor(Math.random() * 90000) + 10000}</p>
                </div>
                <a href="/" className="inline-block w-full bg-[#282728] text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-[#282728]/10 hover:bg-black transition-all active:scale-95">
                    Return to Portal
                </a>
            </div>
        </div>
    );
}
