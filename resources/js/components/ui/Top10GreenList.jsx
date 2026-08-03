import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft } from "react-feather";

// Local fallback imagery (used until a matched programme has its own image).
import fbEducation from "@assets/Services/education.png";
import fbAgents from "@assets/Services/agents.png";
import fbPathways from "@assets/Services/pathways.png";
import fbJob from "@assets/Services/job.png";
import fbSettlement from "@assets/Services/settlement.png";
import fbVisa from "@assets/Services/visa.png";

const FALLBACKS = [fbEducation, fbAgents, fbPathways, fbJob, fbSettlement, fbVisa];

/**
 * "Best 10 New Zealand study programs for Green List residence" — a paged
 * gallery of numbered programme cards (5 per page), mirroring the reference:
 * each card sits beside a giant outlined ghost numeral peeking bottom-left,
 * with a LEVEL badge over the image, residence tier, title, short description
 * and an "EXPLORE PROGRAMME" link. Prev / Next flip between page 1 (ranks 1-5)
 * and page 2 (ranks 6-10) — exactly five cards are ever on screen.
 */
// `match` is a lowercase substring looked for inside a published programme's
// title to pull that programme's real image + detail link.
const PROGRAMS = [
    {
        title: "Master of Teaching and Learning",
        match: "teaching and learning",
        occupation: "Primary or secondary school teacher",
        residence: "Tier 1 · Straight to Residence",
        condition: "Must be an approved initial teacher-education program leading to Teaching Council registration.",
    },
    {
        title: "Master of Nursing Practice",
        match: "nursing practice",
        occupation: "Registered nurse",
        residence: "Tier 1 · Straight to Residence",
        condition: "Must be a pre-registration nursing program approved by the Nursing Council.",
    },
    {
        title: "Master of Engineering Studies / Professional Engineering",
        match: "engineering studies",
        occupation: "Civil, electrical, mechanical or environmental engineer",
        residence: "Tier 1 · Straight to Residence",
        condition: "Your total engineering education must satisfy Engineering New Zealand requirements.",
    },
    {
        title: "Master of Construction / Construction Management",
        match: "construction management",
        occupation: "Construction project manager",
        residence: "Tier 1 · Straight to Residence",
        condition: "Usually strongest for applicants who already have construction, engineering or architecture experience.",
    },
    {
        title: "Master of Quantity Surveying",
        match: "quantity surveying",
        occupation: "Quantity surveyor",
        residence: "Tier 1 · Straight to Residence",
        condition: "The qualification and previous studies must contain sufficient quantity-surveying or construction-economics content.",
    },
    {
        title: "Master of Environmental Science or Environmental Engineering",
        match: "environmental",
        occupation: "Environmental research scientist or environmental engineer",
        residence: "Tier 1 · Straight to Residence",
        condition: "Usually requires a relevant science or engineering bachelor's degree.",
    },
    {
        title: "Master of Food Science or Food Technology",
        match: "food science",
        occupation: "Food technologist",
        residence: "Tier 1 · Straight to Residence",
        condition: "Previous studies should be in food science, nutrition, technology, engineering or a related field.",
    },
    {
        title: "Professional Master's in Clinical Psychology",
        match: "clinical psychology",
        occupation: "Clinical psychologist",
        residence: "Tier 1 · Straight to Residence",
        condition: "Extremely competitive and must lead to registration with the Psychologists Board.",
    },
    {
        title: "Master of Applied Social Work",
        match: "social work",
        occupation: "Social worker",
        residence: "Tier 1 · Straight to Residence",
        condition: "Only choose a professionally accredited program that qualifies graduates for registration.",
    },
    {
        title: "Master of Speech Language Therapy Practice",
        match: "speech language",
        occupation: "Speech-language therapist",
        residence: "Green List pathway",
        condition: "Must lead to membership or recognition by the New Zealand Speech-language Therapists' Association.",
    },
];

const PER_PAGE = 5;

