import React from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import Navbar from '@/components/navigation-bar';
import Footer from '../components/footer';

export default function AssessmentResult({ lead_id, first_name, status, analysis }) {
    if (status === 'pending' || status === 'processing') {
        return <ProcessingState leadId={lead_id} firstName={first_name} />;
    }

    if (status === 'failed') {
        return <FailedState leadId={lead_id} firstName={first_name} />;
    }

    const score = analysis?.overall_score ?? 0;

    const getScoreColor = (s) => {
        if (s >= 75) return { ring: '#436235', bg: 'bg-green-50', text: 'text-green-700' };
        if (s >= 50) return { ring: '#d97706', bg: 'bg-amber-50', text: 'text-amber-700' };
        return { ring: '#ef4444', bg: 'bg-red-50', text: 'text-red-700' };
    };

    const scoreStyle = getScoreColor(score);
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="min-h-screen bg-white font-urbanist text-[#212121]">
            <Head title="Assessment Result" />
            <Navbar />

            <div className="bg-white py-32 border-b border-gray-100">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
                        <h1 className="text-4xl lg:text-5xl font-black text-[#282728] uppercase tracking-tighter mb-6 leading-[1.1]">
                            Your Assessment<br className="hidden lg:block" /> Result
                        </h1>
                        <h2 className="text-[11px] font-black text-[#436235] uppercase tracking-[0.6em] mb-8 opacity-80">
                            Eligibility Analysis
                        </h2>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em]">
                            Protocol: {lead_id}
                        </p>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-6 py-24 max-w-3xl">
                <div className="space-y-16">

                    {/* Score Circle */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center"
                    >
                        <div className="relative w-40 h-40 mb-8">
                            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="54" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                <motion.circle
                                    cx="60" cy="60" r="54"
                                    stroke={scoreStyle.ring}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset }}
                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-[#282728]">{score}</span>
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">out of 100</span>
                            </div>
                        </div>

                        {first_name && (
                            <p className="text-gray-500 text-sm font-medium mb-4">
                                Hi {first_name}, here's your eligibility assessment.
                            </p>
                        )}

                        {analysis?.recommended_pathway && (
                            <div className="bg-[#436235]/5 border border-[#436235]/20 rounded-2xl px-8 py-4">
                                <p className="text-[9px] font-black text-[#436235] uppercase tracking-[0.3em] mb-1">Recommended Pathway</p>
                                <p className="text-lg font-black text-[#282728]">{analysis.recommended_pathway}</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Summary */}
                    {analysis?.summary && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gray-50/50 rounded-3xl p-10 border border-gray-100"
                        >
                            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#282728] opacity-60 mb-4">Summary</h3>
                            <p className="text-sm text-gray-600 leading-[2] font-medium">{analysis.summary}</p>
                        </motion.div>
                    )}

                    {/* Strengths */}
                    {analysis?.strengths?.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#436235] mb-6">Strengths</h3>
                            <div className="space-y-3">
                                {analysis.strengths.map((s, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 bg-green-50/50 rounded-xl border border-green-100/50">
                                        <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-gray-600 font-medium">{s}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Concerns */}
                    {analysis?.concerns?.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                        >
                            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-600 mb-6">Areas to Address</h3>
                            <div className="space-y-3">
                                {analysis.concerns.map((c, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
                                        <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-gray-600 font-medium">{c}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="text-center pt-8"
                    >
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mb-6">Ready to take the next step?</p>
                        <a
                            href="/booking"
                            className="inline-flex items-center gap-3 px-12 py-5 bg-[#282728] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl shadow-[#282728]/10 active:scale-95"
                        >
                            Book a Consultation <ChevronRight size={14} />
                        </a>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function ProcessingState({ leadId, firstName }) {
    return (
        <div className="min-h-screen bg-white font-urbanist text-[#212121]">
            <Head title="Analysis in Progress" />
            <Navbar />
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-gray-100 border-t-[#436235] rounded-full mb-8"
                />
                <h2 className="text-2xl font-black text-[#282728] uppercase tracking-tighter mb-4">Analyzing Your Profile</h2>
                {firstName && <p className="text-gray-500 text-sm font-medium mb-2">Hi {firstName}, we're reviewing your submission.</p>}
                <p className="text-gray-300 text-xs font-bold uppercase tracking-[0.2em] mb-8">This usually takes less than a minute</p>
                <p className="text-gray-300 text-[10px] font-bold uppercase tracking-[0.3em]">Protocol: {leadId}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-8 px-8 py-4 bg-[#282728] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all"
                >
                    Refresh Status
                </button>
            </div>
            <Footer />
        </div>
    );
}

function FailedState({ leadId, firstName }) {
    return (
        <div className="min-h-screen bg-white font-urbanist text-[#212121]">
            <Head title="Analysis Unavailable" />
            <Navbar />
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
                <div className="w-16 h-16 bg-amber-50 rounded-[1.5rem] flex items-center justify-center text-amber-500 mb-8">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-2xl font-black text-[#282728] uppercase tracking-tighter mb-4">Analysis Unavailable</h2>
                {firstName && <p className="text-gray-500 text-sm font-medium mb-2">Hi {firstName}, we encountered an issue.</p>}
                <p className="text-gray-500 text-sm font-medium mb-8 max-w-md text-center">
                    Your submission was received successfully, but the automated analysis could not be completed. Our team will review your profile manually and contact you.
                </p>
                <p className="text-gray-300 text-[10px] font-bold uppercase tracking-[0.3em] mb-8">Protocol: {leadId}</p>
                <a href="/" className="px-8 py-4 bg-[#282728] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all">
                    Return to Portal
                </a>
            </div>
            <Footer />
        </div>
    );
}
