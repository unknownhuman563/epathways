import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'react-feather';
import StepOne from "@assets/NewSections/step_one.png";
import StepTwo from "@assets/NewSections/step_two.png";
import StepThree from "@assets/NewSections/step_three.png";
import StepFour from "@assets/NewSections/step_four.png";

const steps = [
    {
        tag: "Step one",
        title: "Tell us what you're looking for",
        desc: "Share your goals and circumstances with us. We listen to your vision to build the best plan.",
        linkText: "Start",
        image: StepOne
    },
    {
        tag: "Step two",
        title: "We map out your best options",
        desc: "Our team assesses your eligibility and shares the courses and pathways that suit you.",
        linkText: "Choose",
        image: StepTwo
    },
    {
        tag: "Step three",
        title: "We handle the paperwork and filings",
        desc: "Documents, applications, and submissions are our responsibility. We handle the complexity.",
        linkText: "Process",
        image: StepThree
    },
    {
        tag: "Step four",
        title: "You move forward with confidence",
        desc: "Approval comes through, and we support your transition every step of the way.",
        linkText: "Arrive",
        image: StepFour
    }
];

export default function ProcessSteps() {
    return (
        <section className="py-24 bg-gray-50/50 font-urbanist overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-20 px-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-4 block">Process</span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#282728] leading-tight mb-6">
                        Your journey in four steps
                    </h2>
                    <p className="text-gray-500 text-sm md:text-base font-light max-w-xl mx-auto leading-relaxed">
                        From your first question to your arrival, we handle it all.
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                                <p className="text-gray-400 text-sm font-light leading-relaxed mb-8 flex-grow">
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
