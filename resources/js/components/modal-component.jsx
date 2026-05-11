import { useState, useEffect } from "react";
import PopUpImage from "@assets/Hero/pop_up.jpg";
import EPathwaysLogo from "@assets/newlogosite.png";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
      {/* Wrapper to control width and relative positioning */}
      <div className="relative w-full max-w-5xl">

        {/* Close Button: Simple white X top-right */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute -top-8 -right-1 text-white hover:opacity-70 transition-opacity text-xl font-light cursor-pointer z-[60]"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="bg-white rounded-lg shadow-2xl overflow-hidden w-full flex flex-col md:flex-row min-h-0 md:min-h-[380px] max-h-[90vh] overflow-y-auto">
          {/* ── Left Image Section (50%) ── */}
          <div className="relative w-full md:w-1/2 min-h-[200px] sm:min-h-[300px] md:min-h-0 bg-gray-100">
            <img
              src={PopUpImage}
              alt="Students"
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          </div>

          {/* ── Right Content Section (50%) ── */}
          <div className="w-full md:w-1/2 flex flex-col items-center text-center px-6 sm:px-12 py-8 sm:py-12 bg-white justify-between">

            {/* ── TOP: Eyebrow + Logo ── */}
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-light tracking-[0.4em] uppercase text-[#555555] mb-3">
                WELCOME TO
              </p>
              <img
                src={EPathwaysLogo}
                alt="ePathways"
                style={{ width: "180px", objectFit: "contain" }}
              />
            </div>

            {/* ── MIDDLE: Heading + Description ── */}
            <div className="flex flex-col items-center">
              <h2 className="text-3xl font-bold mb-4 tracking-tight text-[#111111] leading-tight">
                Take the First Step Forward
              </h2>
              <p className="text-sm leading-relaxed text-[#555555] max-w-[260px]">
                Book your complimentary pre-assessment today and start building the path to your future.
              </p>
            </div>

            {/* ── BOTTOM: CTA Button + Dismiss ── */}
            <div className="w-full flex flex-col items-center">
              <a
                href="/booking"
                className="w-full text-center text-white text-[11px] font-bold py-5 transition-all hover:bg-black/90 uppercase tracking-[0.2em]"
                style={{ background: "#1a1a1a", display: "block" }}
              >
                BOOK NOW - IT'S FREE
              </a>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-5 text-[11px] text-gray-500 hover:text-gray-600 underline underline-offset-4 hover:cursor-pointer transition-colors"
              >
                No thanks, maybe later
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

