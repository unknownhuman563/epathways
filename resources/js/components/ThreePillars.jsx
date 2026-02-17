import React from 'react';

// Using existing images as placeholders since exact matches aren't available
// Ideally these should be replaced with the exact images from the design
const images = import.meta.glob("/resources/Assets/Services/*", { eager: true, import: "default" });

const imageMap = Object.keys(images).reduce((acc, key) => {
    const filename = key.split("/").pop();
    acc[filename] = images[key];
    return acc;
}, {});

export default function ThreePillars() {
    const pillars = [
        {
            number: '01',
            title: 'emerge.',
            image: 'education.png', // Placeholder for seedling/plant
            description: 'Start your journey'
        },
        {
            number: '02',
            title: 'energise.',
            image: 'agents.png', // Placeholder for group/energy
            description: 'Build momentum'
        },
        {
            number: '03',
            title: 'evolve.',
            image: 'pathways.png', // Placeholder for future/mountain
            description: 'Reach new heights'
        },
    ];

    return (
        <section className="py-16 bg-[#282728]">
            <div className="max-w-7xl mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-widest uppercase">
                        3 PILLARS
                    </h2>
                </div>

                {/* Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pillars.map((pillar) => (
                        <div
                            key={pillar.number}
                            className="group relative h-[350px] overflow-hidden rounded-2xl cursor-pointer"
                        >
                            {/* Background Image */}
                            <img
                                src={imageMap[pillar.image]}
                                alt={pillar.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-[#282728]/40 group-hover:bg-[#282728]/60 transition-colors duration-300"></div>

                            {/* Content */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                                <div className="text-white">
                                    <span className="text-2xl font-bold opacity-50 block mb-2">{pillar.number}</span>
                                    <h3 className="text-xl md:text-2xl font-light uppercase tracking-widest">
                                        {pillar.title}
                                    </h3>
                                </div>

                                <div className="transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                    <p className="text-white/80 text-xs font-light tracking-wider uppercase">
                                        Discover more
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
