import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, ChevronUp, Star, CheckCircle, Calendar, MapPin, Phone, Mail, Shield } from 'react-feather';
import Navbar from "@/components/layout/Navbar";
import ImmigrationServices from "./ImmigrationServices";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";

// Assets
import MigrationLogo  from "@assets/Immigration/migration_logo.png";
import HeroBg         from "@assets/NewSections/nz_hero.png";
import GuidanceImg   from "@assets/NewSections/immigration_guidance.png";
import NZCityImg     from "@assets/NewSections/nz_city.png";

import StudentVisaImg from "@assets/NewSections/student_visa.png";
import VisitorVisaImg from "@assets/NewSections/visitor_visa.png";
import WorkVisaImg    from "@assets/NewSections/work_visa.png";
import SettleVisaImg  from "@assets/NewSections/settle_visa.png";
import ResidencyImg   from "@assets/NewSections/residency_visa.png";
import BrandBanner   from "@assets/NewSections/brand_banner.png";

import DevImg         from "@assets/team/Dev.png";
import DaiImg         from "@assets/team/dai.png";
import EmmaImg        from "@assets/team/emma.png";
import EmilyImg       from "@assets/team/emily.png";
import VisaImg        from "@assets/Services/visa.png";
import AgentsImg      from "@assets/Services/agents.png";
import SettlementImg  from "@assets/Services/settlement.png";
import PathwaysImg    from "@assets/Services/pathways.png";
import JobImg         from "@assets/Services/job.png";
import EducationImg   from "@assets/Services/education.png";

// ─── Data ───────────────────────────────────────────────────────────────────

const topVisas = [
    { emoji: "🛂", label: "Skilled Migrant",  sub: "Residence · 6–12 mos",   img: VisaImg },
    { emoji: "💼", label: "Work Visa (AEWV)", sub: "Work · 4–8 wks",         img: AgentsImg },
    { emoji: "🎓", label: "Student Visa",     sub: "Study · 4–6 wks",        img: EducationImg },
    { emoji: "👨‍👩‍👧", label: "Family Visa",      sub: "Family · 3–9 mos",       img: SettlementImg },
    { emoji: "🌿", label: "Green List",       sub: "Residence · 1–3 mos",    img: PathwaysImg },
    { emoji: "✈️", label: "Visitor Visa",     sub: "Visit · 1–4 wks",        img: JobImg },
];

const services = []; // Removed in favor of ImmigrationServices component

const consultants = [
    { 
        name: "Emily Dela Pena", 
        license: "Finance Admin Champion", 
        role: "Finance & Admin", 
        bio: "Dedicated finance and administration champion ensuring smooth operations and a seamless client experience at ePathways.",
        img: EmilyImg 
    },
    { 
        name: "Dev Bhageerutty", 
        license: "202401351", 
        role: "Licence Immigration Adviser (Provisional)", 
        bio: "Senior adviser with 15 years of immigration law expertise in New Zealand.",
        img: DevImg 
    },
    { 
        name: "Hendry Dai", 
        license: "IAA: 201500074", 
        role: "Licence Immigration Adviser", 
        bio: "Specialist in skilled migration programs and employer accredited work visas.",
        img: DaiImg 
    },
];

const newsItems = [
    {
        tag: "Policy Update",
        date: "Mar 2025",
        title: "INZ Expands Green List Tier 2 Occupations",
        body: "More health and construction roles added — broadening fast-track residence for skilled migrants.",
        img: VisaImg,
    },
    {
        tag: "Visa News",
        date: "Feb 2025",
        title: "AEWV Processing Down to 3 Weeks",
        body: "INZ operational improvements dramatically cut Accredited Employer Work Visa processing times.",
        img: AgentsImg,
    },
    {
        tag: "Announcement",
        date: "Jan 2025",
        title: "ePathways Grows Its Advisory Team",
        body: "Two new Licensed Immigration Advisers join our Auckland office to meet growing demand.",
        img: SettlementImg,
    },
];