export default function Top10GreenList({ programs = [] }) {
    const [page, setPage] = useState(0);
    const [direction, setDirection] = useState(1);

    // Attach each curated card to a real published programme (by title match)
    // for its image + detail link, falling back to a Services asset.
    const cards = PROGRAMS.map((p, i) => {
        const hit = programs.find(
            (prog) => prog.title && prog.title.toLowerCase().includes(p.match),
        );
        return {
            ...p,
            image: hit?.image_url || FALLBACKS[i % FALLBACKS.length],
            href: hit?.slug ? `/program-details/${hit.slug}` : "/programs-levels",
        };
    });
    const pages = Math.ceil(PROGRAMS.length / PER_PAGE);
    const start = page * PER_PAGE;
    const shown = cards.slice(start, start + PER_PAGE);

    const go = (next) => {
        if (next < 0 || next >= pages) return;
        setDirection(next > page ? 1 : -1);
        setPage(next);
    };

    const variants = {
        enter: (dir) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
        center: { opacity: 1, x: 0 },
        exit: (dir) => ({ opacity: 0, x: dir > 0 ? -80 : 80 }),
    };

    return (
        <section className="bg-[#fcfcfc] text-[#282728] py-32 font-urbanist border-y border-gray-200 overflow-hidden">
            <div className="container mx-auto px-6 md:px-10 max-w-[1680px]">
                {/* Heading */}
                <div className="mb-16 text-center">
                    <div className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] mb-5">
                        Green List Pathways
                    </div>
                    <h2 className="text-3xl md:text-5xl leading-[1.05] tracking-tight text-[#1a1a1a]">
                        <span className="font-black">Best 10</span>{" "}
                        <span className="font-light">New Zealand study programs for Green List residence</span>
                    </h2>
                </div>

                {/* Card row (one page of 5) — arrows sit in the outer margins */}
                <div className="relative">
                    <div className="relative">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={page}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="flex flex-wrap md:flex-nowrap gap-16 justify-center pl-20 pr-4 pt-10 pb-20"
                        >
                            {shown.map((program, j) => {
                                const rank = start + j + 1;
                                return (
                                    <div key={rank} className="relative flex-1 min-w-[200px] md:min-w-0">
                                        {/* Giant ghost numeral — bottom-left, behind the
                                            cards so neighbours cover its sides and it peeks
                                            in the gap. */}
                                        <span
                                            aria-hidden
                                            className="pointer-events-none select-none absolute z-0 leading-none font-black text-transparent"
                                            style={{
                                                fontSize: "clamp(110px, 10vw, 165px)",
                                                WebkitTextStroke: "2px rgba(26,26,26,0.12)",
                                                left: "-58px",
                                                bottom: "-44px",
                                            }}
                                        >
                                            {rank}
                                        </span>

                                        {/* Card */}
                                        <div className="relative z-10 bg-white border border-gray-200 shadow-lg h-full flex flex-col">
                                            {/* Image / badge header */}
                                            <div className="relative h-36 bg-gray-100 overflow-hidden">
                                                <img
                                                    src={program.image}
                                                    alt={program.title}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover"
                                                />
                                                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-[#1a1a1a] text-[9px] font-bold uppercase tracking-[0.2em] px-2.5 py-1.5">
                                                    Level 9
                                                </span>
                                            </div>

                                            {/* Body */}
                                            <div className="p-6 flex flex-col flex-1">
                                                <div className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.18em] mb-3">
                                                    {program.residence}
                                                </div>

                                                <h3 className="text-base font-black text-[#1a1a1a] leading-snug mb-3">
                                                    {program.title}
                                                </h3>

                                                <p className="text-gray-500 text-xs leading-relaxed font-light mb-6 flex-1">
                                                    {program.condition}
                                                </p>

                                                <a
                                                    href={program.href}
                                                    className="inline-flex items-center gap-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-[0.2em] group"
                                                >
                                                    Explore Programme
                                                    <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                    </div>

                    {/* Prev — pushed into the left margin */}
                    <button
                        onClick={() => go(page - 1)}
                        disabled={page === 0}
                        aria-label="Previous programmes"
                        className="absolute top-1/2 -translate-y-1/2 left-[-16px] lg:left-[-104px] z-20 w-12 h-12 flex items-center justify-center bg-white border border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    {/* Next — pushed into the right margin */}
                    <button
                        onClick={() => go(page + 1)}
                        disabled={page === pages - 1}
                        aria-label="Next programmes"
                        className="absolute top-1/2 -translate-y-1/2 right-[-16px] lg:right-[-104px] z-20 w-12 h-12 flex items-center justify-center bg-[#1a1a1a] text-white hover:bg-black transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none"
                    >
                        <ArrowRight size={18} />
                    </button>
                </div>

                {/* Progress readout */}
                <div className="mt-8 text-center text-xs font-bold tracking-[0.2em] text-gray-500">
                    {String(start + 1).padStart(2, "0")}–{String(start + shown.length).padStart(2, "0")} / {PROGRAMS.length}
                </div>
            </div>
        </section>
    );
}
