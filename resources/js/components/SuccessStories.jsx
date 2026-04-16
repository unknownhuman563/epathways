import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';

// Project Assets
import testi1 from "@assets/Testimonies/testi1.png";
import testi2 from "@assets/Testimonies/testi2.png";
import testi3 from "@assets/Testimonies/testi3.png";

const stories = [
    {
        id: 1,
        title: "Ely Family",
        location: "PERTH, AUSTRALIA",
        date: "Mar 2025",
        category: "FAMILY VISA",
        image: testi1,
    },
    {
        id: 2,
        title: "Franz & Juniven",
        location: "AUCKLAND, NEW ZEALAND",
        date: "Oct 2025",
        category: "SKILLED VISA",
        image: testi2,
    },
    {
        id: 3,
        title: "Marilyn Kinto",
        location: "GOLD COAST, AUSTRALIA",
        date: "Jan 2025",
        category: "STUDENT ARRIVAL",
        image: testi3,
    },
    {
        id: 4,
        title: "Cruz Family",
        location: "MELBOURNE, AUSTRALIA",
        date: "Feb 2025",
        category: "FAMILY VISA",
        image: testi1,
    },
    {
        id: 5,
        title: "Garcia Family",
        location: "BRISBANE, AUSTRALIA",
        date: "Apr 2025",
        category: "SKILLED VISA",
        image: testi2,
    },
];

export default function SuccessStories() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const nextStory = () => setActiveIndex((prev) => (prev + 1) % stories.length);
    const prevStory = () => setActiveIndex((prev) => (prev - 1 + stories.length) % stories.length);

    const activeStory = stories[activeIndex];
    const brandColor = "#1a1a1a";

    // Formatting helper
    const padZero = (num) => num.toString().padStart(2, '0');

    return (
        <section className="py-24 relative font-urbanist overflow-hidden bg-[#fafbfa]">
            {/* Dynamic Background */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                {/* Dot Pattern */}
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#4a7c59 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.05 }} />

                {/* Large Background Text */}
                <motion.div
                    initial={{ x: "-5%" }}
                    animate={{ x: "5%" }}
                    transition={{ repeat: Infinity, duration: 25, repeatType: "reverse", ease: "easeInOut" }}
                    className="absolute top-[5%] whitespace-nowrap text-[18vw] font-black text-[#4a7c59]/[0.03] -z-10 select-none tracking-tighter"
                >
                    SUCCESS STORIES
                </motion.div>

                {/* Glow Blobs */}
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[40vw] h-[40vw] bg-[#4a7c59]/10 blur-[100px] rounded-full -z-10" />
                <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[30vw] h-[30vw] bg-yellow-500/10 blur-[100px] rounded-full -z-10" />
            </div>

            <div className="max-w-[1000px] mx-auto px-4 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4a7c59]/10 border border-[#4a7c59]/20 mb-6">
                        <span className="w-2 h-2 rounded-full bg-[#4a7c59] animate-pulse" />
                        <p className="text-[11px] font-bold tracking-[0.2em] text-[#4a7c59] uppercase">TESTIMONIALS</p>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight" style={{ color: brandColor }}>
                        Student <span className="text-[#4a7c59]">Success</span> Stories
                    </h2>
                </motion.div>

                {/* Main Card Container */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100">

                    {/* Top Section: Media */}
                    <div className="relative aspect-video w-full bg-gray-100 overflow-hidden group">
                        <AnimatePresence mode="popLayout">
                            <motion.img
                                key={activeStory.id}
                                src={activeStory.image}
                                alt={activeStory.title}
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </AnimatePresence>

                        {/* Top Right Badge */}
                        <div className="absolute top-6 right-6 z-20">
                            <div className="px-4 py-1.5 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm shadow-xl">
                                <span className="text-[11px] font-bold tracking-widest text-white">{activeStory.category}</span>
                            </div>
                        </div>

                        {/* Center Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-20 h-20 rounded-full border border-white/40 bg-white/20 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto transition-transform hover:scale-110 shadow-2xl"
                            >
                                <Play className="w-8 h-8 fill-white ml-2" />
                            </button>
                        </div>
                    </div>

                    {/* Bottom Section: Info */}
                    <div className="p-8 pb-10">
                        {/* Fractional counter inside the card */}
                        <div className="mb-4">
                            <span className="text-sm font-bold tracking-widest text-[#4a7c59]">
                                {padZero(activeIndex + 1)} / {padZero(stories.length)}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-[1px] bg-gray-200 mb-6" />

                        {/* Story Details */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h3 className="text-3xl md:text-4xl font-black text-[#1a1a1a] mb-2">
                                        {activeStory.title}
                                    </h3>
                                    <p className="text-sm font-bold tracking-widest text-gray-500 uppercase">
                                        {activeStory.location} <span className="mx-2 text-gray-300">•</span> {activeStory.date}
                                    </p>
                                </motion.div>
                            </AnimatePresence>

                            {/* Bottom Right Category Badge */}
                            <div className="shrink-0">
                                <div className="px-6 py-2.5 rounded-full border border-[#4a7c59]/20 bg-[#4a7c59]/5 hover:bg-[#4a7c59]/10 transition-colors cursor-pointer">
                                    <span className="text-[11px] font-bold tracking-widest text-[#4a7c59]">{activeStory.category}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* External Pagination Controls */}
                <div className="mt-16 flex items-center justify-center gap-6">
                    <button
                        onClick={prevStory}
                        className="w-14 h-14 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-white hover:bg-[#1a1a1a] hover:border-[#1a1a1a] transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 sm:gap-6 bg-white px-4 sm:px-8 py-3 sm:py-4 rounded-full border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="flex items-center gap-2">
                            {stories.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveIndex(idx)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex
                                            ? 'w-6 bg-[#4a7c59]'
                                            : 'w-1.5 bg-gray-200 hover:bg-gray-300'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="text-sm font-bold text-gray-700 tracking-widest border-l border-gray-200 pl-6">
                            {activeIndex + 1} <span className="text-gray-400">/</span> {stories.length}
                        </div>
                    </div>

                    <button
                        onClick={nextStory}
                        className="w-14 h-14 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-white hover:bg-[#1a1a1a] hover:border-[#1a1a1a] transition-all"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-4 md:p-12"
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 transition-all z-[110]"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="w-full max-w-5xl">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl"
                            >
                                <img
                                    src={activeStory.image}
                                    alt={activeStory.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/10" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                                        <Play className="w-10 h-10 text-white fill-white ml-2" />
                                    </div>
                                </div>
                            </motion.div>

                            <div className="mt-8 flex flex-col md:flex-row items-end justify-between gap-6 px-2">
                                <div>
                                    <h2 className="text-4xl md:text-5xl font-black text-white">{activeStory.title}</h2>
                                    <p className="text-white/50 text-sm md:text-base font-bold tracking-widest mt-2 uppercase">
                                        {activeStory.location} <span className="mx-2">•</span> {activeStory.date}
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={prevStory} className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all">
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button onClick={nextStory} className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all">
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
