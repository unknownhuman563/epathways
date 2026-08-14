import React from 'react';
import { ArrowRight } from 'react-feather';

export default function WhyUs() {
    return (
        <section className="py-16 sm:py-20 md:py-24 bg-white font-urbanist overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center">
                    <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.3em] mb-4 block">Why</span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#282728] leading-tight mb-4 sm:mb-6">
                        We stand with you
                    </h2>
                    <p className="text-gray-600 text-sm md:text-lg font-light max-w-5xl mx-auto leading-relaxed">
                        Our approach is built on knowing your situation deeply and meeting you where you are. We've guided thousands through their transitions with care and precision.
                    </p>

                    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 mt-8 sm:mt-10">
                        <a href="/free-assessment" className="px-10 py-3.5 bg-[#436235] text-white text-[11px] font-bold rounded-lg hover:bg-[#385029] transition-all uppercase tracking-[0.2em] shadow-lg active:scale-95">
                            Get my free check
                        </a>
                        <a href="/about-us" className="flex items-center gap-2 text-[#282728] text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#436235] group">
                            About us <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
