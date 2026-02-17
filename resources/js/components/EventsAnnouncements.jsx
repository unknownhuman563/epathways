import React from 'react';
import { motion } from 'framer-motion';
import sb19Image from "@assets/Events/sb19.png";

export default function EventsAnnouncements() {
    return (
        <section className="py-20 bg-gray-50 font-urbanist">
            <div className="max-w-7xl mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#282728] mb-4">
                        Events and Announcements
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                        Stay informed with the latest updates, opportunities, and important announcements
                        about living, working, and studying in New Zealand
                    </p>
                </div>

                {/* Featured Event Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl mx-auto flex flex-col md:flex-row items-stretch"
                >
                    {/* Image Area */}
                    <div className="md:w-1/2 relative overflow-hidden group">
                        <img
                            src={sb19Image}
                            alt="SB19 Visa Approval"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    {/* Content Area */}
                    <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
                        <h3 className="text-2xl md:text-3xl font-black text-[#282728] mb-6 leading-tight">
                            SB19's New Zealand Visas Approved with ePathways as Visa Partner
                        </h3>

                        <div className="space-y-4 text-gray-600 text-sm md:text-base leading-relaxed mb-8">
                            <p>
                                Great news! SB19's New Zealand visas have been approved!
                                ePathways is honored to support this milestone as their trusted
                                Visa Servicing Partner, with SB19 and the team now officially
                                securing their New Zealand Visas.
                            </p>
                            <p className="font-bold text-[#282728]">
                                Message us TODAY for your FREE consultation and start your journey now!
                            </p>
                            <a
                                href="https://forms.clickup.com/8461429/f/6zflon9-5161/0k6qeptd"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs md:text-sm text-blue-600 hover:underline break-all block"
                            >
                                https://forms.clickup.com/8461429/f/6zflon9-5161/0k6qeptd
                            </a>
                        </div>

                        {/* See More Button */}
                        <div className="mt-auto flex justify-end">
                            <button className="bg-[#282728] text-white px-8 py-2.5 rounded-lg text-sm font-bold tracking-wide hover:bg-black transition-all shadow-md transform hover:-translate-y-0.5">
                                See More
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
