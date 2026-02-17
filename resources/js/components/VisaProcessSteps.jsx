import React from 'react';
import { motion } from 'framer-motion';

export default function VisaProcessSteps() {
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

    const bottomRowRaw = steps.slice(4, 8);

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.5, // Slower stagger for more elegant feel
            },
        },
    };

    return (
        <section className="py-24 bg-[#1a1a1a] font-urbanist overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-3xl md:text-4xl font-bold text-white tracking-widest uppercase"
                    >
                        STEPS OF STUDENT VISA APPLICATION
                    </motion.h2>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="relative"
                >
                    {/* Desktop Snake Path Connections (Animated) */}
                    <div className="hidden lg:block absolute inset-0 pointer-events-none">
                        {/* Top row horizontal line (animates L to R) */}
                        <motion.div
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 2, ease: "easeInOut" }}
                            className="absolute top-[80px] left-[12.5%] w-[75%] h-0.5 bg-[#436235] opacity-20 origin-left"
                        ></motion.div>

                        {/* Vertical connector on the right (animates Top to Bottom) */}
                        <motion.div
                            initial={{ scaleY: 0 }}
                            whileInView={{ scaleY: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 2.2, duration: 0.6, ease: "easeInOut" }}
                            className="absolute top-[80px] bottom-[80px] right-[12.5%] w-0.5 bg-[#436235] opacity-20 origin-top"
                        ></motion.div>

                        {/* Bottom row horizontal line (animates R to L) */}
                        <motion.div
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 2.8, duration: 2, ease: "easeInOut" }}
                            className="absolute bottom-[80px] left-[12.5%] w-[75%] h-0.5 bg-[#436235] opacity-20 origin-right"
                        ></motion.div>

                        {/* Middle separator line */}
                        <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            whileInView={{ scaleX: 1, opacity: 0.1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 1, duration: 1.5 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-0.5 bg-white"
                        ></motion.div>
                    </div>

                    {/* Steps Container */}
                    <div className="flex flex-col gap-16 lg:gap-32">
                        {/* Top Row: 1-4 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                            {steps.slice(0, 4).map((step, idx) => (
                                <StepCard key={step.id} step={step} index={idx} />
                            ))}
                        </div>

                        {/* Bottom Row: 8-5 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                            {bottomRowRaw.map((step, idx) => (
                                <StepCard key={step.id} step={step} index={idx + 4} reverseOrder />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function StepCard({ step, index, reverseOrder = false }) {
    const desktopOrder = reverseOrder ? `lg:order-${4 - (index - 4)}` : '';

    const cardVariants = {
        hidden: { opacity: 0, y: 40, scale: 0.9 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 80,
                damping: 15,
            }
        },
    };

    return (
        <motion.div
            variants={cardVariants}
            className={`relative flex flex-col items-center ${desktopOrder}`}
        >
            {/* Day Circle */}
            <motion.div
                whileHover={{ scale: 1.15, rotate: 5 }}
                className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-2xl z-20 border-4 border-[#1a1a1a] transition-colors"
            >
                <span className="text-3xl font-black text-[#282728] leading-none mb-1 group-hover:text-[#436235]">{step.id}</span>
                <span className="text-[10px] font-bold text-gray-400 tracking-widest">{step.day}</span>
            </motion.div>

            {/* Content Card */}
            <motion.div
                whileHover={{ y: -8 }}
                className="bg-white rounded-xl shadow-lg w-full -mt-12 pt-16 pb-8 px-6 text-center flex flex-col min-h-[180px] justify-center transition-all duration-500 hover:shadow-2xl hover:shadow-[#436235]/10"
            >
                <h3 className="text-sm md:text-base font-black text-[#282728] leading-tight mb-3 uppercase tracking-tight">
                    {step.title}
                </h3>
                {step.subTitle && (
                    <p className="text-[10px] text-gray-500 font-bold mb-4 tracking-tight leading-snug px-2">
                        {step.subTitle}
                    </p>
                )}
                <div className="mt-auto pt-4 flex flex-col items-end w-full border-t border-gray-50">
                    {step.price && (
                        <span className={`text-[11px] font-black ${step.price === 'FREE' ? 'text-gray-400' : 'text-[#436235]'} tracking-tighter`}>
                            {step.price}
                        </span>
                    )}
                    {step.note && (
                        <span className="text-[9px] text-gray-400 italic mt-1 font-medium scale-90 origin-right">
                            {step.note}
                        </span>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
