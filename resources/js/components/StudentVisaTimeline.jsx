import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

import educationImg  from "@assets/Services/education.png";
import agentsImg     from "@assets/Services/agents.png";
import pathwaysImg   from "@assets/Services/pathways.png";
import visaImg       from "@assets/Services/visa.png";
import settlementImg from "@assets/Services/settlement.png";
import jobImg        from "@assets/Services/job.png";
import day80Img     from "@assets/visa_process/day_80.png";
import day1Video     from "@assets/visa_process/day_1.mp4";
import day2Video     from "@assets/visa_process/day_2.mp4";


// Alternating pattern:
// Even index (0, 2, 4) -> Image on top, Text on bottom
// Odd index (1, 3, 5) -> Text on top, Image on bottom
const milestones = [
    {
        day: "Day 1",
        desc: "We assess your eligibility and discuss your goals at no cost.",
        video: day1Video,
    },
    {
        day: "Day 2",
        desc: "You meet with our team to set clear objectives for your journey.",
        video: day2Video,
    },
    {
        day: "Day 4",
        desc: "English proficiency testing happens. Investment required is NZD$950.",
        img: pathwaysImg,
    },
    {
        day: "Day 7",
        desc: "School enrollment is finalized. Program costs are NZD$3,000.",
        img: educationImg,
    },
    {
        day: "Day 37",
        desc: "Visa processing begins. Application fee is NZD$2,350.",
        img: visaImg,
    },
    {
        day: "Day 44",
        desc: "Complete offshore medical and police clearance requirements.",
        img: settlementImg,
    },
    {
        day: "Day 72",
        desc: "Authorities assess your application — we monitor every update.",
        img: jobImg,
    },
    {
        day: "Day 80",
        desc: "Finalise flights, accommodation, and orientation. Arrive confident.",
        img: day80Img,
    },
];

const ITEM_WIDTH = 280; // Total width for each timeline block

export default function StudentVisaTimeline() {
    return (
        <section className="py-24 bg-white font-urbanist overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 md:px-12">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="mb-20">
                    <p className="text-xs font-bold text-[#1a1a1a] mb-6">
                        Timeline
                    </p>

                    <h2 className="text-3xl md:text-5xl font-normal text-[#1a1a1a] leading-tight tracking-tight mb-6 max-w-4xl">
                        Your visa journey unfolds in clear <br /> stages
                    </h2>
                    
                    <p className="text-sm md:text-[15px] text-[#1a1a1a] leading-relaxed max-w-3xl mb-10">
                        We break down the student visa process into manageable milestones. Each day brings you closer <br className="hidden md:block" /> to your destination.
                    </p>

                    <div className="flex items-center gap-6">
                        <a
                            href="/free-assessment"
                            className="px-6 py-2.5 border border-[#e5e7eb] text-[#1a1a1a] text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Start
                        </a>
                        <a
                            href="/free-assessment"
                            className="flex items-center gap-1 text-[#1a1a1a] text-sm font-medium hover:opacity-70 transition-opacity"
                        >
                            Begin <ChevronRight size={16} />
                        </a>
                    </div>
                </div>

                {/* ── Timeline ─────────────────────────────── */}
                <div 
                    className="overflow-x-auto pb-10 hide-scrollbar" 
                    style={{ WebkitOverflowScrolling: "touch", msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                >
                    <div 
                        className="flex"
                        style={{ minWidth: `${milestones.length * ITEM_WIDTH}px` }}
                    >
                        {milestones.map((step, i) => {
                            const imageTop = i % 2 === 0;

                            const ImageBlock = (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="w-48 h-48 bg-[#f2f2f2] relative group overflow-hidden"
                                >
                                    {step.video ? (
                                        <video 
                                            src={step.video} 
                                            autoPlay 
                                            loop 
                                            muted 
                                            playsInline 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : step.img ? (
                                        <img 
                                            src={step.img} 
                                            alt={step.day} 
                                            className="w-full h-full object-cover transition-all duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                <polyline points="21 15 16 10 5 21"></polyline>
                                            </svg>
                                        </div>
                                    )}
                                </motion.div>
                            );

                            const TextBlock = (
                                <motion.div 
                                    initial={{ opacity: 0, y: imageTop ? -10 : 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 + 0.1 }}
                                    className="w-56"
                                    style={{ paddingRight: '20px' }}
                                >
                                    <h3 className="text-xl font-normal text-[#1a1a1a] mb-2">{step.day}</h3>
                                    <p className="text-[13px] text-[#1a1a1a] leading-relaxed">
                                        {step.desc}
                                    </p>
                                </motion.div>
                            );

                            return (
                                <div key={i} className="flex flex-col" style={{ width: `${ITEM_WIDTH}px` }}>
                                    
                                    {/* Top Section */}
                                    <div className="h-56 flex items-end pb-8">
                                        {imageTop ? ImageBlock : TextBlock}
                                    </div>

                                    {/* Middle Rail */}
                                    <div className="h-4 w-full relative flex items-center">
                                        {/* Background line */}
                                        <div className="absolute w-full h-[2px] bg-[#1a1a1a]"></div>
                                        {/* Dot */}
                                        <div className="w-4 h-4 rounded-full bg-[#1a1a1a] absolute left-0 z-10"></div>
                                        
                                        {/* Mask line for the very last item so the line doesn't extend infinitely, though since it's inside the container it's fine. We'll just add a fade-out effect at the very end of the container. */}
                                    </div>

                                    {/* Bottom Section */}
                                    <div className="h-56 flex items-start pt-8">
                                        {imageTop ? TextBlock : ImageBlock}
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </section>
    );
}
