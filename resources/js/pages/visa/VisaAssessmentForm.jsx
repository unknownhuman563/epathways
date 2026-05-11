import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, UploadCloud, ChevronLeft, CreditCard, Lock, Shield } from 'react-feather';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import FormBgImg from "@assets/NewSections/nz_hero.png";

export default function VisaAssessmentForm() {
    const [visaType, setVisaType] = useState('General');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('type')) {
            const typeParam = params.get('type');
            setVisaType(typeParam.charAt(0).toUpperCase() + typeParam.slice(1));
        }
    }, []);

    const [step, setStep] = useState(1);
    const [promoCode, setPromoCode] = useState('');
    const isFree = promoCode.toUpperCase() === 'FREEADMIN';

    return (
        <div className="bg-[#FAFAFA] min-h-screen font-urbanist relative selection:bg-[#00A693] selection:text-white">
            <Navbar />
            <ScrollToTop />

            {/* Premium Dark Hero Section */}
            <div className="relative w-full pt-[160px] pb-24 z-0 bg-[#0c1611]">
                <img src={FormBgImg} alt="New Zealand" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0c1611]/80 to-[#FAFAFA]"></div>
                
                {/* Header & Title */}
                <div className="relative z-10 max-w-4xl mx-auto text-center text-white px-6">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium mb-8 tracking-tight">
                        {visaType} Visa Assessment
                    </h1>
                    <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-4xl mx-auto">
                        Complete this comprehensive profile to help our Licensed Immigration Advisers evaluate your eligibility and map out the most viable pathway for your future in New Zealand.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 py-16 md:py-24 px-6 md:px-12 container mx-auto">
                
                {/* Back Link */}
                <div className="max-w-4xl mx-auto mb-8">
                    <a href="/immigration-assessment" className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#282728] hover:text-[#00A693] transition-colors group">
                        <ChevronLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Back to pathways
                    </a>
                </div>

                {/* Form Content */}
                <div className="max-w-4xl mx-auto bg-white p-8 md:p-16 lg:p-20 shadow-[0_30px_60px_rgba(0,0,0,0.05)] rounded-sm border border-gray-100 relative">

                    {/* Top Step Indicator */}
                    <div className="max-w-3xl mx-auto mb-16 md:mb-20 relative px-4 md:px-8">
                        {/* Background track line */}
                        <div className="absolute top-5 left-12 right-12 h-[1px] bg-gray-200 -z-10 hidden sm:block"></div>
                        {/* Active track line */}
                        <div className="absolute top-5 left-12 h-[1px] bg-[#00A693] -z-10 transition-all duration-700 ease-in-out hidden sm:block" style={{ width: `calc(${((step - 1) / 2) * 100}% - 3rem)` }}></div>
                        
                        <div className="flex justify-between relative">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${step >= 1 ? 'bg-[#00A693] text-white shadow-[0_0_20px_rgba(0,166,147,0.4)] scale-110' : 'bg-white text-gray-400 border border-gray-200'}`}>1</div>
                                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 hidden sm:block mt-3 ${step >= 1 ? 'text-[#282728]' : 'text-gray-500'}`}>Personal Details</span>
                            </div>
                            {/* Step 2 */}
                            <div className="flex flex-col items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${step >= 2 ? 'bg-[#00A693] text-white shadow-[0_0_20px_rgba(0,166,147,0.4)] scale-110' : 'bg-white text-gray-500 border border-gray-300'}`}>2</div>
                                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 hidden sm:block mt-3 ${step >= 2 ? 'text-[#282728]' : 'text-gray-500'}`}>Academic & Work</span>
                            </div>
                            {/* Step 3 */}
                            <div className="flex flex-col items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${step >= 3 ? 'bg-[#00A693] text-white shadow-[0_0_20px_rgba(0,166,147,0.4)] scale-110' : 'bg-white text-gray-500 border border-gray-300'}`}>3</div>
                                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 hidden sm:block mt-3 ${step >= 3 ? 'text-[#282728]' : 'text-gray-500'}`}>Review & Payment</span>
                            </div>
                        </div>
                    </div>


                    <form className="space-y-16" onSubmit={(e) => { e.preventDefault(); if (step < 3) setStep(step + 1); }}>
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div 
                                    key="step1"
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="space-y-12"
                                >
                                    <div className="pb-8 border-b border-gray-200">
                                        <h3 className="text-3xl md:text-4xl font-semibold text-[#282728] tracking-tight">Personal Information</h3>
                                        <p className="text-[#282728]/70 text-sm md:text-base mt-3 leading-relaxed">Please provide your details exactly as they appear on your passport.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                                        <div className="space-y-3 relative group">
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#282728]/60 group-focus-within:text-[#00A693] transition-colors">First Name</label>
                                            <input type="text" className="w-full bg-transparent border-0 border-b-2 border-gray-300 px-0 py-3 text-xl font-medium text-[#282728] focus:ring-0 focus:border-[#00A693] transition-colors placeholder-gray-400" placeholder="e.g. John" required />
                                        </div>
                                        <div className="space-y-3 relative group">
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#282728]/60 group-focus-within:text-[#00A693] transition-colors">Last Name</label>
                                            <input type="text" className="w-full bg-transparent border-0 border-b-2 border-gray-300 px-0 py-3 text-xl font-medium text-[#282728] focus:ring-0 focus:border-[#00A693] transition-colors placeholder-gray-400" placeholder="e.g. Doe" required />
                                        </div>
                                        <div className="space-y-3 md:col-span-2 relative group">
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#282728]/60 group-focus-within:text-[#00A693] transition-colors">Email Address</label>
                                            <input type="email" className="w-full bg-transparent border-0 border-b-2 border-gray-300 px-0 py-3 text-xl font-medium text-[#282728] focus:ring-0 focus:border-[#00A693] transition-colors placeholder-gray-400" placeholder="you@example.com" required />
                                        </div>
                                        <div className="space-y-3 md:col-span-2 relative group">
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#282728]/60 group-focus-within:text-[#00A693] transition-colors">Nationality</label>
                                            <input type="text" className="w-full bg-transparent border-0 border-b-2 border-gray-300 px-0 py-3 text-xl font-medium text-[#282728] focus:ring-0 focus:border-[#00A693] transition-colors placeholder-gray-400" placeholder="e.g. Indian" required />
                                        </div>
                                    </div>

                                    <div className="pt-12 flex justify-end">
                                        <button type="submit" className="w-full sm:w-auto bg-[#0c1611] text-white px-14 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#00A693] transition-colors flex items-center justify-center gap-4 group rounded-none">
                                            Continue <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div 
                                    key="step2"
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="space-y-12"
                                >
                                    <div className="pb-8 border-b border-gray-200">
                                        <h3 className="text-3xl md:text-4xl font-semibold text-[#282728] tracking-tight">Professional & Academic</h3>
                                        <p className="text-[#282728]/70 text-sm md:text-base mt-3 leading-relaxed">Help us understand your background to find the best fit.</p>
                                    </div>

                                    <div className="space-y-12">
                                        <div className="space-y-3 relative group">
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#282728]/60 group-focus-within:text-[#00A693] transition-colors">Highest Qualification</label>
                                            <select className="w-full bg-transparent border-0 border-b-2 border-gray-300 px-0 py-3 text-xl font-medium text-[#282728] focus:ring-0 focus:border-[#00A693] transition-colors appearance-none cursor-pointer">
                                                <option value="" className="text-gray-400">Select level...</option>
                                                <option value="high-school">High School</option>
                                                <option value="bachelors">Bachelor's Degree</option>
                                                <option value="masters">Master's Degree</option>
                                                <option value="phd">PhD or Doctorate</option>
                                                <option value="other">Other Diploma/Certificate</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3 relative group">
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#282728]/60 group-focus-within:text-[#00A693] transition-colors">Years of Relevant Work Experience</label>
                                            <select className="w-full bg-transparent border-0 border-b-2 border-gray-300 px-0 py-3 text-xl font-medium text-[#282728] focus:ring-0 focus:border-[#00A693] transition-colors appearance-none cursor-pointer">
                                                <option value="" className="text-gray-400">Select experience...</option>
                                                <option value="0-1">Less than 1 year</option>
                                                <option value="1-3">1 to 3 years</option>
                                                <option value="3-5">3 to 5 years</option>
                                                <option value="5+">More than 5 years</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3 relative group">
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#282728]/60 group-focus-within:text-[#00A693] transition-colors">Current Occupation / Field</label>
                                            <input type="text" className="w-full bg-transparent border-0 border-b-2 border-gray-300 px-0 py-3 text-xl font-medium text-[#282728] focus:ring-0 focus:border-[#00A693] transition-colors placeholder-gray-400" placeholder="e.g. Software Engineer" />
                                        </div>
                                        
                                        <div className="space-y-4 pt-4">
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#282728]/60">Upload Resume / CV (Optional)</label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-sm p-12 hover:border-[#00A693] hover:bg-[#00A693]/5 transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 mt-2">
                                                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-[#00A693]/10 transition-colors">
                                                    <UploadCloud className="text-[#00A693]" size={24} />
                                                </div>
                                                <span className="text-base font-semibold text-[#282728]">Click or drag file to upload</span>
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">PDF, DOCX up to 10MB</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3 relative group pt-4">
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#282728]/60 group-focus-within:text-[#00A693] transition-colors">Criminal convictions or medical conditions?</label>
                                            <textarea className="w-full bg-transparent border-0 border-b-2 border-gray-300 px-0 py-3 text-lg font-medium text-[#282728] focus:ring-0 focus:border-[#00A693] transition-colors min-h-[100px] placeholder-gray-400 resize-none" placeholder="Provide brief details if applicable... (Leave blank if none)" />
                                        </div>
                                    </div>

                                    <div className="pt-12 flex flex-col sm:flex-row justify-between gap-6">
                                        <button type="button" onClick={() => setStep(1)} className="w-full sm:w-auto text-[#282728] px-14 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors rounded-none border border-gray-200">
                                            Back
                                        </button>
                                        <button type="submit" className="w-full sm:w-auto bg-[#0c1611] text-white px-14 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#00A693] transition-colors flex items-center justify-center gap-4 group rounded-none">
                                            Continue <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div 
                                    key="step3"
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="space-y-12"
                                >
                                    <div className="pb-8 border-b border-gray-200">
                                        <h3 className="text-3xl md:text-4xl font-semibold text-[#282728] tracking-tight">Review & Payment</h3>
                                        <p className="text-[#282728]/70 text-sm md:text-base mt-3 leading-relaxed">Secure your comprehensive immigration assessment.</p>
                                    </div>

                                    <div className="flex flex-col lg:flex-row gap-16">
                                        {/* Left Column: Order Summary */}
                                        <div className="flex-1 bg-[#FAFAFA] rounded-sm p-10 self-start border border-gray-200 relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-[#00A693]"></div>
                                            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-500 mb-8 block">Order Summary</span>
                                            <div className="mb-8">
                                                <h4 className="font-semibold text-[#282728] text-2xl tracking-tight">{visaType} Assessment</h4>
                                                <p className="text-gray-600 text-sm mt-3 leading-relaxed">Full profile evaluation & tailored roadmap</p>
                                            </div>

                                            <div className="border-t border-gray-200 pt-8 mt-8">
                                                <div className="space-y-4 mb-8">
                                                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#282728]/60">Admin Code (Optional)</label>
                                                    <input 
                                                        type="text" 
                                                        value={promoCode}
                                                        onChange={(e) => setPromoCode(e.target.value)}
                                                        className="w-full bg-white border border-gray-300 px-5 py-4 text-sm focus:ring-0 focus:border-[#00A693] rounded-sm outline-none font-semibold tracking-widest uppercase transition-colors placeholder-gray-400" 
                                                        placeholder="Enter code" 
                                                    />
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#282728]">Total (NZD)</span>
                                                    <span className="text-4xl font-medium text-[#282728] tracking-tight">{isFree ? '$0.00' : '$150.00'}</span>
                                                </div>
                                            </div>

                                            <div className="mt-10 flex items-start gap-4 pt-8 border-t border-gray-200">
                                                <Shield className="text-[#00A693] mt-0.5 shrink-0" size={18} />
                                                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                                    Reviewed by an IAA Licensed Adviser. Results delivered within 2-3 business days.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right Column: Payment Details */}
                                        <div className="flex-1 space-y-10 pt-6 lg:pt-0">
                                            <div className="flex items-center gap-4 text-[#282728] border-b border-gray-200 pb-5">
                                                <CreditCard size={20} className="text-[#00A693]" />
                                                <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Payment Details</span>
                                            </div>
                                            
                                            {isFree ? (
                                                <div className="flex flex-col items-center justify-center h-[250px] text-center space-y-5 text-gray-600 bg-[#FAFAFA] rounded-sm border border-gray-200">
                                                    <CheckCircle size={40} className="text-[#00A693]" />
                                                    <div className="text-base font-medium">
                                                        <span className="font-bold text-[#282728] block mb-2 text-lg">Code applied!</span>
                                                        Your assessment is fully covered.<br />No payment required.
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-8">
                                                    <div className="space-y-3 relative group">
                                                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#282728]/60 group-focus-within:text-[#00A693] transition-colors">Cardholder Name</label>
                                                        <input type="text" className="w-full bg-transparent border-0 border-b-2 border-gray-300 px-0 py-3 text-xl font-medium text-[#282728] focus:ring-0 focus:border-[#00A693] transition-colors placeholder-gray-400" placeholder="Name on card" required />
                                                    </div>
                                                    <div className="space-y-3 relative group">
                                                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#282728]/60 group-focus-within:text-[#00A693] transition-colors">Card Number</label>
                                                        <input type="text" className="w-full bg-transparent border-0 border-b-2 border-gray-300 px-0 py-3 text-xl font-medium tracking-[0.2em] text-[#282728] focus:ring-0 focus:border-[#00A693] transition-colors placeholder-gray-400" placeholder="0000 0000 0000 0000" required />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-10">
                                                        <div className="space-y-3 relative group">
                                                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#282728]/60 group-focus-within:text-[#00A693] transition-colors">Expiry</label>
                                                            <input type="text" className="w-full bg-transparent border-0 border-b-2 border-gray-300 px-0 py-3 text-xl font-medium tracking-widest text-[#282728] focus:ring-0 focus:border-[#00A693] transition-colors placeholder-gray-400" placeholder="MM/YY" required />
                                                        </div>
                                                        <div className="space-y-3 relative group">
                                                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#282728]/60 group-focus-within:text-[#00A693] transition-colors">CVC</label>
                                                            <input type="text" className="w-full bg-transparent border-0 border-b-2 border-gray-300 px-0 py-3 text-xl font-medium tracking-widest text-[#282728] focus:ring-0 focus:border-[#00A693] transition-colors placeholder-gray-400" placeholder="123" required />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {!isFree && (
                                                <div className="flex items-center gap-3 pt-4 text-xs text-gray-400 font-medium tracking-wide">
                                                    <Lock size={14} /> Payments are secure and encrypted
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-12 flex flex-col sm:flex-row justify-between gap-6">
                                        <button type="button" onClick={() => setStep(2)} className="w-full sm:w-auto text-[#282728] px-14 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors rounded-none border border-gray-200">
                                            Back
                                        </button>
                                        <button type="button" onClick={() => { alert('Assessment submitted successfully! We will be in touch shortly.'); window.location.href = '/immigration'; }} className="w-full sm:flex-1 bg-[#00A693] text-white px-14 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#008c7c] transition-colors flex items-center justify-center gap-4 group rounded-none">
                                            {isFree ? 'Submit Assessment' : 'Pay $150.00'} <CheckCircle size={18} className="ml-2 group-hover:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>
            </div>

            <Footer />
        </div>
    );
}
