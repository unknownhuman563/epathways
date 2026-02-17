import React from 'react';
import { Star, ArrowUpRight } from 'lucide-react';

export default function HeroSection({ backgroundVideo }) {
    return (
        <div className="relative h-screen w-full overflow-hidden font-urbanist">
            {/* Background Video with Overlay */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            >
                <source src={backgroundVideo} type="video/mp4" />
            </video>
            {/* Elegant light overlay with subtle blur */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"></div>

            <div className="relative z-10 flex h-full items-center justify-center px-4 container mx-auto">
                <div className="max-w-5xl text-[#282728] font-ubuntu text-center flex flex-col items-center">
                    <h1 className="text-5xl md:text-[85px] font-medium mb-12 leading-[1.3] tracking-tight">
                        Let's Create Your<br />
                        <span className="font-light italic text-[#436235] block mt-4">Dream Future</span>
                    </h1>
                    <p className="text-lg md:text-2xl mb-20 opacity-75 max-w-2xl font-light leading-relaxed tracking-widest uppercase text-xs sm:text-sm">
                        The world needs innovators and problem solvers who turn challenges into greater opportunities.
                    </p>
                    <div className="flex flex-wrap justify-center gap-8">
                        <button className="bg-[#282728] text-white px-8 py-2.5 rounded-full text-sm font-light tracking-[0.2em] uppercase hover:bg-black transition-all duration-700 shadow-xl hover:shadow-[#282728]/20">
                            Book Consultation
                        </button>
                        <button className="border-2 border-[#436235] text-[#436235] px-8 py-2.5 rounded-full text-sm font-light tracking-[0.2em] uppercase hover:bg-[#436235] hover:text-white transition-all duration-700 shadow-lg">
                            Book Webinar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
