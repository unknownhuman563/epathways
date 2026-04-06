import React from 'react';
import testi1 from "@assets/Testimonies/testi1.png";
import testi2 from "@assets/Testimonies/testi2.png";
import testi3 from "@assets/Testimonies/testi3.png";

export default function HeroSection({ backgroundVideo }) {
    return (
        <div className="relative h-screen w-full overflow-hidden">
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
            {/* Elegant dark overlay with subtle blur */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>

            <div className="relative z-10 flex h-full items-center justify-start px-6 sm:px-12 lg:px-24 container mx-auto">
                <div className="max-w-4xl text-white text-left flex flex-col items-start -mt-32">

                    {/* Social Proof / Reviews */}
                    <div className="flex items-center gap-4 mb-10">
                        <div className="flex -space-x-3">
                            <img src={testi1} alt="Client 1" className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover" />
                            <img src={testi2} alt="Client 2" className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover" />
                            <img src={testi3} alt="Client 3" className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover" />
                            <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden flex items-center justify-center">
                                <img src={testi1} alt="Client 4" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-multiply" />
                                <div className="absolute inset-0 bg-[#e8ecf1]/80"></div>
                                <span className="relative z-10 text-xs md:text-sm font-semibold text-[#4a5568]">+97</span>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center leading-tight">
                            <span className="text-xs md:text-sm text-white/90 font-normal">Trusted by 500+ Successful</span>
                            <span className="text-xs md:text-sm text-white/90 font-normal">Visa Applicants</span>
                        </div>
                    </div>

                    <h1 className="text-6xl md:text-8xl lg:text-[100px] font-bold mb-6 leading-none tracking-tight text-white">
                        Paving the Path <br />Towards <span className="text-[#436235]">New Zealand Future</span>
                    </h1>

                    <p className="text-sm md:text-lg mb-20 text-white/90 max-w-3xl font-light leading-snug tracking-wide">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-6 mt-4">
                        <a href="/booking" className="bg-[#000000] text-white px-8 py-3.5 rounded-[5px] text-sm font-semibold tracking-wide hover:bg-black/90 transition-all duration-700 shadow-xl uppercase">
                            Book Free Consultation
                        </a>
                        <a href="/free-assessment" className="bg-[#4a6b38] text-white px-8 py-3.5 rounded-[5px] text-sm font-semibold tracking-wide hover:bg-[#3d592e] transition-all duration-700 shadow-lg uppercase">
                            Free Assessment Eligibility
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
