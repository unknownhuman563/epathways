import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'react-feather';
import AboutImg from "@assets/about_us/group_pic.png";

export default function AboutBrief() {
    return (
        <section className="py-24 bg-white font-urbanist overflow-hidden">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-stretch">
                    
                    {/* Left Side: Content */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex flex-col items-start justify-center"
                    >
                        <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.3em] mb-4">About</span>
                        
                        <h2 className="text-4xl md:text-5xl font-black text-[#282728] leading-[1.1] mb-8 max-w-md">
                            ePathways guides your <span className="text-[#436235]">journey forward</span>
                        </h2>
                        
                        <p className="text-gray-600 text-sm md:text-base font-light leading-relaxed mb-10 max-w-xl">
                            We believe education and opportunity know no borders. Our team works to make your transition seamless, from application to arrival.
                        </p>
                        
                        <ul className="space-y-5 mb-12">
                            {[
                                "Expert guidance every step",
                                "Personalized support tailored to you",
                                "Trusted by thousands worldwide"
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-4 group">
                                    <div className="w-5 h-5 rounded-full bg-[#436235]/10 flex items-center justify-center group-hover:bg-[#436235] transition-colors">
                                        <Check size={10} className="text-[#436235] group-hover:text-white transition-colors" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">{item}</span>
                                </li>
                            ))}
                        </ul>
                        
                        <div className="flex items-center gap-10">
                            <a 
                                href="/about-us" 
                                className="px-10 py-4 bg-[#436235] text-white text-[11px] font-bold rounded hover:bg-[#344d29] transition-all uppercase tracking-[0.2em] shadow-lg active:scale-95"
                            >
                                Learn
                            </a>
                            <a 
                                href="/about-us" 
                                className="flex items-center gap-2 text-[#282728] text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#436235] transition-colors group"
                            >
                                More <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                            </a>
                        </div>
                    </motion.div>
                    
                    {/* Right Side: Image */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative h-full"
                    >
                        <div className="h-full rounded-[2rem] overflow-hidden shadow-2xl relative group min-h-[450px]">
                            <img 
                                src={AboutImg} 
                                alt="ePathways Team" 
                                className="w-full h-full object-cover grayscale-[0.1] group-hover:grayscale-0 transition-all duration-700"
                            />
                            {/* Clean Grayish Overlay */}
                            <div className="absolute inset-0 bg-slate-900/10 transition-opacity duration-300 group-hover:opacity-0"></div>
                        </div>
                        
                        {/* Decorative Element */}
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gray-50 -z-10 rounded-full blur-2xl opacity-50"></div>
                    </motion.div>
                    
                </div>
            </div>
        </section>
    );
}
