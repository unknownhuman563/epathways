import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

// ── Assets ─────────────────────────────────────────────────────────────────
import educationImg  from "@assets/Services/education.png";
import agentsImg     from "@assets/Services/agents.png";
import pathwaysImg   from "@assets/Services/pathways.png";
import visaImg       from "@assets/Services/visa.png";
import settlementImg from "@assets/Services/settlement.png";
import jobImg        from "@assets/Services/job.png";

// ── Timeline Data ───────────────────────────────────────────────────────────
// above: true  → card sits ABOVE the timeline rail
// above: false → card sits BELOW the timeline rail
const milestones = [
    {
        day: "Day 1",
        desc: "We assess your eligibility and discuss your goals at no cost.",
        img: agentsImg,
        above: false,
    },
    {
        day: "Day 2",
        desc: "You meet with our team to set clear objectives for your journey.",
        img: educationImg,
        above: true,
    },
    {
        day: "Day 4",
        desc: "English proficiency testing happens. Investment required is NZD$950.",
        img: pathwaysImg,
        above: false,
    },
    {
        day: "Day 7",
        desc: "School enrollment is finalized. Program costs are NZD$3,000.",
        img: educationImg,
        above: true,
    },
    {
        day: "Day 37",
        desc: "Visa processing begins. Application fee is NZD$2,350.",
        img: visaImg,
        above: false,
    },
    {
        day: "Day 44",
        desc: "Complete offshore medical and police clearance requirements.",
        img: settlementImg,
        above: true,
    },
    {
        day: "Day 72",
        desc: "Authorities assess your application — we monitor every update.",
        img: jobImg,
        above: false,
    },
    {
        day: "Day 80",
        desc: "Finalise flights, accommodation, and orientation. Arrive confident.",
        img: pathwaysImg,
        above: true,
    },
];

const CARD_W = 160; // px width of each card column
const STEM_H = 32;  // px height of stem connecting card to dot

export default function StudentVisaTimeline() {
    return (
        <section className="py-20 bg-white font-urbanist">
            <div className="max-w-7xl mx-auto px-6 md:px-12">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="mb-16">
                    {/* "Timeline" eyebrow */}
                    <motion.p
                        initial={{ opacity: 0, y: -8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#282728] mb-3"
                    >
                        Timeline
                    </motion.p>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        {/* Left: title + subtitle */}
                        <div className="max-w-xl">
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.06 }}
                                className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-[#282728] leading-[1.15] tracking-tight mb-4"
                            >
                                Your visa journey unfolds in clear stages
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.12 }}
                                className="text-sm text-gray-500 leading-relaxed max-w-md"
                            >
                                We break down the student visa process into manageable milestones.
                                Each day brings you closer to your destination.
                            </motion.p>
                        </div>

                        {/* Right: CTA buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.18 }}
                            className="flex items-center gap-3 flex-shrink-0"
                        >
                            <a
                                href="/free-assessment"
                                className="px-5 py-2 border border-gray-300 text-[#282728] text-sm font-medium rounded hover:border-[#282728] transition-colors duration-200"
                            >
                                Start
                            </a>
                            <a
                                href="/free-assessment"
                                className="flex items-center gap-1 text-[#282728] text-sm font-medium hover:opacity-60 transition-opacity duration-200"
                            >
                                Begin <ChevronRight size={15} />
                            </a>
                        </motion.div>
                    </div>
                </div>

                {/* ── Scrollable Timeline ─────────────────────────────── */}
                <div
                    className="overflow-x-auto pb-4"
                    style={{ WebkitOverflowScrolling: "touch" }}
                >
                    {/*
                        Three-row grid:
                          Row 1 — above cards (flex items aligned to bottom)
                          Row 2 — horizontal rail with dots
                          Row 3 — below cards (flex items aligned to top)
                    */}
                    <div
                        style={{
                            minWidth: `${milestones.length * CARD_W + 40}px`,
                            display: "grid",
                            gridTemplateRows: `auto ${STEM_H}px ${STEM_H}px auto`,
                        }}
                    >

                        {/* ── Row 1: Above cards ─────────────────────── */}
                        <div className="flex items-end" style={{ gridRow: "1" }}>
                            {milestones.map((step, i) => (
                                <div
                                    key={i}
                                    className="flex justify-center"
                                    style={{ width: `${CARD_W}px`, flexShrink: 0 }}
                                >
                                    {step.above && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: "-40px" }}
                                            transition={{ delay: i * 0.06, duration: 0.45 }}
                                        >
                                            <Card step={step} />
                                        </motion.div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* ── Row 2: stem (above) → dot ──────────────── */}
                        <div className="flex" style={{ gridRow: "2" }}>
                            {milestones.map((step, i) => (
                                <div
                                    key={i}
                                    className="flex items-end justify-center"
                                    style={{ width: `${CARD_W}px`, flexShrink: 0 }}
                                >
                                    {step.above && (
                                        <div
                                            className="w-px bg-gray-300"
                                            style={{ height: `${STEM_H}px` }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* ── Row 3: dot rail + stem (below start) ───── */}
                        <div className="flex items-center" style={{ gridRow: "3" }}>
                            {milestones.map((step, i) => (
                                <div
                                    key={i}
                                    className="flex items-center"
                                    style={{ width: `${CARD_W}px`, flexShrink: 0 }}
                                >
                                    {/* Leading line */}
                                    <div className="flex-1 h-px bg-gray-300" />

                                    {/* Dot */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        whileInView={{ scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            delay: i * 0.06 + 0.1,
                                            type: "spring",
                                            stiffness: 350,
                                            damping: 18,
                                        }}
                                        className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-[#282728] shadow-sm z-10"
                                        style={{ boxShadow: "0 0 0 3px #fff, 0 0 0 4.5px #282728" }}
                                    />

                                    {/* Trailing line for last item */}
                                    {i === milestones.length - 1 && (
                                        <div className="flex-1 h-px bg-gray-300" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* ── Row 4: stem (below) + below cards ─────── */}
                        <div className="flex items-start" style={{ gridRow: "4" }}>
                            {milestones.map((step, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col items-center"
                                    style={{ width: `${CARD_W}px`, flexShrink: 0 }}
                                >
                                    {!step.above && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: "-40px" }}
                                            transition={{ delay: i * 0.06, duration: 0.45 }}
                                            className="flex flex-col items-center"
                                        >
                                            <div
                                                className="w-px bg-gray-300"
                                                style={{ height: `${STEM_H}px` }}
                                            />
                                            <Card step={step} />
                                        </motion.div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile scroll hint */}
                <p className="text-center text-[10px] text-gray-300 mt-3 tracking-widest uppercase select-none md:hidden">
                    ← Scroll to explore →
                </p>
            </div>
        </section>
    );
}

// ── Card ────────────────────────────────────────────────────────────────────
function Card({ step }) {
    return (
        <div
            className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-300"
            style={{ width: "140px" }}
        >
            {/* Image */}
            <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                    src={step.img}
                    alt={step.day}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Text body */}
            <div className="p-2.5">
                <p className="text-[11px] font-bold text-[#282728] mb-1">{step.day}</p>
                <p className="text-[10px] text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
        </div>
    );
}
