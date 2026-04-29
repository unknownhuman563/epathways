import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/navigation-bar";
import Footer from "@/components/footer";

export default function ComingSoon() {
    return (
        <div className="min-h-screen bg-[#f5f5f5] font-urbanist flex flex-col relative overflow-hidden">
            {/* Misty Background Effect */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-[#e0e0e0] to-[#f5f5f5]"></div>
                {/* Large soft clouds/mist elements */}
                <div className="absolute top-1/4 -left-1/4 w-[80vw] h-[80vw] bg-white rounded-full blur-[150px] opacity-60"></div>
                <div className="absolute bottom-0 right-0 w-[60vw] h-[60vw] bg-white rounded-full blur-[120px] opacity-40"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[40vh] bg-white/30 blur-[100px]"></div>
            </div>

            <Navbar />
            
            <main className="flex-grow flex items-center justify-center relative z-10 px-4 py-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="max-w-7xl w-full flex flex-col items-center"
                >
                    {/* Perfectly Centered Heading - Urbanist */}
                    <h1 
                        className="text-5xl md:text-[100px] font-black text-black mb-10 uppercase leading-tight whitespace-nowrap font-urbanist text-center w-full"
                        style={{ letterSpacing: '0.4em', marginRight: '-0.4em' }}
                    >
                        Coming Soon
                    </h1>
                    
                    {/* Centered Single-Line Subtext */}
                    <div className="flex flex-col items-center space-y-2 mb-14 text-center">
                        <p className="text-gray-600 text-sm md:text-lg font-light tracking-wide whitespace-nowrap">
                            We're currently working on creating something fantastic.
                        </p>
                        <p className="text-gray-600 text-sm md:text-lg font-light tracking-wide whitespace-nowrap">
                            We'll be here soon, subscribe to be notified.
                        </p>
                    </div>
                    
                    {/* Bold Black Button */}
                    <motion.button 
                        whileHover={{ scale: 1.02, backgroundColor: "#1a1a1a" }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-black text-white px-12 py-4 text-[10px] font-bold tracking-[0.25em] uppercase transition-all shadow-sm"
                    >
                        Notify Me
                    </motion.button>
                </motion.div>
            </main>
            
            <div className="relative z-10">
                <Footer />
            </div>
        </div>
    );
}
