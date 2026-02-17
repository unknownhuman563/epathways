import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

export default function InDemandPrograms() {
    const programs = [
        {
            title: "Master in Science in Information Technology",
            location: "Whitecliffe",
            level: "Level 9",
            image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
        },
        {
            title: "NZ Diploma in Enrolled Nursing",
            location: "Southern Institute of Tech",
            level: "Level 5",
            image: "https://images.unsplash.com/photo-1576091160550-217359f42f8c?auto=format&fit=crop&q=80&w=800",
        },
        {
            title: "Master in Science in Information Technology",
            location: "Auckland Institute of Studies",
            level: "Level 9",
            image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
        }
    ];

    return (
        <section className="py-20 bg-white font-urbanist">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <span className="text-gray-500 text-sm tracking-widest uppercase mb-2 block">Find a Program</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#282728] tracking-tight">
                        TOP IN-DEMAND BACHELOR PROGRAMS
                    </h2>
                    <div className="w-24 h-1 bg-[#436235] mx-auto mt-4 rounded-full opacity-20"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {programs.map((program, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2, duration: 0.6 }}
                            className="bg-[#282728] rounded-2xl overflow-hidden shadow-2xl group flex flex-col h-full hover:scale-[1.02] transition-transform duration-500"
                        >
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={program.image}
                                    alt={program.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute bottom-4 right-4 bg-[#436235] text-white text-xs font-bold px-3 py-1 rounded-md shadow-lg border border-white/20">
                                    {program.level}
                                </div>
                            </div>
                            <div className="p-8 flex flex-col flex-grow">
                                <h3 className="text-xl font-bold text-white mb-4 leading-tight">
                                    {program.title}
                                </h3>
                                <div className="mt-auto flex items-center text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                                    <MapPin className="w-4 h-4 mr-2 text-[#436235]" />
                                    {program.location}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="text-center mt-16">
                    <a
                        href="#"
                        className="text-[#282728] font-bold text-lg hover:text-[#436235] transition-colors relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#436235] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
                    >
                        See more
                    </a>
                </div>
            </div>
        </section>
    );
}
