import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'react-feather';
import Navbar from "@/components/navigation-bar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scrolltotop";
import JourneyExperience from "@/components/JourneyExperience";

// Assets
import heroBg from "@assets/Services/education.png";
import ceoImage from "@assets/team/dina.png";

export default function EducationJourney() {
    return (
        <div className="min-h-screen bg-white font-urbanist overflow-x-hidden">
            <Navbar />

            {/* Hero Section */}
            <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
                <img
                    src={heroBg}
                    alt="University Study"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

                <div className="relative z-10 container mx-auto px-4 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-bold text-white max-w-5xl mx-auto leading-tight"
                    >
                        Your Gateway to Study, Live, and Succeed in New Zealand
                    </motion.h1>
                </div>
            </section>

            {/* CEO Message Section */}
            <section className="py-24 container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 max-w-7xl mx-auto">

                    {/* CEO Image Container */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative group h-full min-h-[500px] lg:min-h-0"
                    >
                        <div className="absolute -inset-4 bg-gray-50 rounded-3xl -z-10 transition-transform group-hover:scale-105 duration-700"></div>
                        <img
                            src={ceoImage}
                            alt="Dinah Jabone"
                            className="absolute inset-0 w-full h-full object-cover object-top rounded-2xl shadow-2xl transition-all duration-700"
                        />
                    </motion.div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col justify-between py-2"
                    >
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-[#282728] leading-tight mb-8">
                                Choose smart. Study with purpose. <br />
                                <span className="text-[#436235]">Build a career that grows with the future.</span>
                            </h2>

                            <div className="relative pl-8 border-l-2 border-[#436235]/30 mb-8">
                                <p className="text-gray-600 text-base md:text-lg leading-relaxed italic mb-6">
                                    "ePathways is a trusted education and migration consultancy dedicated
                                    to guiding students toward global opportunities. We help dreams
                                    <span className="font-bold text-[#282728] mx-1">emerge</span> through clear guidance and personalized pathways. We
                                    <span className="font-bold text-[#282728] mx-1">energise</span> goals by providing expert support, strong international
                                    partnerships, and informed decision-making. As journeys progress, we
                                    help individuals
                                    <span className="font-bold text-[#282728] mx-1">evolve</span> into confident global learners and professionals.
                                    At ePathways, every step is built with purpose, trust, and a vision for a better future."
                                </p>

                                <div className="mt-8">
                                    <h4 className="text-xl font-bold text-[#282728]">Dinah Jabone</h4>
                                    <p className="text-[#436235] font-medium tracking-wide">CEO & Owner</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <motion.button
                                whileHover={{ x: 10 }}
                                className="inline-flex items-center gap-3 bg-[#282728] text-white px-8 py-4 rounded-lg font-bold transition-all hover:bg-black group shadow-lg"
                            >
                                See Programs
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </section>

            <JourneyExperience />

            <ScrollToTop />
            <Footer />
        </div>
    );
}
