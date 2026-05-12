import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'react-feather';
import EducationImg from "@assets/Services/education.png";
import VisaImg from "@assets/Services/visa.png";
import SettlementImg from "@assets/Services/settlement.png";

const steps = [
    {
        tag: "Emerge",
        title: "Education",
        desc: "Start your journey with confidence. We connect you to the right schools and courses, guided by ICEF-certified experts who understand your goals.",
        linkText: "Learn More",
        image: EducationImg
    },
    {
        tag: "Energise",
        title: "Immigration",
        desc: "Move forward with ease. From Visitor to Student and Residency visas, we handle the process while keeping everything legally compliant and stress-free.",
        linkText: "Learn More",
        image: VisaImg
    },
    {
        tag: "Evolve",
        title: "Accommodation",
        desc: "Settle in smoothly. We help you find safe, comfortable housing and provide essential support—from homestays to getting you oriented with daily transport.",
        linkText: "Learn More",
        image: SettlementImg
    }
];

export default function ProcessSteps() {
    return (
        <section className="py-16 sm:py-20 md:py-24 bg-gray-50/50 font-urbanist overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12 sm:mb-16 md:mb-20">
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em] mb-4 block">Service Trifecta</span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#282728] leading-tight mb-4 sm:mb-6">
                        3 Pillars
                    </h2>
                    <p className="text-gray-600 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                        Integrated core offerings to support every step of your journey.
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full group hover:shadow-xl transition-all duration-500"
                        >
                            <div className="p-8 pb-10 flex flex-col flex-grow">
                                <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.2em] mb-4 block">
                                    {step.tag}
                                </span>
                                <h3 className="text-xl font-bold text-[#282728] mb-4 leading-tight group-hover:text-[#436235] transition-colors">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed mb-8 flex-grow">
                                    {step.desc}
                                </p>
                                
                                <button className="flex items-center gap-2 text-[#282728] text-[11px] font-bold uppercase tracking-[0.2em] group/btn">
                                    {step.linkText} <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                                </button>
                            </div>
                            
                            {/* Image at bottom */}
                            <div className="h-48 overflow-hidden">
                                <img 
                                    src={step.image} 
                                    alt={step.title} 
                                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
