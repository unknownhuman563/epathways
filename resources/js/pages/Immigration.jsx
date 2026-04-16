import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, ChevronUp, Star, CheckCircle, Calendar, MapPin, Phone, Mail, Shield } from 'react-feather';
import Navbar from "@/components/navigation-bar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scrolltotop";

// Assets
import MigrationLogo  from "@assets/Immigration/migration_logo.png";

import DevImg         from "@assets/team/Dev.png";
import DaiImg         from "@assets/team/dai.png";
import EmmaImg        from "@assets/team/emma.png";
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

const services = [
    {
        img: AgentsImg,
        tag: "Consultation",
        title: "Visa Consultation",
        desc: "Personalised review of your goals and circumstances to find the right pathway.",
        time: "1–2 hrs",
    },
    {
        img: VisaImg,
        tag: "Application",
        title: "Application Management",
        desc: "Full preparation and lodgement of your visa application with INZ.",
        time: "2–4 wks",
    },
    {
        img: PathwaysImg,
        tag: "Residence",
        title: "Residence Planning",
        desc: "Strategic advice on the fastest and safest route to NZ permanent residence.",
        time: "Ongoing",
    },
    {
        img: SettlementImg,
        tag: "Post-Visa",
        title: "Settlement Support",
        desc: "Guidance on your rights, obligations, and next steps after your visa is granted.",
        time: "Anytime",
    },
];

