import { useState } from "react";
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
                            ? "fill-amber-400 text-amber-400"
                            : "fill-transparent text-gray-200"
                    }
                />
            ))}
        </div>
    );
}

function ReviewCard({ review, compact = false }) {
    const [expanded, setExpanded] = useState(false);

    const initials = (review.name || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "—";

    // Single body text — for "questions" mode we collapse the 3 answers
    // into one passage so the new card layout (compact, single-paragraph)
    // doesn't feel cramped. For "paragraph" mode just use it directly.
    const bodyText = review.mode === "paragraph"
        ? review.paragraph
        : [review.answer_1, review.answer_2, review.answer_3].filter(Boolean).join(" ");

    // Char threshold for "See more" — picked to roughly correlate with the
    // 4–6 line clamp so it only appears when content is actually truncated.
    const TRUNCATE_AT = compact ? 180 : 280;
    const isLong = (bodyText || "").length > TRUNCATE_AT;

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative bg-[#282728] rounded-2xl border border-white/5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.35)] hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)] hover:-translate-y-1 hover:border-white/10 p-8 flex flex-col group transition-all duration-300 overflow-hidden"
        >
            {/* Olive accent bar at the top — same motif used in the section
                eyebrows for visual cohesion. */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#436235] via-[#436235]/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Identity row — bigger avatar, clearer name + role hierarchy. */}
            <div className="relative flex items-center gap-3.5 mb-4">
                {review.photo_url ? (
                    <img
                        src={review.photo_url}
                        alt={review.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-white/10 shadow-md"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3d3c3d] to-[#525051] text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md ring-2 ring-white/10">
                        {initials}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-white truncate leading-tight">{review.name}</p>
                    {(review.visa_type || review.program_type) && (
                        <p className="text-xs font-semibold text-gray-400 truncate leading-tight mt-1">
                            {[review.visa_type, review.program_type].filter(Boolean).join(" · ")}
                        </p>
                    )}
                </div>
            </div>

            {/* Stars + rating — bigger, more prominent. */}
            {review.rating ? (
                <div className="relative flex items-center gap-2.5 mb-5">
                    <StarRow value={review.rating} size={16} />
                    <span className="text-sm font-bold text-white tabular-nums">
                        {Number(review.rating).toFixed(1)}
                    </span>
                </div>
            ) : (
                <div className="mb-5" />
            )}

            {/* Body — larger leading, slightly bigger type for older readers. */}
            <p className={`relative text-[15px] text-gray-300 font-normal leading-relaxed flex-grow whitespace-pre-line ${
                expanded ? "" : (compact ? "line-clamp-4" : "line-clamp-6")
            }`}>
                {bodyText}
            </p>
            {isLong && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="relative mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a9d68] hover:text-[#9bbe88] transition-colors self-start"
                >
                    {expanded ? "Show less" : "Read more"} <ArrowRight size={11} strokeWidth={2.5} />
                </button>
            )}

            {/* Footer — just the meta with a tiny olive dot for accent. */}
            <div className="relative mt-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7a9d68]" />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                    {timeAgo(review.created_at)}{review.is_featured ? " · Featured" : ""}
                </p>
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
    department = "immigration",
    // Show the "Worked with our team? Write a review" CTA card under the
    // grid. Off on /home (merged feed across departments — submission lives
    // on each department's own page instead).
    showWriteCta = true,
}) {
    const [modalOpen, setModalOpen] = useState(false);
    const [visible, setVisible] = useState(PAGE_SIZE);

    // Filter chips were removed — visitors see the full list, with each
    // card carrying its own visa/programme tags. The 'filter' state is
    // kept (unused by UI) so any downstream consumer relying on it stays
    // intact, defaulting to "all".
    const shown = reviews.slice(0, visible);
    const hasMore = reviews.length > visible;

    return (
        <section id="reviews" className="py-24 sm:py-28 lg:py-32 bg-gradient-to-b from-white via-[#fafaf9] to-white font-urbanist">
            <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">

                {/* ── Header — same editorial pattern used by the visa
                    pathway / visa journey sections: tiny olive eyebrow,
                    oversized dark heading, soft gray intro. */}
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
                    <p className="text-base text-gray-700 font-normal leading-relaxed max-w-xl">
                        {intro}
                    </p>
                </div>

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

                        {/* Single small olive-green "Write a review" button —
                            no card, no copy, no rating chip. Hidden on /home
                            (showWriteCta=false) where reviews are read-only. */}
                        {showWriteCta && (
                            <div className="mt-12 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(true)}
                                    className="inline-flex items-center gap-2 bg-[#436235] hover:bg-[#385029] text-white text-[10px] font-bold px-4 py-2 rounded-lg transition-colors uppercase tracking-[0.22em] shadow-sm"
                                >
                                    <PenTool size={11} strokeWidth={2.5} />
                                    Write a review
                                    <ArrowRight size={12} strokeWidth={2.5} />
                                </button>
                            </div>
                        )}
                    </>
                ) : showWriteCta ? (
                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center gap-2 bg-[#436235] hover:bg-[#385029] text-white text-[10px] font-bold px-4 py-2 rounded-lg transition-colors uppercase tracking-[0.22em] shadow-sm"
                        >
                            <PenTool size={11} strokeWidth={2.5} />
                            Write the first review
                            <ArrowRight size={12} strokeWidth={2.5} />
                        </button>
                    </div>
                ) : null}
            </div>

            {showWriteCta && (
                <ReviewModal open={modalOpen} onClose={() => setModalOpen(false)} department={department} />
            )}
        </section>
    );
}

export { ReviewCard, StarRow };
