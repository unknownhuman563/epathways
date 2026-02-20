import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import sb19Image from "@assets/Events/sb19.png";
import garyVImage from "@assets/Events/garyv.jpg";
import newRightsImage from "@assets/Events/newrights.jpg";
import epathphImage from "@assets/Events/epathph.jpg";
import immigrationImage from "@assets/Events/immigration.png";
import studentHoursImage from "@assets/Events/studenthours.jpg";

const articles = [
    {
        image: sb19Image,
        date: "15 February 2025",
        title: "SB19's New Zealand Visas Approved with ePathways as Visa Partner",
        excerpt:
            "Great news! SB19's New Zealand visas have been approved! ePathways is honored to support this milestone as their trusted Visa Servicing Partner.",
        link: "https://forms.clickup.com/8461429/f/6zflon9-5161/0k6qeptd",
    },
    {
        image: garyVImage,
        date: "10 January 2025",
        title: "GaryVee's Insights on Immigration and Global Opportunities",
        excerpt:
            "Catch the latest insights from business mogul GaryVee on how immigration shapes global entrepreneurship and unlocks new pathways.",
        link: "#",
    },
    {
        image: newRightsImage,
        date: "05 December 2024",
        title: "New Rights for Migrants: What You Need to Know",
        excerpt:
            "Stay up to date with the latest changes in migration law and understand how new rights affect your journey to New Zealand.",
        link: "#",
    },
    {
        image: epathphImage,
        date: "20 November 2024",
        title: "ePathways Philippines: Expanding Our Reach",
        excerpt:
            "ePathways continues to grow its presence across the Philippines, connecting more families with trusted immigration services.",
        link: "#",
    },
    {
        image: immigrationImage,
        date: "01 November 2024",
        title: "Immigration Updates: Key Policy Changes for 2025",
        excerpt:
            "A comprehensive look at the most important immigration policy shifts coming in 2025 and how they may impact your plans.",
        link: "#",
    },
    {
        image: studentHoursImage,
        date: "15 October 2024",
        title: "Student Work Hours: Latest Updates from Immigration NZ",
        excerpt:
            "International students in New Zealand can now benefit from updated work hour allowances. Learn what this means for you.",
        link: "#",
    },
];

const CARDS_PER_PAGE = 3;
const totalPages = Math.ceil(articles.length / CARDS_PER_PAGE);

const slideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' } },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60, transition: { duration: 0.3, ease: 'easeIn' } }),
};

export default function EventsAnnouncements() {
    const [page, setPage] = useState(0);
    const [direction, setDirection] = useState(1);

    const goTo = (next) => {
        setDirection(next > page ? 1 : -1);
        setPage(next);
    };

    const prev = () => goTo((page - 1 + totalPages) % totalPages);
    const next = () => goTo((page + 1) % totalPages);

    // Auto-play: advance every 4 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setDirection(1);
            setPage((p) => (p + 1) % totalPages);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    const visible = articles.slice(page * CARDS_PER_PAGE, page * CARDS_PER_PAGE + CARDS_PER_PAGE);

    return (
        <section className="py-20 bg-white font-urbanist">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <p className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-2">
                        News &amp; Announcements
                    </p>
                    <h2 className="text-3xl md:text-4xl font-black text-[#282728]">
                        Our Latest News &amp; Updates
                    </h2>
                </div>

                {/* Carousel */}
                <div className="relative">
                    {/* Prev Arrow */}
                    <button
                        onClick={prev}
                        aria-label="Previous"
                        className="absolute -left-14 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 hover:bg-[#436235] hover:text-white hover:border-[#436235] transition-all duration-200 text-gray-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Cards */}
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={page}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                        >
                            {visible.map((article, i) => (
                                <div key={i} className="group flex flex-col">
                                    {/* Image with date badge */}
                                    <div className="relative overflow-hidden aspect-[4/3]">
                                        <img
                                            src={article.image}
                                            alt={article.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute bottom-0 right-0 bg-[#282728] text-white text-xs font-semibold px-3 py-1.5">
                                            {article.date}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="pt-4 flex flex-col flex-1">
                                        <h3 className="text-lg font-black text-[#282728] mb-2 leading-snug group-hover:text-[#436235] transition-colors duration-300">
                                            {article.title}
                                        </h3>
                                        <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1">
                                            {article.excerpt}
                                        </p>
                                        <a
                                            href={article.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-semibold text-[#436235] underline underline-offset-2 hover:text-[#2d4224] transition-colors duration-200 w-fit"
                                        >
                                            Read More
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* Next Arrow */}
                    <button
                        onClick={next}
                        aria-label="Next"
                        className="absolute -right-14 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 hover:bg-[#436235] hover:text-white hover:border-[#436235] transition-all duration-200 text-gray-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Dot indicators */}
                <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            aria-label={`Go to page ${i + 1}`}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === page ? 'bg-[#436235] w-6' : 'bg-gray-300'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
