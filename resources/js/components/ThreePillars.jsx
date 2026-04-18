import React from 'react';

// Using existing images as placeholders since exact matches aren't available
// Ideally these should be replaced with the exact images from the design
const images = import.meta.glob("/resources/assets/Services/*", { eager: true, import: "default" });

const imageMap = Object.keys(images).reduce((acc, key) => {
    const filename = key.split("/").pop();
    acc[filename] = images[key];
    return acc;
}, {});

export default function ThreePillars() {
    const pillars = [
        {
            number: '01',
            title: 'Align Your Studies with Skill-Shortage Industries',
            image: 'education.png', // Placeholder for seedling/plant
            description: "Choosing study programme in areas listed on New Zealand's Skill Shortage or Green List improves employability and post-study work or migration pathways."
        },
        {
            number: '02',
            title: 'Focus on Quality & Relevance',
            image: 'agents.png', // Placeholder for group/energy
            description: "Consider the reputation of the institution, industry links, internships, and practical experience, and how the program connects to roles in demand."
        },
        {
            number: '03',
            title: 'Build Future-Ready Skills',
            image: 'pathways.png', // Placeholder for future/mountain
            description: "Choosing study programme in areas listed on New Zealand's Skill Shortage or Green List improves employability and post-study work or migration pathways."
        },
    ];

    return (
        <section className="py-16 bg-[#282728]">
            <div className="max-w-7xl mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <p className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-2">Why Choose Us</p>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                        How ePathways Helps You
                    </h2>
                    <p className="text-gray-300 max-w-4xl mx-auto text-lg leading-relaxed font-light">
                        ePathways is your trusted partner in visa and migration, providing expert guidance and end-to-end support—
                        from eligibility assessment to compliant, stress-free application processing.
                    </p>
                </div>

                {/* Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pillars.map((pillar) => (
                        <div
                            key={pillar.number}
                            className="group relative h-[400px] overflow-hidden rounded-2xl cursor-pointer"
                        >
                            {/* Background Image */}
                            <img
                                src={imageMap[pillar.image]}
                                alt={pillar.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-[#282728]/60 group-hover:bg-[#282728]/80 transition-colors duration-300"></div>

                            {/* Content */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10 transition-transform duration-500 group-hover:-translate-y-4">
                                <div className="text-white">
                                    <span className="text-3xl font-bold opacity-50 block mb-4">{pillar.number}</span>
                                    <h3 className="text-xl md:text-2xl font-bold leading-snug">
                                        {pillar.title}
                                    </h3>
                                </div>

                                <div className="overflow-hidden">
                                    <p className="text-white/90 text-sm md:text-base font-light leading-relaxed transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                                        {pillar.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
