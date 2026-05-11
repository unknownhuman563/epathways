import React from 'react';
import { motion } from 'framer-motion';

export default function HowItHelps() {
    const steps = [
        {
            number: 1,
            title: "Align Your Studies with Skill-Shortage Industries",
            description: "Choosing study programme in areas listed on New Zealand's Skill Shortage or Green List improves employability and post-study work or migration pathways."
        },
        {
            number: 2,
            title: "Focus on Quality & Relevance",
            description: [
                "Consider the reputation of the institution,",
                "Industry links, internships, and practical experience,",
                "And how the program connects to roles in demand."
            ]
        },
        {
            number: 3,
            title: "Build Future-Ready Skills",
            description: "Choosing study programme in areas listed on New Zealand's Skill Shortage or Green List improves employability and post-study work or migration pathways."
        }
    ];

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (customDelay) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: customDelay,
                duration: 0.8,
                ease: "easeOut",
                staggerChildren: 0.2
            }
        })
    };

    const childVariants = {
        hidden: { opacity: 0, scale: 0.5, y: 10 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 260,
                damping: 20
            }
        }
    };

    const lineVariants = {
        hidden: { scaleX: 0 },
        visible: {
            scaleX: 1,
            transition: { duration: 3, ease: "linear", delay: 0.2 } // Linear for predictable timing
        }
    };

    return (
        <section className="py-16 bg-white font-urbanist overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-12 md:mb-24"
                >
                    <h2 className="text-2xl md:text-3xl font-bold text-[#282728] uppercase tracking-widest mb-6">
                        HOW EPATHWAYS HELPS YOU ?
                    </h2>
                    <p className="text-gray-600 max-w-4xl mx-auto text-lg leading-relaxed font-light">
                        ePathways is your trusted partner in visa and migration, providing expert guidance and end-to-end support—
                        from eligibility assessment to compliant, stress-free application processing.
                    </p>
                </motion.div>

                {/* Timeline Process */}
                <div className="relative">
                    {/* Horizontal Line (Desktop) */}
                    <motion.div
                        variants={lineVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="hidden md:block absolute top-[92px] left-0 right-0 h-0.5 bg-gray-900 z-0 origin-left"
                    ></motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative z-10">
                        {steps.map((step, index) => {
                            // Precise delays matching line progress (centers at 1/6, 3/6, 5/6)
                            // Line starts at 0.2s, duration 3s.
                            // Step 1: 0.2 + (3 * 0.166) = ~0.7s
                            // Step 2: 0.2 + (3 * 0.5) = 1.7s
                            // Step 3: 0.2 + (3 * 0.833) = ~2.7s
                            const delays = [0.7, 1.7, 2.7];

                            return (
                                <motion.div
                                    key={step.number}
                                    custom={delays[index]}
                                    variants={itemVariants}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: "-50px" }}
                                    className="flex flex-col items-center text-center"
                                >
                                    {/* Title above for desktop */}
                                    <motion.div variants={childVariants} className="mb-6 h-12 flex items-end">
                                        <h3 className="text-xl font-bold text-[#282728] leading-tight max-w-[250px]">
                                            {step.title}
                                        </h3>
                                    </motion.div>

                                    {/* Number Circle */}
                                    <motion.div variants={childVariants} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg mb-6 shadow-md relative">
                                        {step.number}
                                        {/* Mobile Vertical Line */}
                                        {index !== steps.length - 1 && (
                                            <div className="md:hidden absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gray-900"></div>
                                        )}
                                    </motion.div>

                                    {/* Description */}
                                    <motion.div variants={childVariants} className="px-4">
                                        {Array.isArray(step.description) ? (
                                            <ul className="text-gray-600 text-sm leading-relaxed font-light space-y-1">
                                                {step.description.map((line, i) => (
                                                    <li key={i} className="flex items-start justify-center">
                                                        <span className="mr-1 opacity-50">•</span>
                                                        {line}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-600 text-sm leading-relaxed font-light">
                                                {step.description}
                                            </p>
                                        )}
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
