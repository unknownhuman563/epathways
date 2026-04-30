import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'react-feather';
import Navbar from "@/components/navigation-bar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scrolltotop";

// Assets (Using placeholders if exact ones not available, standardizing)
import heroBg from "@assets/Services/education.png";
import programImg from "@assets/Services/pathways.png"; // Changed from Testimonies/testi1.png to a more relevant education asset

export default function ProgramDetails({ program }) {
    const paragraphs = (program?.description || '').split(/\n\n+/).filter(Boolean);
    const fees = Array.isArray(program?.fee_guide) ? program.fee_guide : [];
    const fmt = (val) => {
        if (val === null || val === undefined || val === '') return '—';
        const n = Number(val);
        return Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(val);
    };

    return (
        <div className="min-h-screen bg-white font-urbanist overflow-x-hidden">
            <Navbar />

            {/* Hero Section */}
            <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
                <img
                    src={heroBg}
                    alt="Medical Professionals"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center">
                    <h1 className="text-6xl md:text-8xl font-bold text-white mb-2 tracking-tight">ePathways</h1>
                    <p className="text-sm md:text-base text-white/90 font-light tracking-wide">New Zealand Journey</p>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="container mx-auto px-4 py-16 max-w-7xl">

                {/* About This Program Section - Card Style */}
                <div className="mb-16">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">About This Program</h4>

                    <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden border border-gray-100">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            {/* Left: Text Content */}
                            <div className="p-4 lg:p-3 flex flex-col justify-center">
                                <h1 className="text-4xl md:text-5xl font-bold text-[#282728] mb-2 leading-tight">
                                    {program?.title || 'Program'}
                                </h1>
                                <h2 className="text-2xl font-normal text-[#436235] mb-8">{program?.location || ''}</h2>

                                <div className="prose prose-lg text-gray-600 leading-relaxed space-y-4">
                                    {paragraphs.length === 0 ? (
                                        <p>No description available.</p>
                                    ) : paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                                </div>
                            </div>

                            {/* Right: Image */}
                            <div className="p-4 lg:p-3 h-full min-h-[400px]">
                                <div className="relative h-full w-full rounded-[5px] overflow-hidden shadow-lg">
                                    <img
                                        src={program?.image_url || programImg}
                                        alt={program?.title || ''}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    {program?.intake_months && (
                                        <div className="absolute top-6 right-6 bg-[#1a1a1a]/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium uppercase tracking-wide">
                                            {program.intake_months}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Bar - Elegant Footer of the Card */}
                        <div className="bg-[#1a1a1a] text-white py-10 px-6">
                            <div className="grid grid-cols-5 items-center">
                                <div className="flex flex-col items-center border-r border-white/10 last:border-r-0">
                                    <span className="text-3xl font-bold mb-1.5 tabular-nums">{program?.level ?? '—'}</span>
                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em]">Level</span>
                                </div>
                                <div className="flex flex-col items-center border-r border-white/10 last:border-r-0">
                                    <span className="text-3xl font-bold mb-1.5 tabular-nums">{program?.duration_months ?? '—'}</span>
                                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em] text-center leading-relaxed">
                                        Months<br />(Duration)
                                    </div>
                                </div>
                                <div className="flex flex-col items-center border-r border-white/10 last:border-r-0">
                                    <span className="text-3xl font-bold mb-1.5 tabular-nums">{program?.credits ?? '—'}</span>
                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em]">Credits</span>
                                </div>
                                <div className="flex flex-col items-center border-r border-white/10 last:border-r-0">
                                    <span className="text-3xl font-bold mb-1.5 tabular-nums">{program?.residency_points ?? '—'}</span>
                                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em] text-center leading-relaxed px-2">
                                        Points of Residency
                                    </div>
                                </div>
                                <div className="flex flex-col items-center border-r border-white/10 last:border-r-0">
                                    <span className="text-3xl font-bold mb-1.5 tabular-nums">{program?.hours_per_week ?? '—'}</span>
                                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em] text-center leading-relaxed">
                                        Hours per Week<br />(Works Right)
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    {/* Entry Requirements Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 h-full">
                        <h3 className="text-lg font-bold text-[#282728] mb-4">Entry Requirements</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {program?.entry_requirements || 'No entry requirements specified.'}
                        </p>
                    </div>

                    {/* English Requirements Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 h-full">
                        <h3 className="text-lg font-bold text-[#282728] mb-4">English Requirements</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {program?.english_requirements || 'No English requirements specified.'}
                        </p>
                    </div>

                    {/* Employment Outcomes Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 h-full">
                        <h3 className="text-lg font-bold text-[#282728] mb-4">Employment Outcomes</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {program?.employment_outcomes || 'No employment outcomes specified.'}
                        </p>
                    </div>

                    {/* Post Study Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 h-full">
                        <h3 className="text-lg font-bold text-[#282728] mb-4">Post Study</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {program?.post_study || 'No post-study information specified.'}
                        </p>
                    </div>
                </div>

                {/* Detailed Entry Requirements Alert */}
                <div className="mb-16">
                    <h3 className="text-lg font-bold text-[#282728] mb-6">Entry Requirements</h3>
                    <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-start gap-4 shadow-sm w-full md:w-1/2">
                        <div className="min-w-[24px] h-6 bg-[#436235] rounded flex items-center justify-center mt-0.5">
                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {program?.entry_requirements || 'No entry requirements specified.'}
                        </p>
                    </div>
                </div>

                {/* Fee Guide */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Fee Guide</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* Tuition Fee */}
                        <div>
                            <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-200">
                                <span className="text-sm font-bold text-[#282728] uppercase tracking-wider">Tuition Fee</span>
                                <span className="text-sm font-bold text-[#282728] uppercase tracking-wider">Amount (NZD)</span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-baseline gap-4">
                                    <span className="text-gray-600 text-sm flex-shrink-0">Tuition</span>
                                    <span className="font-bold text-[#282728] text-right">
                                        <span className="text-2xl tabular-nums">
                                            {program?.tuition_fee ? fmt(program.tuition_fee) : '—'}
                                        </span>
                                        {program?.tuition_fee && program?.tuition_fee_notes && (
                                            <span className="text-sm font-normal text-gray-500 ml-2">
                                                ({program.tuition_fee_notes})
                                            </span>
                                        )}
                                    </span>
                                </div>
                                {!program?.tuition_fee && (
                                    <p className="text-sm text-gray-400">No tuition fee specified.</p>
                                )}
                            </div>

                            {/*
                            Legacy regional fee guide — kept for backward compatibility with seeded data.
                            Uncomment the block below to display per-region fees if any are saved on the program.
                            */}
                            {/*
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Schools</span>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fees</span>
                                </div>
                                <div className="space-y-4">
                                    {fees.length === 0 ? (
                                        <p className="text-sm text-gray-400">No fee data available.</p>
                                    ) : fees.map((row, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">{row.region}</span>
                                            <span className="font-bold text-[#282728]">{fmt(row.fee)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            */}
                        </div>

                        {/* Cost Card */}
                        <div className="bg-[#282728] text-white rounded-2xl p-8 lg:p-10 shadow-2xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-8">
                                <div>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-[10px] text-gray-400 font-medium tracking-wider">NZD</span>
                                        <h4 className="text-2xl font-bold tabular-nums">{fmt(program?.insurance_fee)}</h4>
                                    </div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Insurance (indicative)</p>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-[10px] text-gray-400 font-medium tracking-wider">NZD</span>
                                        <h4 className="text-2xl font-bold tabular-nums">{fmt(program?.visa_processing_fee)}</h4>
                                    </div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Visa Processing Fee</p>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-[10px] text-gray-400 font-medium tracking-wider">NZD</span>
                                        <h4 className="text-2xl font-bold tabular-nums">{fmt(program?.living_expense)}</h4>
                                    </div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Living Expense (one year)</p>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold mb-1">{program?.accommodation || '—'}</h4>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Accommodation (single occupancy)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <ScrollToTop />
            <Footer />
        </div>
    );
}
