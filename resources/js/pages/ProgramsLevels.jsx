import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight } from 'react-feather';
import Navbar from "@/components/navigation-bar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scrolltotop";

// Assets
import heroBg from "@assets/Services/education.png";
import programImg from "@assets/Testimonies/testi1.png";

// Comprehensive Program Data
const programsData = [
    // Level 5
    { id: 1, level: "Level 5", title: "NZ Diploma in Enrolled Nursing", institution: "Southern Institute of Tech", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 2, level: "Level 5", title: "NZ Diploma in Enrolled Nursing", institution: "Wintec", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 3, level: "Level 5", title: "NZ Diploma in Early Childhood Education", institution: "NZTC", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 4, level: "Level 5", title: "New Zealand Diploma in Hospitality Management", institution: "PIHMS", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 5, level: "Level 5", title: "NZ Diploma in IT Technical Support", institution: "NZSE", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 6, level: "Level 5", title: "NZ Diploma in IT Technical Support", institution: "International College of Auckland", price: "Contact for price", category: "diplomas", image: programImg },

    // Level 6
    { id: 7, level: "Level 6", title: "NZ Diploma in Engineering - Electronics", institution: "ICA", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 8, level: "Level 6", title: "NZ Diploma in Engineering - Electrical", institution: "ICA", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 9, level: "Level 6", title: "NZ Diploma in Engineering - Electronics", institution: "NZSE", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 10, level: "Level 6", title: "NZ Diploma in Engineering - Civil/Mechanical", institution: "Southern Institute of Tech", price: "Contact for price", category: "diplomas", image: programImg },

    // Level 7
    { id: 11, level: "Level 7", title: "Bachelor of Accounting", institution: "Wintec", price: "180,000!", category: "bachelors", image: programImg },
    { id: 12, level: "Level 7", title: "Bachelor of Nursing", institution: "Wintec", price: "180,000!", category: "bachelors", image: programImg },
    { id: 13, level: "Level 7", title: "Bachelor of Applied Hotel Management", institution: "PIHMS", price: "180,000!", category: "bachelors", image: programImg },
    { id: 14, level: "Level 7", title: "Bachelor of Applied Information Technology", institution: "Whitecliffe", price: "180,000!", category: "bachelors", image: programImg },
    { id: 15, level: "Level 7", title: "Bachelors of Applied Information Technology", institution: "Wintec", price: "180,000!", category: "bachelors", image: programImg },
    { id: 16, level: "Level 7", title: "Bachelor of Computer and Information Sciences", institution: "AUT", price: "180,000!", category: "bachelors", image: programImg },
    { id: 17, level: "Level 7", title: "Bachelor of Engineering Technology", institution: "AUT", price: "180,000!", category: "bachelors", image: programImg },
    { id: 18, level: "Level 7", title: "Bachelor of Engineering (Honours)", institution: "AUT", price: "180,000!", category: "bachelors", image: programImg },
    { id: 19, level: "Level 7", title: "Bachelor of Software Engineering", institution: "Yoobee", price: "180,000!", category: "bachelors", image: programImg },
    { id: 20, level: "Level 7", title: "Bachelor of Engineering Technology", institution: "Wintec", price: "180,000!", category: "bachelors", image: programImg },
    { id: 21, level: "Level 7", title: "Bachelor of Applied Management", institution: "Wintec", price: "180,000!", category: "bachelors", image: programImg },
    { id: 22, level: "Level 7", title: "Bachelor of Applied Management", institution: "Future Skills", price: "180,000!", category: "bachelors", image: programImg },
    { id: 23, level: "Level 7", title: "Bachelors in Applied Management", institution: "ATMC", price: "180,000!", category: "bachelors", image: programImg },
    { id: 24, level: "Level 7", title: "Bachelor of Teaching (ECE)", institution: "NZTC", price: "180,000!", category: "bachelors", image: programImg },
    { id: 25, level: "Level 7", title: "Bachelor of Teaching (ECE)", institution: "Te Rito Maioha", price: "180,000!", category: "bachelors", image: programImg },
    { id: 26, level: "Level 7", title: "Bachelor of Teaching (Primary)", institution: "Te Rito Maioha", price: "180,000!", category: "bachelors", image: programImg },

    // Level 7 Diplomas/Graduate Diplomas
    { id: 27, level: "Level 7", title: "Graduate Diploma in Teaching (ECE)", institution: "ICL Graduate Business School", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 28, level: "Level 7", title: "Graduate Diploma in Teaching (ECE)", institution: "NZTC", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 29, level: "Level 7", title: "NZ Diploma in Healthcare Management", institution: "ATMC", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 30, level: "Level 7", title: "Diploma in Applied Network and Cloud Tech", institution: "NZSE", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 31, level: "Level 7", title: "Diploma in Community Healthcare and Support", institution: "NZSE", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 32, level: "Level 7", title: "Diploma in Software Development", institution: "ATMC", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 33, level: "Level 7", title: "Graduate Diploma in Teaching (ECE)", institution: "NZTC", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 34, level: "Level 7", title: "Graduate Diploma of Teaching (Primary)", institution: "Te Rito Maioha", price: "Contact for price", category: "diplomas", image: programImg },
    { id: 35, level: "Level 7", title: "Graduate Diploma of Teaching (ECE)", institution: "Te Rito Maioha", price: "Contact for price", category: "diplomas", image: programImg },

    // Level 8
    { id: 36, level: "Level 8", title: "Postgraduate Diploma in AI Integrated Solutions", institution: "Future Skills", price: "Contact for price", category: "masters", image: programImg }, // Grouping PG with Masters for simplicity or create separate? Using 'masters' as PG/Masters bucket for now to keep filters simple, or add 'postgraduate'
    { id: 37, level: "Level 8", title: "Postgraduate Diploma in Applied Hotel Management", institution: "PIHMS", price: "Contact for price", category: "masters", image: programImg },
    { id: 38, level: "Level 8", title: "Postgraduate Diploma in Healthcare (Addiction Support)", institution: "NZSE", price: "Contact for price", category: "masters", image: programImg },
    { id: 39, level: "Level 8", title: "Postgraduate Certificate in Business Administration (PGCBA)", institution: "Auckland Institute of Studies", price: "Contact for price", category: "masters", image: programImg },

    // Level 9
    { id: 40, level: "Level 9", title: "Master of Business Informatics", institution: "ICL Graduate Business School", price: "Contact for price", category: "masters", image: programImg },
    { id: 41, level: "Level 9", title: "Master of Business Informatics (Thesis)", institution: "ICL Graduate Business School", price: "Contact for price", category: "masters", image: programImg },
    { id: 42, level: "Level 9", title: "Master of Management", institution: "ICL Graduate Business School", price: "Contact for price", category: "masters", image: programImg },
    { id: 43, level: "Level 9", title: "Master of Management (Thesis)", institution: "ICL Graduate Business School", price: "Contact for price", category: "masters", image: programImg },
    { id: 44, level: "Level 9", title: "Master of Management (Healthcare)", institution: "ICL Graduate Business School", price: "Contact for price", category: "masters", image: programImg },
    { id: 45, level: "Level 9", title: "Master of Business Administration", institution: "Auckland Institute of Studies", price: "Contact for price", category: "masters", image: programImg },
    { id: 46, level: "Level 9", title: "Master of Information Technology", institution: "Auckland Institute of Studies", price: "Contact for price", category: "masters", image: programImg },
    { id: 47, level: "Level 9", title: "Master of Applied Hotel Management", institution: "PIHMS", price: "Contact for price", category: "masters", image: programImg },
    { id: 48, level: "Level 9", title: "Master of Business Informatics", institution: "Yoobee", price: "Contact for price", category: "masters", image: programImg },
    { id: 49, level: "Level 9", title: "Master of Software Engineering", institution: "Yoobee", price: "Contact for price", category: "masters", image: programImg },
    { id: 50, level: "Level 9", title: "Master of Information Technology", institution: "Whitecliffe", price: "Contact for price", category: "masters", image: programImg },
    { id: 51, level: "Level 9", title: "Master of Teaching and Learning (ECE)", institution: "NZTC", price: "Contact for price", category: "masters", image: programImg },
    { id: 52, level: "Level 9", title: "Master of Applied Management", institution: "Southern Institute of Tech", price: "Contact for price", category: "masters", image: programImg },
    { id: 53, level: "Level 9", title: "Master of Information Technology", institution: "Southern Institute of Tech", price: "Contact for price", category: "masters", image: programImg },
    { id: 54, level: "Level 9", title: "Master of Applied Health Sciences (Rehab)", institution: "Southern Institute of Tech", price: "Contact for price", category: "masters", image: programImg },
    { id: 55, level: "Level 9", title: "Master of Applied Management", institution: "Wintec", price: "Contact for price", category: "masters", image: programImg },
    { id: 56, level: "Level 9", title: "Master of Applied Information Technology", institution: "Wintec", price: "Contact for price", category: "masters", image: programImg },
    { id: 57, level: "Level 9", title: "Master of Nursing Science (Pre-Registration)", institution: "Wintec", price: "Contact for price", category: "masters", image: programImg },
    { id: 58, level: "Level 9", title: "Master of AI Integrated IT Solutions", institution: "Future Skills", price: "Contact for price", category: "masters", image: programImg },
    { id: 59, level: "Level 9", title: "Master of Nursing Science", institution: "Eastern Institute of Tech", price: "Contact for price", category: "masters", image: programImg },
    { id: 60, level: "Level 9", title: "Master of Applied Management", institution: "Future Skills", price: "Contact for price", category: "masters", image: programImg },
];

