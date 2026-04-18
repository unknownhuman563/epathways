import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'react-feather';

const images = import.meta.glob("/resources/Assets/Services/*", { eager: true, import: "default" });

const imageMap = Object.keys(images).reduce((acc, key) => {
    const filename = key.split("/").pop();
    acc[filename] = images[key];
    return acc;
}, {});

const services = [
    {
        tag: "Visa & Migration",
        title: "Immigration Support",
        description: "Navigate visas with confidence. Expert guidance from eligibility to processing.",
        image: imageMap['visa.png'],
        size: "large", // spans 2 rows
        link: "/immigration"
    },
    {
        tag: "Pathways",
        title: "English Pro",
        description: "Master the language for your journey with our specialized training programs.",
        image: imageMap['pathways.png'],
        size: "small",
        link: "/programs-levels"
    },
    {
        tag: "Consultation",
        title: "Engagement Services",
        description: "Connect with our advisors to find the best pathway for your future.",
        image: imageMap['agents.png'],
        size: "small",
        link: "/contact"
    },
    {
        tag: "Study Abroad",
        title: "Education Services",
        description: "Admission and scholarship guidance for top global institutions.",
        image: imageMap['education.png'],
        size: "small",
        link: "/education-journey"
    },
    {
        tag: "Career",
        title: "Employment Support",
        description: "Explore job opportunities and secure your future in a new country.",
        image: imageMap['job.png'],
        size: "small",
        link: "/fee-guide"
    }
];

export default function ServicesGrid() {
    return (
        <section className="py-24 bg-[#fcfcfc] font-urbanist">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.3em]">Our Services</span>
                            <div className="h-[1px] w-8 bg-[#436235]"></div>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-[#282728] leading-tight mb-6">
                            What We <span className="text-[#436235]">Offer</span>
                        </h2>
                        <p className="text-gray-500 text-sm md:text-base font-light mx-auto">
                            ePathways is your trusted partner, providing expert guidance and end-to-end support—from assessment to success.
                        </p>
                    </div>
                </div>

                {/* Services Collage Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className={`group relative overflow-hidden rounded-[2rem] cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-700 
                                ${service.size === 'large' ? 'md:row-span-2' : ''}`}
                        >
                            {/* Background Image */}
                            <img 
                                src={service.image} 
                                alt={service.title} 
                                className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
                            />
                            
                            {/* Dark Overlay - Gradient for bottom readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500 group-hover:from-black/100"></div>
                            
                            {/* Content Overlay */}
                            <div className="absolute inset-0 p-10 flex flex-col justify-end text-left">
                                <span className="text-[9px] font-bold text-white/50 uppercase tracking-[0.3em] mb-2 transform transition-all duration-500 group-hover:text-white/70">
                                    {service.tag}
                                </span>
                                
                                <h3 className="text-white text-2xl md:text-3xl font-bold mb-3 leading-tight transform transition-transform duration-500 group-hover:-translate-y-1">
                                    {service.title}
                                </h3>
                                
                                <div className="overflow-hidden">
                                    <p className="text-white/60 text-sm font-light leading-relaxed mb-8 transform transition-all duration-700 opacity-0 -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 line-clamp-3">
                                        {service.description}
                                    </p>
                                </div>
                                
                                <a 
                                    href={service.link}
                                    className="flex items-center gap-3 text-white text-[10px] font-bold uppercase tracking-[0.2em] group/btn transition-all duration-300"
                                >
                                    Explore 
                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center transition-all duration-300 group-hover/btn:bg-[#436235] group-hover/btn:translate-x-1">
                                        <ArrowRight size={12} className="text-white" />
                                    </div>
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
