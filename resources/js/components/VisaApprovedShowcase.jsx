import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Plus, ChevronDown } from 'lucide-react';

// Dynamically import all images from the visa_approved folder
const imageFiles = import.meta.glob("/resources/assets/visa_approved/*.jpg", { eager: true, import: "default" });

// Process and sort images numerically
const approvedImages = Object.keys(imageFiles).map((path) => {
    const filename = path.split('/').pop();
    const idNum = parseInt(filename.split('.')[0]);
    return {
        id: idNum,
        src: imageFiles[path],
        name: "Visa Approved",
        country: idNum === 2 ? "India" : "Philippines",
        batch: idNum <= 5 ? "2026 Batch" : "2025 Batch"
    };
}).sort((a, b) => a.id - b.id);

export default function VisaApprovedShowcase() {
    const [showAll, setShowAll] = useState(false);
    const initialItems = 6; // Show 2 rows of 3 on desktop
    
    const displayedImages = showAll ? approvedImages : approvedImages.slice(0, initialItems);

    return (
        <section className="py-24 bg-white font-urbanist overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 text-left">
                {/* Section Header */}
                <div className="mb-20">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.3em]">Success Stories</span>
                        <div className="h-px w-8 bg-[#436235]"></div>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-[#282728] leading-tight whitespace-nowrap mb-6">
                        Visa Approved <span className="text-[#436235]">Milestones</span>
                    </h2>
                    <p className="text-gray-500 text-base font-light leading-relaxed">
                        Every approval is a step towards a new life. We celebrate the success of our clients who<br />
                        have successfully obtained their New Zealand visas through ePathways.
                    </p>
                </div>

                {/* Vertical Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    <AnimatePresence>
                        {displayedImages.map((image, idx) => (
                            <motion.div
                                key={image.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: (idx % 3) * 0.1, duration: 0.5 }}
                                className="w-full aspect-[4/5] bg-[#282728] overflow-hidden shadow-2xl border border-gray-800 group/card"
                            >
                                <div className="relative w-full h-full flex flex-col">
                                    {/* Background Image */}
                                    <div className="absolute inset-0">
                                        <img 
                                            src={image.src} 
                                            alt={image.name}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80"></div>
                                    </div>

                                    {/* Bottom Content Area */}
                                    <div className="relative z-10 mt-auto p-6 pt-0">
                                        <div className="flex items-end justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg md:text-xl font-bold text-white mb-1 tracking-tight">Visa Approved</h3>
                                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">New Zealand Student ePathways</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-base md:text-lg font-black text-white">100%</span>
                                                <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Success Rate</p>
                                            </div>
                                        </div>

                                        {/* Footer Info Bar */}
                                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-[#8bba7a] uppercase tracking-widest">{image.country}</span>
                                            </div>
                                            <div className="h-4 w-px bg-white/10"></div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{image.batch}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* View More Button */}
                {!showAll && approvedImages.length > initialItems && (
                    <div className="flex justify-center">
                        <button 
                            onClick={() => setShowAll(true)}
                            className="group flex flex-col items-center gap-4 text-[#282728] transition-all hover:text-[#436235]"
                        >
                            <span className="text-xs font-bold uppercase tracking-[0.4em]">View All Success Stories</span>
                            <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-[#436235] group-hover:bg-[#436235]/5 transition-all animate-bounce">
                                <ChevronDown size={20} />
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
