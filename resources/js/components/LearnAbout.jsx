import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'react-feather';
// Using a placeholder video thumbnail or relevant image
import videoThumbnail from "@assets/processed.png";

export default function LearnAbout() {
    return (
        <section className="py-24 bg-[#282728] font-urbanist">
            <div className="max-w-7xl mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <p className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-2">Overview</p>
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                        Learn About <span className="text-[#436235]">e</span>Pathways
                    </h2>
                    <p className="text-gray-400 max-w-3xl mx-auto text-sm md:text-base leading-relaxed px-4">
                        Discover how Epathways can guide you on your journey to New Zealand. Learn about our services, support, and
                        commitment to making your migration process smoother and more achievable.
                    </p>
                </div>

                {/* Video Container */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl group cursor-pointer"
                >
                    {/* Thumbnail Image */}
                    <img
                        src={videoThumbnail}
                        alt="Epathways Intro Video"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Darker Overlay */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>

                    {/* Play Button Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-20 h-20 md:w-28 md:h-28 rounded-full border-2 border-white/50 flex items-center justify-center bg-white/10 backdrop-blur-sm shadow-2xl transition-all group-hover:bg-white/20 group-hover:border-white"
                        >
                            <Play fill="white" className="text-white w-8 h-8 md:w-12 md:h-12 translate-x-1" />
                        </motion.div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute bottom-6 left-6 text-white/50 text-[10px] tracking-[0.2em] font-light italic">
                        WATCH COMPANY OVERVIEW
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
