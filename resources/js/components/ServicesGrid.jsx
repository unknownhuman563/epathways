import React from 'react';

const images = import.meta.glob("/resources/Assets/Services/*", { eager: true, import: "default" });

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
                    <h2 className="text-2xl md:text-3xl font-bold text-[#282728] mb-4">
                        SERVICES
                    </h2>
                    <p className="text-gray-600 max-w-3xl mx-auto">
                        ePathways is your trusted partner in visa and migration, providing expert guidance and end-to-end support—
                        from eligibility assessment to a compliant, stress-free application processing
                    </p>
                </div>

                {/* Services Grid Masonry Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* English Pro - Small (Top Right in design, but we fill grid) */}
                    <div className="md:col-start-1 h-[300px] group relative overflow-hidden rounded-2xl cursor-pointer">
                        <img src={imageMap['pathways.png']} alt="English Pro" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300"></div>
                        <div className="absolute top-0 left-0 p-6 flex flex-col h-full justify-between">
                            <h3 className="text-white text-xl font-light">English Pro</h3>
                        </div>
                    </div>

                    {/* Immigration - Large (Middle/Left in design) */}
                    <div className="md:row-span-2 h-[450px] md:h-full group relative overflow-hidden rounded-2xl cursor-pointer">
                        <img src={imageMap['visa.png']} alt="Immigration" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300"></div>
                        <div className="absolute top-0 left-0 p-6 flex flex-col h-full justify-between">
                            <h3 className="text-white text-xl font-light">Immigration</h3>
                        </div>
                    </div>

                    {/* Engagement - Small */}
                    <div className="h-[300px] group relative overflow-hidden rounded-2xl cursor-pointer">
                        <img src={imageMap['agents.png']} alt="Engagement" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300"></div>
                        <div className="absolute top-0 left-0 p-6 flex flex-col h-full justify-between">
                            <h3 className="text-white text-xl font-light">Engagement</h3>
                        </div>
                    </div>

                    {/* Education - Small */}
                    <div className="h-[300px] group relative overflow-hidden rounded-2xl cursor-pointer">
                        <img src={imageMap['education.png']} alt="Education" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300"></div>
                        <div className="absolute top-0 left-0 p-6 flex flex-col h-full justify-between">
                            <h3 className="text-white text-xl font-light">Education</h3>
                        </div>
                    </div>

                    {/* Employment - Small */}
                    <div className="h-[300px] group relative overflow-hidden rounded-2xl cursor-pointer">
                        <img src={imageMap['job.png']} alt="Employment" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300"></div>
                        <div className="absolute top-0 left-0 p-6 flex flex-col h-full justify-between">
                            <h3 className="text-white text-xl font-light">Employment</h3>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
