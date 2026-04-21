import React from 'react';
import { motion } from 'framer-motion';

const images = import.meta.glob("/resources/Assets/Services/*", { eager: true, import: "default" });

const imageMap = Object.keys(images).reduce((acc, key) => {
    const filename = key.split("/").pop();
    acc[filename] = images[key];
    return acc;
}, {});

export default function InDemandPrograms() {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: direction === 'left' ? -680 : 680, behavior: 'smooth' });
    };

    return (
        <section className="py-24 bg-[#121613] text-white font-urbanist">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gray-400">Programs</p>
                        <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-2">
                            Top In-Demand Programs
                        </h2>
                        <p className="text-sm md:text-base text-gray-300">
                            The most sought-after qualifications for NZ immigration and career pathways
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => scroll('left')}
                            className="w-11 h-11 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="w-11 h-11 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors"
                            aria-label="Scroll right"
                        >
                            <ChevronRight size={20} />
                        </button>
                        <a
                            href="/programs-levels"
                            className="border border-white/20 px-6 py-2.5 text-sm hover:bg-white/10 transition-colors ml-2"
                        >
                            Explore all
                        </a>
                    </div>
                </div>

                {/* Horizontal Scrollable Row */}
                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto pb-4 scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            className="flex-shrink-0 w-[320px] bg-white text-[#1a1a1a] rounded-xl overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300"
                        >
                            {/* Image */}
                            <div className="relative h-48 w-full overflow-hidden bg-[#2a3a2a]">
                                <img
                                    src={cat.image}
                                    alt={cat.title}
                                    className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                                />
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex flex-col flex-grow">
                                {/* Tags */}
                                <div className="flex gap-2 mb-3">
                                    {cat.tags.map((tag, i) => (
                                        <span key={i} className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-semibold rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Title */}
                                <h3 className="text-base font-bold text-gray-800 leading-snug mb-2">
                                    {cat.title}
                                </h3>

                                {/* Programs list */}
                                <ul className="space-y-1 mb-4 flex-grow">
                                    {cat.programs.map((prog, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700 leading-relaxed">
                                            <span className="text-gray-500 mt-0.5">›</span>
                                            <span>{prog}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Intakes */}
                                <p className="text-[11px] text-gray-500 mb-4">
                                    Intakes: <span className="text-gray-700 font-semibold">{cat.intakes.join(", ")}</span>
                                </p>

                                {/* Explore link */}
                                <a
                                    href="/programs-levels"
                                    className="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                    Explore all <span className="text-base leading-none">›</span>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
