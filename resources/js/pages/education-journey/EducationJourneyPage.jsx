import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'react-feather';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import JourneyExperience from "./JourneyExperience";

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
            <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center py-24 bg-[#0a0f0a]">
                {/* Background Image with Light Overlay */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src={heroBg} 
                        alt="Education Journey" 
                        className="w-full h-full object-cover scale-105 opacity-40 grayscale"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0a]/90 via-[#0a0f0a]/60 to-[#0a0f0a]"></div>
                </div>
                
                <div className="container mx-auto px-6 md:px-12 max-w-5xl relative z-10 text-center font-urbanist">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[#436235] text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] mb-6 drop-shadow-md"
                    >
                        Global Education
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.8 }}
                        className="text-6xl md:text-8xl lg:text-[130px] font-black text-white leading-[0.85] tracking-[calc(-0.05em)] mb-10 uppercase flex flex-col items-center drop-shadow-2xl"
                    >
                        <span>Study</span>
                        <span className="text-[#436235]">abroad</span>
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-white/60 text-sm md:text-base leading-relaxed max-w-2xl mx-auto mb-12 font-light tracking-wide"
                    >
                        Expert guidance through every step of your international education journey. We connect you with the world's leading institutions.
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto"
                    >
                        <a
                            href="/programs-levels"
                            className="w-full sm:w-auto bg-[#436235] text-white text-[11px] font-bold px-10 py-4 rounded-none hover:bg-[#436235]/80 transition-all duration-300 uppercase tracking-[0.2em] shadow-2xl text-center"
                        >
                            Explore
                        </a>
                        <a 
                            href="/booking" 
                            className="w-full sm:w-auto bg-transparent border border-white/20 text-white text-[11px] font-bold px-10 py-4 rounded-none hover:bg-white/10 transition-all duration-300 uppercase tracking-[0.2em] text-center"
                        >
                            Consult
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="bg-white text-[#282728] py-32 font-urbanist overflow-hidden">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#436235] mb-6 block">
                                Services
                            </span>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-8">
                                What we <br />
                                <span className="text-gray-300 italic">offer you</span>
                            </h2>
                            <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-12 max-w-md">
                                Comprehensive support for your education abroad. We help you find the right program, navigate admissions, and connect with trusted partner universities.
                            </p>

                            <div className="flex flex-col gap-8 mb-12">
                                <div className="flex gap-6 items-start">
                                    <span className="text-xs font-bold font-mono text-[#436235] pt-1">01</span>
                                    <div>
                                        <h3 className="text-xl font-medium mb-2">Study abroad programs</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">Access curated programs across universities in North America, Europe, Australia, and Asia.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 items-start">
                                    <span className="text-xs font-bold font-mono text-[#436235] pt-1">02</span>
                                    <div>
                                        <h3 className="text-xl font-medium mb-2">Partner universities</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">Work with institutions we've built trusted relationships with worldwide.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 items-start">
                                    <span className="text-xs font-bold font-mono text-[#436235] pt-1">03</span>
                                    <div>
                                        <h3 className="text-xl font-medium mb-2">Course selection</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">Find the right program and navigate the application and admission process.</p>
                                    </div>
                                </div>
                            </div>

                            <a
                                href="/programs-levels"
                                className="inline-flex items-center gap-3 bg-[#436235] text-white border border-[#436235] px-8 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-[#436235]/90 transition-all duration-500"
                            >
                                Browse Programs <ArrowRight size={14} />
                            </a>
                        </motion.div>

                        {/* Right Content - Image */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="relative aspect-square lg:aspect-auto lg:h-[700px] overflow-hidden rounded-sm"
                        >
                            <img 
                                src={agentsImg} 
                                alt="Education Services" 
                                className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                            />
                            {/* Decorative overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0a]/40 to-transparent" />
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
                            className="text-gray-600 text-sm md:text-base leading-relaxed max-w-none lg:whitespace-nowrap"
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
                                    <h3 className={`text-2xl md:text-3xl font-light tracking-tight transition-all duration-500 ${activeProgram === item.id ? "text-[#282728] translate-x-2" : "text-gray-500 group-hover:text-gray-700"}`}>
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
                                                <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Intakes</span>
                                                <span className="text-xs font-medium text-[#282728]">{demandPrograms[activeProgram].intakes}</span>
                                            </div>
                                            <a href="/programs-levels" className="w-10 h-10 rounded-sm border border-gray-300 flex items-center justify-center text-gray-600 hover:text-white hover:bg-[#436235] hover:border-[#436235] transition-all">
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
            <section className="py-32 bg-[#e8e8e6] font-urbanist border-y border-gray-200">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    <div className="text-center mb-24">
                        <motion.span
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            className="text-[11px] font-bold tracking-[0.4em] uppercase text-gray-600 mb-4 block"
                        >
                            Costs
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="text-4xl md:text-5xl lg:text-6xl font-medium mb-6 tracking-tight text-[#282728]"
                        >
                            Transparent fees
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            className="text-gray-600 text-sm md:text-base max-w-xl mx-auto leading-relaxed"
                        >
                            Know exactly what your education will cost.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-gray-300 bg-white">
                        {/* Diploma */}
                        <div className="p-12 md:p-16 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col hover:bg-gray-50 transition-colors">
                            <h3 className="text-lg font-medium text-[#282728] mb-2">Diploma level</h3>
                            <p className="text-gray-500 text-xs tracking-widest uppercase mb-8">total school fees</p>
                            <div className="text-5xl lg:text-6xl font-light text-[#436235] mb-12">$31k<span className="text-2xl text-gray-500">+</span></div>
                            <ul className="space-y-4 mb-12 flex-1">
                                {["Tuition across regions", "Health insurance included", "Visa processing covered"].map(item => (
                                    <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                                        <CheckCircle size={16} className="text-[#436235] mt-0.5" /> {item}
                                    </li>
                                ))}
                            </ul>
                            <a href="/fee-guide" className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-[#282728] hover:text-[#436235] transition-colors group/link">
                                Explore <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                            </a>
                        </div>
                        {/* Bachelor's */}
                        <div className="p-12 md:p-16 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col hover:bg-gray-50 transition-colors">
                            <h3 className="text-lg font-medium text-[#282728] mb-2">Bachelor's degree</h3>
                            <p className="text-gray-500 text-xs tracking-widest uppercase mb-8">average per year</p>
                            <div className="text-5xl lg:text-6xl font-light text-[#436235] mb-12">$45k<span className="text-2xl text-gray-500">+</span></div>
                            <ul className="space-y-4 mb-12 flex-1">
                                {["Full tuition and fees", "Housing assistance available", "Visa and travel support", "Scholarship matching service"].map(item => (
                                    <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                                        <CheckCircle size={16} className="text-[#436235] mt-0.5" /> {item}
                                    </li>
                                ))}
                            </ul>
                            <a href="/fee-guide" className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-[#282728] hover:text-[#436235] transition-colors group/link">
                                View options <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                            </a>
                        </div>
                        {/* Master's */}
                        <div className="p-12 md:p-16 flex flex-col hover:bg-gray-50 transition-colors">
                            <h3 className="text-lg font-medium text-[#282728] mb-2">Master's program</h3>
                            <p className="text-gray-500 text-xs tracking-widest uppercase mb-8">average per year</p>
                            <div className="text-5xl lg:text-6xl font-light text-[#436235] mb-12">$52k<span className="text-2xl text-gray-500">+</span></div>
                            <ul className="space-y-4 mb-12 flex-1">
                                {["Postgraduate tuition costs", "Research funding guidance", "Thesis and project support", "Career placement assistance"].map(item => (
                                    <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                                        <CheckCircle size={16} className="text-[#436235] mt-0.5" /> {item}
                                    </li>
                                ))}
                            </ul>
                            <a href="/fee-guide" className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-[#282728] hover:text-[#436235] transition-colors group/link">
                                Start application <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Education Consultant Section */}
            <section id="education-consultants" className="py-32 bg-white text-[#282728] font-urbanist overflow-hidden">
                <div className="container mx-auto px-6 md:px-12 max-w-5xl">
                    {/* Header */}
                    <div className="text-center mb-24">
                        <motion.span
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            className="text-[11px] font-bold tracking-[0.4em] uppercase text-[#436235] mb-4 block"
                        >
                            Team
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-medium mb-6 tracking-tight"
                        >
                            Meet our education consultants
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
                        >
                            Dedicated specialists guiding every step of your international education journey
                        </motion.p>
                    </div>

                    {/* Consultant Cards */}
                    <div className="flex flex-col gap-6">
                        {[
                            { name: "Fhilip Bryll Añabeza", role: "Education Consultant", bio: "Fhilip provides expert guidance on matching students to the right programs and navigating the application process.", img: bryllImage },
                            { name: "Emma Ceballo", role: "Head of Education Dept", bio: "Emma leads our education team, bringing extensive expertise in enrollment support and international student success.", img: emmaImage },
                            { name: "Dinah Suarin", role: "CEO / Founder", bio: "With over a decade of experience, Dinah founded ePathways to help students navigate their global education journey.", img: dinaImage }
                        ].map((c, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="flex flex-col sm:flex-row bg-[#0a0f0a] text-white border border-[#1a251a] rounded-none overflow-hidden group hover:border-[#436235] transition-all duration-500"
                            >
                                {/* Left: Image */}
                                <div className="sm:w-[35%] lg:w-[25%] aspect-square sm:aspect-auto relative overflow-hidden bg-black/50">
                                    <img 
                                        src={c.img} 
                                        alt={c.name} 
                                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-all duration-700 opacity-90" 
                                    />
                                </div>
                                {/* Right: Info */}
                                <div className="sm:w-[65%] lg:w-[75%] p-10 md:p-14 flex flex-col justify-center">
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#436235] mb-3 block">
                                        {c.role}
                                    </span>
                                    <h3 className="text-2xl md:text-4xl font-light mb-6 text-white leading-tight">
                                        {c.name}
                                    </h3>
                                    <p className="text-white/60 text-sm md:text-base leading-relaxed mb-10 max-w-2xl">
                                        {c.bio}
                                    </p>
                                    <a 
                                        href="/booking" 
                                        className="inline-flex items-center gap-3 border border-white/20 px-8 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-white hover:text-[#0a0f0a] transition-all duration-500 w-fit"
                                    >
                                        Book a session <ArrowRight size={14} />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Partner Universities Section */}
            <section className="bg-[#0f1a0f] text-white py-32 font-urbanist border-t border-white/5 overflow-hidden">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl text-center">
                    <motion.span
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        className="text-[11px] font-bold tracking-[0.4em] uppercase text-[#436235] mb-6 block"
                    >
                        Network
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-medium leading-tight mb-8"
                    >
                        Global partner universities
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        className="text-gray-500 text-sm md:text-base leading-relaxed mb-20 max-w-2xl mx-auto"
                    >
                        These institutions trust ePathways to send serious students. That relationship works in your favor.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-60 hover:opacity-100 transition-opacity duration-500"
                    >
                        {[
                            { name: "AIS", logo: logoAIS, size: "h-8 md:h-12" },
                            { name: "ATMC", logo: logoATMC, size: "h-8 md:h-10" },
                            { name: "Bridge", logo: logoBridge, size: "h-8 md:h-12" },
                            { name: "ICA", logo: logoICA, size: "h-8 md:h-10" },
                            { name: "NZ Tourism", logo: logoNSTourism, size: "h-10 md:h-14" },
                            { name: "NZSE", logo: logoNZSE, size: "h-8 md:h-10" },
                            { name: "NZ Tertiary", logo: logoNZTertiary, size: "h-8 md:h-12" },
                            { name: "Strategix", logo: logoStrategix, size: "h-8 md:h-10" },
                            { name: "YOOBEE", logo: logoYOOBEE, size: "h-8 md:h-12" },
                            { name: "ICL", logo: logoICL, size: "h-8 md:h-10" },
                            { name: "Ignite", logo: logoIgnite, size: "h-8 md:h-12" },
                            { name: "NZMA", logo: logoNZMA, size: "h-8 md:h-10" },
                            { name: "Skills", logo: logoSkills, size: "h-8 md:h-12" },
                            { name: "Tawera", logo: logoTawera, size: "h-8 md:h-10" },
                            { name: "White Cliffe", logo: logoWhiteCliffe, size: "h-8 md:h-10" },
                            { name: "Wintec", logo: logoWintec, size: "h-8 md:h-12" },
                            { name: "UP", logo: logoUP, size: "h-8 md:h-10" },
                            { name: "SR", logo: logoSR, size: "h-8 md:h-10" },
                        ].map((partner, i) => (
                            <img
                                key={i}
                                src={partner.logo}
                                alt={partner.name}
                                className={`${partner.size} w-auto object-contain filter brightness-0 invert hover:scale-110 transition-transform duration-300 cursor-pointer`}
                            />
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-white font-urbanist py-32 border-t border-gray-100 overflow-hidden">
                <div className="container mx-auto px-6 max-w-5xl text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-light text-[#282728] mb-6 leading-tight"
                    >
                        Start your <br/>
                        <span className="italic text-[#436235]">education journey</span> today
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-gray-600 text-sm md:text-base mb-12 max-w-xl mx-auto"
                    >
                        One conversation can change everything. Let's find your pathway forward and unlock global opportunities.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24"
                    >
                        <a
                            href="/booking"
                            className="bg-[#436235] text-white px-10 py-4 rounded-none text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#436235]/90 transition-all shadow-xl"
                        >
                            Book consultation
                        </a>
                        <a
                            href="/programs-levels"
                            className="border border-gray-200 text-[#282728] px-10 py-4 rounded-none text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-50 transition-all"
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
                        className="relative w-full overflow-hidden rounded-sm shadow-2xl group"
                    >
                        <img 
                            src={bannerTeam} 
                            alt="Education Team" 
                            className="w-full h-auto transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0a]/30 to-transparent pointer-events-none"></div>
                    </motion.div>
                </div>
            </section>

            <ScrollToTop />

            <Footer />
        </div>
    );
}
