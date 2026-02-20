import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function VisaProcessSteps() {
    const [activeIndex, setActiveIndex] = useState(0);

    const steps = [
        { id: "01", day: "DAY", title: "ASSESSMENT FOR ELIGIBILITY", price: "FREE" },
        { id: "02", day: "DAY", title: "GOAL SETTING MEETING", price: "" },
        { id: "04", day: "DAY", title: "ENGLISH PROFICIENCY TEST", price: "NZD $950" },
        { id: "07", day: "DAY", title: "SCHOOL ENROLLMENT", price: "NZD $3,000" },
        { id: "37", day: "DAY", title: "VISA PROCESS", price: "NZD $2,350" },
        { id: "44", day: "DAY", title: "VISA LODGEMENT", price: "" },
        { id: "72", day: "DAY", title: "APPROVED IN PRINCIPLE VISA", subTitle: "Full Payment of SCHOOL FEES", price: "NZD $2,350", note: "*Depends on the program" },
        { id: "80", day: "DAY", title: "VISA OUTCOME", price: "" },
    ];

    const next = () => setActiveIndex((prev) => (prev + 1) % steps.length);
    const prev = () => setActiveIndex((prev) => (prev - 1 + steps.length) % steps.length);

    return (
        <section className="py-24 bg-[#1a1a1a] font-urbanist overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-2"
                    >
                        Student Visa
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-5xl font-black text-white"
                    >
                        Steps of Application
                    </motion.h2>
                </div>

                {/* Elegant Stepper Timeline */}
                <div className="relative mb-20 max-w-5xl mx-auto px-10">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2"></div>
                    <motion.div
                        className="absolute top-1/2 left-0 h-0.5 bg-[#436235] -translate-y-1/2 transition-all duration-500"
                        style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
                    ></motion.div>

                    <div className="relative flex justify-between">
                        {steps.map((step, idx) => (
                            <button
                                key={step.id}
                                onClick={() => setActiveIndex(idx)}
                                className="group relative flex flex-col items-center"
                            >
                                <motion.div
                                    animate={{
                                        scale: activeIndex === idx ? 1.2 : 1,
                                        backgroundColor: activeIndex === idx ? "#436235" : "#ffffff",
                                        borderColor: activeIndex === idx ? "#436235" : "rgba(255,255,255,0.2)"
                                    }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-4 text-sm font-bold transition-all duration-300 ${activeIndex === idx ? "text-white shadow-[0_0_20px_rgba(67,98,53,0.5)]" : "text-[#282728]"
                                        }`}
                                >
                                    {step.id}
                                </motion.div>
                                <span className={`absolute -bottom-8 text-[10px] font-bold tracking-tighter transition-opacity duration-300 ${activeIndex === idx ? "text-[#436235] opacity-100" : "text-gray-500 opacity-60"
                                    }`}>
                                    DAY {step.id}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="relative max-w-4xl mx-auto flex items-center gap-4">
                    {/* Prev Button */}
                    <button
                        onClick={prev}
                        className="hidden md:flex w-14 h-14 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-[#436235] hover:border-[#436235] transition-all duration-300 group"
                    >
                        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <div className="flex-grow perspective-[1000px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeIndex}
                                initial={{ opacity: 0, x: 20, rotateY: 5 }}
                                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                                exit={{ opacity: 0, x: -20, rotateY: -5 }}
                                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                className="bg-white rounded-[40px] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden"
                            >
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#436235]/5 rounded-bl-full"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#436235]/5 rounded-tr-full"></div>

                                <div className="inline-flex flex-col items-center mb-8">
                                    <div className="w-20 h-20 bg-[#436235] rounded-2xl flex flex-col items-center justify-center text-white shadow-xl rotate-3 mb-2">
                                        <span className="text-3xl font-black leading-none">{steps[activeIndex].id}</span>
                                        <span className="text-[10px] font-bold tracking-widest opacity-80 uppercase">DAY</span>
                                    </div>
                                </div>

                                <h3 className="text-2xl md:text-3xl font-black text-[#282728] leading-tight mb-4 uppercase tracking-tight">
                                    {steps[activeIndex].title}
                                </h3>

                                {steps[activeIndex].subTitle && (
                                    <p className="text-sm md:text-base text-gray-500 font-bold mb-6 tracking-wide underline decoration-[#436235]/30 underline-offset-8">
                                        {steps[activeIndex].subTitle}
                                    </p>
                                )}

                                <div className="flex flex-col items-center gap-2 mt-8">
                                    {steps[activeIndex].price && (
                                        <div className="px-6 py-2 bg-gray-50 rounded-full border border-gray-100 italic">
                                            <span className={`text-base font-black ${steps[activeIndex].price === 'FREE' ? 'text-gray-400' : 'text-[#436235]'} tracking-tight`}>
                                                {steps[activeIndex].price}
                                            </span>
                                        </div>
                                    )}
                                    {steps[activeIndex].note && (
                                        <span className="text-[11px] text-gray-400 italic font-medium">
                                            {steps[activeIndex].note}
                                        </span>
                                    )}
                                </div>

                                {/* Custom Mobile Nav inside card */}
                                <div className="flex md:hidden justify-between mt-12 pt-6 border-t border-gray-100">
                                    <button onClick={prev} className="flex items-center gap-2 text-[#436235] font-bold text-sm">
                                        <ChevronLeft className="w-4 h-4" /> Prev
                                    </button>
                                    <button onClick={next} className="flex items-center gap-2 text-[#436235] font-bold text-sm">
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={next}
                        className="hidden md:flex w-14 h-14 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-[#436235] hover:border-[#436235] transition-all duration-300 group"
                    >
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-2 mt-12">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === activeIndex ? "w-8 bg-[#436235]" : "w-2 bg-white/20"
                                }`}
                        ></div>
                    ))}
                </div>
            </div>
        </section>
    );
}
