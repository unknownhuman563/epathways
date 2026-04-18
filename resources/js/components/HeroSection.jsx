import React from 'react';
import { motion } from 'framer-motion';
import testi1 from "@assets/Testimonies/testi1.png";
import testi2 from "@assets/Testimonies/testi2.png";
import testi3 from "@assets/Testimonies/testi3.png";

export default function HeroSection({ backgroundVideo }) {
    return (
        <div className="relative h-screen w-full overflow-hidden font-urbanist">
            {/* Background Video with Overlay */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            >
                <source src={backgroundVideo} type="video/mp4" />
            </video>
            
            {/* Clean Grayish Overlay (Strictly Preserved) */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"></div>
            
            {/* Centered Content (Pinned Higher) */}
            <div className="relative z-10 flex h-full items-center justify-center container mx-auto px-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="max-w-7xl text-center flex flex-col items-center -mt-40"
                >

                    {/* Downsized Premium Social Proof Pill */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="inline-flex items-center gap-3 mb-10 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
                    >
                        <div className="flex -space-x-2">
                            <img src={testi1} alt="Client 1" className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white/30 object-cover" />
                            <img src={testi2} alt="Client 2" className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white/30 object-cover" />
                            <img src={testi3} alt="Client 3" className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white/30 object-cover" />
                            <div className="relative w-5 h-5 md:w-6 md:h-6 rounded-full overflow-hidden flex items-center justify-center bg-white/20 border-2 border-white/30">
                                <span className="text-[7px] md:text-[8px] font-bold text-white">+97</span>
                            </div>
                        </div>
                        <div className="h-3 w-[1px] bg-white/30"></div>
                        <div className="flex flex-col text-left leading-tight">
                            <span className="text-[7px] md:text-[8px] text-white uppercase tracking-[0.2em] font-bold">Trusted by 500+</span>
                            <span className="text-[7px] md:text-[8px] text-white/50 font-medium whitespace-nowrap">Successful Visa Applicants</span>
                        </div>
                    </motion.div>

                    <div className="flex flex-col items-center mb-10">
                        <span className="text-xl md:text-3xl font-bold text-white uppercase tracking-[0.6em] mb-4 opacity-70">
                            Paving the Path Towards
                        </span>
                        <h1 className="text-6xl sm:text-8xl md:text-[140px] lg:text-[230px] font-black leading-[0.75] tracking-[calc(-0.06em)] text-white uppercase flex flex-col items-center">
                            <span className="relative">
                                New Zealand
                            </span>
                            <span className="text-[#436235]">Future</span>
                        </h1>
                    </div>

                    <p className="text-xs md:text-sm mb-12 text-white/60 max-w-5xl font-light leading-relaxed tracking-wider mx-auto px-4">
                        ePathways is your trusted partner, providing expert guidance and end-to-end support—from assessment to success.
                    </p>

                    {/* Smaller Premium Ghost Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
                        <motion.a 
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 1)", color: "#282728" }}
                            whileTap={{ scale: 0.95 }}
                            href="/booking" 
                            className="w-full sm:w-auto bg-transparent border border-white text-white px-7 py-2.5 rounded-none text-[9px] font-bold tracking-[0.2em] transition-all duration-300 uppercase text-center"
                        >
                            Book Free Consultation
                        </motion.a>
                        <motion.a 
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 1)", color: "#282728" }}
                            whileTap={{ scale: 0.95 }}
                            href="/free-assessment" 
                            className="w-full sm:w-auto bg-transparent border border-white text-white px-7 py-2.5 rounded-none text-[9px] font-bold tracking-[0.2em] transition-all duration-300 uppercase text-center"
                        >
                            Free Assessment
                        </motion.a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
