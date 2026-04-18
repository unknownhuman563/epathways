import React from 'react';
import { motion } from 'framer-motion';
import WhyUsImg from "@assets/NewSections/why_us_main.png";
import { ArrowRight } from 'react-feather';

export default function WhyUs() {
    return (
        <section className="py-24 bg-white font-urbanist overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-16 px-4">
                    <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.3em] mb-4 block">Why</span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#282728] leading-tight mb-6">
                        We stand with you
                    </h2>
                    <p className="text-gray-500 text-sm md:text-lg font-light max-w-5xl mx-auto leading-relaxed px-4">
                        Our approach is built on knowing your situation deeply and meeting you where you are. We've guided thousands through their transitions with care and precision.
                    </p>
                    
                    <div className="flex justify-center items-center gap-6 mt-10">
                        <button className="px-10 py-3.5 bg-[#282728] text-white text-[11px] font-bold rounded-lg hover:bg-black transition-all uppercase tracking-[0.2em] shadow-lg active:scale-95">
                            Explore
                        </button>
                        <button className="flex items-center gap-2 text-[#282728] text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#436235] group">
                            More <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>

                {/* Categories Tabs */}
                <div className="flex flex-wrap justify-center gap-10 md:gap-16 border-b border-gray-100 pb-8 mb-16">
                    {['Expert guidance', 'Personalized support', 'Trusted partners'].map((tab, idx) => (
                        <button 
                            key={idx}
                            className={`text-[11px] font-bold uppercase tracking-[0.2em] pb-2 relative transition-colors ${idx === 0 ? 'text-[#436235]' : 'text-gray-400 hover:text-[#282728]'}`}
                        >
                            {tab}
                            {idx === 0 && (
                                <motion.div 
                                    layoutId="activeTab"
                                    className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[#436235]"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Feature Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="max-w-xl"
                    >
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-4 block">Guidance</span>
                        <h3 className="text-3xl md:text-4xl font-black text-[#282728] leading-tight mb-6">
                            We know the path ahead
                        </h3>
                        <p className="text-gray-500 text-sm md:text-base font-light leading-relaxed mb-10">
                            Our team has walked these roads before. We understand the questions, the doubts, and the decisions that matter most. We provide the clarity you need to move forward.
                        </p>
                        
                        <div className="flex items-center gap-8">
                            <button className="px-10 py-3.5 bg-gray-100 text-[#282728] text-[11px] font-bold rounded-lg hover:bg-gray-200 transition-all uppercase tracking-[0.2em] active:scale-95">
                                Learn
                            </button>
                            <button className="flex items-center gap-2 text-[#282728] text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#436235] group">
                                More <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-auto lg:h-[450px]"
                    >
                        <img 
                            src={WhyUsImg} 
                            alt="Professional Guidance" 
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
