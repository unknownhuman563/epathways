import React from 'react';
import { motion } from 'framer-motion';

const images = import.meta.glob("/resources/assets/Services/*", { eager: true, import: "default" });

const imageMap = Object.keys(images).reduce((acc, key) => {
    const filename = key.split("/").pop();
    acc[filename] = images[key];
    return acc;
}, {});

export default function InDemandPrograms() {
    const programs = [
        { title: "Business administration", level: "Bachelor", location: "Australia", image: imageMap['education.png'] },
        { title: "Computer science", level: "Master", location: "Canada", image: imageMap['pathways.png'] },
        { title: "Engineering technology", level: "Bachelor", location: "United Kingdom", image: imageMap['education.png'] },
        { title: "Nursing and healthcare", level: "Diploma", location: "New Zealand", image: imageMap['pathways.png'] },
        { title: "Data analytics", level: "Master", location: "Australia", image: imageMap['education.png'] },
        { title: "Hospitality management", level: "Bachelor", location: "Canada", image: imageMap['pathways.png'] },
        { title: "Environmental science", level: "Bachelor", location: "United Kingdom", image: imageMap['education.png'] },
        { title: "Finance and accounting", level: "Master", location: "Australia", image: imageMap['pathways.png'] },
    ];

    return (
        <section className="py-24 bg-[#121613] text-white font-urbanist">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-3">Programs</p>
                        <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-2">
                            Pathways that lead somewhere
                        </h2>
                        <p className="text-sm md:text-base text-gray-300">
                            Find your fit among the world's best
                        </p>
                    </div>
                    <button className="border border-white/20 px-6 py-2.5 text-sm hover:bg-white/10 transition-colors">
                        Explore all
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                    {programs.map((program, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="flex flex-col group cursor-pointer"
                        >
                            {/* Image Container */}
                            <div className="bg-[#2a302b] aspect-[4/5] mb-5 overflow-hidden relative">
                                {program.image ? (
                                    <img
                                        src={program.image}
                                        alt={program.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                                    />
                                ) : (
                                    /* Fallback if image not found */
                                    <div className="w-full h-full flex items-center justify-center text-white/20">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                            <polyline points="21 15 16 10 5 21"></polyline>
                                        </svg>
                                    </div>
                                )}
                            </div>
                            
                            {/* Text Info */}
                            <h3 className="text-sm md:text-base font-semibold mb-1 tracking-wide group-hover:text-green-400 transition-colors">
                                {program.title}
                            </h3>
                            <p className="text-[12px] text-gray-400 italic mb-1">
                                {program.level}
                            </p>
                            <p className="text-sm font-bold tracking-wide">
                                {program.location}
                            </p>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}
