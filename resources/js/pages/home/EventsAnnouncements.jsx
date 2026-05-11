import React from 'react';
import { motion } from 'framer-motion';
import sb19Image from "@assets/Events/sb19.png";
import garyVImage from "@assets/Events/garyv.jpg";
import newRightsImage from "@assets/Events/newrights.jpg";
import epathphImage from "@assets/Events/epathph.jpg";
import immigrationImage from "@assets/Events/immigration.png";
import studentHoursImage from "@assets/Events/studenthours.jpg";

const articles = [
    {
        image: sb19Image,
        date: "15 February 2025",
        title: "SB19's New Zealand Visas Approved with ePathways as Visa Partner",
        excerpt:
            "Great news! SB19's New Zealand visas have been approved! ePathways is honored to support this milestone as their trusted Visa Servicing Partner.",
        link: "https://forms.clickup.com/8461429/f/6zflon9-5161/0k6qeptd",
    },
    {
        image: garyVImage,
        date: "10 January 2025",
        title: "GaryVee's Insights on Immigration and Global Opportunities",
        excerpt:
            "Catch the latest insights from business mogul GaryVee on how immigration shapes global entrepreneurship and unlocks new pathways.",
        link: "#",
    },
    {
        image: newRightsImage,
        date: "05 December 2024",
        title: "New Rights for Migrants: What You Need to Know",
        excerpt:
            "Stay up to date with the latest changes in migration law and understand how new rights affect your journey to New Zealand.",
        link: "#",
    },
    {
        image: epathphImage,
        date: "20 November 2024",
        title: "ePathways Philippines: Expanding Our Reach",
        excerpt:
            "ePathways continues to grow its presence across the Philippines, connecting more families with trusted immigration services.",
        link: "#",
    },
    {
        image: immigrationImage,
        date: "01 November 2024",
        title: "Immigration Updates: Key Policy Changes for 2025",
        excerpt:
            "A comprehensive look at the most important immigration policy shifts coming in 2025 and how they may impact your plans.",
        link: "#",
    },
    {
        image: studentHoursImage,
        date: "15 October 2024",
        title: "Student Work Hours: Latest Updates from Immigration NZ",
        excerpt:
            "International students in New Zealand can now benefit from updated work hour allowances. Learn what this means for you.",
        link: "#",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' }
    }
};

export default function EventsAnnouncements() {
    return (
        <section className="py-24 bg-white font-urbanist overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.3em]">Stay Informed</span>
                            <div className="h-[1px] w-8 bg-[#436235]"></div>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-[#282728] leading-tight mb-2">
                             News & <span className="text-[#436235]">Announcements</span>
                        </h2>
                        <p className="text-gray-600 text-sm md:text-base font-light max-w-xl">
                            The latest updates on New Zealand immigration, company events, and success stories from the ePathways community.
                        </p>
                    </div>
                </div>

                {/* Grid Layout */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {articles.map((article, index) => (
                        <motion.div
                            key={index}
                            variants={cardVariants}
                            className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 h-full"
                        >
                            {/* Image Container */}
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500"></div>
                                
                                {/* Date Badge */}
                                <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-md text-[#282728] text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-widest">
                                    {article.date}
                                </div>
                            </div>

                            {/* Content Side */}
                            <div className="p-8 flex flex-col flex-grow">
                                <h3 className="text-xl font-bold text-[#282728] mb-4 leading-tight group-hover:text-[#436235] transition-colors line-clamp-2">
                                    {article.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed mb-8 font-light line-clamp-3">
                                    {article.excerpt}
                                </p>
                                
                                <div className="mt-auto">
                                    <a
                                        href={article.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-[10px] font-bold text-[#282728] uppercase tracking-[0.2em] group/link"
                                    >
                                        <span className="relative">
                                            Read Story
                                            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#436235] transition-all duration-300 group-hover/link:w-full"></span>
                                        </span>
                                        <svg className="w-4 h-4 transition-transform group-hover/link:translate-x-1 text-[#436235]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
