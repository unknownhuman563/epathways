import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'react-feather';
import Navbar from "@/components/navigation-bar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scrolltotop";
import JourneyExperience from "@/components/JourneyExperience";

// Assets
import heroBg from "@assets/Services/education.png";
import visaImg from "@assets/Services/visa.png";
import settlementImg from "@assets/Services/settlement.png";
import agentsImg from "@assets/Services/agents.png";
import dinaImage from "@assets/team/dina.png";
import bryllImage from "@assets/team/bryll.png";
import emmaImage from "@assets/team/emma.png";
import bannerTeam from "@assets/banner/team_education.png";

// Partner Logos
import logoAIS from "@assets/Partners/AIS.png";
import logoATMC from "@assets/Partners/ATMC.png";
import logoBridge from "@assets/Partners/Bridge.png";
import logoICA from "@assets/Partners/ICA.png";
import logoNSTourism from "@assets/Partners/NStourism.png";
import logoNZSE from "@assets/Partners/NZSE.png";
import logoNZTertiary from "@assets/Partners/NZtertiary.png";
import logoSR from "@assets/Partners/SR.png";
import logoStrategix from "@assets/Partners/Strategix.png";
import logoUP from "@assets/Partners/UP.png";
import logoYOOBEE from "@assets/Partners/YOOBEE.png";
import logoICL from "@assets/Partners/icl.png";
import logoIgnite from "@assets/Partners/ignite.png";
import logoNZMA from "@assets/Partners/nzma.png";
import logoSkills from "@assets/Partners/skills.png";
import logoTawera from "@assets/Partners/tawera.png";
import logoWhiteCliffe from "@assets/Partners/whitecligge.png";
import logoWintec from "@assets/Partners/wintec.png";

