import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, Clock, Globe, ShieldCheck, UserCheck, FileText, CheckSquare, Plane } from "lucide-react";

const steps = [
    { n: "01", day: "Day 01", name: "Eligibility Assessment", desc: "We review your profile to determine the best visa pathway — completely free.", chips: ["Free", "Profile Review"], bg: "bg-emerald-50", icon: <UserCheck className="w-8 h-8 text-emerald-600" /> },
    { n: "02", day: "Day 02", name: "Course Selection", desc: "We match you with the right institution and course aligned with your goals.", chips: ["Course Match", "Institutions"], bg: "bg-blue-50", icon: <Globe className="w-8 h-8 text-blue-600" /> },
    { n: "03", day: "Day 04", name: "Document Preparation", desc: "Compile financial statements, transcripts, and English test results.", chips: ["Checklist", "Templates"], bg: "bg-indigo-50", icon: <FileText className="w-8 h-8 text-indigo-600" /> },
    { n: "04", day: "Day 07", name: "Application Submission", desc: "Your complete application is reviewed and officially lodged by our team.", chips: ["Fully Managed", "Lodgement"], bg: "bg-violet-50", icon: <CheckSquare className="w-8 h-8 text-violet-600" /> },
    { n: "05", day: "Day 37", name: "Health & Character", desc: "Complete offshore medical examinations and police clearances required.", chips: ["Medical Exam", "Police Check"], bg: "bg-fuchsia-50", icon: <ShieldCheck className="w-8 h-8 text-fuchsia-600" /> },
    { n: "06", day: "Day 44", name: "Biometrics & Interview", desc: "Attend biometric capture at your nearest centre. We prepare you for interviews.", chips: ["Biometrics", "Interview Prep"], bg: "bg-rose-50", icon: <UserCheck className="w-8 h-8 text-rose-600" /> },
    { n: "07", day: "Day 72", name: "Visa Decision", desc: "Authorities assess your application. We monitor and handle any requests.", chips: ["Processing", "Updates"], bg: "bg-amber-50", icon: <Clock className="w-8 h-8 text-amber-600" /> },
    { n: "08", day: "Day 80", name: "Pre-Departure", desc: "Finalise flights, accommodation, and orientation. Arrive confident.", chips: ["Travel Ready", "Orientation"], bg: "bg-green-50", icon: <Plane className="w-8 h-8 text-green-600" /> },
];

