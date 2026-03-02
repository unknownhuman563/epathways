import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, ExternalLink } from 'react-feather';
import Navbar from "@/components/navigation-bar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scrolltotop";

// Assets
import educationImg from "@assets/Services/education.png";
import pathwaysImg from "@assets/Services/pathways.png";
import agentsImg from "@assets/Services/agents.png";

// Mock data for the accordion - in a real app, this might come from a prop or API
const programs = [
    {
        id: 1,
        title: "NZ Diploma in Enrolled Nursing",
        institution: "Southern Institure of Tech",
        level: 5,
        type: 'diploma',
        image: educationImg,
        baseFee: "31,200",
        fees: {
            "India & Subcontinent": "31,200.00",
            "Southeast Asia": "31,200.00",
            "China/Malaysia/Singapore": "31,200.00",
            "LATAM/Europe/ Africa/Middle East": "31,200.00"
        },
        additionalCosts: {
            insurance: "1,000.00",
            visa: "2,350.00",
            living: "20,000.00",
            accommodation: "from $180/week"
        }
    },
    {
        id: 2,
        title: "NZ Diploma in Enrolled Nursing",
        institution: "Wintec",
        level: 5,
        type: 'diploma',
        image: pathwaysImg,
        baseFee: "26,600",
        fees: {
            "India & Subcontinent": "26,600.00",
            "Southeast Asia": "26,600.00",
            "China/Malaysia/Singapore": "26,600.00",
            "LATAM/Europe/ Africa/Middle East": "26,600.00"
        },
        additionalCosts: {
            insurance: "1,000.00",
            visa: "2,350.00",
            living: "20,000.00",
            accommodation: "from $180/week"
        }
    },
    {
        id: 3,
        title: "NZ Diploma in Early Childhood Education",
        institution: "NZTC",
        level: 5,
        type: 'diploma',
        image: educationImg,
        baseFee: "28,000",
        fees: {
            "India & Subcontinent": "28,000.00",
            "Southeast Asia": "28,000.00",
            "China/Malaysia/Singapore": "28,000.00",
            "LATAM/Europe/ Africa/Middle East": "28,000.00"
        },
        additionalCosts: {
            insurance: "1,000.00",
            visa: "2,350.00",
            living: "20,000.00",
            accommodation: "from $180/week"
        }
    },
    {
        id: 4,
        title: "NZ Diploma in IT Technical Support",
        institution: "NZSE",
        level: 5,
        type: 'diploma',
        image: pathwaysImg,
        baseFee: "20,900",
        fees: {
            "India & Subcontinent": "20,900.00",
            "Southeast Asia": "17,750.00",
            "China/Malaysia/Singapore": "20,900.00",
            "LATAM/Europe/ Africa/Middle East": "20,900.00"
        },
        additionalCosts: {
            insurance: "1,000.00",
            visa: "2,350.00",
            living: "20,000.00",
            accommodation: "from $180/week"
        }
    },
    {
        id: 5,
        title: "Bachelor of Accounting",
        institution: "Wintec",
        level: 7,
        type: 'bachelor',
        image: educationImg,
        baseFee: "26,600",
        fees: {
            "India & Subcontinent": "26,600.00/year",
            "Southeast Asia": "26,600.00/year",
            "China/Malaysia/Singapore": "26,600.00/year",
            "LATAM/Europe/ Africa/Middle East": "26,600.00/year"
        },
        additionalCosts: {
            insurance: "1,000.00",
            visa: "2,350.00",
            living: "20,000.00",
            accommodation: "from $180/week"
        }
    },
    {
        id: 6,
        title: "Bachelor of Nursing",
        institution: "Wintec",
        level: 7,
        type: 'bachelor',
        image: pathwaysImg,
        baseFee: "29,800",
        fees: {
            "India & Subcontinent": "29,800.00/year",
            "Southeast Asia": "29,800.00/year",
            "China/Malaysia/Singapore": "29,800.00/year",
            "LATAM/Europe/ Africa/Middle East": "29,800.00/year"
        },
        additionalCosts: {
            insurance: "1,000.00",
            visa: "2,350.00",
            living: "20,000.00",
            accommodation: "from $180/week"
        }
    },
    {
        id: 7,
        title: "Master of Business Informatics",
        institution: "ICL Graduate Business School",
        level: 9,
        type: 'masters',
        image: educationImg,
        baseFee: "30,460",
        fees: {
            "India & Subcontinent": "30,460.00",
            "Southeast Asia": "29,700.00",
            "China/Malaysia/Singapore": "32,460.00",
            "LATAM/Europe/ Africa/Middle East": "27,960.00"
        },
        additionalCosts: {
            insurance: "1,000.00",
            visa: "2,350.00",
            living: "20,000.00",
            accommodation: "from $180/week"
        }
    },
    {
        id: 8,
        title: "Master of Management",
        institution: "ICL Graduate Business School",
        level: 9,
        type: 'masters',
        image: pathwaysImg,
        baseFee: "32,460",
        fees: {
            "India & Subcontinent": "32,460.00",
            "Southeast Asia": "32,200.00",
            "China/Malaysia/Singapore": "34,460.00",
            "LATAM/Europe/ Africa/Middle East": "28,460.00"
        },
        additionalCosts: {
            insurance: "1,000.00",
            visa: "2,350.00",
            living: "20,000.00",
            accommodation: "from $180/week"
        }
    }
];

