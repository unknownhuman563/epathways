import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'react-feather';

// Assets
import VisaImg        from "@assets/Services/visa.png";
import AgentsImg      from "@assets/Services/agents.png";
import SettlementImg  from "@assets/Services/settlement.png";

const services = [
    {
        id: "visas",
        tag: "Visas",
        title: "Student, work, and\npermanent residence",
        desc: "We navigate visa categories and requirements specific to your goals.",
        img: VisaImg,
        link: "/immigration"
    },
    {
        id: "assessment",
        tag: "Assessment",
        title: "Eligibility evaluation",
        desc: "We assess your qualifications and determine the right pathway forward.",
        img: AgentsImg,
        link: "/free-assessment"
    },
    {
        id: "processing",
        tag: "Processing",
        title: "Document and\napplication filing",
        desc: "We prepare, organize, and submit everything required by immigration authorities.",
        img: SettlementImg,
        link: "/booking"
    }
];

export default function ImmigrationServices() {
    const [hoveredId, setHoveredId] = useState(null);

    // The first card is expanded by default unless another is hovered
    const expandedId = hoveredId || 'visas';

    return (
        <section className="py-24 bg-white font-urbanist relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl lg:text-5xl font-black mb-4 text-[#282728] tracking-tight">
                        What we handle for you
                    </h2>
                    <p className="text-gray-600 text-sm md:text-base font-medium max-w-2xl mx-auto tracking-wide">
                        Each step of immigration requires expertise. We provide it all.
                    </p>
                </div>

                {/* Accordion Flex Row */}
                <div className="flex flex-col lg:flex-row gap-5 lg:h-[480px]">
                    {services.map((service) => {
                        const isExpanded = expandedId === service.id;
                        
                        return (
                            <motion.div
                                key={service.id}
                                layout
                                onMouseEnter={() => setHoveredId(service.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-shadow duration-500
                                    ${isExpanded ? 'lg:flex-[2.2]' : 'lg:flex-1'} 
                                    flex flex-col ${isExpanded ? 'lg:flex-row' : 'lg:flex-col'}
                                `}
                            >
                                {/* TEXT CONTENT */}
                                <motion.div 
                                    layout
                                    className={`p-8 lg:p-10 flex flex-col justify-start h-full sm:h-auto lg:h-full bg-white z-10 relative
                                        ${isExpanded ? 'lg:w-[50%]' : 'w-full lg:h-[55%]'}
                                    `}
                                >
                                    <motion.span layout className="text-[#00A693] text-[10px] sm:text-xs font-extrabold uppercase tracking-widest mb-3 block">
                                        {service.tag}
                                    </motion.span>
                                    
                                    <motion.h3 
                                        layout 
                                        className={`text-[#282728] font-black leading-tight mb-4 whitespace-pre-line ${isExpanded ? 'text-2xl md:text-3xl' : 'text-xl'}`}
                                    >
                                        {service.title}
                                    </motion.h3>
                                    
                                    <motion.p 
                                        layout
                                        className={`text-gray-600 text-sm leading-relaxed mb-6 flex-grow`}
                                    >
                                        {service.desc}
                                    </motion.p>
                                    
                                    <motion.a 
                                        layout
                                        href={service.link} 
                                        className="mt-auto inline-flex items-center gap-2 text-[#282728] text-[11px] sm:text-xs font-bold uppercase tracking-wider hover:text-[#00A693] transition-colors group/link w-fit"
                                    >
                                        Learn more <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                                    </motion.a>
                                </motion.div>

                                {/* IMAGE CONTAINER */}
                                <motion.div 
                                    layout
                                    className={`relative overflow-hidden bg-gray-100 flex-shrink-0
                                        ${isExpanded ? 'lg:w-[50%] lg:h-full lg:border-l border-gray-100' : 'w-full h-48 lg:h-[45%] lg:border-t border-gray-100 mt-auto'}
                                    `}
                                >
                                    <img 
                                        src={service.img} 
                                        alt={service.tag}
                                        className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[1.5s]"
                                    />
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
