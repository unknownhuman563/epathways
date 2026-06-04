import React, { useState } from 'react';
import {
    Upload, CheckCircle, AlertCircle, Briefcase, ChevronDown, ChevronUp, Home,
} from 'lucide-react';
import { motion } from 'framer-motion';

// Step components extracted from FreeAssessmentPage.jsx so the
// /education-enrolment page can reuse the same field UI inside the
// IntakeFormShell wrapper. Field markup unchanged — only the export
// modifier was added.

{/* --- STEP COMPONENTS --- */}

export function StepTerms({ data, setData, errors }) {
    return (
        <div className="space-y-12">
            <h2 className="text-2xl font-black text-[#282728] tracking-tight mb-8 leading-tight">Privacy & Terms</h2>
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
                    <span className={`text-sm font-semibold transition-colors ${errors.terms_accepted ? 'text-red-500' : 'text-[#282728]'}`}>
                        I have read and agree to the terms and conditions *
                    </span>
                </label>
                {errors.terms_accepted && <p className="text-sm font-black text-red-500 uppercase tracking-widest mt-2 pl-4">{errors.terms_accepted}</p>}
            </div>
        </div>
    );
}

export function StepPersonal({ data, setData, errors }) {
    return (
        <div className="space-y-12">
            <h2 className="text-2xl font-black text-[#282728] tracking-tight mb-10">Personal Profile</h2>

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
                    <h3 className="text-sm font-bold text-[#436235] mb-6">Current Residence</h3>
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
                    <h3 className="text-sm font-bold text-[#436235] mb-6">Passport Details</h3>
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

export function StepStudyPlans({ data, setData, errors, programs = [] }) {
    const levels = ['Diploma (Level 5-6)', 'Bachelor Degree (Level 7)', 'Postgraduate Diploma (Level 8)', 'Master\'s Degree (Level 9)', 'Doctorate (Level 10)'];
    const updateNested = (key, val) => setData('study_plans', { ...data.study_plans, [key]: val });

    return (
        <div className="space-y-12">
            <h2 className="text-2xl font-black text-[#282728] tracking-tight mb-10">Study Aspirations</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Preferred Course/Program *" error={errors['study_plans.preferred_course']}>
                    {programs.length > 0 ? (
                        // Pages that pass the programs catalogue get a real
                        // dropdown bound to the DB; everyone else (e.g. the
                        // legacy /free-assessment route) falls back to a free
                        // text input so the form keeps working with no data.
                        <select
                            className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors"
                            value={data.study_plans.preferred_course}
                            onChange={e => updateNested('preferred_course', e.target.value)}
                        >
                            <option value="">Select a programme</option>
                            {programs.map(p => (
                                <option key={p.id} value={p.title}>
                                    {p.title}{p.level ? ` — ${p.level}` : ''}{p.institution ? ` (${p.institution})` : ''}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#436235] transition-colors" value={data.study_plans.preferred_course} onChange={e => updateNested('preferred_course', e.target.value)} />
                    )}
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
                    <h3 className="text-sm font-bold text-[#436235] mb-6">English Proficiency</h3>
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

export function StepEducation({ data, setData, errors }) {
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
            <h2 className="text-2xl font-black text-[#282728] tracking-tight mb-10">Academic Background</h2>

            {/* High School Section */}
            <div className="bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
                <h3 className="text-sm font-bold text-[#436235] mb-6">High School Education</h3>
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
                <h3 className="text-sm font-bold text-[#436235] mb-6">Tertiary Education</h3>
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
                <h3 className="text-sm font-bold text-[#436235]">Available Documents</h3>
                
                <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-3">Certificates</h4>
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
                    <h4 className="text-xs font-bold text-gray-700 mb-3">Transcripts</h4>
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
                    <span className="text-sm font-semibold text-[#282728]">{edu.level}</span>
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

export function StepWork({ data, setData, errors }) {
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
            <h2 className="text-2xl font-black text-[#282728] tracking-tight mb-10">Professional History</h2>

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

export function StepFinancial({ data, setData, errors }) {
    const sources = ['Personal Savings', 'Family Support', 'Bank Loan', 'Scholarship', 'Employer Sponsored', 'Property/Investments'];
    const updateFinancial = (key, val) => setData('financial_info', { ...data.financial_info, [key]: val });
    const toggleSource = (src) => {
        const current = data.financial_info.funding_source;
        const next = current.includes(src) ? current.filter(s => s !== src) : [...current, src];
        updateFinancial('funding_source', next);
    };

    return (
        <div className="space-y-12">
            <h2 className="text-2xl font-black text-[#282728] tracking-tight mb-10">Financial Capability</h2>

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

export function StepSourceOfFunds({ data, setData, errors }) {
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
            <h2 className="text-2xl font-black text-[#282728] tracking-tight mb-10">Source of Funds & Sponsors</h2>

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
                    <h3 className="text-sm font-bold text-[#436235] mb-6">Student Financial Documents Available</h3>
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
                            <h4 className="text-sm font-bold text-[#436235]">Sponsor Details</h4>

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

export function StepImmigration({ data, setData, errors }) {
    const update = (key, val) => setData('immigration_info', { ...data.immigration_info, [key]: val });

    return (
        <div className="space-y-12">
            <h2 className="text-2xl font-black text-[#282728] tracking-tight mb-10">Immigration / Travel History</h2>

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

export function StepCharacterHealth({ data, setData, errors }) {
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
            <h2 className="text-2xl font-black text-[#282728] tracking-tight mb-10">Character & Health</h2>

            <div className="space-y-8">
                <h3 className="text-sm font-bold text-[#436235] mb-6">Character Details</h3>
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
                <h3 className="text-sm font-bold text-[#436235] mb-6">Health Details</h3>
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

export function StepFamily({ data, setData, errors }) {
    const partnershipStatuses = ['Single', 'Married', 'De Facto', 'Separated', 'Divorced', 'Widowed'];

    const updateMember = (index, field, value) => {
        const members = [...data.family_info.members];
        members[index] = { ...members[index], [field]: value };
        setData('family_info', { ...data.family_info, members });
    };

    return (
        <div className="space-y-12">
            <h2 className="text-2xl font-black text-[#282728] tracking-tight mb-10">Family Information</h2>

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
                <span className="text-sm font-semibold text-[#282728]">{member.relation}</span>
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

export function StepAdditional({ data, setData, errors }) {
    const updateNzContacts = (key, val) => setData('nz_contacts_info', { ...data.nz_contacts_info, [key]: val });
    const updateMilitary = (key, val) => setData('military_info', { ...data.military_info, [key]: val });
    const updateHomeTies = (key, val) => setData('home_ties_info', { ...data.home_ties_info, [key]: val });

    return (
        <div className="space-y-12">
            <h2 className="text-2xl font-black text-[#282728] tracking-tight mb-10">Additional Information</h2>

            {/* NZ Contacts */}
            <div className="space-y-8">
                <h3 className="text-sm font-bold text-[#436235] mb-6">NZ Contacts</h3>
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
                <h3 className="text-sm font-bold text-[#436235] mb-6">Military Service</h3>
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
                <h3 className="text-sm font-bold text-[#436235] mb-6">Home Ties</h3>
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

export function StepDeclaration({ data, setData, errors }) {
    return (
        <div className="space-y-12">
            <h2 className="text-2xl font-black text-[#282728] tracking-tight mb-8 leading-tight">Declaration</h2>
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
                    <span className={`text-sm font-semibold transition-colors ${errors.declaration_accepted ? 'text-red-500' : 'text-[#282728]'}`}>
                        I have read, understood and agree to the declaration above *
                    </span>
                </label>
                {errors.declaration_accepted && <p className="text-sm font-black text-red-500 uppercase tracking-widest mt-2 pl-4">{errors.declaration_accepted}</p>}
            </div>
        </div>
    );
}

export function Field({ label, error, children }) {
    // Sentence-case labels — matches the immigration / student / work / visitor
    // intake forms. The original FreeAssessment used `uppercase` + wide
    // tracking which forced everything to ALL CAPS and was hard to read.
    const hasError = !!error;
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end px-1">
                <label className={`text-[13px] font-semibold transition-colors ${hasError ? 'text-red-500' : 'text-gray-700'}`}>
                    {label}
                </label>
            </div>
            {children}
            {hasError && (
                <p className="text-[11px] font-semibold text-red-500 mt-1.5 pl-1">
                    {error}
                </p>
            )}
        </div>
    );
}

export function SuccessMessage({ leadId }) {
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
                <h2 className="text-2xl font-black text-[#282728] tracking-tight mb-6">Success</h2>
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
