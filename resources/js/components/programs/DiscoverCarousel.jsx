import React, { useRef, useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { ArrowRight, ArrowLeft } from "react-feather";
import placeholderImg from "@assets/Services/education.png";

/**
 * A single programme card — same editorial treatment used on the Programs grid,
 * lifted out so the category carousels can reuse it verbatim.
 */
function ProgramCard({ program }) {
    return (
        <Link
            href={`/program-details/${program.slug}`}
            className="bg-white border border-gray-200 hover:border-gray-400 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] transition-all duration-500 flex flex-col h-full group cursor-pointer"
        >
            <div className="relative h-56 w-full overflow-hidden">
                <img
                    src={program.image_url || placeholderImg}
                    alt={program.title}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = placeholderImg; }}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[1500ms] ease-out"
                />
                <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[#282728] text-[9px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 shadow-sm">
                    Level {program.level}
                </span>
            </div>

            <div className="p-7 flex flex-col flex-grow">
                <p className="text-[10px] font-medium text-gray-500 tracking-[0.25em] uppercase mb-3">
                    {program.intake_months || "Intake TBA"}
                    {program.duration_months && <span className="mx-2 text-gray-300">·</span>}
                    {program.duration_months && `${program.duration_months} months`}
                </p>

                <h4 className="text-xl font-medium text-[#282728] leading-snug tracking-tight mb-3">
                    {program.title}
                </h4>

                {program.description && (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-6">
                        {program.description}
                    </p>
                )}

                <div className="mt-auto pt-5 border-t border-gray-200">
                    <span className="text-[11px] font-bold text-[#282728] uppercase tracking-[0.22em] flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
                        Explore Programme
                        <ArrowRight size={14} strokeWidth={2} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                </div>
            </div>
        </Link>
    );
}

/**
 * A titled, horizontally-scrolling row of programme cards with left/right
 * arrows and a "See More" link — one per category (Diplomas, Bachelor, …).
 * Renders nothing when the category has no matching programmes.
 */
export default function DiscoverCarousel({ title, programs = [], onSeeMore, headerRight }) {
    const trackRef = useRef(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const updateEdges = () => {
        const el = trackRef.current;
        if (!el) return;
        setAtStart(el.scrollLeft <= 4);
        setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    };

    useEffect(() => {
        updateEdges();
        const el = trackRef.current;
        if (!el) return;
        el.addEventListener("scroll", updateEdges, { passive: true });
        window.addEventListener("resize", updateEdges);
        return () => {
            el.removeEventListener("scroll", updateEdges);
            window.removeEventListener("resize", updateEdges);
        };
    }, [programs]);

    const scrollByCard = (dir) => {
        const el = trackRef.current;
        if (!el) return;
        const card = el.querySelector("[data-card]");
        const step = card ? card.offsetWidth + 32 : 340;
        el.scrollBy({ left: dir * step, behavior: "smooth" });
    };

    // Fully hide an empty category — unless it carries the search field
    // (headerRight), in which case keep the header mounted so the user can
    // keep typing even when this category has no matches.
    if (!programs.length && !headerRight) return null;

    return (
        <div className="mb-20">
            {/* Category header + See More (+ optional right-aligned slot). On
                mobile the right slot (search) stacks full-width under the title
                instead of squeezing beside it. */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <h3 className="text-4xl md:text-5xl font-bold text-[#282728] tracking-tight">{title}</h3>
                    {onSeeMore && (
                        <button
                            onClick={onSeeMore}
                            className="text-xs font-semibold text-gray-500 hover:text-[#436235] tracking-wide transition-colors"
                        >
                            See More &gt;
                        </button>
                    )}
                </div>
                {headerRight && <div className="w-full md:w-auto shrink-0">{headerRight}</div>}
            </div>

            {/* Empty state — only reachable for the search-bearing category */}
            {programs.length === 0 && (
                <p className="text-sm text-gray-400 py-8">No programmes match your search.</p>
            )}

            {/* Scrolling card row with flanking arrows */}
            {programs.length > 0 && (
            <div className="relative">
                <style>{`.dc-track::-webkit-scrollbar{display:none;}`}</style>
                <div
                    ref={trackRef}
                    className="dc-track flex gap-8 overflow-x-auto pb-4 pr-2 snap-x"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {programs.map((program) => (
                        <div key={program.id} data-card className="shrink-0 w-[260px] md:w-[280px] snap-start">
                            <ProgramCard program={program} />
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => scrollByCard(-1)}
                    disabled={atStart}
                    aria-label={`Scroll ${title} left`}
                    className="absolute top-1/2 left-2 xl:left-[-80px] -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center bg-white border border-gray-300 text-[#282728] shadow-lg hover:bg-[#282728] hover:text-white hover:border-[#282728] transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none"
                >
                    <ArrowLeft size={18} />
                </button>
                <button
                    onClick={() => scrollByCard(1)}
                    disabled={atEnd}
                    aria-label={`Scroll ${title} right`}
                    className="absolute top-1/2 right-2 xl:right-[-80px] -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center bg-white border border-gray-300 text-[#282728] shadow-lg hover:bg-[#282728] hover:text-white hover:border-[#282728] transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none"
                >
                    <ArrowRight size={18} />
                </button>
            </div>
            )}
        </div>
    );
}
