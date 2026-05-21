import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import LogoBackdrop from "@assets/newlogosite.png";

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

// Filters that the underlying data actually supports — country + batch.
// Previously buttons claimed "Student Visa / Work Visa / Immigration" which
// the per-image metadata couldn't satisfy, so clicks did nothing.
const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'country:Philippines', label: 'Philippines' },
    { key: 'country:India', label: 'India' },
    { key: 'batch:2026 Batch', label: '2026 Batch' },
    { key: 'batch:2025 Batch', label: '2025 Batch' },
];

export default function VisaApproved() {
    const [filter, setFilter] = useState('all');

    const filteredImages = useMemo(() => {
        if (filter === 'all') return approvedImages;
        const [field, value] = filter.split(':');
        return approvedImages.filter(img => img[field] === value);
    }, [filter]);

    return (
        <div className="min-h-screen bg-white font-urbanist overflow-x-hidden">
            <Navbar />

            {/* Hero Section */}
            <section className="relative h-[40vh] min-h-[300px] w-full bg-[#f3f4f6] flex flex-col items-center justify-center pt-20">
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none p-20">
                    <img
                        src={LogoBackdrop}
                        alt="ePathways Logo Backdrop"
                        className="w-full max-w-4xl object-contain opacity-50 grayscale"
                    />
                </div>
                
                <div className="relative z-10 text-center px-4">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.3em]">Visa Approvals</span>
                        <div className="h-px w-8 bg-[#436235]"></div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-[#282728] mb-4">
                        All <span className="text-[#436235]">Success Stories</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
                        Every approval is a step towards a new life. We celebrate the success of our clients who
                        have successfully obtained their New Zealand visas through ePathways.
                    </p>
                </div>
            </section>

            {/* Main Blog-Style Section */}
            <section className="py-16 md:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    
                    {/* Header and Filters */}
                    <div className="mb-12">
                        <h2 className="text-4xl md:text-5xl font-medium text-[#1c2c26] mb-8 tracking-tight">Success Stories</h2>
                        <div className="flex flex-wrap gap-3">
                            {FILTERS.map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setFilter(f.key)}
                                    className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${
                                        filter === f.key
                                            ? 'bg-[#1c2c26] text-white'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Featured Post (First filtered image) */}
                    {filteredImages.length > 0 && (
                        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center mb-24">
                            {/* Featured Image */}
                            <div className="w-full lg:w-3/5">
                                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-sm">
                                    <img
                                        src={filteredImages[0].src}
                                        alt={filteredImages[0].name}
                                        className="w-full h-full object-cover object-top"
                                    />
                                </div>
                            </div>

                            {/* Featured Content */}
                            <div className="w-full lg:w-2/5 flex flex-col items-start">
                                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-sm mb-6">
                                    Featured
                                </span>
                                <h3 className="text-3xl md:text-4xl font-medium text-[#1c2c26] mb-6 leading-tight tracking-tight">
                                    Latest Visa Approval from {filteredImages[0].country}
                                </h3>
                                <p className="text-gray-600 mb-8 leading-relaxed">
                                    We offer comprehensive guidance designed to meet your unique needs. From strategy development to document preparation, our expert team is dedicated to driving your success and securing your future in New Zealand.
                                </p>
                                <a href="/free-assessment" className="px-8 py-3 bg-[#436235] text-white text-sm font-medium rounded-md hover:bg-[#385029] transition-colors">
                                    Start Your Journey
                                </a>
                            </div>
                        </div>
                    )}

                    {filteredImages.length === 0 && (
                        <div className="text-center py-16 text-gray-500 text-sm">
                            No approvals match this filter yet — try another category.
                        </div>
                    )}
                </div>
            </section>

            {/* Grid Section */}
            <section className="py-20 bg-[#fafafa]">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Section Header */}
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-[#1c2c26]"></div>
                            <span className="text-sm text-gray-600 font-medium">More success stories</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-medium text-[#1c2c26] tracking-tight">
                            Latest approvals and trends
                        </h2>
                    </div>

                    {/* 3-Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                        <AnimatePresence>
                            {filteredImages.slice(1).map((image, idx) => (
                                <motion.div
                                    key={image.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (idx % 6) * 0.1, duration: 0.5 }}
                                    className="group flex flex-col"
                                >
                                    {/* Image */}
                                    <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden mb-6 bg-gray-200">
                                        <img 
                                            src={image.src} 
                                            alt={image.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex flex-col flex-grow">
                                        <div className="mb-4">
                                            <span className="inline-block px-2 py-1 bg-gray-200/60 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-sm">
                                                {image.batch}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-medium text-[#1c2c26] mb-3 group-hover:text-[#436235] transition-colors">
                                            Visa Approved in {image.country}
                                        </h3>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            Discover how we helped streamline the application process and ensured a successful outcome for this client's journey.
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </section>

            <ScrollToTop />
            <Footer />
        </div>
    );
}