const successStories = [
    {
        logo: "Webflow",
        quote: "ePathways made the entire process clear and manageable. I went from uncertainty to approved in six months.",
        name: "Priya Sharma",
        detail: "Student visa, Auckland",
        img: DevImg // Placeholder for avatar
    },
    {
        logo: "Relume",
        quote: "Their attention to detail saved me months of back-and-forth. Professional, responsive, and genuinely invested in my success.",
        name: "Michael Torres",
        detail: "Work visa, Wellington",
        img: DaiImg // Placeholder for avatar
    },
    {
        logo: "Webflow",
        quote: "From initial assessment to permanent residency approval, ePathways guided me every step. Highly recommended.",
        name: "Elena Kowalski",
        detail: "PR application, Christchurch",
        img: EmmaImg // Placeholder for avatar
    }
];

const faqs = [
    { q: "What is a Licensed Immigration Adviser (LIA)?",  a: "A person licensed by the IAA to legally give immigration advice in NZ for a fee. Using a licensed adviser protects you." },
    { q: "How do I know which visa suits me?",              a: "It depends on your qualifications, job situation, and goals. Our assessment gives you a clear, personalised recommendation." },
    { q: "How long does a visa take to process?",           a: "From a few weeks for a visitor visa to over a year for residence. We keep you updated at every step." },
    { q: "Can I work while my application is pending?",     a: "Often yes — bridging options exist depending on your situation. Our advisers will guide you." },
    { q: "What is the Green List?",                         a: "A list of shortage occupations in NZ. Tier 1 roles qualify for immediate residence; Tier 2 has a two-year fast-track pathway." },
    { q: "Do I need a job offer to apply for residence?",   a: "Not always — the Skilled Migrant Category is points-based. A job offer adds significant points but isn't always required." },
];

const partners = ["INZ Accredited", "IAA Licensed", "NZQA Compliant", "Allianz Partner", "Southern Cross"];

// ─── Sub-components ──────────────────────────────────────────────────────────

