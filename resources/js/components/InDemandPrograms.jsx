import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

const images = import.meta.glob("/resources/Assets/Services/*", { eager: true, import: "default" });

const imageMap = Object.keys(images).reduce((acc, key) => {
    const filename = key.split("/").pop();
    acc[filename] = images[key];
    return acc;
}, {});

export default function InDemandPrograms() {
    const programs = [
        {
            title: "Master in Science in Information Technology",
            location: "Whitecliffe",
            level: "Level 9",
            image: imageMap['education.png'], // Local asset
        },
        {
            title: "NZ Diploma in Enrolled Nursing",
            location: "Southern Institute of Tech",
            level: "Level 5",
            image: imageMap['job.png'], // Local asset
        },
        {
            title: "Master in Science in Information Technology",
            location: "Auckland Institute of Studies",
            level: "Level 9",
            image: imageMap['pathways.png'], // Local asset
        }
    ];

    return (
        <section className="py-20 bg-white font-urbanist">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <p className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-2">Find a Program</p>
                    <h2 className="text-3xl md:text-4xl font-black text-[#282728]">
                        Top In-Demand Programs
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {programs.map((program, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2, duration: 0.6 }}
                            className="bg-white rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 group flex flex-col h-full hover:scale-[1.02] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-500"
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
                                <h3 className="text-xl font-bold text-[#282728] mb-4 leading-tight group-hover:text-[#436235] transition-colors">
                                    {program.title}
                                </h3>
                                <div className="mt-auto flex items-center text-gray-500 text-sm group-hover:text-gray-700 transition-colors">
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
