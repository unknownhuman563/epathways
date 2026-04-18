import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

// ── Assets ───────────────────────────────────────────────────────────────────
import testi1 from "@assets/Testimonies/testi1.png";
import testi2 from "@assets/Testimonies/testi2.png";
import testi3 from "@assets/Testimonies/testi3.png";

// ── Data ─────────────────────────────────────────────────────────────────────
const stories = [
    {
        id: 1,
        name: "Priya Sharma",
        role: "Student, Canada",
        quote: "ePathways made the whole process feel manageable. They answered every question and never made me feel rushed.",
        image: testi1,
        rating: 5,
    },
    {
        id: 2,
        name: "Franz & Juniven",
        role: "Skilled Migrants, Auckland",
        quote: "From the first consultation to our visa approval, the team guided us with honesty and care every single step.",
        image: testi2,
        rating: 5,
    },
    {
        id: 3,
        name: "Marilyn Kinto",
        role: "Student Arrival, Gold Coast",
        quote: "I was nervous about studying abroad, but ePathways handled everything efficiently. I could not have done it without them.",
        image: testi3,
        rating: 5,
    },
];

export default function SuccessStories() {
    const [active, setActive] = useState(0);

    const prev = () => setActive((p) => (p - 1 + stories.length) % stories.length);
    const next = () => setActive((p) => (p + 1) % stories.length);

    const story = stories[active];

    return (
        <section className="py-16 bg-white font-urbanist">
            <div className="max-w-6xl mx-auto px-6 md:px-12">

                {/* ── Section heading ───────────────────────────────── */}
                <div className="mb-10">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-2">
                        Testimonials
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] leading-tight">
                        What Our Clients Say
                    </h2>
                </div>

                {/* ── Main row ──────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row gap-0">

                    {/* Left — portrait photo */}
                    <div
                        className="flex-shrink-0 bg-[#e8e8e4] overflow-hidden"
                        style={{ width: "43%", maxHeight: "380px" }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={story.id}
                                src={story.image}
                                alt={story.name}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="w-full h-full object-cover object-top"
                                style={{ maxHeight: "380px" }}
                            />
                        </AnimatePresence>
                    </div>

                    {/* Right — testimonial content */}
                    <div
                        className="flex-1 flex flex-col justify-center"
                        style={{ paddingLeft: "3.5rem", paddingTop: "2rem", paddingBottom: "2rem" }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={story.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.35 }}
                            >
                                {/* Stars */}
                                <div className="flex items-center gap-0.5 mb-5">
                                    {[...Array(story.rating)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={18}
                                            className="fill-[#1a1a1a] text-[#1a1a1a]"
                                        />
                                    ))}
                                </div>

                                {/* Quote */}
                                <p className="text-[15px] text-[#1a1a1a] leading-[1.65] mb-7 max-w-sm">
                                    &ldquo;{story.quote}&rdquo;
                                </p>

                                {/* Name / Role / Brand */}
                                <div className="flex items-center gap-6">
                                    {/* Name + role */}
                                    <div>
                                        <p className="text-sm font-bold text-[#1a1a1a] leading-tight">
                                            {story.name}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                                            {story.role}
                                        </p>
                                    </div>

                                    {/* Divider */}
                                    <div className="w-px h-8 bg-gray-200 flex-shrink-0" />

                                    {/* ePathways logo */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {/* "W"-style icon replicating the reference */}
                                        <svg width="22" height="16" viewBox="0 0 22 16" fill="none" className="flex-shrink-0">
                                            <path d="M0 0h4l3 10 3-10h6l3 10 3-10h4L17 16h-4l-3-9-3 9H3L0 0z" fill="#1a1a1a"/>
                                        </svg>
                                        <span className="text-sm font-bold text-[#1a1a1a] tracking-tight">
                                            ePathways
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── Bottom controls ───────────────────────────────── */}
                <div className="mt-5 flex items-center justify-between">

                    {/* Dot indicators — left */}
                    <div className="flex items-center gap-1.5">
                        {stories.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActive(i)}
                                style={{
                                    width: i === active ? "18px" : "7px",
                                    height: "7px",
                                    borderRadius: "9999px",
                                    background: i === active ? "#1a1a1a" : "#d1d5db",
                                    transition: "all 0.25s ease",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                }}
                            />
                        ))}
                    </div>

                    {/* Arrow buttons — right */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={prev}
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                border: "1px solid #e5e7eb",
                                background: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.querySelector("svg").style.color = "#fff"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.querySelector("svg").style.color = "#1a1a1a"; }}
                        >
                            <ChevronLeft size={15} color="#1a1a1a" />
                        </button>
                        <button
                            onClick={next}
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                border: "1px solid #e5e7eb",
                                background: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.querySelector("svg").style.color = "#fff"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.querySelector("svg").style.color = "#1a1a1a"; }}
                        >
                            <ChevronRight size={15} color="#1a1a1a" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
