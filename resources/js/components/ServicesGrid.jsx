import React from 'react';

const images = import.meta.glob("/resources/assets/Services/*", { eager: true, import: "default" });

const imageMap = Object.keys(images).reduce((acc, key) => {
    const filename = key.split("/").pop();
    acc[filename] = images[key];
    return acc;
}, {});

export default function ServicesGrid() {
    return (
        <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <p className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-2">Our Services</p>
                    <h2 className="text-3xl md:text-4xl font-black text-[#282728] mb-4">
                        What We Offer
                    </h2>
                    <p className="text-gray-600 max-w-3xl mx-auto">
                        ePathways is your trusted partner in visa and migration, providing expert guidance and end-to-end support—
                        from eligibility assessment to a compliant, stress-free application processing
                    </p>
                </div>

                {/* Services Grid Masonry Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* English Pro - Small (Top Right in design, but we fill grid) */}
                    <div className="md:col-start-1 h-[300px] group relative overflow-hidden rounded-2xl cursor-pointer text-left">
                        <img src={imageMap['pathways.png']} alt="English Pro" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors duration-500"></div>
                        <div className="absolute inset-0 p-6 flex flex-col">
                            <h3 className="text-white text-2xl font-light tracking-wide mb-3 transform transition-transform duration-500 group-hover:-translate-y-1">English Pro</h3>
                            <div className="overflow-hidden">
                                <p className="text-white/90 text-sm font-medium leading-relaxed transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out delay-75">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Immigration - Large (Middle/Left in design) */}
                    <div className="md:row-span-2 h-[450px] md:h-full group relative overflow-hidden rounded-2xl cursor-pointer text-left">
                        <img src={imageMap['visa.png']} alt="Immigration" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors duration-500"></div>
                        <div className="absolute inset-0 p-6 flex flex-col">
                            <h3 className="text-white text-2xl font-light tracking-wide mb-3 transform transition-transform duration-500 group-hover:-translate-y-1">Immigration</h3>
                            <div className="overflow-hidden">
                                <p className="text-white/90 text-sm md:text-base font-medium leading-relaxed transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out delay-75">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Engagement - Small */}
                    <div className="h-[300px] group relative overflow-hidden rounded-2xl cursor-pointer text-left">
                        <img src={imageMap['agents.png']} alt="Engagement" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors duration-500"></div>
                        <div className="absolute inset-0 p-6 flex flex-col">
                            <h3 className="text-white text-2xl font-light tracking-wide mb-3 transform transition-transform duration-500 group-hover:-translate-y-1">Engagement</h3>
                            <div className="overflow-hidden">
                                <p className="text-white/90 text-sm font-medium leading-relaxed transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out delay-75">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Education - Small */}
                    <div className="h-[300px] group relative overflow-hidden rounded-2xl cursor-pointer text-left">
                        <img src={imageMap['education.png']} alt="Education" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors duration-500"></div>
                        <div className="absolute inset-0 p-6 flex flex-col">
                            <h3 className="text-white text-2xl font-light tracking-wide mb-3 transform transition-transform duration-500 group-hover:-translate-y-1">Education</h3>
                            <div className="overflow-hidden">
                                <p className="text-white/90 text-sm font-medium leading-relaxed transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out delay-75">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Employment - Small */}
                    <div className="h-[300px] group relative overflow-hidden rounded-2xl cursor-pointer text-left">
                        <img src={imageMap['job.png']} alt="Employment" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors duration-500"></div>
                        <div className="absolute inset-0 p-6 flex flex-col">
                            <h3 className="text-white text-2xl font-light tracking-wide mb-3 transform transition-transform duration-500 group-hover:-translate-y-1">Employment</h3>
                            <div className="overflow-hidden">
                                <p className="text-white/90 text-sm font-medium leading-relaxed transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out delay-75">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