export default function EducationJourney() {
    const [activeProgram, setActiveProgram] = useState(0);

    const demandPrograms = [
        {
            id: 0,
            title: "IT & Computer Science",
            description: "Software engineering, cybersecurity, and data-driven disciplines are experiencing unprecedented growth.",
            programs: [
                "Bachelor of Computer Science",
                "Bachelor of Information Technology",
                "Bachelor of Software Engineering",
                "Bachelor of Data Science"
            ],
            intakes: "Feb, Mar, May, Jul",
            tags: ["Technology", "Bachelor"],
            image: heroBg
        },
        {
            id: 1,
            title: "Engineering",
            description: "Infrastructure growth and renewable energy shift drive strong global demand for specialized engineers.",
            programs: [
                "Bachelor of Civil Engineering",
                "Bachelor of Mechanical Engineering",
                "Bachelor of Electrical Engineering",
                "Bachelor of Chemical Engineering"
            ],
            intakes: "Feb, Mar, Jun, Jul",
            tags: ["Engineering", "Bachelor"],
            image: agentsImg
        },
        {
            id: 2,
            title: "Healthcare & Nursing",
            description: "Address global shortages in key health professions with recognized degrees and strong residency pathways.",
            programs: [
                "Bachelor of Nursing",
                "Bachelor of Medicine",
                "Bachelor of Pharmacy",
                "Bachelor of Physiotherapy"
            ],
            intakes: "Feb, Mar, Apr, May, Jun, Jul",
            tags: ["Healthcare", "Diploma"],
            image: settlementImg
        },
        {
            id: 3,
            title: "Business & Management",
            description: "Develop advanced leadership and analytical skills for modern corporate and tech sectors.",
            programs: [
                "Bachelor of Business Administration",
                "Bachelor of Commerce",
                "Bachelor of Applied Management",
                "Bachelor of Business Informatics"
            ],
            intakes: "Feb, Mar, Apr, May, Jul",
            tags: ["Business", "Bachelor"],
            image: heroBg
        },
        {
            id: 4,
            title: "Education & Teaching",
            description: "STEM-specialized teachers remain in critical shortage globally, offering distinct long-term career benefits.",
            programs: [
                "Bachelor of Education",
                "Bachelor of Early Childhood",
                "Bachelor of Primary Education",
                "Bachelor of Secondary Education"
            ],
            intakes: "Feb, Mar, Apr, May, Jun",
            tags: ["Education", "Bachelor"],
            image: visaImg
        }
    ];

    return (
        <div className="min-h-screen bg-white font-urbanist overflow-x-hidden">
            <Navbar />

            {/* Hero Section */}
            <section className="relative min-h-[80vh] flex items-center justify-center bg-[#0a0f0a] text-white pt-20 overflow-hidden font-urbanist">
                {/* Background Image with Overlay - Matching Card Style */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <img 
                        src={heroBg} 
                        alt="Education Journey" 
                        className="w-full h-full object-cover opacity-20 grayscale scale-150"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0a]/80 via-[#0a0f0a]/40 to-[#0a0f0a]"></div>
                </div>
                
                <div className="relative z-10 container mx-auto px-6 text-center max-w-5xl">
                    <motion.span 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-xs md:text-sm font-bold tracking-[0.4em] uppercase mb-6 block text-gray-400"
                    >
                        Pathways
                    </motion.span>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-6xl md:text-8xl lg:text-[100px] font-medium leading-[1.1] mb-10 tracking-tight"
                    >
                        Study abroad
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-base md:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light"
                    >
                        We guide you through every step of your international education journey with care and expertise.
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-5"
                    >
                        <a 
                            href="#services" 
                            className="w-full sm:w-auto bg-[#436235] text-white px-10 py-4 rounded-sm font-bold text-sm tracking-widest hover:bg-[#436235]/90 transition-all shadow-lg active:scale-95"
                        >
                            EXPLORE
                        </a>
                        <a 
                            href="/booking" 
                            className="w-full sm:w-auto border border-white/20 text-white px-10 py-4 rounded-sm font-bold text-sm tracking-widest hover:bg-white/10 transition-all active:scale-95"
                        >
                            CONSULT
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-32 bg-white text-[#282728] font-urbanist border-t border-gray-100">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="text-center mb-24">
                        <motion.span 
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-xs font-bold tracking-[0.4em] uppercase text-[#436235] mb-6 block"
                        >
                            Services
                        </motion.span>
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl md:text-6xl font-medium mb-8 tracking-tight"
                        >
                            What we offer you
                        </motion.h2>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-gray-600 text-lg max-w-2xl mx-auto font-light"
                        >
                            Comprehensive support for your education abroad
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Card 1 - Study Abroad Programs */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="lg:col-span-1 bg-white border border-gray-100 shadow-sm hover:shadow-md p-10 rounded-sm flex flex-col justify-between min-h-[450px] relative overflow-hidden group transition-all duration-300"
                        >
                            <div className="relative z-10">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-[#436235] mb-4 block">Explore</span>
                                <h3 className="text-3xl font-medium mb-6 leading-tight">Study abroad programs</h3>
                                <p className="text-gray-600 font-light leading-relaxed mb-8">
                                    Access curated programs across universities in North America, Europe, Australia, and Asia
                                </p>
                            </div>
                            
                            <div className="relative z-10 flex flex-wrap items-center gap-6 mt-auto">
                                <a 
                                    href="/programs-levels" 
                                    className="bg-[#282728] text-white px-6 py-3 rounded-sm text-[11px] font-bold tracking-widest hover:bg-[#436235] transition-all duration-300 shadow-sm"
                                >
                                    BROWSE
                                </a>
                                <a href="/programs-levels" className="text-sm font-medium flex items-center gap-2 group/link text-gray-700 hover:text-[#436235] transition-colors">
                                    Learn more <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                                </a>
                            </div>

                            {/* Background image effect (Subtle) */}
                            <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none grayscale">
                                <img src={heroBg} alt="Background" className="w-full h-full object-cover scale-150" />
                            </div>
                        </motion.div>

                        {/* Card 2 - Partner Universities */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="bg-white border border-gray-100 shadow-sm hover:shadow-md p-10 rounded-sm flex flex-col justify-between min-h-[450px] relative overflow-hidden group transition-all duration-300"
                        >
                            <div className="relative z-10">
                                <div className="w-12 h-12 mb-8 text-[#282728] group-hover:text-[#436235] transition-colors">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                                        <path d="M3 21h18M3 7v1a3 3 0 006 0V7m6 0v1a3 3 0 006 0V7m-9 0h6m-6 0a3 3 0 00-6 0m6 0v14m-3-14h3m-3 4h3m-3 4h3m-3 4h3" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-medium mb-6 leading-tight">Partner universities and colleges</h3>
                                <p className="text-gray-600 font-light leading-relaxed">
                                    Work with institutions we've built trusted relationships with
                                </p>
                            </div>
                            <div className="relative z-10 mt-auto">
                                <a href="/about-us" className="text-sm font-medium flex items-center gap-2 group/link text-gray-700 hover:text-[#436235] transition-colors">
                                    View partners <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                                </a>
                            </div>

                            {/* Background image effect (Subtle) */}
                            <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none grayscale">
                                <img src={heroBg} alt="Background" className="w-full h-full object-cover scale-150" />
                            </div>
                        </motion.div>

                        {/* Card 3 - Course Selection */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="bg-white border border-gray-100 shadow-sm hover:shadow-md p-10 rounded-sm flex flex-col justify-between min-h-[450px] relative overflow-hidden group transition-all duration-300"
                        >
                            <div className="relative z-10">
                                <div className="w-12 h-12 mb-8 text-[#282728] group-hover:text-[#436235] transition-colors">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-medium mb-6 leading-tight">Course selection and admission</h3>
                                <p className="text-gray-600 font-light leading-relaxed">
                                    Find the right program and navigate the application process
                                </p>
                            </div>
                            <div className="relative z-10 mt-auto">
                                <a href="/booking" className="text-sm font-medium flex items-center gap-2 group/link text-gray-700 hover:text-[#436235] transition-colors">
                                    Get started <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                                </a>
                            </div>

                            {/* Background image effect (Subtle) */}
                            <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none grayscale">
                                <img src={heroBg} alt="Background" className="w-full h-full object-cover scale-150" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <JourneyExperience />

            {/* Top In-Demand Programs Section - Custom Editorial Redesign */}
            <section className="py-32 bg-white text-[#282728] font-urbanist border-t border-gray-100 overflow-hidden">
                <div className="container mx-auto px-6 max-w-7xl">
                    {/* Header */}
                    <div className="mb-20 md:mb-28 max-w-4xl">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-[11px] font-bold tracking-[0.4em] uppercase text-[#436235] mb-6 block"
                        >
                            Pathways
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-medium mb-8 tracking-tight leading-tight whitespace-normal md:whitespace-nowrap"
                        >
                            Top in-demand programs
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-gray-500 text-sm md:text-base leading-relaxed max-w-none lg:whitespace-nowrap"
                        >
                            The most sought-after qualifications for international careers and residency pathways. Hover to explore specific disciplines.
                        </motion.p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
                        {/* Left: Program Titles */}
                        <div className="lg:w-2/5 flex flex-col gap-8 relative z-10 w-full">
                            {demandPrograms.map((item) => (
                                <div 
                                    key={item.id}
                                    onMouseEnter={() => setActiveProgram(item.id)}
                                    className="cursor-pointer group flex items-center gap-6 py-2 border-b border-gray-100 last:border-b-0"
                                >
                                    <span className={`text-xs font-bold font-mono transition-colors duration-500 ${activeProgram === item.id ? "text-[#436235]" : "text-gray-300"}`}>
                                        0{item.id + 1}
                                    </span>
                                    <h3 className={`text-2xl md:text-3xl font-light tracking-tight transition-all duration-500 ${activeProgram === item.id ? "text-[#282728] translate-x-2" : "text-gray-400 group-hover:text-gray-700"}`}>
                                        {item.title}
                                    </h3>
                                </div>
                            ))}
                        </div>

                        {/* Right: Active Program Details */}
                        <div className="lg:w-3/5 w-full">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeProgram}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4 }}
                                    className="bg-gray-50 border border-gray-100 rounded-sm overflow-hidden flex flex-col shadow-sm"
                                >
                                    {/* Image Top */}
                                    <div className="h-64 relative overflow-hidden bg-gray-200">
                                        <img 
                                            src={demandPrograms[activeProgram].image} 
                                            alt={demandPrograms[activeProgram].title} 
                                            className="w-full h-full object-cover opacity-80"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
                                        <div className="absolute bottom-6 left-8 flex gap-3">
                                            {demandPrograms[activeProgram].tags.map(t => (
                                                <span key={t} className="px-3 py-1 bg-[#436235] text-white text-[10px] font-bold tracking-widest uppercase rounded-sm shadow-sm">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Details Bottom */}
                                    <div className="p-8 md:p-10 bg-white">
                                        <p className="text-gray-600 text-sm leading-relaxed mb-8">
                                            {demandPrograms[activeProgram].description}
                                        </p>
                                        
                                        <div className="mb-10">
                                            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#436235] mb-4">Core Programs</h4>
                                            <ul className="space-y-3">
                                                {demandPrograms[activeProgram].programs.map((prog, i) => (
                                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                                                        <div className="w-1 h-1 rounded-full bg-[#436235]"></div>
                                                        {prog}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        
                                        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Intakes</span>
                                                <span className="text-xs font-medium text-[#282728]">{demandPrograms[activeProgram].intakes}</span>
                                            </div>
                                            <a href="/programs-levels" className="w-10 h-10 rounded-sm border border-gray-300 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#436235] hover:border-[#436235] transition-all">
                                                <ArrowRight size={16} />
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </section>

            {/* Transparent Fees Section */}
            <section className="py-32 bg-[#e8e8e6] font-urbanist">
                <div className="container mx-auto px-6 max-w-7xl">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-xs font-bold tracking-[0.4em] uppercase text-gray-500 mb-4 block"
                        >
                            Costs
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl md:text-6xl font-light mb-6 tracking-tight text-[#282728]"
                        >
                            Transparent fees
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-gray-600 text-base font-light"
                        >
                            Know exactly what your education will cost
                        </motion.p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1 - Diploma */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-white rounded-sm p-10 flex flex-col justify-between shadow-sm"
                        >
                            <div>
                                <p className="text-gray-500 text-sm font-medium mb-4">Diploma level</p>
                                <p className="text-5xl md:text-6xl font-light text-[#282728] mb-1">$31,200</p>
                                <p className="text-gray-500 text-sm mb-10">total school fees</p>
                                <ul className="space-y-3 mb-10">
                                    {["Tuition across regions", "Health insurance included", "Visa processing covered"].map((item) => (
                                        <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                                            <svg className="w-4 h-4 text-[#436235] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <a
                                href="/fee-guide"
                                className="block w-full text-center bg-[#436235] text-white py-4 text-sm font-bold tracking-widest hover:bg-[#436235]/90 transition-all duration-300 rounded-sm"
                            >
                                Explore programs
                            </a>
                        </motion.div>

                        {/* Card 2 - Bachelor's */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="bg-white rounded-sm p-10 flex flex-col justify-between shadow-sm"
                        >
                            <div>
                                <p className="text-gray-500 text-sm font-medium mb-4">Bachelor's degree</p>
                                <p className="text-5xl md:text-6xl font-light text-[#282728] mb-1">$45,000</p>
                                <p className="text-gray-500 text-sm mb-10">average per year</p>
                                <ul className="space-y-3 mb-10">
                                    {["Full tuition and fees", "Housing assistance available", "Visa and travel support", "Scholarship matching service"].map((item) => (
                                        <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                                            <svg className="w-4 h-4 text-[#436235] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <a
                                href="/fee-guide"
                                className="block w-full text-center bg-[#436235] text-white py-4 text-sm font-bold tracking-widest hover:bg-[#436235]/90 transition-all duration-300 rounded-sm"
                            >
                                View options
                            </a>
                        </motion.div>

                        {/* Card 3 - Master's */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="bg-white rounded-sm p-10 flex flex-col justify-between shadow-sm"
                        >
                            <div>
                                <p className="text-gray-500 text-sm font-medium mb-4">Master's program</p>
                                <p className="text-5xl md:text-6xl font-light text-[#282728] mb-1">$52,000</p>
                                <p className="text-gray-500 text-sm mb-10">average per year</p>
                                <ul className="space-y-3 mb-10">
                                    {["Postgraduate tuition costs", "Research funding guidance", "Thesis and project support", "Career placement assistance", "Professional networking access"].map((item) => (
                                        <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                                            <svg className="w-4 h-4 text-[#436235] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <a
                                href="/fee-guide"
                                className="block w-full text-center bg-[#436235] text-white py-4 text-sm font-bold tracking-widest hover:bg-[#436235]/90 transition-all duration-300 rounded-sm"
                            >
                                Start application
                            </a>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Education Consultant Section */}
            <section id="education-consultants" className="py-32 bg-white text-[#282728] font-urbanist border-t border-gray-100">
                <div className="container mx-auto px-6 max-w-7xl">
                    {/* Header */}
                    <div className="text-center mb-24">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-[11px] font-bold tracking-[0.4em] uppercase text-[#436235] mb-4 block"
                        >
                            Team
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl md:text-5xl font-medium mb-6 tracking-tight"
                        >
                            Meet our education consultants
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
                        >
                            Dedicated specialists guiding every step of your international education journey
                        </motion.p>
                    </div>

                    {/* Consultant Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Fhilip Bryll Añabeza",
                                role: "Education Consultant",
                                bio: "Fhilip provides expert guidance on matching students to the right programs and navigating the application process.",
                                img: bryllImage,
                                badge: "Consultant"
                            },
                            {
                                name: "Emma Ceballo",
                                role: "Head of Education Dept",
                                bio: "Emma leads our education team, bringing extensive expertise in enrollment support and international student success.",
                                img: emmaImage,
                                badge: "Head"
                            },
                            {
                                name: "Dinah Suarin",
                                role: "CEO / Founder",
                                bio: "With over a decade of experience, Dinah founded ePathways to help students navigate their global education journey.",
                                img: dinaImage,
                                badge: "Founder"
                            }
                        ].map((c, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex flex-col bg-[#141a14] text-white border border-[#2a3a2a] rounded-sm overflow-hidden group hover:border-[#436235] transition-all duration-500 shadow-lg hover:shadow-xl"
                            >
                                {/* Top: Image */}
                                <div className="aspect-[4/5] relative overflow-hidden bg-[#0a0f0a]">
                                    <img
                                        src={c.img}
                                        alt={c.name}
                                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-all duration-700"
                                    />
                                    {/* Badge */}
                                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-[#436235] text-white text-[9px] font-bold uppercase tracking-widest rounded-sm shadow-sm">
                                        {c.badge}
                                    </div>
                                </div>

                                {/* Bottom: Info */}
                                <div className="p-8 flex flex-col justify-center flex-1">
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#436235] mb-3 block">
                                        {c.role}
                                    </span>
                                    <h3 className="text-2xl font-medium mb-4 text-white leading-tight">
                                        {c.name}
                                    </h3>
                                    <p className="text-white/60 text-xs leading-relaxed mb-8 flex-1">
                                        {c.bio}
                                    </p>
                                    <a
                                        href="/booking"
                                        className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-white/80 hover:text-[#436235] transition-colors group/link mt-auto"
                                    >
                                        Book a session <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Partner Universities Section */}
            <section className="bg-[#0f1a0f] text-white font-urbanist py-20 border-t border-white/5">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left - Text */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="pr-0 lg:pr-16"
                        >
                            <h2 className="text-3xl md:text-4xl font-medium leading-tight mb-6">
                                We partner with universities across continents
                            </h2>
                            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm">
                                These institutions trust ePathways to send serious students. That relationship works in your favor.
                            </p>
                            <div className="flex items-center gap-4">
                                <a
                                    href="/about-us"
                                    className="bg-white/10 border border-white/20 text-white text-xs font-bold tracking-widest px-6 py-3 rounded-sm hover:bg-white/20 transition-all"
                                >
                                    View all
                                </a>
                                <a
                                    href="/programs-levels"
                                    className="text-sm font-medium flex items-center gap-2 group/link text-white hover:text-[#436235] transition-colors"
                                >
                                    Explore <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                                </a>
                            </div>
                        </motion.div>

                        {/* Right - Partner Logos (no cards) */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="flex flex-wrap items-center gap-x-8 gap-y-6"
                        >
                            {[
                                { name: "AIS", logo: logoAIS, size: "h-16" },
                                { name: "ATMC", logo: logoATMC, size: "h-14" },
                                { name: "Bridge", logo: logoBridge, size: "h-16" },
                                { name: "ICA", logo: logoICA, size: "h-14" },
                                { name: "NZ Tourism", logo: logoNSTourism, size: "h-20" },
                                { name: "NZSE", logo: logoNZSE, size: "h-14" },
                                { name: "NZ Tertiary", logo: logoNZTertiary, size: "h-16" },
                                { name: "Strategix", logo: logoStrategix, size: "h-14" },
                                { name: "YOOBEE", logo: logoYOOBEE, size: "h-16" },
                                { name: "ICL", logo: logoICL, size: "h-14" },
                                { name: "Ignite", logo: logoIgnite, size: "h-16" },
                                { name: "NZMA", logo: logoNZMA, size: "h-14" },
                                { name: "Skills", logo: logoSkills, size: "h-16" },
                                { name: "Tawera", logo: logoTawera, size: "h-14" },
                                { name: "White Cliffe", logo: logoWhiteCliffe, size: "h-14" },
                                { name: "Wintec", logo: logoWintec, size: "h-16" },
                                { name: "UP", logo: logoUP, size: "h-14" },
                                { name: "SR", logo: logoSR, size: "h-14" },
                            ].map((partner, i) => (
                                <img
                                    key={i}
                                    src={partner.logo}
                                    alt={partner.name}
                                    className={`${partner.size} w-auto object-contain filter brightness-0 invert opacity-60 hover:opacity-100 transition-all duration-300`}
                                />
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-white font-urbanist py-28 border-t border-gray-100">
                <div className="container mx-auto px-6 max-w-4xl text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-light text-[#282728] mb-6 leading-tight"
                    >
                        Start your education journey today
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-[#436235] text-sm font-medium mb-10"
                    >
                        One conversation can change everything. Let's find your pathway forward.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
                    >
                        <a
                            href="/booking"
                            className="bg-[#436235] text-white px-8 py-3 rounded-sm text-sm font-bold tracking-widest hover:bg-[#436235]/90 transition-all shadow-lg"
                        >
                            Book consultation
                        </a>
                        <a
                            href="/programs-levels"
                            className="border border-gray-300 text-[#282728] px-8 py-3 rounded-sm text-sm font-bold tracking-widest hover:bg-gray-50 transition-all"
                        >
                            Learn more
                        </a>
                    </motion.div>

                    {/* Banner Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="relative w-full overflow-hidden rounded-sm shadow-lg group mt-20"
                    >
                        <img 
                            src={bannerTeam} 
                            alt="Education Team" 
                            className="w-full h-auto transition-transform duration-1000 group-hover:scale-[1.01]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0a]/10 via-transparent to-transparent"></div>
                    </motion.div>
                </div>
            </section>

            <ScrollToTop />

            <Footer />
        </div>
    );
}
