import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "react-feather";

const AnnouncementCarousel = ({ slides, autoslide = true, autoslideInterval = 4000 }) => {
  const [curr, setCurr] = useState(0);

  const prev = useCallback(
    () => setCurr(curr === 0 ? slides.length - 1 : curr - 1),
    [curr, slides.length]
  );

  const next = useCallback(
    () => setCurr(curr === slides.length - 1 ? 0 : curr + 1),
    [curr, slides.length]
  );

  useEffect(() => {
    if (!autoslide) return;
    const interval = setInterval(next, autoslideInterval);
    return () => clearInterval(interval);
  }, [autoslide, autoslideInterval, next]);

  return (
    <div className="relative max-w-4xl mx-auto h-100 rounded-2xl overflow-hidden shadow-lg">
      {/* Slides wrapper */}
      <div
        className="flex transition-transform ease-out duration-500 h-full"
        style={{ transform: `translateX(-${curr * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <a
            key={i}
            href={slide.urlref || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative w-full flex-shrink-0 h-100 bg-cover bg-center focus:outline-none"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute bottom-0 left-0 p-6 bg-gradient-to-t from-gray-900/70 w-full text-white">
              <h2 className="text-lg sm:text-xl font-semibold">{slide.title}</h2>
              <p className="text-sm text-gray-200">{slide.description}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
        <button
          onClick={prev}
          className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 pointer-events-auto"
        >
          <ChevronLeft size={28} />
        </button>
        <button
          onClick={next}
          className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 pointer-events-auto"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-3 w-full flex justify-center gap-2 pointer-events-none">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurr(i)}
            className={`w-3 h-3 rounded-full pointer-events-auto ${curr === i ? "bg-white" : "bg-gray-400"
              }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default AnnouncementCarousel;