const consultants = [
    { name: "Dev Bhageerutty",  license: "LIA 201401301", role: "Residence & Skilled Migration", img: DevImg,  rating: 4.9, clients: "150+" },
    { name: "Hendry Dai",       license: "LIA 202200456", role: "Work & Skilled Visas",           img: DaiImg,  rating: 4.8, clients: "80+" },
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

const faqs = [
    { q: "What is a Licensed Immigration Adviser (LIA)?",  a: "A person licensed by the IAA to legally give immigration advice in NZ for a fee. Using a licensed adviser protects you." },
    { q: "How do I know which visa suits me?",              a: "It depends on your qualifications, job situation, and goals. Our free assessment gives you a clear, personalised recommendation." },
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
                <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${open ? 'bg-[#00A693] text-white' : 'bg-gray-100 text-gray-400'}`}>
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
                        <p className="pb-5 text-sm text-gray-500 leading-relaxed">{item.a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Immigration() {
    return (
        <div className="min-h-screen bg-white font-urbanist overflow-x-hidden text-[#282728]">
            <Navbar />

            {/* ══════════════════════════════════════════════════════════════
                HERO  —  split layout: text left | person photo right
            ══════════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#f0faf9] via-white to-white min-h-[88vh] flex items-center">
                {/* Background decorative ring */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full bg-[#00A693]/8 -mr-40 pointer-events-none" />

                <div className="container mx-auto px-6 md:px-12 max-w-7xl flex flex-col lg:flex-row items-center gap-10 py-20">
                    {/* ── Left column ────────────────────────── */}
                    <div className="flex-1 z-10">
                        {/* pill badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 bg-[#00A693]/10 text-[#00A693] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-7"
                        >
                            🌏 Immigration Journey
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                            className="text-5xl md:text-6xl lg:text-[4.2rem] font-bold text-[#282728] leading-[1.1] tracking-tight mb-6"
                        >
                            Your New Life<br />
                            Begins Here,<br />
                            <span className="text-[#00A693]">We Got Your Back! 🇳🇿</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="text-gray-500 text-base md:text-lg leading-relaxed max-w-lg mb-8"
                        >
                            Licensed immigration advisers dedicated to helping you navigate New Zealand's visa system — clearly, honestly, and stress-free.
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                            className="flex flex-wrap gap-4 mb-10"
                        >
                            <a href="/free-assessment" className="flex items-center gap-2 bg-[#282728] text-white text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-[#00A693] transition-colors duration-300 shadow-lg">
                                Get Started <ArrowRight size={15} />
                            </a>
                            <a href="#top-visas" className="flex items-center gap-2 border-2 border-gray-200 text-[#282728] text-sm font-semibold px-7 py-3.5 rounded-full hover:border-[#00A693] hover:text-[#00A693] transition-colors duration-300">
                                Explore Visas ↓
                            </a>
                        </motion.div>

                        {/* Happy clients badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}
                            className="inline-flex items-center gap-4 bg-white rounded-2xl shadow-md border border-gray-100 px-5 py-3"
                        >
                            {/* Avatar stack */}
                            <div className="flex -space-x-3">
                                {[DevImg, DaiImg, EmmaImg].map((src, i) => (
                                    <img key={i} src={src} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white" />
                                ))}
                            </div>
                            <div>
                                <div className="flex items-center gap-1 mb-0.5">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
                                    <span className="text-xs font-bold text-[#282728] ml-1">4.9</span>
                                </div>
                                <div className="text-[11px] text-gray-400 font-medium">300+ Happy Clients</div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Right column: Migration Logo ────────── */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
                        className="flex-shrink-0 flex items-center justify-center lg:justify-end w-full lg:w-auto"
                    >
                        <img src={MigrationLogo} alt="ePathways Migration" className="w-56 md:w-72 lg:w-80 object-contain opacity-90 drop-shadow-xl" />
                    </motion.div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                PARTNER / CREDENTIAL STRIP
            ══════════════════════════════════════════════════════════════ */}
            <section className="py-6 border-y border-gray-100 bg-white overflow-hidden">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl flex flex-wrap items-center justify-center md:justify-between gap-6">
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
                TOP VISA CATEGORIES   (like "Explore Top Searched Spots")
            ══════════════════════════════════════════════════════════════ */}
            <section id="top-visas" className="py-20">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    {/* Section header */}
                    <div className="flex items-start justify-between gap-6 mb-10">
                        <div>
                            <motion.h2
                                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="text-2xl md:text-3xl font-bold text-[#282728]"
                            >
                                Top Visa Categories 🛂
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                                className="text-sm text-gray-400 mt-2 max-w-md"
                            >
                                Unsure which visa is right for you? These are our most enquired visa pathways — each with a tailored approach.
                            </motion.p>
                        </div>
                        <a href="/free-assessment" className="hidden md:flex items-center gap-2 text-sm font-semibold text-[#00A693] hover:text-[#282728] transition-colors flex-shrink-0">
                            See all <ArrowRight size={14} />
                        </a>
                    </div>

                    {/* Scroll row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {topVisas.map((v, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                                className="group flex flex-col items-center gap-3 cursor-pointer"
                            >
                                {/* Circle image */}
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#00A693] transition-all duration-300 shadow-md group-hover:shadow-xl">
                                    <img src={v.img} alt={v.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="text-center">
                                    <div className="text-sm font-semibold text-[#282728] group-hover:text-[#00A693] transition-colors">{v.label}</div>
                                    <div className="text-[11px] text-gray-400 mt-0.5">{v.sub}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                IMMIGRATION SERVICES  (like "Explore Iconic Locations")
            ══════════════════════════════════════════════════════════════ */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-6 mb-10">
                        <div>
                            <motion.h2
                                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="text-2xl md:text-3xl font-bold text-[#282728]"
                            >
                                Visa &amp; Immigration Services ✈️
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                                className="text-sm text-gray-400 mt-2 max-w-lg"
                            >
                                From your first consultation through to residency — we manage every step with care and expertise.
                            </motion.p>
                        </div>
                        <a href="/booking" className="hidden md:flex items-center gap-2 text-sm font-semibold text-[#00A693] hover:text-[#282728] transition-colors flex-shrink-0">
                            Book now <ArrowRight size={14} />
                        </a>
                    </div>

                    {/* 2-col + overflow grid (like location cards) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {services.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className="group relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                            >
                                {/* Image */}
                                <div className="aspect-[4/3] overflow-hidden">
                                    <img src={s.img} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>

                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#282728]/80 via-transparent to-transparent opacity-80" />

                                {/* Tag badge top-left */}
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#00A693] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                    {s.tag}
                                </div>

                                {/* Time badge top-right */}
                                <div className="absolute top-3 right-3 bg-[#00A693] text-white text-[10px] font-bold px-3 py-1 rounded-full">
                                    {s.time}
                                </div>

                                {/* Bottom info */}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="text-white font-bold text-sm mb-1">{s.title}</h3>
                                    <p className="text-gray-300 text-xs leading-snug mb-3">{s.desc}</p>
                                    <a
                                        href="/booking"
                                        className="inline-flex items-center gap-1.5 bg-white text-[#282728] text-[11px] font-bold px-4 py-1.5 rounded-full hover:bg-[#00A693] hover:text-white transition-colors duration-300"
                                    >
                                        Learn More <ArrowRight size={11} />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                LICENSED CONSULTANTS
            ══════════════════════════════════════════════════════════════ */}
            <section id="consultants" className="py-20">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    <div className="flex items-start justify-between gap-6 mb-10">
                        <div>
                            <motion.h2
                                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="text-2xl md:text-3xl font-bold text-[#282728]"
                            >
                                Licensed Immigration Consultants 🛡️
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                                className="text-sm text-gray-400 mt-2 max-w-md"
                            >
                                All advice is provided by IAA-licensed advisers — fully compliant, fully accountable, and fully on your side.
                            </motion.p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {consultants.map((c, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                            >
                                {/* Photo */}
                                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                                    <img src={c.img} alt={c.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#282728]/70 via-transparent to-transparent" />

                                    {/* IAA badge */}
                                    <div className="absolute top-3 right-3 w-11 h-11 rounded-full bg-[#00A693] flex items-center justify-center text-white text-[8px] font-bold text-center leading-tight">
                                        Licensed<br />IAA
                                    </div>

                                    {/* Rating */}
                                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                                        <Star size={11} className="text-amber-400 fill-amber-400" />
                                        <span className="text-[11px] font-bold text-[#282728]">{c.rating}</span>
                                    </div>

                                    {/* Name overlay */}
                                    <div className="absolute bottom-4 left-4">
                                        <h3 className="text-white font-bold text-base leading-tight">{c.name}</h3>
                                        <p className="text-[#00A693] text-[11px] font-semibold">{c.license}</p>
                                    </div>
                                </div>

                                {/* Card body */}
                                <div className="p-5 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 font-medium">{c.role}</span>
                                        <span className="text-[11px] font-bold text-[#00A693]">{c.clients} clients</span>
                                    </div>
                                    <a
                                        href="/booking"
                                        className="w-full flex items-center justify-center gap-2 bg-[#282728] text-white text-xs font-bold py-3 rounded-xl hover:bg-[#00A693] transition-colors duration-300"
                                    >
                                        Book Consultation <ArrowRight size={13} />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                NEWS & ANNOUNCEMENTS
            ══════════════════════════════════════════════════════════════ */}
            <section id="news" className="py-20 bg-gray-50">
                <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                    <div className="flex items-start justify-between gap-6 mb-10">
                        <div>
                            <motion.h2
                                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="text-2xl md:text-3xl font-bold text-[#282728]"
                            >
                                News &amp; Announcements 📢
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                                className="text-sm text-gray-400 mt-2"
                            >
                                Stay current with the latest NZ immigration policy changes and ePathways updates.
                            </motion.p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {newsItems.map((n, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col"
                            >
                                <div className="aspect-video overflow-hidden bg-gray-100">
                                    <img src={n.img} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="p-6 flex flex-col gap-3 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#00A693] bg-[#00A693]/10 px-3 py-1 rounded-full">{n.tag}</span>
                                        <span className="text-[11px] text-gray-400">{n.date}</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-[#282728] leading-snug group-hover:text-[#00A693] transition-colors">{n.title}</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed flex-1">{n.body}</p>
                                    <button className="flex items-center gap-1 text-[#00A693] text-xs font-bold mt-1 hover:gap-2 transition-all">
                                        Read more <ArrowRight size={12} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
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
                                className="text-sm text-gray-400 leading-relaxed mb-8"
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
                            <p className="text-gray-400 text-base max-w-md leading-relaxed">
                                Start your journey with a free immigration assessment. Our licensed advisers will give you a clear, honest picture of your options.
                            </p>
                        </div>

                        {/* Right — action card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                            className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col gap-5 w-full max-w-sm flex-shrink-0"
                        >
                            <h3 className="text-lg font-bold text-[#282728]">Book a Free Consultation</h3>
                            <p className="text-sm text-gray-400">Speak directly with a Licensed Immigration Adviser — no obligation, no hidden fees.</p>

                            <div className="space-y-2 text-sm text-gray-500">
                                {["Free initial assessment", "IAA Licensed advisers", "Personalised visa roadmap"].map((item, i) => (
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
                                Start Free Assessment <ArrowRight size={15} />
                            </a>
                            <a
                                href="/booking"
                                className="w-full flex items-center justify-center gap-2 border border-gray-200 text-[#282728] text-sm font-semibold py-4 rounded-xl hover:border-[#282728] transition-colors duration-300"
                            >
                                <Calendar size={14} /> Book a Consultation
                            </a>

                            {/* Contact row */}
                            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2 text-[11px] text-gray-400">
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
