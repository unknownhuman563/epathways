import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'react-feather';
import Navbar from "@/components/navigation-bar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scrolltotop";
import LearnAbout from "@/components/LearnAbout";
import ThreePillars from "@/components/ThreePillars";

// Import assets
import GroupPic from "@assets/about_us/group_pic.png";
import GroupPic2 from "@assets/about_us/group_pic2.png";
import DevLIA from "@assets/team/Dev.png";
import LogoBackdrop from "@assets/newlogosite.png";
import LogoBlack from "@assets/newlogosite.png";

// Team Members Data
import DevImg from "@assets/team/Dev.png";
import DinaImg from "@assets/team/dina.png";
import EmmaImg from "@assets/team/emma.png";
import DaiImg from "@assets/team/dai.png";
import EmilyImg from "@assets/team/emily.png";
import NovaImg from "@assets/team/nova.png";

const teamMembers = [
    { name: "DAVID BHAGEERUTTY", role: "CEO, FOUNDING MEMBER", image: DevImg },
    { name: "DINAH SUARIN", role: "CO, FOUNDING MEMBER", image: DinaImg },
    { name: "EMMA CEBALLO", role: "PEOPLE JOURNEY EXPERIENCE CHAMPION", image: EmmaImg },
    { name: "HENDRY DAI", role: "LICENSE IMMIGRATION ADVISER", image: DaiImg },
    { name: "DINAH SUARIN", role: "FINANCE ADMIN CHAMPION", image: DinaImg },
    { name: "NOVA PALACA", role: "ADMIN CHAMPION", image: NovaImg }
];

