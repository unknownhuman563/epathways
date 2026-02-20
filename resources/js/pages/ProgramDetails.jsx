import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'react-feather';
import Navbar from "@/components/navigation-bar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scrolltotop";

// Assets (Using placeholders if exact ones not available, standardizing)
import heroBg from "@assets/Services/education.png";
import programImg from "@assets/Testimonies/testi1.png"; // Or a specific nursing image if available

export default function ProgramDetails() {
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
                                    NZ Diploma in Enrolled Nursing
                                </h1>
                                <h2 className="text-2xl font-normal text-[#436235] mb-8">Auckland</h2>

                                <div className="prose prose-lg text-gray-600 leading-relaxed space-y-4">
                                    <p>
                                        This program is for those who want to work in clinical settings as an enrolled nurse and a valued member of the health team. Students will gain knowledge in nursing, social science, and the structure and function of the human body.
                                    </p>
                                    <p>
                                        They will learn skills in simulated learning environments which can then be applied on placements in clinical practice. A range of clinical courses in different health care settings will prepare students to practice in areas including rehabilitation, acute care and mental health.
                                    </p>
                                    <p>
                                        After completing this program students will be able to apply to the Nursing Council of New Zealand to sit an exam to be registered as an Enrolled Nurse; this means they will be able to practice under the direction of a Registered Nurse.
                                    </p>
                                </div>
                            </div>

                            {/* Right: Image */}
                            <div className="p-4 lg:p-3 h-full min-h-[400px]">
                                <div className="relative h-full w-full rounded-[5px] overflow-hidden shadow-lg">
                                    <img
                                        src={programImg}
                                        alt="Nursing Student"
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    <div className="absolute top-6 right-6 bg-[#1a1a1a]/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium uppercase tracking-wide">
                                        February, July
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Bar - Elegant Footer of the Card */}
                        <div className="bg-[#1a1a1a] text-white py-10 px-6">
                            <div className="grid grid-cols-5 items-center">
                                {/* Level */}
                                <div className="flex flex-col items-center border-r border-white/10 last:border-r-0">
                                    <span className="text-3xl font-bold mb-1.5 tabular-nums">5</span>
                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em]">Level</span>
                                </div>

                                {/* Duration */}
                                <div className="flex flex-col items-center border-r border-white/10 last:border-r-0">
                                    <span className="text-3xl font-bold mb-1.5 tabular-nums">18</span>
                                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em] text-center leading-relaxed">
                                        Months<br />(Duration)
                                    </div>
                                </div>

                                {/* Credits */}
                                <div className="flex flex-col items-center border-r border-white/10 last:border-r-0">
                                    <span className="text-3xl font-bold mb-1.5 tabular-nums">180</span>
                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em]">Credits</span>
                                </div>

                                {/* Residency */}
                                <div className="flex flex-col items-center border-r border-white/10 last:border-r-0">
                                    <span className="text-3xl font-bold mb-1.5 tabular-nums">3</span>
                                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em] text-center leading-relaxed px-2">
                                        Points of Residency
                                    </div>
                                </div>

                                {/* Hours */}
                                <div className="flex flex-col items-center border-r border-white/10 last:border-r-0">
                                    <span className="text-3xl font-bold mb-1.5 tabular-nums">25</span>
                                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em] text-center leading-relaxed">
                                        Hours per Week<br />(Works Right)
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {/* Entry Requirements Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 h-full">
                        <h3 className="text-lg font-bold text-[#282728] mb-4">Entry Requirements</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Completion of equivalent secondary education to New Zealand's NCEA Level 2. Some institutions may require credits in English and Mathematics.
                        </p>
                    </div>

                    {/* Employment Outcomes Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 h-full">
                        <h3 className="text-lg font-bold text-[#282728] mb-4">Employment Outcomes</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Graduates of New Zealand's Enrolled Nursing diploma generally find employment in hospitals, aged care, mental health and community settings. Starting salaries average NZD $50,000-$60,000, rising with experience. While demand exists, some face competition for positions. Expanded scope of practice and flexible work settings improve long-term opportunities and career growth.
                        </p>
                    </div>

                    {/* Post Study Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 h-full">
                        <h3 className="text-lg font-bold text-[#282728] mb-4">Post Study</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Graduates who complete an Enrolled Nursing qualification (typically a Level 5 Diploma) in New Zealand can apply for a Post Study Work Visa (PSWV). This visa allows them to work for any employer in the health sector, often for up to 1-2 years, provided they have completed a 60-week full-time course and hold a valid registration with the Nursing Council of New Zealand.
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
                            Completion of equivalent secondary education to New Zealand's NCEA Level 2. Some institutions may require credits in English and Mathematics.
                        </p>
                    </div>
                </div>

                {/* Fee Guide */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Fee Guide</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* Schools Table */}
                        <div>
                            <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-200">
                                <span className="text-sm font-bold text-[#282728] uppercase tracking-wider">SCHOOLS</span>
                                <span className="text-sm font-bold text-[#282728] uppercase tracking-wider">FEES</span>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">India & Subcontinent</span>
                                    <span className="font-bold text-[#282728]">31,200.00</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Southeast Asia</span>
                                    <span className="font-bold text-[#282728]">31,200.00</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">China/Malaysia/Singapore</span>
                                    <span className="font-bold text-[#282728]">31,200.00</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">LATAM/Europe/ Africa/Middle East</span>
                                    <span className="font-bold text-[#282728]">31,200.00</span>
                                </div>
                            </div>
                        </div>

                        {/* Cost Card */}
                        <div className="bg-[#282728] text-white rounded-2xl p-8 lg:p-10 shadow-2xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-8">
                                <div>
                                    <h4 className="text-2xl font-bold mb-1">1,000.00</h4>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">INSURANCE (indicative)</p>
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold mb-1">2,350.00</h4>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Visa Processing Fee</p>
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold mb-1">20,000.00</h4>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Living Expense (one year)</p>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold mb-1">from $180/week</h4>
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