export default function VisaProcessSteps() {
    const containerRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Update active index based on scroll position within the sticky container
    useEffect(() => {
        const unsubscribe = scrollYProgress.on("change", (v) => {
            // Give a slight buffer at start and end
            const stepValue = Math.min(Math.floor(v * steps.length), steps.length - 1);
            if (stepValue !== activeIndex && stepValue >= 0) {
                setActiveIndex(stepValue);
            }
        });
        return () => unsubscribe();
    }, [scrollYProgress, activeIndex]);

    return (
        <section 
            ref={containerRef} 
            className="relative font-urbanist bg-[#111111]"
            // The height determines how long to scroll before the sticky section releases.
            // 100vh for each step gives plenty of scroll room per step.
            style={{ height: `${steps.length * 100}vh` }} 
        >
            {/* ── STICKY CONTAINER ── */}
            <div className="sticky top-0 h-screen w-full flex flex-col md:flex-row overflow-hidden">
                
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[#436235]/10 blur-[120px]" />
                    <div className="absolute bottom-[0%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[#436235]/10 blur-[100px]" />
                    
                    {/* Animated grid lines */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
                </div>

                {/* ── LEFT PANEL (Information & Progression) ── */}
                <div className="w-full md:w-[45%] lg:w-[40%] h-1/2 md:h-full flex flex-col justify-center px-6 md:px-16 lg:px-24 relative z-10 border-b md:border-b-0 md:border-r border-white/10 bg-black/40 backdrop-blur-md">
                    
                    <div className="mb-8 md:mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="w-2 h-2 rounded-full bg-[#436235] animate-pulse"></span>
                            <span className="text-[#436235] text-xs md:text-sm font-bold tracking-[0.2em] uppercase">Student Visa</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
                            The Journey<br />
                            <span className="text-white/40 font-light italic">Unfolded</span>
                        </h2>
                    </div>

                    <div className="relative border-l border-white/10 ml-[22px] pl-10 md:pl-12 py-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeIndex}
                                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            >
                                {/* Step Indicator */}
                                <div className="absolute -left-[23px] top-4 w-[46px] h-[46px] rounded-full bg-[#436235] border-4 border-[#111] flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(67,98,53,0.4)]">
                                    {steps[activeIndex].n}
                                </div>

                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] font-bold tracking-widest uppercase mb-4">
                                    <Clock className="w-3 h-3" />
                                    {steps[activeIndex].day}
                                </div>

                                <h3 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight">
                                    {steps[activeIndex].name}
                                </h3>

                                <p className="text-white/60 text-sm md:text-base font-light leading-relaxed mb-8 max-w-sm">
                                    {steps[activeIndex].desc}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {steps[activeIndex].chips.map(chip => (
                                        <span key={chip} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-[10px] uppercase tracking-wider font-semibold">
                                            {chip}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="absolute bottom-8 left-6 md:left-16 flex items-center gap-4 text-white/30 text-xs font-medium uppercase tracking-widest">
                        <span>Scroll</span>
                        <ChevronDown className="w-4 h-4 animate-bounce" />
                    </div>
                </div>

                {/* ── RIGHT PANEL (Interactive 3D-like Stack) ── */}
                <div className="w-full md:w-[55%] lg:w-[60%] h-1/2 md:h-full relative flex items-center justify-center overflow-hidden">
                    
                    {/* Perspective Container */}
                    <div className="relative w-full max-w-2xl aspect-square flex items-center justify-center [perspective:1000px]">
                        
                        {steps.map((step, idx) => {
                            // Calculate position relative to active index
                            const offset = idx - activeIndex;
                            const isActive = offset === 0;
                            const isPast = offset < 0;
                            
                            // Visual properties based on position in stack
                            // We construct a "deck of cards" that peels away as you scroll
                            const zIndex = steps.length - idx;
                            const scale = isActive ? 1 : isPast ? 1.2 : 0.85 - (offset * 0.05);
                            const yPostion = isActive ? 0 : isPast ? '-120%' : `${offset * 15}%`;
                            const opacity = isActive ? 1 : isPast ? 0 : 1 - (offset * 0.3);
                            const rotateX = isActive ? 0 : isPast ? 10 : offset * 5;
                            const rotateZ = isActive ? 0 : isPast ? -5 : (offset % 2 === 0 ? offset * 2 : -offset * 2);

                            return (
                                <motion.div
                                    key={step.n}
                                    className={`absolute w-[80%] md:w-[60%] aspect-[4/3] rounded-[32px] p-8 md:p-10 shadow-2xl flex flex-col justify-between border ${isActive ? 'border-white/20' : 'border-transparent'} ${step.bg}`}
                                    animate={{
                                        scale,
                                        y: yPostion,
                                        opacity,
                                        rotateX,
                                        rotateZ,
                                        zIndex
                                    }}
                                    transition={{
                                        duration: 0.8,
                                        ease: [0.16, 1, 0.3, 1] // Custom spring-like easing
                                    }}
                                    style={{
                                        transformStyle: "preserve-3d",
                                        boxShadow: isActive ? "0 30px 60px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset" : "0 10px 30px -10px rgba(0,0,0,0.2)"
                                    }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                            {step.icon}
                                        </div>
                                        <div className="text-6xl font-black text-black/5">
                                            {step.n}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2">
                                            {step.day}
                                        </div>
                                        <h4 className="text-2xl md:text-3xl font-black text-[#111] leading-tight flex items-center gap-3">
                                            {step.name}
                                            {isPast && <CheckCircle2 className="w-6 h-6 text-[#436235]" />}
                                        </h4>
                                    </div>
                                    
                                    {/* Glass reflection effect */}
                                    <div className="absolute inset-0 rounded-[32px] bg-gradient-to-tr from-white/0 via-white/40 to-white/0 pointer-events-none opacity-50" />
                                </motion.div>
                            );
                        })}
                    </div>
                    
                    {/* Contextual counter bottom right */}
                     <div className="absolute bottom-8 right-8 text-white/20 font-black text-6xl md:text-8xl tracking-tighter">
                        {activeIndex + 1}<span className="text-2xl md:text-4xl text-white/10">/{steps.length}</span>
                    </div>

                </div>
            </div>
        </section>
    );
}
