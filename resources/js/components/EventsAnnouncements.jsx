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
        <section className="bg-white font-urbanist">
            <div className="max-w-7xl mx-auto px-6">
                {/* Banner Carousel */}
                <div className="relative group">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={page}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="bg-white rounded-[1.5rem] shadow-xl overflow-hidden border border-gray-100 flex flex-col lg:flex-row min-h-[320px]"
                        >
                            {/* Image Side */}
                            <div className="lg:w-1/2 relative h-48 lg:h-auto overflow-hidden">
                                <img
                                    src={articles[page].image}
                                    alt={articles[page].title}
                                    className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent hidden lg:block"></div>
                                
                                {/* Date Badge */}
                                <div className="absolute top-4 left-4 bg-[#282728] text-white text-[9px] font-bold px-3 py-1.5 rounded-md shadow-lg uppercase tracking-widest">
                                    {articles[page].date}
                                </div>
                            </div>

                            {/* Content Side */}
                            <div className="lg:w-1/2 p-8 lg:p-10 flex flex-col justify-center bg-white">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-[9px] font-bold text-[#436235] uppercase tracking-[0.3em]">Latest Announcement</span>
                                    <div className="h-[1px] w-6 bg-[#436235]"></div>
                                </div>
                                <h3 className="text-xl lg:text-2xl font-black text-[#282728] mb-4 leading-tight hover:text-[#436235] transition-colors cursor-default">
                                    {articles[page].title}
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-8 font-light line-clamp-2">
                                    {articles[page].excerpt}
                                </p>
                                <a
                                    href={articles[page].link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#282728] text-white text-[10px] font-bold rounded-xl hover:bg-[#436235] transition-all uppercase tracking-[0.2em] shadow-lg active:scale-95 w-fit group/btn"
                                >
                                    Read Story
                                    <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </a>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Controlls */}
                    <div className="absolute -left-6 lg:-left-10 top-1/2 -translate-y-1/2 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                            onClick={prev}
                            className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-xl border border-gray-100 hover:bg-[#436235] hover:text-white transition-all transform hover:scale-110 active:scale-95"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    </div>
                    <div className="absolute -right-6 lg:-right-10 top-1/2 -translate-y-1/2 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                            onClick={next}
                            className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-xl border border-gray-100 hover:bg-[#436235] hover:text-white transition-all transform hover:scale-110 active:scale-95"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>

                {/* Progressive Indicators */}
                <div className="flex justify-center gap-3 mt-12">
                    {articles.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === page ? 'bg-[#436235] w-12' : 'bg-gray-200 w-4'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
