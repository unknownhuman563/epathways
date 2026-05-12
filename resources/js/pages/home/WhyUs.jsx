import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WhyUsImg from "@assets/NewSections/why_us_main.png";
import { ArrowRight } from 'react-feather';

const tabContent = [
    {
        title: "Expert guidance",
        label: "Guidance",
        heading: "We know the path ahead",
        description: "Our team of licensed immigration advisers and education counselors has successfully navigated these exact pathways thousands of times. We provide crystal-clear, step-by-step roadmaps tailored to your unique situation, eliminating the guesswork and confusion from your journey to New Zealand. From choosing the right visa to gathering the perfect documentation, we ensure you make informed decisions every step of the way.",
        image: WhyUsImg,
    },
    {
        title: "Personalized support",
        label: "Personalized Support",
        heading: "Your journey, uniquely yours",
        description: "We understand that no two migration or education stories are exactly alike. That’s why we don't offer cookie-cutter solutions. We take the time to deeply understand your personal goals, your family’s needs, and your professional aspirations. Our dedicated consultants are available to answer your questions, ease your anxieties, and adapt your strategy whenever your circumstances change.",
        image: WhyUsImg,
    },
    {
        title: "Trusted partners",
        label: "Trusted Partners",
        heading: "Connections that matter",
        description: "With years of established relationships, ePathways connects you directly to New Zealand’s top educational institutions and trusted employers. Our strong partnerships mean faster application processing, exclusive scholarship opportunities, and reliable job placement assistance. When you stand with us, you stand with an entire network of experts committed to your long-term success.",
        image: WhyUsImg,
    }
];

export default function WhyUs() {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <section className="py-16 sm:py-20 md:py-24 bg-white font-urbanist overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-10 sm:mb-14 md:mb-16">
                    <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.3em] mb-4 block">Why</span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#282728] leading-tight mb-4 sm:mb-6">
                        We stand with you
                    </h2>
                    <p className="text-gray-600 text-sm md:text-lg font-light max-w-5xl mx-auto leading-relaxed">
                        Our approach is built on knowing your situation deeply and meeting you where you are. We've guided thousands through their transitions with care and precision.
                    </p>

                    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 mt-8 sm:mt-10">
                        <button className="px-10 py-3.5 bg-[#282728] text-white text-[11px] font-bold rounded-lg hover:bg-black transition-all uppercase tracking-[0.2em] shadow-lg active:scale-95">
                            Explore
                        </button>
                        <button className="flex items-center gap-2 text-[#282728] text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#436235] group">
                            More <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>

                {/* Categories Tabs */}
                <div className="flex flex-wrap justify-center gap-6 sm:gap-10 md:gap-16 border-b border-gray-100 pb-6 sm:pb-8 mb-10 sm:mb-14 md:mb-16">
                    {tabContent.map((tab, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setActiveTab(idx)}
                            className={`text-[11px] font-bold uppercase tracking-[0.2em] pb-2 relative transition-colors ${idx === activeTab ? 'text-[#436235]' : 'text-gray-500 hover:text-[#282728]'}`}
                        >
                            {tab.title}
                            {idx === activeTab && (
                                <motion.div 
                                    layoutId="activeWhyUsTab"
                                    className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[#436235]"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Feature Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center lg:min-h-[450px]">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={`content-${activeTab}`}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ duration: 0.4 }}
                            className="max-w-xl"
                        >
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-4 block">
                                {tabContent[activeTab].label}
                            </span>
                            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#282728] leading-tight mb-4 sm:mb-6">
                                {tabContent[activeTab].heading}
                            </h3>
                            <p className="text-gray-600 text-sm md:text-base font-light leading-relaxed mb-10 text-justify">
                                {tabContent[activeTab].description}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                                <button className="px-8 sm:px-10 py-3 sm:py-3.5 bg-gray-100 text-[#282728] text-[11px] font-bold rounded-lg hover:bg-gray-200 transition-all uppercase tracking-[0.2em] active:scale-95">
                                    Learn
                                </button>
                                <button className="flex items-center gap-2 text-[#282728] text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#436235] group">
                                    More <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={`image-${activeTab}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-auto lg:h-[450px]"
                        >
                            <img 
                                src={tabContent[activeTab].image} 
                                alt={tabContent[activeTab].title} 
                                className="w-full h-full object-cover"
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
