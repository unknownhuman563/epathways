import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "react-feather";

export default function ProcessFlow() {
    const steps = [
        { number: 1, title: "Pathway Consultancy", description: "We assist you in identifying the right course that matches your skills and abilities." },
        { number: 2, title: "Education Provider", description: "We guide you through the process of gaining entry into your selected education provider." },
        { number: 3, title: "Immigration Agent Choice", description: "We help you find the right Immigration Agent that suits your requirements." },
        { number: 4, title: "Visa Lodging", description: "We guide and process your visa requirements towards its completion." },
        { number: 5, title: "Settlement Assistance", description: "We assist and guide you through everything you need to get settled." },
    ];

    const scrollerRef = useRef(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);

    const checkArrows = () => {
        const el = scrollerRef.current;
        if (!el) return;
        const { scrollLeft, clientWidth, scrollWidth } = el;
        setShowLeft(scrollLeft > 0);
        setShowRight(scrollLeft + clientWidth < scrollWidth - 1);
    };

    useEffect(() => {
        checkArrows();
        const el = scrollerRef.current;
        if (!el) return;
        el.addEventListener("scroll", checkArrows, { passive: true });
        window.addEventListener("resize", checkArrows);
        return () => {
            el.removeEventListener("scroll", checkArrows);
            window.removeEventListener("resize", checkArrows);
        };
    }, []);

    const scroll = (dir) => {
        const el = scrollerRef.current;
        if (!el) return;
        const amount = Math.min(360, el.clientWidth * 0.8);
        el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    };

    return (
        <div className="relative w-full max-w-7xl mx-auto px-4 py-10">
            {/* Arrows (only appear when needed) */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-gray-900">
               The <span className="text-green-700">ePathways</span> Process 
            </h2>
            {showLeft && (
                <button
                    onClick={() => scroll("left")}
                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 bg-green-700 text-white p-2 rounded-full shadow z-20"
                    aria-label="Scroll left"
                >
                    <ArrowLeft />
                </button>
            )}
            {showRight && (
                <button
                    onClick={() => scroll("right")}
                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 bg-green-700 text-white p-2 rounded-full shadow z-20"
                    aria-label="Scroll right"
                >
                    <ArrowRight />
                </button>
            )}

            {/* Scroll area */}
            <div
                ref={scrollerRef}
                className="relative overflow-x-auto no-scrollbar"
                style={{ scrollBehavior: "smooth" }}
            >
                {/* Content wrapper grows to fit all steps → line spans entire content */}
                <div className="relative w-max min-w-max flex items-start gap-10 py-4">
                    {/* Connecting line spans all steps (centered through circles) */}
                    <div className="pointer-events-none absolute left-0 right-0 top-10 h-1 bg-green-600 z-0" />

                    {steps.map((s) => (
                        <div
                            key={s.number}
                            className="relative z-10 flex flex-col items-center flex-shrink-0 w-72 sm:w-80"
                        >
                            {/* Number circle */}
                            <div className="w-20 h-20 rounded-full bg-green-700 flex items-center justify-center shadow-md">
                                <div className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl font-semibold">
                                    {s.number}
                                </div>
                            </div>

                            {/* Card (equal height) */}
                            <div className="w-full mt-6">
                                <div className="h-52 rounded-2xl border border-gray-200 bg-white shadow flex">
                                    <div className="p-4 flex flex-col justify-between text-center w-full">
                                        <h3 className="text-green-700 font-bold text-lg">{s.title}</h3>
                                        <p className="text-sm text-gray-600 mt-2">{s.description}</p>
                                        <div className="h-0" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hide scrollbar without editing Tailwind config */}
            <style>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
        </div>
    );
}
