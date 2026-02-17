import React from 'react';
import { motion } from 'framer-motion';
import whiteLogo from "@assets/epath-white-logo.png";
// Using a relevant placeholder from the project assets
import arrivalImage from "@assets/Testimonies/testi2.png";

export default function SuccessStories() {
    return (
        <section className="py-20 bg-white font-urbanist">
            <div className="max-w-7xl mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-sm md:text-base font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
                        TESTIMONIALS
                    </h2>
                </div>

                {/* Featured Story Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative max-w-5xl mx-auto aspect-[21/9] md:aspect-[16/7] rounded-3xl overflow-hidden shadow-2xl group"
                >
                    {/* Background Image */}
                    <img
                        src={arrivalImage}
                        alt="Franz & Juniven Arrival"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-between z-10">
                        {/* Logo and Pill */}
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                                <img src={whiteLogo} alt="ePathways" className="h-4 md:h-5 brightness-0 invert" />
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="max-w-xl">
                            <h3 className="text-4xl md:text-6xl font-light text-white leading-tight mb-4 italic font-serif">
                                Franz & Juniven <br />
                                <span className="font-bold opacity-90 not-italic font-urbanist">Arrival</span>
                            </h3>

                            <div className="flex flex-col gap-1">
                                <span className="text-white text-sm md:text-lg font-bold tracking-widest uppercase opacity-80">
                                    AUCKLAND, NEW ZEALAND
                                </span>
                                <span className="text-white/60 text-xs md:text-sm font-medium tracking-wider">
                                    October 2025
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Subtle Frame/Boarder Effect */}
                    <div className="absolute inset-4 border border-white/10 rounded-2xl pointer-events-none"></div>
                </motion.div>
            </div>
        </section>
    );
}
