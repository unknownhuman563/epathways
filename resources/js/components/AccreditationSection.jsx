import React from 'react';
import { motion } from 'framer-motion';
import ICEFLogo from "@assets/about_us/icef.png";

const AccreditationSection = () => {
    return (
        <section className="py-24 bg-white font-urbanist overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
                    {/* Left Content */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="flex-1"
                    >
                        <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.3em] mb-4 block">
                            Quality Guaranteed
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-[#282728] leading-tight mb-8">
                            Global Standards, <br />
                            <span className="text-[#436235]">Local Expertise</span>
                        </h2>
                        <p className="text-gray-500 text-lg font-light leading-relaxed mb-8">
                            ePathways is a recognized education and immigration agency. Our team includes ICEF-trained consultants and Licensed Immigration Advisers, ensuring that your journey is backed by professional knowledge and ethical standards.
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="h-px w-12 bg-[#436235]"></div>
                            <span className="text-sm font-bold text-[#282728] uppercase tracking-wider">
                                Accredited & Licensed
                            </span>
                        </div>
                    </motion.div>

                    {/* Right Image */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="flex-1 w-full flex justify-center items-center"
                    >
                        <img 
                            src={ICEFLogo} 
                            alt="ICEF Accreditation" 
                            className="w-full max-w-lg h-auto object-contain transition-transform duration-500 hover:scale-105"
                        />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AccreditationSection;
