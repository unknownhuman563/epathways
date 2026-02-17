import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "react-feather";

function CarouselHeader({ children: slides, autoslide = false, autoslideInterval = 3000 }) {
    const [curr, setCurr] = useState(0);

    const prev = useCallback(
        () => setCurr((curr) => (curr === 0 ? slides.length - 1 : curr - 1)),
        [slides.length]
    );

    const next = useCallback(
        () => setCurr((curr) => (curr === slides.length - 1 ? 0 : curr + 1)),
        [slides.length]
    );

    useEffect(() => {
        if (!autoslide) return;
        const slideInterval = setInterval(next, autoslideInterval);
        return () => clearInterval(slideInterval);
    }, [autoslide, autoslideInterval, next]);

    return (
        <div className="overflow-hidden relative w-full h-[250px] sm:h-[300px] md:h-screen">
            <div
                className="flex transition-transform ease-out duration-500 w-full h-full"
                style={{ transform: `translateX(-${curr * 100}%)` }}
            >
                {slides.map((slide, i) => (
                    <div key={i} className="w-full flex-shrink-0 h-full">
                        <img
                            src={slide.props.src}
                            alt={`slide-${i}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Arrows */}
            <div className="absolute inset-0 flex items-center justify-between p-4">
                <button
                    onClick={prev}
                    className="p-1 rounded-full shadow bg-gray-700/50 text-white hover:bg-white hover:text-gray-800"
                >
                    <ChevronLeft size={30} />
                </button>
                <button
                    onClick={next}
                    className="p-1 rounded-full shadow bg-gray-700/50 text-white hover:bg-white hover:text-gray-800"
                >
                    <ChevronRight size={30} />
                </button>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-4 right-0 left-0">
                <div className="flex items-center justify-center gap-2">
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            className={`transition-all w-2 h-2 rounded-full ${curr === i ? "p-1.5 bg-white" : "bg-gray-800 bg-opacity-40"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CarouselHeader;