export default function AboutUs() {
    return (
        <div className="min-h-screen bg-white font-urbanist overflow-x-hidden">
            <Navbar />

            {/* Hero Section */}
            <section className="relative h-[65vh] min-h-[500px] w-full bg-[#f3f4f6] flex flex-col items-center justify-center pt-20">
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none p-20">
                    <img
                        src={LogoBackdrop}
                        alt="ePathways Logo Backdrop"
                        className="w-full max-w-4xl object-contain opacity-50 grayscale"
                    />
                </div>

                <div className="relative z-10 text-center px-4">
                    <h1 className="text-5xl md:text-7xl font-medium text-[#282728] mb-6">
                        About <span className="font-bold">Us</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-white font-medium tracking-widest uppercase opacity-80">
                        emerge. energise. evolve
                    </p>
                </div>
            </section>

            {/* Content Section: Emerge, Energise, Evolve */}
            <section className="py-32 container mx-auto px-4 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    {/* Left: Overlapping Images and Stats Box */}
                    <div className="relative">
                        {/* Background Image (group_pic2) */}
                        <div className="bg-gray-100 rounded-lg aspect-[5/4] w-[85%] overflow-hidden shadow-xl">
                            <img
                                src={GroupPic2}
                                alt="ePathways Celebration"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Foreground Image (group_pic) */}
                        <div className="absolute top-40 right-0 w-[60%] aspect-square rounded-lg overflow-hidden shadow-2xl">
                            <img
                                src={GroupPic}
                                alt="ePathways Professional Team"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Overlapping dark box with green bottom border */}
                        <div className="absolute -bottom-10 -left-10 bg-[#282728] py-5 px-3 text-white min-w-[170px] shadow-2xl border-b-[6px] border-[#436235] text-center z-20">
                            <div className="text-3xl font-bold mb-0.5">300 +</div>
                            <div className="text-[10px] font-light text-gray-400 uppercase tracking-[0.2em]">
                                Visa Approvals
                            </div>
                        </div>
                    </div>

                    {/* Right: Content */}
                    <div className="lg:pl-12 mt-20 lg:mt-0">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">About Us</span>
                            <div className="h-[2px] w-12 bg-[#436235]"></div>
                        </div>

                        <h2 className="text-5xl md:text-6xl font-bold text-[#282728] mb-10 leading-tight">
                            emerge. energise. evolve
                        </h2>

                        <p className="text-lg text-gray-500 mb-12 leading-relaxed font-light">
                            Pathways empowers students to emerge. energise. and evolve by guiding them through global education opportunities, scholarships, and career pathways.
                        </p>

                        <ul className="space-y-8 mb-16">
                            {[
                                "A licensed Education and Migration Consultancy based in Auckland, New Zealand.",
                                "Providing families end-to-end support from course selection to residency.",
                                "Operating in New Zealand and Australia.",
                                "Accredited partners with top NZ institutions."
                            ].map((item, index) => (
                                <li key={index} className="flex items-start gap-5 group">
                                    <div className="mt-1 w-6 h-6 bg-[#436235] rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                                        <Check className="text-white w-3.5 h-3.5" strokeWidth={4} />
                                    </div>
                                    <span className="text-sm text-gray-400 font-medium italic leading-relaxed">{item}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="flex flex-wrap gap-5">
                            <a href="/programs-levels" className="px-10 py-4 bg-[#282728] text-white text-[12px] font-bold rounded flex items-center gap-4 hover:bg-black transition-all uppercase tracking-widest shadow-xl active:scale-95 group">
                                Programs <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                            </a>
                            <a href="/contact" className="px-10 py-4 bg-white border border-gray-300 text-[#282728] text-[12px] font-bold rounded hover:bg-gray-50 transition-all uppercase tracking-widest shadow-sm">
                                Contact
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Licensed and Accredited Section */}
            <section className="py-32 bg-white">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
                        {/* Left: Benefits */}
                        <div className="pt-12">
                            <div className="flex items-center gap-4 mb-8">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Licensed and Accredited in New Zealand</span>
                                <div className="h-[2px] w-12 bg-[#436235]"></div>
                            </div>

                            <h2 className="text-5xl font-bold text-[#282728] mb-16 leading-tight uppercase tracking-tight">
                                Licensed and Accredited <br /> in <span className="text-[#436235]">New Zealand</span>
                            </h2>

                            <div className="space-y-5 max-w-lg">
                                {[
                                    "Partnered with top NZ Schools and Employers",
                                    "Collaborates with Allianz & Southern Cross for insurance",
                                    "Compliant with NZQA and INZ standards"
                                ].map((item, index) => (
                                    <div key={index} className="bg-[#282728] p-10 rounded-xl text-gray-300 text-sm font-medium tracking-wide shadow-lg border-l-4 border-transparent hover:border-[#436235] transition-all duration-300">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Advisor Card */}
                        <div className="bg-gray-50 rounded-3xl shadow-inner border border-gray-100 overflow-hidden">
                            <div className="flex flex-col h-full bg-white relative group">
                                <div className="absolute top-10 left-10 z-20">
                                    <div className="w-16 h-16 bg-[#436235]/10 rounded-full flex items-center justify-center p-3 border border-[#436235]/20 backdrop-blur-sm">
                                        <div className="w-full h-full bg-[#436235] rounded-full flex items-center justify-center text-white text-[8px] uppercase font-bold text-center leading-none">
                                            Licensed<br />IAA
                                        </div>
                                    </div>
                                </div>

                                <div className="p-12 pb-0 relative z-10 bg-white">
                                    <h3 className="text-4xl font-bold text-[#282728] mb-10 uppercase tracking-tight leading-[1.1]">
                                        Licensed Immigration<br /><span className="text-gray-400">Advisers (LIA)</span>
                                    </h3>
                                </div>

                                <div className="relative aspect-[3/4] overflow-hidden">
                                    <img
                                        src={DevLIA}
                                        alt="Dev Bhageerutty (LIA)"
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#282728] via-transparent to-transparent opacity-90"></div>
                                    <div className="absolute bottom-10 left-10 text-white z-20">
                                        <div className="text-3xl font-bold mb-2">Dev Bhageerutty</div>
                                        <div className="text-[10px] text-gray-300 uppercase tracking-[0.2em] font-medium leading-relaxed mb-6">
                                            (LIA 201401301)<br />
                                            dev@epathways.co.nz
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-glow"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-white/30"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Team Behind ePathways Section */}
            <section className="py-24 bg-white border-t border-gray-100">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-col items-center mb-20 text-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-4">The Team Behind</span>
                        <div className="flex items-center gap-2 mb-6">
                            <img src={LogoBlack} alt="ePathways Logo" className="h-8 object-contain grayscale brightness-0" />
                        </div>
                        <div className="h-0.5 w-16 bg-[#436235]"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="group relative rounded-2xl overflow-hidden shadow-2xl bg-white aspect-[4/5] overflow-hidden">
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                                />
                                <div className="absolute inset-x-0 bottom-0 p-8 pt-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                    <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-tight leading-tight">
                                        {member.name}
                                    </h3>
                                    <p className="text-[10px] text-gray-300 font-medium uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                                        {member.role}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Global Reach Section */}
            <section className="py-24 bg-[#fcfcfc] overflow-hidden">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="mb-20">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Pathways</span>
                            <div className="h-[2px] w-12 bg-[#436235]"></div>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#282728] uppercase tracking-tight">
                            ePathways Evolves <br /> the <span className="text-[#436235]">World</span>
                        </h2>
                    </div>

                    <div className="relative w-full aspect-[2/1] bg-white rounded-[3rem] shadow-inner border border-gray-100 flex items-center justify-center p-12 overflow-hidden">
                        {/* Placeholder for World Map - Using a clean SVG Map concept */}
                        <svg viewBox="0 0 1000 500" className="w-full h-full opacity-10 grayscale pointer-events-none absolute inset-0">
                            <path d="M150,150 Q200,100 250,150 T350,150 T450,150 T550,150 T650,150 T750,150 T850,150" fill="none" stroke="#282728" strokeWidth="2" />
                            {/* Generic World Map Silhouette */}
                            <path d="M100,100 L900,100 L900,400 L100,400 Z" fill="#282728" opacity="0.1" />
                        </svg>

                        {/* Map Pins / Locations */}
                        <div className="relative w-full h-full z-10">
                            {/* Example Pins matched to screenshot locations roughly */}
                            {[
                                { name: "New Zealand", top: "85%", left: "88%" },
                                { name: "Philippines", top: "55%", left: "78%" },
                                { name: "Vietnam", top: "52%", left: "74%" },
                                { name: "Indonesia", top: "65%", left: "75%" },
                                { name: "India", top: "55%", left: "68%", main: true },
                                { name: "Australia", top: "78%", left: "82%" },
                                { name: "Mauritius", top: "72%", left: "62%" }
                            ].map((loc, idx) => (
                                <div
                                    key={idx}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                                    style={{ top: loc.top, left: loc.left }}
                                >
                                    {loc.main ? (
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full border-4 border-white shadow-2xl overflow-hidden animate-bounce">
                                                <img src={DevImg} className="w-full h-full object-cover" alt="Main Representative" />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#436235] rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="w-6 h-6 bg-[#436235] rounded-full border-2 border-white shadow-xl flex items-center justify-center hover:scale-125 transition-transform cursor-pointer">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                            </div>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[8px] font-bold uppercase tracking-widest text-gray-500 z-30">
                                                {loc.name}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* How ePathways Helps You Section */}
            <ThreePillars />

            {/* Learn About Section */}
            <LearnAbout />

            <ScrollToTop />
            <Footer />
        </div>
    );
}
