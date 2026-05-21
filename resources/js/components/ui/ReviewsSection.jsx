import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Star, ArrowRight, PenTool } from "react-feather";
import ReviewModal from "./ReviewModal";

const PAGE_SIZE = 6;

// Human-readable "x days/weeks/months ago". No external date lib — keeps
// the bundle lean and the rendering deterministic.
function timeAgo(iso) {
    if (!iso) return "";
    const now = Date.now();
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const sec = Math.max(1, Math.floor((now - then) / 1000));
    if (sec < 60) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} minute${min > 1 ? "s" : ""} ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hour${hr > 1 ? "s" : ""} ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day} day${day > 1 ? "s" : ""} ago`;
    const week = Math.floor(day / 7);
    if (week < 5) return `${week} week${week > 1 ? "s" : ""} ago`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month} month${month > 1 ? "s" : ""} ago`;
    const year = Math.floor(day / 365);
    return `${year} year${year > 1 ? "s" : ""} ago`;
}

function StarRow({ value = 0, size = 14 }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    size={size}
                    strokeWidth={1.5}
                    className={
                        n <= value
                            ? "fill-[#436235] text-[#436235]"
                            : "fill-transparent text-gray-200"
                    }
                />
            ))}
        </div>
    );
}

function ReviewCard({ review, compact = false }) {
    const initials = (review.name || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "—";

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-white border border-gray-100 p-7 lg:p-8 flex flex-col group hover:border-[#436235]/30 hover:shadow-[0_24px_48px_-24px_rgba(40,39,40,0.18)] transition-all duration-300"
        >
            {/* Top — rating + featured chip */}
            <div className="flex items-start justify-between mb-6">
                {review.rating ? <StarRow value={review.rating} /> : <span className="w-1" />}
                {review.is_featured && (
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#436235] mt-0.5">
                        Featured
                    </span>
                )}
            </div>

            {/* Body — mode-aware */}
            {review.mode === "paragraph" ? (
                <p className={`text-[#282728] font-light italic leading-relaxed mb-6 flex-grow ${
                    compact ? "text-sm line-clamp-6" : "text-[15px]"
                }`}>
                    &ldquo;{review.paragraph}&rdquo;
                </p>
            ) : (
                <div className="space-y-4 mb-6 flex-grow">
                    {[review.answer_1, review.answer_2, review.answer_3]
                        .filter(Boolean)
                        .slice(0, compact ? 1 : 3)
                        .map((ans, i) => (
                            <p
                                key={i}
                                className={`text-[#282728] font-light leading-relaxed ${
                                    compact ? "text-sm line-clamp-4" : "text-[15px]"
                                }`}
                            >
                                {i === 0 && <span className="text-[#436235] font-medium italic">&ldquo; </span>}
                                {ans}
                                {i === 0 && compact && <span className="text-[#436235] italic"> &rdquo;</span>}
                            </p>
                        ))}
                </div>
            )}

            {/* Footer — name + meta */}
            <div className="pt-5 border-t border-gray-100 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#282728] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                    {initials}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#282728] truncate">{review.name}</p>
                    <p className="text-[10px] text-gray-400 font-light uppercase tracking-[0.15em] mt-0.5">
                        {review.visa_type ? `${review.visa_type} · ` : ""}{timeAgo(review.created_at)}
                    </p>
                </div>
            </div>
        </motion.article>
    );
}

// Public reviews block for the immigration page. Two roles:
//   1. Display all currently-published reviews from the backend payload
//   2. Provide a single, modal-based path to submit a new review
//
// Props:
//   reviews — array from UserReviewController::publicPayload (may be empty)
//   stats   — { count, average } — shown in the aggregate header
//   eyebrow / headline — override copy if needed
export default function ReviewsSection({
    reviews = [],
    stats = { count: 0, average: 0 },
    eyebrow = "Client reviews",
    headline = "What our clients say",
    intro = "Real voices from people who navigated their NZ journey with ePathways. Every review here was submitted by a real client and approved by our team.",
}) {
    const [modalOpen, setModalOpen] = useState(false);
    const [filter, setFilter] = useState("all");
    const [visible, setVisible] = useState(PAGE_SIZE);

    // Build filter chips dynamically from the visa_type values that
    // actually appear in the published reviews.
    const visaTypes = useMemo(() => {
        const set = new Set();
        reviews.forEach((r) => r.visa_type && set.add(r.visa_type));
        return Array.from(set).sort();
    }, [reviews]);

    const filtered = useMemo(() => {
        if (filter === "all") return reviews;
        return reviews.filter((r) => r.visa_type === filter);
    }, [reviews, filter]);

    const shown = filtered.slice(0, visible);
    const hasMore = filtered.length > visible;

    return (
        <section id="reviews" className="py-24 sm:py-28 lg:py-32 bg-[#f7f8f6] font-urbanist">
            <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">

                {/* ── Header — single-column editorial. Aggregate stats +
                    Write Review CTA moved to a dark premium panel below the
                    grid so the reader sees what people said first. */}
                <div className="max-w-3xl mb-14 lg:mb-16">
                    <div className="flex items-center gap-4 mb-5">
                        <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.35em]">
                            {eyebrow}
                        </span>
                        <div className="h-px w-12 bg-[#436235]/50"></div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-[#282728] tracking-tight leading-[1.1] mb-5">
                        {headline}
                    </h2>
                    <p className="text-base text-gray-500 font-light leading-relaxed max-w-xl">
                        {intro}
                    </p>
                </div>

                {/* ── Filter chips */}
                {visaTypes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-10">
                        <button
                            type="button"
                            onClick={() => { setFilter("all"); setVisible(PAGE_SIZE); }}
                            className={`px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.18em] border transition-all ${
                                filter === "all"
                                    ? "bg-[#282728] text-white border-[#282728]"
                                    : "bg-white text-gray-500 border-gray-200 hover:border-[#436235]/40 hover:text-[#282728]"
                            }`}
                        >
                            All ({reviews.length})
                        </button>
                        {visaTypes.map((v) => {
                            const count = reviews.filter((r) => r.visa_type === v).length;
                            return (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => { setFilter(v); setVisible(PAGE_SIZE); }}
                                    className={`px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.18em] border transition-all ${
                                        filter === v
                                            ? "bg-[#282728] text-white border-[#282728]"
                                            : "bg-white text-gray-500 border-gray-200 hover:border-[#436235]/40 hover:text-[#282728]"
                                    }`}
                                >
                                    {v} ({count})
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ── Grid / empty state */}
                {shown.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                            {shown.map((r) => (
                                <ReviewCard key={r.id} review={r} />
                            ))}
                        </div>

                        {hasMore && (
                            <div className="mt-12 text-center">
                                <button
                                    type="button"
                                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                                    className="inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#282728] border border-gray-200 hover:border-[#436235] hover:text-[#436235] px-6 py-3 rounded-xl bg-white transition-colors"
                                >
                                    Show more reviews
                                    <ArrowRight size={13} strokeWidth={2.5} />
                                </button>
                            </div>
                        )}

                        {/* ── Premium dark aggregate + Write Review panel.
                            Sits below the grid as the section's confident
                            close — readers see what people said, then are
                            invited to add their own voice. */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            className="mt-16 lg:mt-20 bg-[#282728] text-white rounded-[24px] overflow-hidden relative"
                        >
                            {/* Hairline brand-green top edge for accent */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#436235]/60 to-transparent"></div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 p-10 sm:p-12 lg:p-16 items-center">
                                {/* Left — aggregate stats */}
                                <div>
                                    <p className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.35em] mb-7">
                                        Trusted rating
                                    </p>
                                    <div className="flex items-end gap-8">
                                        <div>
                                            <div className="text-6xl lg:text-7xl font-light text-white tracking-tight leading-none mb-3 tabular-nums">
                                                {stats.average ? stats.average.toFixed(1) : "—"}
                                            </div>
                                            <StarRow value={Math.round(stats.average || 0)} size={16} />
                                        </div>
                                        <div className="h-16 w-px bg-white/15"></div>
                                        <div className="pb-2">
                                            <div className="text-3xl lg:text-4xl font-light text-white tabular-nums leading-none mb-2">
                                                {stats.count}
                                            </div>
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                                                Published<br />reviews
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right — invitation + CTA */}
                                <div className="lg:border-l lg:border-white/10 lg:pl-16">
                                    <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-white leading-tight mb-3">
                                        Worked with our team?
                                    </h3>
                                    <p className="text-base text-white/55 font-light leading-relaxed mb-7 max-w-md">
                                        Share your story. Your review helps the next family find clarity on their NZ journey.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(true)}
                                        className="inline-flex items-center gap-3 bg-white text-[#282728] text-[11px] font-bold px-7 py-4 rounded-xl hover:bg-gray-100 active:scale-[0.99] transition-all uppercase tracking-[0.22em]"
                                    >
                                        <PenTool size={13} strokeWidth={2.5} />
                                        Write a review
                                        <ArrowRight size={14} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                ) : (
                    <div className="bg-[#282728] text-white rounded-[24px] p-12 sm:p-16 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#436235]/60 to-transparent"></div>
                        <p className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.32em] mb-4">
                            Be the first
                        </p>
                        <h3 className="text-2xl sm:text-3xl font-medium text-white tracking-tight mb-3">
                            No published reviews yet
                        </h3>
                        <p className="text-sm text-white/55 font-light leading-relaxed max-w-md mx-auto mb-8">
                            Worked with our team? Share your story — your review will appear here once approved.
                        </p>
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center gap-3 bg-white text-[#282728] text-[11px] font-bold px-7 py-4 rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-[0.22em]"
                        >
                            <PenTool size={13} strokeWidth={2.5} />
                            Write the first review
                            <ArrowRight size={14} strokeWidth={2.5} />
                        </button>
                    </div>
                )}
            </div>

            <ReviewModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </section>
    );
}

export { ReviewCard, StarRow };
