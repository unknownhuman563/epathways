import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight } from 'react-feather';
import { Link } from '@inertiajs/react';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import PromoBanner from "@/components/ui/PromoBanner";
import PromoModal from "@/components/ui/PromoModal";

// Assets
import heroBg from "@assets/Services/education.png";
import placeholderImg from "@assets/Services/education.png";


export default function ProgramsLevels({ programs = [], activePromos = [] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [visibleCount, setVisibleCount] = useState(8); // Start with 8 visible cards

    const filteredPrograms = programs
        .filter(program => {
            const matchesSearch = (program.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (program.institution || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = activeFilter === 'all' || program.category === activeFilter;
            return matchesSearch && matchesFilter;
        })
        // Sort by NZQA level descending so the highest qualifications surface
        // first: Doctorate (10) → Master's (9) → PG Dip (8) → Bachelor (7) →
        // Diploma (5–6). Numeric coerce because `level` arrives as a string
        // on some legacy records; missing levels sink to the bottom.
        .sort((a, b) => (Number(b.level) || 0) - (Number(a.level) || 0));

    const visiblePrograms = filteredPrograms.slice(0, visibleCount);

    const handleSeeMore = () => {
        setVisibleCount(prev => prev + 12); // Show 12 more on click
    };

    return (
        <div className="min-h-screen bg-white font-urbanist overflow-x-hidden">
            <Navbar />

            {/* Live programme promotions — strip below navbar (hidden when none) */}
            <PromoBanner promos={activePromos} variant="strip" />
            <PromoModal promos={activePromos} />

            {/* Featured promo card — only renders if there are active promos */}
            {activePromos.length > 0 && <PromoBanner promos={activePromos} variant="card" />}

            {/* Hero Section with Overlaid Statistics */}
            <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-visible mb-20">
                <img
                    src={heroBg}
                    alt="University Building"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30"></div>

                <div className="relative z-10 container mx-auto px-4 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-3xl md:text-4xl lg:text-5xl font-normal text-white max-w-3xl mx-auto leading-tight tracking-wide"
                        style={{ fontWeight: 400 }}
                    >
                        good education to build a better future
                    </motion.h1>
                </div>

                {/* Statistics Bar - Overlaid at bottom */}
                <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 z-20">
                    <div className="container mx-auto px-4">
                        <div className="bg-[#1a1a1a] py-6 md:py-8 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] max-w-6xl mx-auto border border-white/5 backdrop-blur-sm">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center text-white relative">
                                {/* Dividers for larger screens */}
                                <div className="hidden md:block absolute top-1/2 left-1/4 -translate-y-1/2 w-px h-12 bg-white/10"></div>
                                <div className="hidden md:block absolute top-1/2 left-1/2 -translate-y-1/2 w-px h-12 bg-white/10"></div>
                                <div className="hidden md:block absolute top-1/2 left-3/4 -translate-y-1/2 w-px h-12 bg-white/10"></div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 }}
                                    className="flex flex-col items-center justify-center p-2"
                                >
                                    <h3 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight">12+</h3>
                                    <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-[0.2em] font-medium">Categories<br />Programs</p>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="flex flex-col items-center justify-center p-2"
                                >
                                    <h3 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight">5-9</h3>
                                    <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-[0.2em] font-medium">Levels Offered</p>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 }}
                                    className="flex flex-col items-center justify-center p-2"
                                >
                                    <h3 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight">63</h3>
                                    <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-[0.2em] font-medium">Fields of Study</p>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 }}
                                    className="flex flex-col items-center justify-center p-2"
                                >
                                    <h3 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight">25+</h3>
                                    <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-[0.2em] font-medium">Partners<br />Institutions</p>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Search Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 max-w-7xl">
                    {/* Search Bar */}
                    <div className="mb-20 mt-32">
                        <div className="relative max-w-xl mx-auto">
                            <input
                                type="text"
                                placeholder="Search programs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-16 py-4 rounded-full border border-gray-200 bg-white text-gray-600 placeholder-gray-400/80 focus:outline-none focus:border-gray-400 focus:ring-0 transition-colors text-lg font-light tracking-wide shadow-sm"
                            />
                            <button className="absolute right-6 top-1/2 -translate-y-1/2 p-2 group">
                                <Search className="w-6 h-6 text-black group-hover:scale-110 transition-transform duration-200" strokeWidth={2} />
                            </button>
                        </div>
                    </div>

                    {/* Header and Filter Tabs */}
                    <div className="flex flex-col md:flex-row items-end justify-between mb-12 border-b-0">
                        <div className="mb-6 md:mb-0">
                            <h2 className="text-4xl md:text-5xl font-normal text-[#282728] uppercase tracking-wide mb-1">Discover</h2>
                            <h3 className="text-xl font-normal text-gray-600 uppercase tracking-widest pl-1">Top Courses</h3>
                        </div>

                        <div className="flex gap-8 pb-2">
                            <button
                                onClick={() => setActiveFilter('all')}
                                className={`text-sm font-bold uppercase tracking-widest pb-2 transition-all border-b-2 ${activeFilter === 'all'
                                    ? 'text-[#436235] border-[#436235]'
                                    : 'text-gray-600 border-transparent hover:text-gray-900'
                                    }`}
                            >
                                All Programs
                            </button>
                            <button
                                onClick={() => setActiveFilter('diplomas')}
                                className={`text-sm font-bold uppercase tracking-widest pb-2 transition-all border-b-2 ${activeFilter === 'diplomas'
                                    ? 'text-[#436235] border-[#436235]'
                                    : 'text-gray-600 border-transparent hover:text-gray-900'
                                    }`}
                            >
                                Diplomas
                            </button>
                            <button
                                onClick={() => setActiveFilter('bachelors')}
                                className={`text-sm font-bold uppercase tracking-widest pb-2 transition-all border-b-2 ${activeFilter === 'bachelors'
                                    ? 'text-[#436235] border-[#436235]'
                                    : 'text-gray-600 border-transparent hover:text-gray-900'
                                    }`}
                            >
                                Bachelor
                            </button>
                            <button
                                onClick={() => setActiveFilter('masters')}
                                className={`text-sm font-bold uppercase tracking-widest pb-2 transition-all border-b-2 ${activeFilter === 'masters'
                                    ? 'text-[#436235] border-[#436235]'
                                    : 'text-gray-600 border-transparent hover:text-gray-900'
                                    }`}
                            >
                                PG / Masters
                            </button>
                        </div>
                    </div>

                    {/* Program Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {visiblePrograms.map((program, index) => (
                            <motion.div
                                key={program.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                            >
                                {/* Card — editorial / premium treatment.
                                    Single hairline frame, edge-to-edge
                                    photo with a vignette, level marker
                                    set as tracked white type on the image
                                    (not a pill), generous interior space,
                                    and a chevron link above a hairline
                                    divider instead of a heavy button.
                                    Restraint over ornament. */}
                                <Link
                                    href={`/program-details/${program.slug}`}
                                    className="bg-white border border-gray-200 hover:border-gray-400 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] transition-all duration-500 flex flex-col h-full group cursor-pointer"
                                >
                                    {/* Hero image — taller, edge-to-edge */}
                                    <div className="relative h-56 w-full overflow-hidden">
                                        <img
                                            src={program.image_url || placeholderImg}
                                            alt={program.title}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[1500ms] ease-out"
                                        />
                                        {/* Level marker — pinned to the top
                                            of the image as a small frosted
                                            pill so it stays legible against
                                            any photo background (the prior
                                            bottom-left white-on-photo
                                            treatment kept disappearing into
                                            light backgrounds). */}
                                        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[#282728] text-[9px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 shadow-sm">
                                            Level {program.level}
                                        </span>
                                    </div>

                                    {/* Content — generous padding, clear
                                        hierarchy: eyebrow → title →
                                        description → quiet CTA. */}
                                    <div className="p-7 flex flex-col flex-grow">
                                        {/* Eyebrow — intake · duration */}
                                        <p className="text-[10px] font-medium text-gray-500 tracking-[0.25em] uppercase mb-3">
                                            {program.intake_months || 'Intake TBA'}
                                            {program.duration_months && (
                                                <span className="mx-2 text-gray-300">·</span>
                                            )}
                                            {program.duration_months && `${program.duration_months} months`}
                                        </p>

                                        {/* Title */}
                                        <h4 className="text-xl font-medium text-[#282728] leading-snug tracking-tight mb-3">
                                            {program.title}
                                        </h4>

                                        {/* Description — real copy from the
                                            program record only. When a
                                            programme has no description on
                                            file the paragraph collapses
                                            entirely rather than printing a
                                            generic placeholder. */}
                                        {program.description && (
                                            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-6">
                                                {program.description}
                                            </p>
                                        )}

                                        {/* CTA — hairline divider + chevron
                                            link. Editorial, not a button. */}
                                        <div className="mt-auto pt-5 border-t border-gray-200">
                                            <span className="text-[11px] font-bold text-[#282728] uppercase tracking-[0.22em] flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
                                                Explore Programme
                                                <ArrowRight size={14} strokeWidth={2} className="group-hover:translate-x-1 transition-transform duration-300" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* See More Button */}
                    {visibleCount < filteredPrograms.length && (
                        <div className="text-center mt-16">
                            <button
                                onClick={handleSeeMore}
                                className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest"
                            >
                                See More
                            </button>
                        </div>
                    )}

                    {/* No Results */}
                    {filteredPrograms.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-600 text-sm">No programs found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </section>

            <ScrollToTop />
            <Footer />
        </div>
    );
}
