import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

// Assets - using existing project images for all stages
import preschoolImg from "@assets/Testimonies/testi1.png";
import primaryImg from "@assets/Testimonies/testi2.png";
import intermediateImg from "@assets/Testimonies/testi3.png";
import secondaryImg from "@assets/Testimonies/testi1.png";
import nceaImg from "@assets/Testimonies/testi2.png";
import level4Img from "@assets/Testimonies/testi3.png";
import level7Img from "@assets/Testimonies/testi1.png";
import level8Img from "@assets/Testimonies/testi2.png";
import mastersImg from "@assets/Testimonies/testi3.png";
import doctoralImg from "@assets/Testimonies/testi1.png";

const timelineData = [
    {
        id: 'preschool',
        title: 'Preschool',
        subtitle: 'Age 2-5',
        image: preschoolImg,
        position: { x: 50, y: 8 },
        labelSide: 'left'
    },
    {
        id: 'primary',
        title: 'Primary School',
        subtitle: 'Age 5-10',
        image: primaryImg,
        position: { x: 50, y: 18 },
        labelSide: 'right'
    },
    {
        id: 'intermediate',
        title: 'Intermediate School',
        subtitle: 'Age 10-13',
        image: intermediateImg,
        position: { x: 50, y: 32 },
        labelSide: 'left'
    },
    {
        id: 'secondary',
        title: 'Secondary School',
        subtitle: 'Age 13-18',
        image: secondaryImg,
        position: { x: 80, y: 42 },
        labelSide: 'right'
    },
    {
        id: 'ncea',
        title: 'NCEA',
        subtitle: 'Level 1-3',
        description: 'NCEA is the main qualification for senior secondary school students.',
        image: nceaImg,
        position: { x: 50, y: 52 },
        labelSide: 'right'
    },
    {
        id: 'level4',
        title: 'Level 4 - Higher Education',
        subtitle: 'Certificate / Diploma',
        image: level4Img,
        position: { x: 20, y: 62 },
        labelSide: 'right'
    },
    {
        id: 'level7',
        title: 'Level 7',
        subtitle: 'Bachelor\'s Degree / Graduate Cert / Graduate Diploma',
        image: level7Img,
        position: { x: 35, y: 72 },
        labelSide: 'left'
    },
    {
        id: 'level8',
        title: 'Level 8',
        subtitle: 'Postgraduate Certificate / Postgraduate Diploma / Bachelor Honours Degree',
        image: level8Img,
        position: { x: 50, y: 78 },
        labelSide: 'right'
    },
    {
        id: 'masters',
        title: 'Master\'s Degree',
        image: mastersImg,
        position: { x: 50, y: 88 },
        labelSide: 'left'
    },
    {
        id: 'doctoral',
        title: 'Doctoral\'s Degree',
        subtitle: 'PhD',
        image: doctoralImg,
        position: { x: 50, y: 98 },
        labelSide: 'left'
    }
];

export default function JourneyExperience() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end end"]
    });

    const pathLength = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Refined snake path - starts above Preschool with visible line segment
    const pathD = "M 50 2 L 50 8 L 50 18 L 50 32 L 80 42 L 80 44 L 50 52 L 20 62 L 20 64 L 35 72 L 50 78 L 50 88 L 50 98";

    return (
        <section ref={containerRef} className="py-24 bg-white font-urbanist overflow-hidden">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-20">
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-[0.3em] text-gray-400 mb-3 uppercase">Journey Experience</h2>
                    <p className="text-base md:text-lg tracking-widest text-gray-500 uppercase">New Zealand</p>
                </div>

                <div className="relative min-h-[1800px] md:min-h-[2400px]">
                    {/* SVG Timeline Path */}
                    <svg
                        viewBox="0 0 100 105"
                        fill="none"
                        preserveAspectRatio="xMidYMid meet"
                        className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                        <motion.path
                            d={pathD}
                            stroke="#000000"
                            strokeWidth="0.2"
                            strokeLinecap="round"
                            style={{ pathLength }}
                        />
                    </svg>

                    {/* Starting arrow above the line */}
                    <div className="absolute top-[1.5%] left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-black"></div>
                    </div>

                    {/* Timeline Items */}
                    {timelineData.map((item, index) => (
                        <TimelineItem key={item.id} item={item} index={index} scrollYProgress={scrollYProgress} />
                    ))}

                    {/* Tooltip: National Curriculum */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="absolute top-[35%] right-[12%] z-20"
                    >
                        <div className="bg-[#1e1e1e] text-white p-3 rounded-lg shadow-xl text-[9px] uppercase tracking-wider font-bold opacity-90">
                            A national curriculum <br /> covers school subjects
                        </div>
                    </motion.div>

                    {/* Tooltip: English Requirements */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="absolute top-[58%] left-[5%] z-20"
                    >
                        <div className="bg-[#1e1e1e] text-white p-4 rounded-xl shadow-2xl max-w-[180px] border border-white/10 relative">
                            <p className="text-[10px] leading-relaxed opacity-90">
                                English language foundation program may be required before you meet the requirement for tertiary level study.
                            </p>
                            <div className="absolute top-1/2 -right-2 -translate-y-1/2 border-l-8 border-l-[#1e1e1e] border-y-8 border-y-transparent"></div>
                        </div>
                    </motion.div>

                    {/* Year Labels */}
                    <div className="absolute top-[24%] left-[48%] text-[10px] font-bold text-gray-400">
                        Year 1-6
                    </div>
                    <div className="absolute top-[37%] left-[65%] text-[10px] font-bold text-gray-400">
                        Year 7-8
                    </div>
                    <div className="absolute top-[47%] left-[65%] text-[10px] font-bold text-gray-400">
                        Year 9-10
                    </div>
                    <div className="absolute top-[47%] left-[35%] text-[10px] font-bold text-gray-400">
                        Year 11-13
                    </div>
                    <div className="absolute top-[68%] left-[28%] text-[10px] font-bold text-gray-400">
                        Year 4-6
                    </div>
                </div>
            </div>
        </section>
    );
}

function TimelineItem({ item, index, scrollYProgress }) {
    const itemRef = useRef(null);
    const { scrollYProgress: itemProgress } = useScroll({
        target: itemRef,
        offset: ["start 0.95", "end 0.2"]
    });

    const opacity = useTransform(itemProgress, [0, 0.15], [0, 1]);
    const scale = useTransform(itemProgress, [0, 0.15], [0.8, 1]);

    return (
        <motion.div
            ref={itemRef}
            style={{
                left: `${item.position.x}%`,
                top: `${item.position.y}%`,
                opacity,
                scale
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
        >
            <div className="flex items-center gap-6 md:gap-8">
                {item.labelSide === 'left' && (
                    <div className="text-right min-w-[180px] md:min-w-[220px]">
                        <h3 className="text-lg md:text-xl font-bold text-[#282728] leading-tight">{item.title}</h3>
                        {item.subtitle && <p className="text-base md:text-lg text-gray-500 font-medium">{item.subtitle}</p>}
                        {item.description && (
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                {item.description}
                            </p>
                        )}
                    </div>
                )}

                {/* Circle with Image */}
                <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white shadow-xl">
                        <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                    </div>
                    {/* Center dot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-black z-10"></div>
                </div>

                {item.labelSide === 'right' && (
                    <div className="text-left min-w-[180px] md:min-w-[220px]">
                        <h3 className="text-lg md:text-xl font-bold text-[#282728] leading-tight">{item.title}</h3>
                        {item.subtitle && <p className="text-base md:text-lg text-gray-500 font-medium">{item.subtitle}</p>}
                        {item.description && (
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[220px]">
                                {item.description}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
