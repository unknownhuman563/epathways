import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, UploadCloud, ChevronLeft } from 'react-feather';
import Navbar from "@/components/navigation-bar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scrolltotop";

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

    return (
        <div className="bg-white min-h-screen font-['Inter',sans-serif]">
            <Navbar />
            <ScrollToTop />

            {/* Split Screen Layout for Premium Feel */}
            <div className="flex flex-col lg:flex-row min-h-screen pt-[104px]">
                
                {/* Left Side: Cinematic Context */}
                <div className="lg:w-5/12 bg-[#282728] relative flex flex-col justify-between p-12 md:p-20 text-white min-h-[50vh] lg:min-h-[calc(100vh-104px)] lg:sticky lg:top-[104px]">
                    {/* Background image with overlay */}
                    <div className="absolute inset-0 z-0">
                        <img src={FormBgImg} alt="New Zealand" className="w-full h-full object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#282728] via-[#282728]/80 to-[#282728]"></div>
                    </div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <a href="/immigration-assessment" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/50 hover:text-white mb-16 transition-colors group">
                                <ChevronLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Back to pathways
                            </a>

                            <span className="text-sm font-bold tracking-[0.4em] uppercase text-[#00A693] mb-6 block">
                                Immigration Assessment
                            </span>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium mb-8 tracking-tight text-white leading-tight">
                                {visaType} Visa<br />Profile
                            </h1>
                            <p className="text-white/60 text-sm md:text-base max-w-sm leading-relaxed mb-12">
                                Complete this comprehensive profile to help our Licensed Immigration Advisers evaluate your eligibility and map out the most viable pathway for your future in New Zealand.
                            </p>
                        </div>

                        <div className="space-y-6 hidden md:block">
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-colors duration-500 ${step >= 1 ? 'bg-[#00A693] border-[#00A693] text-white' : 'border-white/20 text-white/50'}`}>1</div>
                                <span className={`text-sm font-bold uppercase tracking-widest transition-colors duration-500 ${step >= 1 ? 'text-white' : 'text-white/50'}`}>Personal Details</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-colors duration-500 ${step >= 2 ? 'bg-[#00A693] border-[#00A693] text-white' : 'border-white/20 text-white/50'}`}>2</div>
                                <span className={`text-sm font-bold uppercase tracking-widest transition-colors duration-500 ${step >= 2 ? 'text-white' : 'text-white/50'}`}>Academic & Work</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-colors duration-500 ${step >= 3 ? 'bg-[#00A693] border-[#00A693] text-white' : 'border-white/20 text-white/50'}`}>3</div>
                                <span className={`text-sm font-bold uppercase tracking-widest transition-colors duration-500 ${step >= 3 ? 'text-white' : 'text-white/50'}`}>Final Review</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form Content */}
                <div className="lg:w-7/12 bg-white flex flex-col justify-center p-8 md:p-20 py-20 lg:py-12">
                    <div className="max-w-xl w-full mx-auto flex-1 flex flex-col justify-center">
                        <form className="space-y-12" onSubmit={(e) => { e.preventDefault(); if (step < 3) setStep(step + 1); }}>
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div 
                                        key="step1"
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                                        className="space-y-8"
                                    >
                                        <div className="pb-8 border-b border-gray-100">
                                            <h3 className="text-3xl md:text-4xl font-medium text-[#282728] tracking-tight">Personal Information</h3>
                                            <p className="text-gray-600 text-sm md:text-base mt-4 leading-relaxed">Please provide your details exactly as they appear on your passport.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">First Name</label>
                                                <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#00A693] transition-colors" placeholder="e.g. John" required />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Last Name</label>
                                                <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#00A693] transition-colors" placeholder="e.g. Doe" required />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Email Address</label>
                                                <input type="email" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#00A693] transition-colors" placeholder="you@example.com" required />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Nationality</label>
                                                <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#00A693] transition-colors" placeholder="e.g. Indian" required />
                                            </div>
                                        </div>

                                        <div className="pt-12">
                                            <button type="submit" className="w-full md:w-auto bg-[#282728] text-white px-10 py-5 text-sm font-bold uppercase tracking-[0.2em] hover:bg-[#00A693] transition-all inline-flex items-center justify-center gap-4 group">
                                                Continue <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div 
                                        key="step2"
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                                        className="space-y-8"
                                    >
                                        <div className="pb-8 border-b border-gray-100">
                                            <h3 className="text-3xl md:text-4xl font-medium text-[#282728] tracking-tight">Professional & Academic</h3>
                                            <p className="text-gray-600 text-sm md:text-base mt-4 leading-relaxed">Help us understand your background to find the best fit.</p>
                                        </div>

                                        <div className="space-y-10">
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Highest Qualification</label>
                                                <select className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#00A693] transition-colors appearance-none">
                                                    <option value="">Select level...</option>
                                                    <option value="high-school">High School</option>
                                                    <option value="bachelors">Bachelor's Degree</option>
                                                    <option value="masters">Master's Degree</option>
                                                    <option value="phd">PhD or Doctorate</option>
                                                    <option value="other">Other Diploma/Certificate</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Years of Relevant Work Experience</label>
                                                <select className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#00A693] transition-colors appearance-none">
                                                    <option value="">Select experience...</option>
                                                    <option value="0-1">Less than 1 year</option>
                                                    <option value="1-3">1 to 3 years</option>
                                                    <option value="3-5">3 to 5 years</option>
                                                    <option value="5+">More than 5 years</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Current Occupation / Field</label>
                                                <input type="text" className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#00A693] transition-colors" placeholder="e.g. Software Engineer" />
                                            </div>
                                        </div>

                                        <div className="pt-12 flex flex-col sm:flex-row gap-4">
                                            <button type="button" onClick={() => setStep(1)} className="w-full sm:w-auto border border-gray-200 text-[#282728] px-10 py-5 text-sm font-bold uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors">
                                                Back
                                            </button>
                                            <button type="submit" className="w-full sm:w-auto bg-[#282728] text-white px-10 py-5 text-sm font-bold uppercase tracking-[0.2em] hover:bg-[#00A693] transition-all inline-flex items-center justify-center gap-4 group">
                                                Continue <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div 
                                        key="step3"
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                                        className="space-y-8"
                                    >
                                        <div className="pb-8 border-b border-gray-100">
                                            <h3 className="text-3xl md:text-4xl font-medium text-[#282728] tracking-tight">Additional Details</h3>
                                            <p className="text-gray-600 text-sm md:text-base mt-4 leading-relaxed">Final details and any supporting documents.</p>
                                        </div>

                                        <div className="space-y-10">
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Upload Resume / CV (Optional)</label>
                                                <div className="border border-dashed border-gray-300 p-10 hover:border-[#00A693] hover:bg-[#00A693]/5 transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 rounded-sm mt-4">
                                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                                                        <UploadCloud className="text-gray-500" size={20} />
                                                    </div>
                                                    <span className="text-sm font-medium text-[#282728]">Click or drag file to upload</span>
                                                    <span className="text-sm font-bold uppercase tracking-widest text-gray-500">PDF, DOCX up to 10MB</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Do you have any criminal convictions or medical conditions?</label>
                                                <textarea className="w-full bg-transparent border-b border-gray-200 py-3 text-[#282728] focus:outline-none focus:border-[#00A693] transition-colors min-h-[80px]" placeholder="Provide brief details if applicable..." />
                                            </div>
                                        </div>

                                        <div className="pt-12 flex flex-col sm:flex-row gap-4">
                                            <button type="button" onClick={() => setStep(2)} className="w-full sm:w-auto border border-gray-200 text-[#282728] px-10 py-5 text-sm font-bold uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors">
                                                Back
                                            </button>
                                            <button type="button" onClick={() => alert('Assessment Submitted Successfully!')} className="w-full sm:w-auto bg-[#00A693] text-white px-10 py-5 text-sm font-bold uppercase tracking-[0.2em] hover:bg-[#008c7c] transition-all inline-flex items-center justify-center gap-4 group">
                                                Submit <CheckCircle size={14} className="ml-2" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