export default function FeeGuide() {
    const [expandedIds, setExpandedIds] = useState([]); // All items closed by default
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const toggleAccordion = (id) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] font-urbanist overflow-x-hidden">
            <Navbar />

            {/* Hero Section */}
            <div className="relative h-[40vh] min-h-[350px] w-full overflow-hidden">
                <img
                    src={educationImg}
                    alt="University Campus"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight max-w-4xl">
                        good education to build a better future
                    </h1>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="container mx-auto px-4 py-16 max-w-4xl">

                {/* Centered Search Bar */}
                <div className="flex justify-center mb-20">
                    <div className="relative w-full max-w-xl">
                        <input
                            type="text"
                            placeholder="Search programs, levels..."
                            className="w-full px-8 py-4 rounded-full border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#436235]/10 focus:border-[#436235] transition-all text-base placeholder-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-800 w-5 h-5" strokeWidth={2.5} />
                    </div>
                </div>

                {/* Title and Filters Row */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-gray-100 pb-2">
                    <div className="text-base font-medium text-[#282728] uppercase tracking-[0.2em] mb-4 md:mb-0">
                        Fee Guide
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-8">
                        {['all', 'diploma', 'bachelor', 'masters'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`text-[10px] font-bold uppercase tracking-[0.15em] pb-3 transition-all border-b-2 ${activeFilter === filter
                                    ? 'text-[#436235] border-[#436235]'
                                    : 'text-gray-400 border-transparent hover:text-gray-600'
                                    }`}
                            >
                                {filter === 'all' ? 'All Programs' : filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Transitions List */}
                <div className="space-y-4">
                    {programs
                        .filter(p => activeFilter === 'all' || p.type === activeFilter)
                        .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.institution.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((program) => {
                            const isExpanded = expandedIds.includes(program.id);
                            return (
                                <div
                                    key={program.id}
                                    className="bg-white rounded-xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 transition-all duration-300"
                                >
                                    {/* Header */}
                                    <div
                                        className="p-4 flex items-center cursor-pointer gap-4"
                                        onClick={() => toggleAccordion(program.id)}
                                    >
                                        <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                            <img src={program.image} className="w-full h-full object-cover" alt={program.title} />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-base font-bold text-[#282728]">{program.title}</h3>
                                                <span className="bg-[#436235] text-white text-[8px] font-bold px-1.5 py-0.5 rounded leading-none">
                                                    Level {program.level}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-medium">{program.institution}</p>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div className="hidden sm:block">
                                                <p className="text-[10px] text-gray-500 font-medium leading-none mb-1">Start from</p>
                                                <p className="text-sm font-bold text-gray-800">{program.baseFee}!</p>
                                            </div>
                                            <div className="text-gray-400">
                                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                            >
                                                <div className="px-6 pb-8 pt-4 border-t border-gray-50">
                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-4">
                                                        {/* Regional Fees */}
                                                        <div className="lg:col-span-5 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Total School Fees</h4>
                                                            <div className="space-y-4">
                                                                {Object.entries(program.fees).map(([region, fee]) => (
                                                                    <div key={region} className="flex justify-between items-center text-[11px]">
                                                                        <span className="text-gray-500 font-medium">{region}</span>
                                                                        <span className="font-bold text-[#282728]">{fee}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Additional Costs */}
                                                        <div className="lg:col-span-7 grid grid-cols-2 gap-y-10 gap-x-8 py-4">
                                                            <div>
                                                                <div className="text-xl font-bold text-[#282728] mb-1 tabular-nums">{program.additionalCosts.insurance}</div>
                                                                <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-medium">Insurance (indicative)</p>
                                                            </div>
                                                            <div>
                                                                <div className="text-xl font-bold text-[#282728] mb-1 tabular-nums">{program.additionalCosts.visa}</div>
                                                                <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-medium">Visa Processing Fee</p>
                                                            </div>
                                                            <div>
                                                                <div className="text-xl font-bold text-[#282728] mb-1 tabular-nums">{program.additionalCosts.living}</div>
                                                                <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-medium">Living Expense (one year)</p>
                                                            </div>
                                                            <div>
                                                                <div className="text-xl font-bold text-[#282728] mb-1 tabular-nums">{program.additionalCosts.accommodation}</div>
                                                                <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-medium">Accommodation (single occupancy)</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex justify-end gap-3 mt-10">
                                                        <a href="/program-details" className="px-5 py-2 border border-gray-200 text-[10px] font-bold rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all uppercase tracking-widest">
                                                            Details
                                                        </a>
                                                        <button className="px-6 py-2 bg-[#1a1a1a] text-white text-[10px] font-bold rounded-lg hover:bg-black transition-all shadow-md active:scale-95 uppercase tracking-widest">
                                                            Book Now
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                </div>
            </div>

            <ScrollToTop />
            <Footer />
        </div>
    );
}
