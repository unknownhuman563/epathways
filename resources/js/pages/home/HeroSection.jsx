import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function HeroSection({ backgroundVideo, hasPromo = false }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch((e) => console.log("Edge Autoplay prevented", e));
        }
    }, []);

    // Reserve only as much vertical room as the chrome above actually
    // takes. Promo strip adds ~40px, navbar is ~72px. Without a promo
    // we'd leave a blank dark band at the bottom of the hero if we kept
    // the larger reservation, so the height shrinks back to navbar-only.
    const heightClass = hasPromo ? 'h-[calc(100vh-7rem)]' : 'h-[calc(100vh-4.5rem)]';

    return (
        <div className={`relative ${heightClass} min-h-[600px] w-full overflow-hidden font-urbanist`}>
            {/* Background Video with Overlay */}
            <video
                ref={videoRef}
                autoPlay
                loop
                muted
                defaultMuted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            >
                <source src={backgroundVideo} type="video/mp4" />
            </video>
            
            {/* Clean Grayish Overlay (Strictly Preserved) */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"></div>
            
            {/* Centered Content (Pinned Higher) */}
            {/* Anchor the content to the BOTTOM of the hero so the CTAs sit
                low in the viewport (video carries the upper two-thirds). */}
            <div className="relative z-10 flex h-full items-end justify-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 md:pb-28">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="w-full text-center flex flex-col items-center"
                >

                    {/* Hero headline, supporting copy, and "Trusted by 500+"
                        social-proof pill all removed — only the CTAs remain,
                        so the video carries the entire visual story. */}

                    {/* Hierarchy: primary solid dark-gray for the assessment
                        funnel (highest-converting destination), secondary
                        outline for the lower-friction booking calendar. */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-6 w-full sm:w-auto max-w-md sm:max-w-none mx-auto">
                        <motion.a
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            href="/free-assessment"
                            className="w-full sm:w-auto bg-[#282728] hover:bg-black border border-[#282728] text-white px-6 sm:px-7 py-3 sm:py-2.5 rounded-none text-[10px] sm:text-[10px] md:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-300 uppercase text-center shadow-lg"
                        >
                            Get my free assessment
                        </motion.a>
                        <motion.a
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 1)", color: "#282728" }}
                            whileTap={{ scale: 0.95 }}
                            href="/booking"
                            className="w-full sm:w-auto bg-transparent border border-white text-white px-6 sm:px-7 py-3 sm:py-2.5 rounded-none text-[10px] sm:text-[10px] md:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-300 uppercase text-center"
                        >
                            Book a 1:1 consultation
                        </motion.a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