function FaqItem({ item, i }) {
    const [open, setOpen] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="border-b border-gray-100"
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between py-5 text-left gap-4"
            >
                <span className={`text-sm font-semibold transition-colors ${open ? 'text-[#00A693]' : 'text-[#282728]'}`}>{item.q}</span>
                <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${open ? 'bg-[#00A693] text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <p className="pb-5 text-sm text-gray-600 leading-relaxed">{item.a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Immigration() {
    const [activeTab, setActiveTab] = useState('Student');

    const visaTabs = {
        Student: {
            tag: "Education",
            title: "Study at universities worldwide",
            desc: "Access top institutions globally with full visa sponsorship. We handle admissions, scholarships, and pre-departure orientation to set you up for success.",
            img: StudentVisaImg
        },
        Work: {
            tag: "Career",
            title: "Expand your career horizons",
            desc: "Secure employment abroad through skilled migration programs. We assess eligibility and manage the entire sponsorship process for a seamless transition.",
            img: WorkVisaImg
        },
        Residency: {
            tag: "Life",
            title: "Build your future in NZ",
            desc: "Navigate the complex path to permanent residency with confidence. Our experts provide end-to-end guidance for families and individuals.",
            img: NZCityImg
        }
    };

    const [activeStep, setActiveStep] = useState('Assessment');

    const processSteps = {
        Assessment: {
            title: "We evaluate your profile thoroughly",
            desc: "Our advisers review your background, goals, and eligibility across available pathways.",
            icon: <Shield size={24} />
        },
        Consultation: {
            title: "Expert one-on-one strategy session",
            desc: "We discuss your specific situation and define a clear, actionable pathway forward for your journey.",
            icon: <Calendar size={24} />
        },
        Documents: {
            title: "Meticulous documentation preparation",
            desc: "We guide you through the exact evidence required to make your application bulletproof for authorities.",
            icon: <Mail size={24} />
        },
        Submission: {
            title: "Professional application filing",
            desc: "We handle the entire submission process with Immigration New Zealand on your behalf, ensuring no errors.",
            icon: <CheckCircle size={24} />
        },
        Approval: {
            title: "Managing the outcome",
            desc: "We track progress, respond to inquiries, and manage all communication until your visa is granted.",
            icon: <Star size={24} />
        },
        "Follow-up": {
            title: "Settling in with confidence",
            desc: "We provide expert advice on next steps once you arrive or transition to your new legal status.",
            icon: <MapPin size={24} />
        }
    };

    return (
        <div className="min-h-screen bg-white font-urbanist overflow-x-hidden text-[#282728]">
            <Navbar />

            {/* ══════════════════════════════════════════════════════════════
                HERO  —  split layout: text left | person photo right
            ══════════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center py-24">
                {/* Background Image with Light Overlay */}
                <div className="absolute inset-0 z-0">
                    <img src={HeroBg} alt="Background" className="w-full h-full object-cover scale-105" />
                    <div className="absolute inset-0 bg-black/30"></div>
                </div>

                <div className="container mx-auto px-6 md:px-12 max-w-5xl relative z-10">
                    <div className="flex flex-col items-center text-center">
                        {/* Centered Tag */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[#00A693] text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] mb-6 drop-shadow-md"
                        >
                            Your Aotearoa Journey
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: 0.1, duration: 0.8 }}
                            className="text-6xl md:text-8xl lg:text-[130px] font-black text-white leading-[0.85] tracking-[calc(-0.05em)] mb-10 uppercase flex flex-col items-center drop-shadow-2xl"
                        >
                            <span>Move with</span>
                            <span className="text-[#00A693]">confidence</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-white/60 text-sm md:text-base leading-relaxed max-w-5xl mb-12 font-light tracking-wide"
                        >
                            Expert guidance through every step of your immigration journey. ePathways provides clear, honest, and stress-free pathways to your new life in New Zealand.
                        </motion.p>

                        {/* Premium Hero Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto"
                        >
                            <a 
                                href="/free-assessment" 
                                className="w-full sm:w-auto bg-[#00A693] text-white text-[11px] font-bold px-10 py-4 rounded-none hover:bg-[#008c7c] transition-all duration-300 uppercase tracking-[0.2em] shadow-2xl text-center"
                            >
                                Apply
                            </a>
                            <a 
                                href="/booking" 
                                className="w-full sm:w-auto bg-transparent border border-white/20 text-white text-[11px] font-bold px-10 py-4 rounded-none hover:bg-white/10 transition-all duration-300 uppercase tracking-[0.2em] text-center"
                            >
                                Consult
                            </a>
                        </motion.div>
                    </div>
                </div>
            </section>
            
            {/* ══════════════════════════════════════════════════════════════
                GUIDANCE SECTION  —  White / Editorial Style
            ══════════════════════════════════════════════════════════════ */}
            <section className="bg-white text-[#282728] py-32 font-urbanist overflow-hidden">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-gray-500 mb-6 block">
                                Guidance
                            </span>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-8">
                                We handle immigration with <br />
                                <span className="text-gray-300 italic">care and precision</span>
                            </h2>
                            <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-12 max-w-md">
                                ePathways connects you with licensed advisers who know the terrain. 
                                We've guided thousands through visa applications, residency pathways, and new beginnings abroad.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
                                {/* Feature 1 */}
                                <div className="space-y-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#00A693]">
                                        <CheckCircle size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold">Expert team</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Certified professionals with years of real-world immigration experience.
                                    </p>
                                </div>

                                {/* Feature 2 */}
                                <div className="space-y-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#00A693]">
                                        <MapPin size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold">Proven results</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        High approval rates backed by meticulous preparation and attention to detail.
                                    </p>
                                </div>
                            </div>

                            <a 
                                href="/booking"
                                className="inline-flex items-center gap-3 border border-gray-200 px-8 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-[#282728] hover:text-white transition-all duration-500"
                            >
                                Learn <ArrowRight size={14} />
                            </a>
                        </motion.div>

                        {/* Right Content - Image */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="relative aspect-square lg:aspect-auto lg:h-[600px] overflow-hidden rounded-sm"
                        >
                            <img 
                                src={GuidanceImg} 
                                alt="Immigration Guidance" 
                                className="w-full h-full object-cover transition-all duration-700"
                            />
                            {/* Decorative overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1611]/60 to-transparent" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                VISA PATHWAYS SECTION  —  Dark Green Grid
            ══════════════════════════════════════════════════════════════ */}
            <section className="bg-[#0c1611] text-white py-24 font-urbanist overflow-hidden border-t border-white/5">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    {/* Header */}
                    <div className="text-center mb-20">
                        <motion.span
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            className="text-[11px] font-bold tracking-[0.4em] uppercase text-[#00A693] mb-4 block"
                        >
                            Services
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-medium mb-6 tracking-tight"
                        >
                            Visa pathways tailored to your goals
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            className="text-white/50 text-sm md:text-base max-w-xl mx-auto leading-relaxed"
                        >
                            Whether you're seeking education abroad, work opportunities, or permanent residence, we offer comprehensive support across all major visa categories.
                        </motion.p>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Large Card (Student Visa) */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="bg-white/5 border border-white/10 rounded-sm overflow-hidden flex flex-col group"
                        >
                            <div className="p-10 md:p-14 flex-1">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-[#00A693] mb-4 block">Study</span>
                                <h3 className="text-3xl md:text-4xl font-medium mb-6 leading-tight">Student visa</h3>
                                <p className="text-white/50 text-sm md:text-base leading-relaxed mb-8 max-w-md">
                                    Study at world-class institutions with full visa support, from application to arrival. 
                                    We guide course selection, admissions, and pre-departure logistics.
                                </p>
                                <a href="/booking" className="inline-flex items-center gap-3 border border-white/20 px-8 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-white hover:text-[#0c1611] transition-all duration-500">
                                    Explore <ArrowRight size={14} />
                                </a>
                            </div>
                            <div className="aspect-video relative overflow-hidden">
                                <img src={StudentVisaImg} alt="Student Visa" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                            </div>
                        </motion.div>

                        {/* Right: 2x2 Grid of Smaller Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                                { 
                                    tag: "Travel", title: "Visitor visa", img: VisitorVisaImg, 
                                    desc: "Travel with confidence. Our advisers prepare documentation and applications for tourism, family visits, and short-term stays." 
                                },
                                { 
                                    tag: "Career", title: "Work visa", img: WorkVisaImg, 
                                    desc: "Secure employment abroad through skilled migration programs. We assess eligibility and manage the entire sponsorship process." 
                                },
                                { 
                                    tag: "Settle", title: "Study abroad fully supported", img: SettleVisaImg, 
                                    desc: "Enroll at universities worldwide with complete visa sponsorship and guidance throughout the entire process." 
                                },
                                { 
                                    tag: "Visit", title: "Travel with proper documentation", img: VisitorVisaImg, 
                                    desc: "Tourism and family visits handled with care and precision throughout. We ensure your documents are perfectly in order." 
                                }
                            ].map((card, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                    className="bg-white/5 border border-white/10 rounded-sm overflow-hidden flex flex-col group"
                                >
                                    <div className="p-8 flex-1">
                                        <span className="text-[9px] font-bold tracking-widest uppercase text-[#00A693] mb-3 block">{card.tag}</span>
                                        <h3 className="text-xl font-medium mb-4 leading-tight">{card.title}</h3>
                                        <p className="text-white/40 text-xs leading-relaxed mb-6">
                                            {card.desc}
                                        </p>
                                        <a href="/booking" className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-white hover:text-[#00A693] transition-colors group/link">
                                            Explore <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                                        </a>
                                    </div>
                                    <div className="h-48 relative overflow-hidden border-t border-white/5">
                                        <img src={card.img} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                MOST SOUGHT VISAS SECTION  —  Tabbed Layout
            ══════════════════════════════════════════════════════════════ */}
            <section id="top-visas" className="py-32 bg-white">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <motion.span
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            className="text-[11px] font-bold tracking-[0.4em] uppercase text-gray-500 mb-4 block"
                        >
                            Popular
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="text-4xl md:text-6xl font-medium mb-6 tracking-tight text-[#282728]"
                        >
                            Most sought visas
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            className="text-gray-600 text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-10"
                        >
                            These pathways open doors for thousands each year. Explore what might work for you.
                        </motion.p>
                        <a 
                            href="/booking" 
                            className="inline-flex items-center gap-3 border border-gray-200 px-8 py-3 text-[11px] font-bold uppercase tracking-widest hover:border-[#282728] transition-all duration-300"
                        >
                            Discover <ArrowRight size={14} />
                        </a>
                    </div>

                    {/* Tabs */}
                    <div className="flex justify-center gap-8 mb-16 border-b border-gray-100">
                        {Object.keys(visaTabs).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 text-sm font-bold tracking-widest uppercase transition-all relative ${activeTab === tab ? 'text-[#282728]' : 'text-gray-300 hover:text-gray-600'}`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#282728]" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-gray-50 rounded-sm overflow-hidden"
                        >
                            <div className="aspect-[4/3] relative overflow-hidden">
                                <img 
                                    src={visaTabs[activeTab].img} 
                                    alt={activeTab} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-12 md:p-16">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-[#00A693] mb-4 block">
                                    {visaTabs[activeTab].tag}
                                </span>
                                <h3 className="text-3xl md:text-5xl font-medium mb-8 leading-tight text-[#282728]">
                                    {visaTabs[activeTab].title}
                                </h3>
                                <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-10 max-w-md">
                                    {visaTabs[activeTab].desc}
                                </p>
                                <a 
                                    href="/booking" 
                                    className="inline-flex items-center gap-3 border border-gray-200 px-8 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-[#282728] hover:text-white transition-all duration-300"
                                >
                                    Learn more <ArrowRight size={14} />
                                </a>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                ASSESSMENT VISAS SECTION
            ══════════════════════════════════════════════════════════════ */}
            <section className="py-32 bg-white">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    <div className="text-center mb-16">
                        <span className="text-[11px] font-bold tracking-[0.4em] uppercase text-[#00A693] mb-4 block">
                            Assessment
                        </span>
                        <h2 className="text-4xl md:text-5xl font-medium mb-6 tracking-tight text-[#282728]">
                            Select your visa pathway
                        </h2>
                        <p className="text-gray-600 text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
                            Choose a visa category below to start your assessment.<br className="hidden md:block" /> We will evaluate your qualifications and help you find the best path forward.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: "Student Visa", desc: "Study at leading institutions with full support for admissions and visa processing.", img: StudentVisaImg, link: "/visa-assessment-form?type=student" },
                            { title: "Work Visa", desc: "Secure international employment through skilled migration and employer programs.", img: WorkVisaImg, link: "/visa-assessment-form?type=work" },
                            { title: "Visitor Visa", desc: "Experience new destinations for tourism, business, or visiting family and friends.", img: VisitorVisaImg, link: "/visa-assessment-form?type=visitor" },
                            { title: "Family Visa", desc: "Reunite with your loved ones through partner, parent, and dependent child pathways.", img: SettleVisaImg, link: "/visa-assessment-form?type=family" },
                            { title: "Residency Visa", desc: "Navigate the complex path to permanent residency with end-to-end expert guidance.", img: ResidencyImg, link: "/visa-assessment-form?type=residency" },
                            { title: "General Assessment", desc: "Unsure which visa suits you? Let our experts evaluate your profile and find the best option.", img: GuidanceImg, link: "/visa-assessment-form?type=general" },
                        ].map((visa, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative h-[400px] md:h-[450px] rounded-sm overflow-hidden bg-[#282728]"
                            >
                                <img 
                                    src={visa.img} 
                                    alt={visa.title} 
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                                <div className="absolute inset-0 p-8 flex flex-col justify-end items-start">
                                    <h3 className="text-2xl font-medium text-white mb-3">
                                        {visa.title}
                                    </h3>
                                    <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-[90%] group-hover:text-white transition-colors duration-300">
                                        {visa.desc}
                                    </p>
                                    <a 
                                        href={visa.link}
                                        className="inline-flex items-center gap-3 bg-white text-[#282728] px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-[#00A693] hover:text-white transition-all duration-300"
                                    >
                                        Assess now <ArrowRight size={14} />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>



            {/* ══════════════════════════════════════════════════════════════
                PARTNER / CREDENTIAL STRIP (Moved below Top Visas)
            ══════════════════════════════════════════════════════════════ */}
            <section className="py-12 border-y border-gray-100 bg-white overflow-hidden">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl flex flex-wrap items-center justify-center md:justify-between gap-10">
                    {partners.map((p, i) => (
                        <motion.span
                            key={i}
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                            className="text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-[#00A693] transition-colors cursor-default"
                        >
                            {p}
                        </motion.span>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                TEAM / LICENSED ADVISERS  —  Horizontal Dark Cards
            ══════════════════════════════════════════════════════════════ */}
            <section id="consultants" className="py-32 bg-[#0c1611] text-white">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    {/* Header */}
                    <div className="text-center mb-24">
                        <motion.span
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            className="text-[11px] font-bold tracking-[0.4em] uppercase text-[#00A693] mb-4 block"
                        >
                            Team
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-medium mb-6 tracking-tight"
                        >
                            Meet our licensed advisers
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            className="text-white/50 text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
                        >
                            Experienced professionals guiding your journey
                        </motion.p>
                    </div>

                    {/* Consultant Grid — 1 row, 3 columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {consultants.map((c, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="flex flex-col sm:flex-row bg-white/5 border border-white/10 rounded-sm overflow-hidden group hover:border-white/20 transition-all duration-500"
                            >
                                {/* Left: Image (45% approx) */}
                                <div className="sm:w-[45%] aspect-[4/5] relative overflow-hidden bg-white/10">
                                    <img 
                                        src={c.img} 
                                        alt={c.name} 
                                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-all duration-700" 
                                    />
                                    {/* IAA badge */}
                                    <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-[#00A693] flex items-center justify-center text-white text-[7px] font-bold text-center leading-tight">
                                        Licensed<br />IAA
                                    </div>
                                </div>

                                {/* Right: Info (55%) */}
                                <div className="sm:w-[55%] p-10 flex flex-col justify-center">
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#00A693] mb-3 block">
                                        {c.role}
                                    </span>
                                    <h3 className="text-2xl md:text-3xl font-medium mb-1 text-white leading-tight">
                                        {c.name}
                                    </h3>
                                    <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-4">
                                        {c.license}
                                    </div>
                                    <a 
                                        href="/immigration-assessment" 
                                        className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-white hover:text-[#00A693] transition-colors group/link"
                                    >
                                        Connect <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                SUCCESS STORIES  —  Testimonial Grid
            ══════════════════════════════════════════════════════════════ */}
            <section id="stories" className="py-32 bg-white">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    {/* Header */}
                    <div className="mb-20">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-medium mb-4 tracking-tight text-[#282728]"
                        >
                            Success stories
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            className="text-gray-500 text-sm md:text-base max-w-lg leading-relaxed"
                        >
                            Real journeys, real outcomes
                        </motion.p>
                    </div>

                    {/* Stories Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {successStories.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="bg-gray-50/50 border border-gray-100 p-10 flex flex-col min-h-[400px] group hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500"
                            >
                                {/* Logo Placeholder */}
                                <div className="text-[#282728] font-black text-xl mb-10 flex items-center gap-2">
                                    <div className="w-6 h-6 bg-[#282728] rounded-sm flex items-center justify-center">
                                        <div className="w-3 h-3 border-2 border-white"></div>
                                    </div>
                                    {s.logo}
                                </div>

                                <p className="text-[#282728] text-lg leading-relaxed mb-12 flex-1 font-medium italic">
                                    "{s.quote}"
                                </p>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                        <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-[#282728]">{s.name}</h4>
                                        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest">{s.detail}</p>
                                    </div>
                                </div>

                                <a 
                                    href="/stories" 
                                    className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-[#282728] hover:text-[#00A693] transition-colors group/link"
                                >
                                    Read story <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                                </a>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
            {/* ══════════════════════════════════════════════════════════════
                BLOG / NEWS SECTION
            ══════════════════════════════════════════════════════════════ */}
            <section id="news" className="py-32 bg-white border-t border-gray-100">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                        <div>
                            <motion.span
                                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                                className="text-[11px] font-bold tracking-[0.4em] uppercase text-gray-500 mb-4 block"
                            >
                                Blog
                            </motion.span>
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="text-4xl md:text-5xl font-medium tracking-tight text-[#282728]"
                            >
                                Latest migration insights
                            </motion.h2>
                        </div>
                        <motion.div
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        >
                            <a 
                                href="/news" 
                                className="inline-flex items-center gap-3 border border-gray-200 px-8 py-3 text-[11px] font-bold uppercase tracking-widest hover:border-[#282728] transition-all duration-300"
                            >
                                View all
                            </a>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {newsItems.map((n, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="group flex flex-col"
                            >
                                <div className="aspect-video overflow-hidden bg-gray-100 mb-8 rounded-sm">
                                    <img src={n.img} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#00A693]">{n.tag}</span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">5 min read</span>
                                </div>
                                <h3 className="text-xl md:text-2xl font-medium text-[#282728] leading-tight mb-4 group-hover:text-[#00A693] transition-colors">
                                    {n.title}
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">
                                    {n.body}
                                </p>
                                <a 
                                    href={`/news/${i}`} 
                                    className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-[#282728] hover:text-[#00A693] transition-colors group/link"
                                >
                                    Read more <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                                </a>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                NEWSLETTER CTA SECTION
            ══════════════════════════════════════════════════════════════ */}
            <section className="py-32 bg-[#0c1611] text-white overflow-hidden relative">
                <div className="container mx-auto px-6 md:px-12 max-w-4xl text-center relative z-10">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-medium mb-6 tracking-tight"
                    >
                        Stay updated on policy changes
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        className="text-white/50 text-sm md:text-base mb-12 max-w-xl mx-auto leading-relaxed"
                    >
                        Join our newsletter to receive the latest New Zealand immigration updates and exclusive expert insights delivered directly to your inbox.
                    </motion.p>
                    
                    <motion.form
                        initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-6"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <input 
                            type="email" 
                            placeholder="Enter your email" 
                            className="flex-1 bg-white/5 border border-white/10 px-6 py-4 text-sm focus:outline-none focus:border-[#00A693] transition-colors"
                        />
                        <button 
                            type="submit"
                            className="bg-[#00A693] text-white font-bold uppercase tracking-[0.2em] text-[11px] px-10 py-4 hover:bg-[#008c7c] transition-all"
                        >
                            Sign up
                        </button>
                    </motion.form>
                    <p className="text-[10px] text-white/30">
                        By clicking Sign Up you're confirming that you agree with our Terms and Conditions.
                    </p>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                FINAL BRAND BANNER
            ══════════════════════════════════════════════════════════════ */}
            <section className="bg-white py-32">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                        transition={{ duration: 1.2 }}
                        className="aspect-[21/9] rounded-sm overflow-hidden shadow-2xl"
                    >
                        <img src={BrandBanner} alt="New Zealand Landscape" className="w-full h-full object-cover" />
                    </motion.div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                FAQ
            ══════════════════════════════════════════════════════════════ */}
            <section id="faq" className="py-20">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
                        {/* Left label */}
                        <div className="lg:col-span-2">
                            <motion.h2
                                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="text-2xl md:text-3xl font-bold text-[#282728] mb-4"
                            >
                                Frequently Asked Questions 💬
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                                className="text-sm text-gray-500 leading-relaxed mb-8"
                            >
                                Got more questions? Our licensed advisers are happy to help.
                            </motion.p>
                            <a
                                href="/booking"
                                className="inline-flex items-center gap-2 bg-[#282728] text-white text-xs font-bold px-6 py-3 rounded-full hover:bg-[#00A693] transition-colors duration-300"
                            >
                                Ask an adviser <ArrowRight size={13} />
                            </a>
                        </div>

                        {/* Accordion */}
                        <div className="lg:col-span-3">
                            {faqs.map((f, i) => <FaqItem key={i} item={f} i={i} />)}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                ASSESSMENT CTA  —  full-bleed teal
            ══════════════════════════════════════════════════════════════ */}
            <section id="assessment" className="py-24 bg-[#282728] relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-[#00A693]/20 pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-[#00A693]/5 pointer-events-none" />

                <div className="container mx-auto px-6 md:px-12 max-w-7xl relative z-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                        {/* Left */}
                        <div>
                            <img src={MigrationLogo} alt="ePathways Migration" className="h-12 object-contain mb-8 brightness-0 invert opacity-60" />
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4"
                            >
                                We Got<br /><span className="text-[#00A693]">Your Back. 🇳🇿</span>
                            </motion.h2>
                            <p className="text-gray-500 text-base max-w-md leading-relaxed">
                                Start your journey with a comprehensive immigration assessment. Our licensed advisers will give you a clear, honest picture of your options.
                            </p>
                        </div>

                        {/* Right — action card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                            className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col gap-5 w-full max-w-sm flex-shrink-0"
                        >
                            <h3 className="text-lg font-bold text-[#282728]">Book a Free Consultation</h3>
                            <p className="text-sm text-gray-500">Speak directly with a Licensed Immigration Adviser — no obligation, no hidden fees.</p>

                            <div className="space-y-2 text-sm text-gray-600">
                                {["Comprehensive assessment", "IAA Licensed advisers", "Personalised visa roadmap"].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <CheckCircle size={14} className="text-[#00A693]" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>

                            <a
                                href="/free-assessment"
                                className="w-full flex items-center justify-center gap-2 bg-[#00A693] text-white text-sm font-bold py-4 rounded-xl hover:bg-[#008f7e] transition-colors duration-300"
                            >
                                Start Assessment <ArrowRight size={15} />
                            </a>
                            <a
                                href="/booking"
                                className="w-full flex items-center justify-center gap-2 border border-gray-200 text-[#282728] text-sm font-semibold py-4 rounded-xl hover:border-[#282728] transition-colors duration-300"
                            >
                                <Calendar size={14} /> Book a Consultation
                            </a>

                            {/* Contact row */}
                            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2 text-[11px] text-gray-500">
                                <a href="tel:+64277775586" className="flex items-center gap-2 hover:text-[#00A693] transition-colors"><Phone size={12} /> +64 27 777 5586</a>
                                <a href="mailto:info@epathways.co.nz" className="flex items-center gap-2 hover:text-[#00A693] transition-colors"><Mail size={12} /> info@epathways.co.nz</a>
                                <span className="flex items-center gap-2"><MapPin size={12} /> Auckland, New Zealand</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <ScrollToTop />
            <Footer />
        </div>
    );
}