export default function ProgramsLevels() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [visibleCount, setVisibleCount] = useState(8); // Start with 8 visible cards

    const filteredPrograms = programsData.filter(program => {
        const matchesSearch = program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            program.institution.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'all' || program.category === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const visiblePrograms = filteredPrograms.slice(0, visibleCount);

    const handleSeeMore = () => {
        setVisibleCount(prev => prev + 12); // Show 12 more on click
    };

    return (
        <div className="min-h-screen bg-white font-urbanist overflow-x-hidden">
            <Navbar />

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
                                    <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-[0.2em] font-medium">Categories<br />Programs</p>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="flex flex-col items-center justify-center p-2"
                                >
                                    <h3 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight">7-9</h3>
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
                                    <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-[0.2em] font-medium">Fields of Study</p>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 }}
                                    className="flex flex-col items-center justify-center p-2"
                                >
                                    <h3 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight">25+</h3>
                                    <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-[0.2em] font-medium">Partners<br />Institutions</p>
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
                                    : 'text-gray-500 border-transparent hover:text-gray-900'
                                    }`}
                            >
                                All Programs
                            </button>
                            <button
                                onClick={() => setActiveFilter('diplomas')}
                                className={`text-sm font-bold uppercase tracking-widest pb-2 transition-all border-b-2 ${activeFilter === 'diplomas'
                                    ? 'text-[#436235] border-[#436235]'
                                    : 'text-gray-500 border-transparent hover:text-gray-900'
                                    }`}
                            >
                                Diplomas
                            </button>
                            <button
                                onClick={() => setActiveFilter('bachelors')}
                                className={`text-sm font-bold uppercase tracking-widest pb-2 transition-all border-b-2 ${activeFilter === 'bachelors'
                                    ? 'text-[#436235] border-[#436235]'
                                    : 'text-gray-500 border-transparent hover:text-gray-900'
                                    }`}
                            >
                                Bachelor
                            </button>
                            <button
                                onClick={() => setActiveFilter('masters')}
                                className={`text-sm font-bold uppercase tracking-widest pb-2 transition-all border-b-2 ${activeFilter === 'masters'
                                    ? 'text-[#436235] border-[#436235]'
                                    : 'text-gray-500 border-transparent hover:text-gray-900'
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
                                className="bg-white p-3 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow duration-300 border border-gray-100 flex flex-col h-full group"
                            >
                                {/* Program Image */}
                                <div className="relative h-48 w-full rounded-xl overflow-hidden">
                                    <img
                                        src={program.image}
                                        alt={program.title}
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {/* Overlay - Matching Hero Section */}
                                    <div className="absolute inset-0 bg-black/30 transition-all duration-300 group-hover:bg-black/10"></div>

                                    {/* Level Badge - Green Pill */}
                                    <div className="absolute top-3 right-3 bg-[#436235] text-white text-[10px] font-medium px-2.5 py-1 rounded shadow-sm">
                                        {program.level}
                                    </div>
                                </div>

                                {/* Program Details */}
                                <div className="mt-4 px-1 flex flex-col flex-grow">
                                    <h4 className="text-lg font-bold text-gray-900 mb-0 leading-tight tracking-tight group-hover:text-[#436235] transition-colors">
                                        {program.title}
                                    </h4>

                                    <p className="text-sm text-gray-500 mt-1">{program.institution}</p>

                                    <p className="text-[10px] font-bold text-[#436235] mt-2 mb-4">
                                        Start from {program.price}
                                    </p>

                                    <div className="flex justify-end gap-2 mt-auto">
                                        <a href="/program-details" className="px-3 py-1.5 border border-gray-300 text-[10px] font-medium rounded text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center">
                                            Details
                                        </a>
                                        <button className="px-3 py-1.5 bg-[#1a1a1a] text-white text-[10px] font-medium rounded hover:bg-black transition-colors shadow-sm">
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* See More Button */}
                    {visibleCount < filteredPrograms.length && (
                        <div className="text-center mt-16">
                            <button
                                onClick={handleSeeMore}
                                className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
                            >
                                See More
                            </button>
                        </div>
                    )}

                    {/* No Results */}
                    {filteredPrograms.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-sm">No programs found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </section>

            <ScrollToTop />
            <Footer />
        </div>
    );
}
