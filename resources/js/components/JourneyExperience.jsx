import React, { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

// Assets
import educationImg from "@assets/Services/education.png";
import pathwaysImg from "@assets/Services/pathways.png";
import agentsImg from "@assets/Services/agents.png";
import visaImg from "@assets/Services/visa.png"; // Using the 3D icon for NCEA/Levels as a fallback or mix
import studyImg from "@assets/Events/immigration.png"; // Checking this one, if it's social/academic it's good

const journeySteps = [
    {
        type: 'stage',
        id: 'preschool',
        title: 'Preschool',
        subtitle: 'Age 2-3',
        image: educationImg,
        side: 'left'
    },
    {
        type: 'stage',
        id: 'primary',
        title: 'Primary School',
        subtitle: 'Age 5-10',
        image: educationImg,
        side: 'right'
    },
    {
        type: 'label',
        id: 'yr1-6',
        text: 'Year 1-6',
        side: 'left'
    },
    {
        type: 'stage',
        id: 'intermediate',
        title: 'Intermediate School',
        subtitle: 'Age 10-13',
        image: educationImg,
        side: 'left'
    },
    {
        type: 'label',
        id: 'yr7-8',
        text: 'Year 7-8',
        side: 'right'
    },
    {
        type: 'tooltip',
        id: 'curriculum',
        text: 'A national curriculum guides what children learn at school',
        side: 'right'
    },
    {
        type: 'stage',
        id: 'secondary',
        title: 'Secondary School',
        subtitle: 'Age 13-18',
        image: educationImg,
        side: 'right'
    },
    {
        type: 'label',
        id: 'yr9-10',
        text: 'Year 10-13',
        side: 'right'
    },
    {
        type: 'stage',
        id: 'ncea',
        title: 'NCEA',
        subtitle: 'Level 1 - 3',
        image: pathwaysImg,
        description: 'NCEA is the main qualification for senior secondary school students.',
        side: 'right'
    },
    {
        type: 'label',
        id: 'yr11-13',
        text: 'Year 11 - 13',
        side: 'left'
    },
    {
        type: 'tooltip',
        id: 'english',
        text: 'English language and foundation programmes are available to help you meet entry requirements for tertiary level study.',
        side: 'left'
    },
    {
        type: 'stage',
        id: 'level4',
        title: 'Level 4 - Higher Education',
        subtitle: 'Certificate / Diploma',
        image: pathwaysImg,
        side: 'left'
    },
    {
        type: 'label',
        id: 'yr4-6',
        text: 'Year 4 - 6',
        side: 'left'
    },
    {
        type: 'stage',
        id: 'level7',
        title: 'Level 7',
        subtitle: "Bachelor's Degree / Graduate Certificate / Graduate Diploma",
        image: educationImg,
        side: 'left'
    },
    {
        type: 'stage',
        id: 'level8',
        title: 'Level 8',
        subtitle: 'Postgraduate Certificate / Postgraduate Diploma / Bachelor Honours Degree',
        image: pathwaysImg,
        side: 'right'
    },
    {
        type: 'stage',
        id: 'masters',
        title: "Master's Degree",
        image: educationImg,
        side: 'left'
    },
    {
        type: 'stage',
        id: 'doctoral',
        title: "Doctoral's Degree",
        subtitle: 'PhD',
        image: pathwaysImg,
        side: 'left'
    }
];

export default function JourneyExperience() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end end"]
    });

    const scaleY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <section ref={containerRef} className="py-32 bg-white font-urbanist overflow-hidden relative">
            <div className="max-w-5xl mx-auto px-4 relative">
                {/* Header */}
                <div className="text-center mb-44">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl md:text-4xl font-black tracking-[0.4em] text-gray-400 mb-2 uppercase"
                    >
                        Journey Experience
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl tracking-[0.3em] text-gray-500 uppercase"
                    >
                        New Zealand
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="mt-20 flex justify-center"
                    >
                        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-black"></div>
                    </motion.div>
                </div>

                <div className="relative pb-40">
                    {/* Centered Vertical Line */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gray-100" />
                    <motion.div
                        className="absolute left-1/2 -translate-x-1/2 top-0 w-1 bg-black origin-top h-full"
                        style={{ scaleY }}
                    />

                    <div className="relative space-y-12">
                        {journeySteps.map((item, index) => (
                            <JourneyItem
                                key={item.id}
                                item={item}
                                index={index}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function JourneyItem({ item, index }) {
    if (item.type === 'stage') {
        const isLeft = item.side === 'left';
        return (
            <div className="relative flex items-center w-full min-h-[160px] md:min-h-[220px]">
                {/* Text Side */}
                <div className={`w-1/2 ${isLeft ? 'pr-20 md:pr-40 text-right' : 'order-last pl-20 md:pl-40 text-left'}`}>
                    <motion.div
                        initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                    >
                        <h2 className="text-xl md:text-3xl font-black text-[#282728] leading-tight mb-1">{item.title}</h2>
                        {item.subtitle && <p className="text-sm md:text-base text-gray-400 font-bold leading-tight mt-1 uppercase tracking-[0.1em]">{item.subtitle}</p>}
                        {item.description && (
                            <p className="text-[9px] md:text-[11px] text-gray-400 mt-2 max-w-[220px] leading-relaxed mx-auto md:mx-0">
                                {item.description}
                            </p>
                        )}
                    </motion.div>
                </div>

                {/* Circle on Line */}
                <div className="absolute left-1/2 -translate-x-1/2 z-10">
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        className="w-24 h-24 md:w-36 md:h-36 rounded-full border-1 border-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden group bg-white"
                    >
                        <img
                            src={item.image}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            alt={item.title}
                        />
                        {/* Center Dot Indicator */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-black z-20 border border-white"></div>
                    </motion.div>
                </div>

                {/* Empty Side for alignment */}
                {!isLeft && <div className="w-1/2"></div>}
                {isLeft && <div className="w-1/2 order-last"></div>}
            </div>
        );
    }

    if (item.type === 'label') {
        const isLeft = item.side === 'left';
        return (
            <div className="relative flex items-center w-full py-6 min-h-[60px]">
                <div className={`w-1/2 flex items-center ${isLeft ? 'justify-end pr-20 md:pr-40' : 'order-last justify-start pl-20 md:pl-40'}`}>
                    <motion.span
                        initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="text-xs md:text-lg font-black text-[#282728] tracking-widest bg-white/80 py-1 uppercase"
                    >
                        {item.text}
                    </motion.span>
                </div>

                {/* Dot on Line */}
                <div className="absolute left-1/2 -translate-x-1/2 z-10">
                    <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-black border-2 md:border-4 border-white shadow-md"></div>
                </div>

                <div className="w-1/2"></div>
            </div>
        );
    }

    if (item.type === 'tooltip') {
        const isLeft = item.side === 'left';
        return (
            <div className="relative flex justify-center w-full py-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`max-w-[200px] md:max-w-[280px] bg-[#1a1a1a] text-white p-4 rounded-xl shadow-2xl z-20 text-center border border-white/10 ${isLeft ? 'md:-translate-x-32' : 'md:translate-x-32'}`}
                >
                    <p className="text-[10px] md:text-[11px] leading-relaxed font-medium tracking-wide">
                        {item.text}
                    </p>
                </motion.div>
            </div>
        );
    }

    return null;
}
