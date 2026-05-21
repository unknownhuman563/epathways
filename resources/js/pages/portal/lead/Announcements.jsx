import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Megaphone, Calendar, ArrowRight, Play, ExternalLink } from "lucide-react";

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "";

export default function LeadAnnouncements({ facebookLives = [], news = [] }) {
    return (
        <div className="space-y-12 max-w-6xl mx-auto pb-16">
            <Head title="Announcements — ePathways Portal" />

            {/* Header */}
            <div>
                <div className="flex items-center gap-4 mb-5">
                    <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.35em]">
                        Announcements
                    </span>
                    <div className="h-px w-12 bg-[#436235]/50"></div>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-[#282728] tracking-tight leading-[1.1]">
                    Sessions & news <span className="text-[#436235] font-light italic">curated for you.</span>
                </h1>
                <p className="text-base text-gray-500 font-light leading-relaxed mt-4 max-w-xl">
                    Live conversations with our advisers, plus the latest from NZ immigration coverage.
                </p>
            </div>

            {/* ── Facebook Live sessions ─────────────────────────────────── */}
            {facebookLives.length > 0 && (
                <section>
                    <SectionHeader
                        eyebrow="Live with our team"
                        title="Facebook Live sessions"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {facebookLives.map((s, i) => (
                            <motion.a
                                key={s.id}
                                href={s.fb_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ delay: i * 0.05, duration: 0.45 }}
                                className="group bg-white rounded-2xl border border-[#282728]/15 overflow-hidden hover:border-[#436235]/40 hover:shadow-[0_24px_48px_-24px_rgba(40,39,40,0.15)] transition-all"
                            >
                                {s.image_url ? (
                                    <div className="aspect-video overflow-hidden bg-[#282728] relative">
                                        <img
                                            src={s.image_url}
                                            alt={s.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#282728]/60 via-transparent to-transparent"></div>
                                        <div className="absolute top-4 left-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] ${
                                                s.is_upcoming
                                                    ? "bg-[#436235] text-white"
                                                    : "bg-white text-[#282728]"
                                            }`}>
                                                {s.is_upcoming ? "Upcoming" : "Past episode"}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-white/95 backdrop-blur flex items-center justify-center">
                                            <Play size={18} className="text-[#282728] ml-1" fill="currentColor" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-[#282728] relative flex items-center justify-center">
                                        <Play size={40} className="text-white/30" />
                                        <div className="absolute top-4 left-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] ${
                                                s.is_upcoming
                                                    ? "bg-[#436235] text-white"
                                                    : "bg-white text-[#282728]"
                                            }`}>
                                                {s.is_upcoming ? "Upcoming" : "Past episode"}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="p-6">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-2.5 flex items-center gap-1.5">
                                        <Calendar size={11} /> {fmtDate(s.session_date)}
                                    </p>
                                    <h3 className="text-base lg:text-lg font-medium text-[#282728] leading-snug tracking-tight mb-2 group-hover:text-[#436235] transition-colors line-clamp-2">
                                        {s.title}
                                    </h3>
                                    {s.description && (
                                        <p className="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">
                                            {s.description}
                                        </p>
                                    )}
                                    <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#282728] group-hover:text-[#436235] transition-colors">
                                        Open on Facebook <ExternalLink size={11} strokeWidth={2.5} />
                                    </span>
                                </div>
                            </motion.a>
                        ))}
                    </div>
                </section>
            )}

            {/* ── NZ migration news ──────────────────────────────────────── */}
            {news.length > 0 && (
                <section>
                    <SectionHeader
                        eyebrow="Migration news"
                        title="Latest from NZ"
                    />
                    <div className="bg-white rounded-2xl border border-[#282728]/15 divide-y divide-[#282728]/10 overflow-hidden">
                        {news.map((n, i) => (
                            <motion.a
                                key={i}
                                href={n.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, x: -8 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.04 }}
                                className="group block p-6 hover:bg-[#f7f8f6] transition-colors"
                            >
                                <div className="flex items-center gap-3 mb-2 text-[10px] font-bold uppercase tracking-[0.22em]">
                                    {n.tag && <span className="text-[#436235]">{n.tag}</span>}
                                    {n.tag && n.source && <span className="text-gray-300">·</span>}
                                    {n.source && <span className="text-gray-400">{n.source}</span>}
                                    <span className="ml-auto text-gray-400 normal-case tracking-widest text-[10px] font-semibold">
                                        {fmtDate(n.published_at)}
                                    </span>
                                </div>
                                <h3 className="text-base lg:text-lg font-medium text-[#282728] leading-snug tracking-tight group-hover:text-[#436235] transition-colors flex items-start justify-between gap-4">
                                    <span>{n.title}</span>
                                    <ArrowRight size={14} strokeWidth={2.5} className="flex-shrink-0 mt-1 text-gray-300 group-hover:text-[#436235] group-hover:translate-x-0.5 transition-all" />
                                </h3>
                            </motion.a>
                        ))}
                    </div>
                </section>
            )}

            {/* Empty state if nothing at all */}
            {facebookLives.length === 0 && news.length === 0 && (
                <div className="bg-white rounded-2xl border border-[#282728]/15 p-14 text-center">
                    <Megaphone size={28} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-base font-medium text-[#282728]">Nothing to share right now</p>
                    <p className="text-sm text-gray-500 font-light mt-1.5">
                        We&apos;ll post news and Facebook Live sessions here as they happen.
                    </p>
                </div>
            )}
        </div>
    );
}

function SectionHeader({ eyebrow, title }) {
    return (
        <div className="mb-6">
            <p className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.32em] mb-1.5">
                {eyebrow}
            </p>
            <h2 className="text-2xl font-medium text-[#282728] tracking-tight">{title}</h2>
        </div>
    );
}
