import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'react-feather';
import Navbar from "@/components/navigation-bar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scrolltotop";

import StudentVisaImg from "@assets/NewSections/student_visa.png";
import VisitorVisaImg from "@assets/NewSections/visitor_visa.png";
import WorkVisaImg    from "@assets/NewSections/work_visa.png";
import SettleVisaImg  from "@assets/NewSections/settle_visa.png";
import ResidencyImg   from "@assets/NewSections/residency_visa.png";
import GuidanceImg   from "@assets/NewSections/immigration_guidance.png";

export default function ImmigrationAssessment() {
    return (
        <div className="bg-white min-h-screen font-['Inter',sans-serif]">
            <Navbar />
            <ScrollToTop />

            <div className="pt-40 pb-32 bg-white min-h-screen flex flex-col justify-center">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    <div className="text-center mb-16">
                        <span className="text-[11px] font-bold tracking-[0.4em] uppercase text-[#00A693] mb-4 block">
                            Assessment
                        </span>
                        <h1 className="text-4xl md:text-5xl font-medium mb-6 tracking-tight text-[#282728]">
                            Select your visa pathway
                        </h1>
                        <p className="text-gray-500 text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
                            Choose a visa category below to start your free assessment.<br className="hidden md:block" /> We will evaluate your qualifications and help you find the best path forward.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: "Student Visa", desc: "Study at leading institutions with full support for admissions and visa processing.", img: StudentVisaImg, link: "/visa-assessment-form?type=student" },
                            { title: "Work Visa", desc: "Secure international employment through skilled migration and employer programs.", img: WorkVisaImg, link: "/visa-assessment-form?type=work" },
                            { title: "Visitor Visa", desc: "Experience new destinations for tourism, business, or visiting family and friends.", img: VisitorVisaImg, link: "/visa-assessment-form?type=visitor" },
                            { title: "Family Visa", desc: "Reunite with your loved ones through partner, parent, and dependent child pathways.", img: SettleVisaImg, link: "/visa-assessment-form?type=family" },
                            { title: "Residency Visa", desc: "Navigate the complex path to permanent residency with end-to-end expert guidance.", img: ResidencyImg, link: "/visa-assessment-form?type=residency" },
                            { title: "General Assessment", desc: "Unsure which visa suits you? Let our experts evaluate your profile and find the best option.", img: GuidanceImg, link: "/visa-assessment-form?type=general" },
                        ].map((visa, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative h-[400px] md:h-[450px] rounded-sm overflow-hidden bg-[#282728]"
                            >
                                <img 
                                    src={visa.img} 
                                    alt={visa.title} 
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                                <div className="absolute inset-0 p-8 flex flex-col justify-end items-start">
                                    <h3 className="text-2xl font-medium text-white mb-3">
                                        {visa.title}
                                    </h3>
                                    <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-[90%] group-hover:text-white transition-colors duration-300">
                                        {visa.desc}
                                    </p>
                                    <a 
                                        href={visa.link}
                                        className="inline-flex items-center gap-3 bg-white text-[#282728] px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-[#00A693] hover:text-white transition-all duration-300"
                                    >
                                        Choose <ArrowRight size={14} />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
