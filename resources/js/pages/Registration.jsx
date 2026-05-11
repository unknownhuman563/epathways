import React, { useState, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { CheckCircle, AlertCircle, ChevronRight, Lock, Calendar, MapPin, Mail, Phone, Clock, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Shared Field Component ---
function Field({ label, error, children }) {
    const hasError = !!error;
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
                <label className={`text-[9px] font-black uppercase tracking-[0.3em] transition-colors ${hasError ? 'text-red-500' : 'text-[#282728] opacity-60'}`}>
                    {label}
                </label>
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

// --- Success Component ---
function SuccessScreen({ eventName }) {
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
                <h2 className="text-3xl font-black text-[#282728] uppercase tracking-tighter mb-6">Registered</h2>
                <p className="text-gray-500 text-sm leading-[2] mb-12 font-medium px-4">
                    Your seat for <strong className="text-[#282728]">{eventName}</strong> is confirmed. We look forward to seeing you there.
                </p>
                <div className="bg-gray-50/50 rounded-2xl p-8 mb-12 border border-gray-100/50">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] mb-3 text-center">Registration ID</p>
                    <p className="text-lg font-mono font-black text-[#282728]">EV-{Math.floor(Math.random() * 90000) + 10000}</p>
                </div>
                <a href="/" className="inline-block w-full bg-[#282728] text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-[#282728]/10 hover:bg-black transition-all active:scale-95">
                    Return to Portal
                </a>
            </div>
        </div>
    );
}

// --- Main Registration Component ---
export default function Registration({ event }) {
    if (!event) return <div className="p-20 text-center font-bold text-gray-500 uppercase tracking-widest text-xs font-urbanist">Error: Event data missing.</div>;

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
        
        if (formRef.current && !formRef.current.reportValidity()) {
            return;
        }

        post(`/register/${event.event_code}`, {
            onSuccess: () => setSuccess(true),
            preserveScroll: true,
            onError: (errs) => {
                const message = Object.values(errs).join('\n');
                setModal({ 
                    show: true, 
                    message: "There is some missing or invalid information. Please review the highlighted fields.\n" + message,
                });
            }
        });
    };

    if (success) return <SuccessScreen eventName={event.name} />;

    const inputClass = "w-full px-5 py-3.5 bg-white border border-[#282728] rounded-xl focus:ring-2 focus:ring-[#282728]/10 focus:border-[#282728] transition-all outline-none font-medium text-sm";
    const selectClass = "w-full px-5 py-3.5 bg-white border border-[#282728] rounded-xl focus:ring-2 focus:ring-[#282728]/10 focus:border-[#282728] transition-all outline-none font-medium text-sm";

    const PillGroup = ({ options, value, onChange }) => (
        <div className="flex flex-wrap gap-3 mt-2">
            {options.map(opt => {
                const isSelected = value === opt;
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all text-center ${isSelected ? 'bg-[#282728] text-white border-[#282728]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#282728]'}`}
                    >
                        {opt}
                    </button>
                )
            })}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/40 font-urbanist text-[#212121]">
            <Head title={`Register – ${event.name}`} />

            {/* HERO SECTION - Event Image Banner */}
            <div className="relative pt-40 pb-32 overflow-hidden flex flex-col items-center justify-center text-center border-b border-gray-100">
                {/* Background Image securely loaded with fallback */}
                <img 
                    src={
                        event.banner_image && event.banner_image.trim() !== ''
                            ? (event.banner_image.startsWith('http') ? event.banner_image : `/storage/${event.banner_image}`)
                            : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop'
                    }
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop'; }}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    alt="Event Banner"
                />
                {/* Subtle dark tint to ensure white text remains readable */}
                <div className="absolute inset-0 bg-black/40 z-0"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#282728]/80 to-transparent z-0"></div>

                <div className="container mx-auto px-6 relative z-10 max-w-4xl flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[9px] font-black uppercase tracking-[0.3em] mb-8"
                    >
                        <Calendar size={12} /> {event.type || 'Webinar Event'}
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl lg:text-[7rem] lg:leading-[0.9] font-black text-white uppercase tracking-tighter leading-[1] mb-8 drop-shadow-2xl"
                    >
                        {event.name || 'ePathways Registration'}
                    </motion.h1>
                    
                    {event.description && (
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="text-sm md:text-base text-gray-300 font-medium leading-relaxed max-w-2xl mb-12"
                        >
                            {event.description}
                        </motion.p>
                    )}

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#282728]"
                    >
                        <div className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white shadow-2xl shadow-black/20">
                            <Calendar size={14} className="text-gray-500" /> 
                            {event.date_from ? new Date(event.date_from).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBA'}
                        </div>
                        {event.mode && (
                            <div className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white shadow-2xl shadow-black/20">
                                <MapPin size={14} className="text-gray-500" /> 
                                {event.mode}
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-[#282728] text-white shadow-2xl shadow-[#282728]/30">
                            <Clock size={14} className="opacity-50" /> 
                            Registration Open
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-20">
                <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
                    
                    {/* LEFT COLUMN: FORM */}
                    <div className="w-full md:flex-1 bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(40,39,40,0.06)] border border-[#282728]/5 overflow-hidden">
                        <div className="p-8 md:p-14">
                            <form ref={formRef} onSubmit={handleSubmit} className="space-y-16">
                                
                                {/* 1. SECTION: Personal Details */}
                                <div className="space-y-8">
                                    <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-[#282728] pb-6 border-b border-gray-50 flex items-center gap-4">
                                        <span className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-[9px]">01</span>
                                        Personal Information
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field label="First Name *" error={errors.first_name}>
                                            <input required type="text" className={inputClass} value={data.first_name} onChange={e => setData('first_name', e.target.value)} />
                                        </Field>
                                        <Field label="Last Name *" error={errors.last_name}>
                                            <input required type="text" className={inputClass} value={data.last_name} onChange={e => setData('last_name', e.target.value)} />
                                        </Field>
                                        <Field label="Email Address *" error={errors.email}>
                                            <input required type="email" className={inputClass} value={data.email} onChange={e => setData('email', e.target.value)} />
                                        </Field>
                                        <Field label="Phone Number *" error={errors.phone}>
                                            <input required type="tel" className={inputClass} value={data.phone} onChange={e => setData('phone', e.target.value)} />
                                        </Field>
                                        <Field label="City *">
                                            <input required type="text" className={inputClass} value={data.city} onChange={e => setData('city', e.target.value)} />
                                        </Field>
                                        <Field label="Current Country *">
                                            <input required type="text" className={inputClass} value={data.country} onChange={e => setData('country', e.target.value)} />
                                        </Field>
                                        
                                        {event.sessions && event.sessions.length > 0 && (
                                            <div className="md:col-span-2">
                                                <Field label="Preferred Session Time" error={errors.event_session_id}>
                                                    <div className="relative">
                                                        <select className={selectClass} value={data.event_session_id} onChange={e => setData('event_session_id', e.target.value)}>
                                                            <option value="">Select session (optional)</option>
                                                            {event.sessions.map(s => (
                                                                <option key={s.id} value={s.id}>{s.venue_name || s.city} – {s.time_start?.slice(0,5)}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </Field>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. SECTION: Background */}
                                <div className="space-y-8">
                                    <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-[#282728] pb-6 border-b border-gray-50 flex items-center gap-4">
                                        <span className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-[9px]">02</span>
                                        Background & Edu
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field label="Highest Education Level *" error={errors.education_level}>
                                            <div className="relative">
                                                <select required className={selectClass} value={data.education_level} onChange={e => setData('education_level', e.target.value)}>
                                                    <option value="">Select level</option>
                                                    <option>High School Graduate</option>
                                                    <option>Associate / Vocational</option>
                                                    <option>Bachelor's Degree</option>
                                                    <option>Master's Degree</option>
                                                    <option>Doctorate / PhD</option>
                                                </select>
                                            </div>
                                        </Field>
                                        <Field label="Field of Study / Profession *" error={errors.field_of_study}>
                                            <input required type="text" className={inputClass} value={data.field_of_study} onChange={e => setData('field_of_study', e.target.value)} />
                                        </Field>
                                        <div className="md:col-span-2">
                                            <Field label="Employment Status *" error={errors.employment_status}>
                                                <PillGroup 
                                                    options={['Employed','Self-Employed','Unemployed','Student','OFW']} 
                                                    value={data.employment_status} 
                                                    onChange={v => setData('employment_status', v)} 
                                                />
                                                {!data.employment_status && <input type="text" required style={{ opacity:0, height:0, padding:0, border:'none', position:'absolute', zIndex:-1 }} />}
                                            </Field>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. SECTION: Pathway */}
                                <div className="space-y-8">
                                    <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-[#282728] pb-6 border-b border-gray-50 flex items-center gap-4">
                                        <span className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-[9px]">03</span>
                                        NZ Pathway
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field label="Pathway of Interest *" error={errors.interest}>
                                            <div className="relative">
                                                <select required className={selectClass} value={data.interest} onChange={e => setData('interest', e.target.value)}>
                                                    <option value="">Select pathway</option>
                                                    <option value="Work Visa / Job Support">Work Visa / Job Support</option>
                                                    <option value="Student Visa">Student Visa</option>
                                                    <option value="Skilled Migrant">Skilled Migrant</option>
                                                    <option value="Partner / Family Visa">Partner / Family Visa</option>
                                                    <option value="Investor Visa">Investor Visa</option>
                                                    <option value="Not sure yet">Not sure yet</option>
                                                </select>
                                            </div>
                                        </Field>
                                        <Field label="Planning Timeline *" error={errors.planning_timeline}>
                                            <div className="relative">
                                                <select required className={selectClass} value={data.planning_timeline} onChange={e => setData('planning_timeline', e.target.value)}>
                                                    <option value="">When are you planning?</option>
                                                    <option>Within 3 months</option>
                                                    <option>3–6 months</option>
                                                    <option>6–12 months</option>
                                                    <option>1–2 years</option>
                                                    <option>Just exploring</option>
                                                </select>
                                            </div>
                                        </Field>
                                        <div className="md:col-span-2">
                                            <Field label="How Will You Fund Your Move? *" error={errors.funding_source}>
                                                <PillGroup 
                                                    options={['Personal Savings','Family Support','Scholarship','Student Loan','Employer-Sponsored','Not yet decided']} 
                                                    value={data.funding_source} 
                                                    onChange={v => setData('funding_source', v)} 
                                                />
                                                {!data.funding_source && <input type="text" required style={{ opacity:0, height:0, padding:0, border:'none', position:'absolute', zIndex:-1 }} />}
                                            </Field>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. SECTION: Remarks */}
                                <div className="space-y-8">
                                    <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-[#282728] pb-6 border-b border-gray-50 flex items-center gap-4">
                                        <span className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-[9px]">04</span>
                                        Final Remarks
                                    </h3>
                                    <Field label="Questions or Goals?">
                                        <textarea 
                                            placeholder="Share your specific concerns..." 
                                            className={`${inputClass} min-h-[140px] resize-y`} 
                                            value={data.remarks} 
                                            onChange={e => setData('remarks', e.target.value)} 
                                        />
                                    </Field>
                                </div>

                                {/* FOOTER SUBMIT */}
                                <div className="pt-10 border-t border-gray-50 flex flex-col items-center">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full md:w-auto px-16 py-6 bg-[#282728] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl shadow-[#282728]/15 active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? 'Processing...' : 'Confirm Registration'}
                                        {!processing && <ChevronRight className="w-4 h-4" />}
                                    </button>
                                    <div className="mt-8 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-500">
                                        <Lock size={12} /> Secure Registration • © {new Date().getFullYear()} ePathways
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: SIDEBAR */}
                    <div className="w-full md:w-[300px] lg:w-[360px] shrink-0 space-y-6 max-w-[400px] mx-auto md:max-w-none">
                        {/* Free Assessment Card */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-[0_16px_32px_-12px_rgba(40,39,40,0.06)] border border-gray-50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                                <FileText size={80} />
                            </div>
                            <div className="flex items-start justify-between mb-8 relative z-10">
                                <div className="w-14 h-14 bg-gray-50 rounded-[1rem] flex items-center justify-center text-[#282728] border border-gray-100 transition-transform group-hover:-translate-y-1 hover:bg-[#282728] hover:text-white">
                                    <FileText size={20} />
                                </div>
                                <span className="inline-block px-3 py-1.5 bg-gray-50 text-[#282728] text-[7px] font-black uppercase tracking-[0.2em] rounded-full border border-gray-100">Complimentary</span>
                            </div>
                            
                            <h3 className="text-xl font-black text-[#282728] uppercase tracking-tighter mb-3 relative z-10">Free Assessment</h3>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6 relative z-10">Get a personalized eligibility evaluation for your pathway at absolutely no cost.</p>
                            
                            <ul className="mb-8 space-y-3 relative z-10">
                                {['Visa eligibility mapping', 'Qualification recognition', 'Step-by-step action plan'].map((txt, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[11px] font-bold text-[#282728]">
                                        <CheckCircle size={14} className="text-[#436235] shrink-0" />
                                        <span className="leading-tight">{txt}</span>
                                    </li>
                                ))}
                            </ul>

                            <a href="/free-assessment" className="inline-flex items-center justify-between w-full p-4 pl-6 bg-white border-2 border-[#282728] text-[#282728] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#282728] hover:text-white transition-colors active:scale-95 relative z-10 group-hover:border-transparent">
                                Claim Assessment
                                <ChevronRight size={14} />
                            </a>
                        </div>

                        {/* Consultation Card */}
                        <div className="bg-[#282728] rounded-[2rem] p-8 shadow-[0_16px_32px_-12px_rgba(40,39,40,0.4)] relative overflow-hidden group">
                            <div className="absolute -bottom-8 -right-8 opacity-[0.05] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                                <Calendar size={120} />
                            </div>
                            
                            <div className="flex items-start justify-between mb-8 relative z-10">
                                <div className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-[1rem] flex items-center justify-center text-white border border-white/10 transition-transform group-hover:-translate-y-1 hover:bg-white hover:text-[#282728]">
                                    <Calendar size={20} />
                                </div>
                                <span className="inline-block px-3 py-1.5 bg-white/10 text-white text-[7px] font-black uppercase tracking-widest rounded-full backdrop-blur-md border border-white/5">Zero Cost</span>
                            </div>

                            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-3 relative z-10">Consultation</h3>
                            <p className="text-xs text-gray-300 font-medium leading-relaxed mb-6 relative z-10">Book a dedicated 1-on-1 private session with a certified ePathways advisor.</p>
                            
                            <ul className="mb-8 space-y-3 relative z-10">
                                {['30-min private session', 'Discuss specific situations', 'No sales pressure, ever'].map((txt, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[11px] font-bold text-white/90">
                                        <CheckCircle size={14} className="text-[#a0c88f] shrink-0" />
                                        <span className="leading-tight">{txt}</span>
                                    </li>
                                ))}
                            </ul>

                            <a href="/booking" className="inline-flex items-center justify-between w-full p-4 pl-6 bg-white text-[#282728] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-white/20 transition-all active:scale-95 relative z-10">
                                View Schedule
                                <ChevronRight size={14} />
                            </a>
                        </div>

                        {/* Contact Card */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-[0_16px_32px_-12px_rgba(40,39,40,0.06)] border border-gray-50">
                            <h3 className="text-sm font-black text-[#282728] uppercase tracking-[0.2em] mb-8 text-center pb-6 border-b border-gray-50">Connect</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-[1.2rem] bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 border border-gray-100 transition-colors hover:text-[#282728]"><MapPin size={16} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Location</p>
                                        <p className="text-xs font-bold text-[#282728]">2F Landco Center<br/>Davao City, PH</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-[1.2rem] bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 border border-gray-100 transition-colors hover:text-[#282728]"><Phone size={16} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Telephone</p>
                                        <p className="text-xs font-bold text-[#282728]">+63 (82) 297-5000</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-[1.2rem] bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 border border-gray-100 transition-colors hover:text-[#282728]"><Mail size={16} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Email</p>
                                        <p className="text-xs font-bold text-[#282728]">hello@epathways.com.ph</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Validation Modal */}
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
                                className="w-full bg-[#282728] text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-black transition-all active:scale-95"
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
