import { useRef } from "react";
import { ChevronLeft, ChevronRight, PlayCircle } from "react-feather";

// Facebook video/reel embed via the official video plugin. Works for public
// videos; some reels may be restricted by Facebook's own embed settings.
const fbSrc = (url, w) => `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=${w}&t=0`;

// Card dimensions by orientation — a uniform-ish height row with portrait clips
// taller and landscape clips wider, vertically centred.
const dims = (orientation) => (orientation === "landscape"
    ? { w: 540, h: 304 }
    : { w: 264, h: 468 });

// A single video card. `bare` drops the caption + "Watch on Facebook" link so
// the marquee shows only the video, nothing else. `orientation` overrides the
// clip's own orientation (the marquee forces every card to landscape).
function VideoCard({ t, bare = false, orientation }) {
    const { w, h } = dims(orientation || t.orientation);
    return (
        <div className="shrink-0 flex flex-col items-center" style={{ width: w }}>
            <div className="rounded-2xl overflow-hidden bg-black shadow-[0_12px_32px_-12px_rgba(0,0,0,0.35)] relative" style={{ width: w, height: h }}>
                <iframe
                    src={fbSrc(t.url, w)}
                    width={w}
                    height={h}
                    title={t.caption || "Client testimonial"}
                    style={{ border: "none", overflow: "hidden" }}
                    scrolling="no"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    loading="lazy"
                />
            </div>
            {!bare && t.caption && <p className="text-sm text-gray-600 mt-3 text-center leading-snug" style={{ maxWidth: w }}>{t.caption}</p>}
            {/* Fallback path when Facebook blocks the inline embed. */}
            {!bare && (
                <a href={t.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#436235] hover:text-[#375029]">
                    Watch on Facebook <ChevronRight size={11} strokeWidth={2.5} />
                </a>
            )}
        </div>
    );
}

// Video-only auto-scrolling marquee — no heading, no arrows, no captions. The
// row glides continuously (like the trusted-partner logos) and pauses on hover
// so a visitor can play a clip. The list is duplicated for a seamless loop.
function VideoMarquee({ testimonials }) {
    const doubled = [...testimonials, ...testimonials];
    // Scale the loop duration to the number of clips so speed stays gentle
    // regardless of how many are published.
    const duration = Math.max(28, testimonials.length * 10);

    // Everything lives in the scoped <style> block: setting the animation via an
    // inline style would reset animation-play-state to "running" and beat the
    // hover-pause rule, so the row wouldn't stop on hover. Driving both from CSS
    // classes keeps the hover-pause working.
    const css = `
        @keyframes epVideoMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ep-vm-track { animation: epVideoMarquee ${duration}s linear infinite; }
        .ep-vm-wrap:hover .ep-vm-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .ep-vm-track { animation: none; } }
    `;

    return (
        <section className="py-14 sm:py-16 bg-white font-urbanist overflow-hidden">
            <style>{css}</style>
            <div className="ep-vm-wrap relative w-full overflow-hidden">
                {/* Soft white edge fades so clips melt into the page at both sides.
                    Inline gradients (not Tailwind classes) so both render reliably
                    regardless of the gradient-utility naming in this Tailwind build. */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-32 z-10" style={{ background: "linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0) 100%)" }} />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-32 z-10" style={{ background: "linear-gradient(to left, #ffffff 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0) 100%)" }} />
                <div className="ep-vm-track flex gap-5 items-center w-max">
                    {doubled.map((t, i) => (
                        <VideoCard key={`${t.id}-${i}`} t={t} bare orientation="landscape" />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function VideoTestimonials({ testimonials = [], variant = "default" }) {
    const scroller = useRef(null);
    if (!testimonials.length) return null;

    if (variant === "marquee") return <VideoMarquee testimonials={testimonials} />;

    const scroll = (dir) => {
        const el = scroller.current;
        if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
    };
    const many = testimonials.length > 2;

    return (
        <section className="py-16 sm:py-20 bg-gradient-to-b from-white via-[#fafaf9] to-white font-urbanist">
            <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
                <div className="max-w-3xl mb-10">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.35em]">Video testimonials</span>
                        <div className="h-px w-12 bg-[#436235]/50" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-medium text-[#282728] tracking-tight leading-[1.1] mb-4">Hear it straight from our clients</h2>
                    <p className="text-base text-gray-700 leading-relaxed max-w-xl">Real stories from clients who shared their ePathways journey on Facebook.</p>
                </div>

                <div className="relative">
                    {many && (
                        <>
                            <button type="button" aria-label="Previous" onClick={() => scroll(-1)}
                                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 lg:-translate-x-5 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 items-center justify-center text-gray-700 hover:text-[#436235] hover:border-[#436235] transition-colors">
                                <ChevronLeft size={18} strokeWidth={2.5} />
                            </button>
                            <button type="button" aria-label="Next" onClick={() => scroll(1)}
                                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 lg:translate-x-5 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 items-center justify-center text-gray-700 hover:text-[#436235] hover:border-[#436235] transition-colors">
                                <ChevronRight size={18} strokeWidth={2.5} />
                            </button>
                        </>
                    )}

                    <div
                        ref={scroller}
                        className="flex gap-5 overflow-x-auto snap-x snap-mandatory items-center pb-4 [&::-webkit-scrollbar]:hidden"
                        style={{ scrollbarWidth: "none" }}
                    >
                        {testimonials.map((t) => (
                            <div key={t.id} className="snap-center">
                                <VideoCard t={t} />
                            </div>
                        ))}
                    </div>
                </div>

                <p className="mt-6 text-[11px] text-gray-400 flex items-center gap-1.5"><PlayCircle size={13} /> Swipe or use the arrows to browse more stories.</p>
            </div>
        </section>
    );
}
