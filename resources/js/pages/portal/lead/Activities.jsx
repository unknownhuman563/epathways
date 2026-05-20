import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight, Check, Clock } from "lucide-react";

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" }) : "";
const fmtDay = (iso) => iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "2-digit" }) : "";
const fmtMonth = (iso) => iso ? new Date(iso).toLocaleDateString("en-NZ", { month: "short" }).toUpperCase() : "";

export default function LeadActivities({ upcoming = [], past = [], registeredEventId = null }) {
    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-16">
            <Head title="Activities — ePathways Portal" />

            {/* Header */}
            <div>
                <div className="flex items-center gap-4 mb-5">
                    <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.35em]">
                        Activities
                    </span>
                    <div className="h-px w-12 bg-[#436235]/50"></div>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-[#282728] tracking-tight leading-[1.1]">
                    Workshops, seminars <span className="text-[#436235] font-light italic">& events.</span>
                </h1>
                <p className="text-base text-gray-500 font-light leading-relaxed mt-4 max-w-xl">
                    Free for our clients. Register for what&apos;s coming up, or catch up on what you missed.
                </p>
            </div>

            {/* Upcoming */}
            <section>
                <SectionHeader title="Upcoming" count={upcoming.length} />
                {upcoming.length === 0 ? (
                    <EmptyState title="No upcoming activities" body="When we schedule a workshop or seminar, it'll appear here first." />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {upcoming.map((e, i) => (
                            <EventCard
                                key={e.id}
                                event={e}
                                isRegistered={e.id === registeredEventId}
                                isUpcoming
                                delay={i * 0.05}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Past */}
            {past.length > 0 && (
                <section>
                    <SectionHeader title="Past activities" count={past.length} />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {past.map((e, i) => (
                            <EventCard
                                key={e.id}
                                event={e}
                                isRegistered={e.id === registeredEventId}
                                isUpcoming={false}
                                delay={i * 0.04}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function SectionHeader({ title, count }) {
    return (
        <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-xl font-medium text-[#282728] tracking-tight">{title}</h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 tabular-nums">
                {count} item{count !== 1 ? "s" : ""}
            </span>
        </div>
    );
}

function EventCard({ event, isRegistered, isUpcoming, delay = 0 }) {
    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay, duration: 0.45, ease: "easeOut" }}
            className={`group bg-white rounded-2xl border overflow-hidden hover:shadow-[0_24px_48px_-24px_rgba(40,39,40,0.18)] transition-all ${
                isRegistered ? "border-[#436235]/40" : "border-[#282728]/15 hover:border-[#436235]/30"
            }`}
        >
            {/* Banner OR date masthead fallback */}
            {event.banner_url ? (
                <div className="aspect-[2/1] overflow-hidden bg-gray-100 relative">
                    <img
                        src={event.banner_url}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    {isRegistered && (
                        <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] bg-white text-[#436235] border border-[#436235]/30">
                            <Check size={11} strokeWidth={3} /> Registered
                        </span>
                    )}
                </div>
            ) : (
                <div className="px-7 pt-7 pb-3 flex items-baseline gap-4 border-b border-[#282728]/10">
                    <span className="text-5xl font-light text-[#282728] tabular-nums leading-none tracking-tight">
                        {fmtDay(event.date_from)}
                    </span>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.3em]">
                            {event.type || "Event"}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400 mt-1">
                            {fmtMonth(event.date_from)} {event.date_from ? new Date(event.date_from).getFullYear() : ""}
                        </span>
                    </div>
                    {isRegistered && (
                        <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] bg-[#436235]/10 text-[#436235] border border-[#436235]/30">
                            <Check size={11} strokeWidth={3} /> Registered
                        </span>
                    )}
                </div>
            )}

            {/* Body */}
            <div className="p-7 sm:p-8 flex flex-col min-h-[180px]">
                <h3 className="text-lg lg:text-xl font-medium text-[#282728] leading-snug tracking-tight mb-3 group-hover:text-[#436235] transition-colors">
                    {event.name}
                </h3>
                {event.description && (
                    <p className="text-sm text-gray-500 font-light leading-relaxed mb-5 line-clamp-3 flex-grow">
                        {event.description}
                    </p>
                )}

                <div className="flex items-center gap-4 text-[11px] text-gray-400 font-semibold uppercase tracking-[0.18em] mb-5">
                    {event.banner_url && (
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar size={12} /> {fmtDate(event.date_from)}
                        </span>
                    )}
                    {event.mode && (
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin size={12} /> {event.mode}
                        </span>
                    )}
                </div>

                {/* Footer CTA */}
                {isUpcoming ? (
                    isRegistered ? (
                        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#436235] border-t border-[#282728]/10 pt-4">
                            <Check size={12} strokeWidth={2.5} /> You&apos;re on the list
                        </span>
                    ) : event.register_href ? (
                        <a
                            href={event.register_href}
                            target={event.register_href.startsWith("http") ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#436235] text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.22em] hover:bg-[#385029] transition-colors w-fit"
                        >
                            Register <ArrowRight size={12} strokeWidth={2.5} />
                        </a>
                    ) : (
                        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 border-t border-[#282728]/10 pt-4">
                            <Clock size={12} /> Details soon
                        </span>
                    )
                ) : (
                    <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 border-t border-[#282728]/10 pt-4">
                        <Clock size={12} /> Closed
                    </span>
                )}
            </div>
        </motion.article>
    );
}

function EmptyState({ title, body }) {
    return (
        <div className="bg-white rounded-2xl border border-[#282728]/15 p-12 text-center">
            <Calendar size={28} className="mx-auto text-gray-300 mb-4" />
            <p className="text-base font-medium text-[#282728]">{title}</p>
            <p className="text-sm text-gray-500 font-light mt-1.5 max-w-xs mx-auto">{body}</p>
        </div>
    );
}
