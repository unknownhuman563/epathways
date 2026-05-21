import { Head, Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import {
    ClipboardList, Calendar, Award, ArrowRight, Hash, ChevronRight,
    FileText,
} from "lucide-react";

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" }) : "";
const fmtTime = (iso) =>
    iso ? new Date(iso).toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" }) : "";

const ICONS = {
    free_assessment:    ClipboardList,
    booking:            Calendar,
    event_registration: Award,
    document:           FileText,
};

const TONE = {
    success: { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    pending: { dot: "bg-amber-500",   chip: "bg-amber-50 text-amber-700 border-amber-200" },
    muted:   { dot: "bg-gray-300",    chip: "bg-gray-50 text-gray-500 border-gray-200" },
};

export default function LeadSubmissions({ submissions = [] }) {
    return (
        <div className="space-y-10 max-w-4xl mx-auto pb-16">
            <Head title="My Submissions — ePathways Portal" />

            {/* Header */}
            <div>
                <div className="flex items-center gap-4 mb-5">
                    <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.35em]">
                        Your record
                    </span>
                    <div className="h-px w-12 bg-[#436235]/50"></div>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-[#282728] tracking-tight leading-[1.1]">
                    My submissions <span className="text-[#436235] font-light italic">& activity.</span>
                </h1>
                <p className="text-base text-gray-500 font-light leading-relaxed mt-4 max-w-xl">
                    Every form you&apos;ve signed against ePathways, in one place — with the current status of each.
                </p>
            </div>

            {/* Timeline */}
            {submissions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#282728]/15 p-12 text-center">
                    <ClipboardList size={28} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-base font-medium text-[#282728]">Nothing here yet</p>
                    <p className="text-sm text-gray-500 font-light mt-1.5 max-w-sm mx-auto">
                        When you submit the free assessment, book a consultation, or register for an event, it&apos;ll appear here.
                    </p>
                    <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
                        <a
                            href="/free-assessment"
                            className="inline-flex items-center gap-2 px-5 py-3 bg-[#436235] text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.22em] hover:bg-[#385029] transition-colors"
                        >
                            Start assessment <ArrowRight size={12} strokeWidth={2.5} />
                        </a>
                        <a
                            href="/booking"
                            className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-[#282728]/20 text-[#282728] rounded-xl text-[11px] font-bold uppercase tracking-[0.22em] hover:border-[#282728] transition-colors"
                        >
                            Book a consult <ArrowRight size={12} strokeWidth={2.5} />
                        </a>
                    </div>
                </div>
            ) : (
                <ol className="relative space-y-5 pl-8 sm:pl-12 before:content-[''] before:absolute before:left-3 sm:before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-[#282728]/15">
                    {submissions.map((item, i) => (
                        <SubmissionItem key={`${item.type}-${item.reference}-${i}`} item={item} delay={i * 0.05} />
                    ))}
                </ol>
            )}
        </div>
    );
}

function SubmissionItem({ item, delay }) {
    const Icon = ICONS[item.type] || ClipboardList;
    const tone = TONE[item.status_tone] || TONE.muted;

    return (
        <motion.li
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay, duration: 0.4 }}
            className="relative"
        >
            {/* Dot on the timeline rail */}
            <span className="absolute -left-8 sm:-left-12 top-6 w-6 sm:w-10 flex items-center justify-center">
                <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-[#282728]/20 flex items-center justify-center text-[#436235]">
                    <Icon size={12} strokeWidth={2.25} />
                </span>
            </span>

            <article className="bg-white rounded-2xl border border-[#282728]/15 hover:border-[#436235]/40 hover:shadow-[0_24px_48px_-24px_rgba(40,39,40,0.15)] transition-all p-6 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base lg:text-lg font-medium text-[#282728] leading-snug tracking-tight">
                            {item.title}
                        </h3>
                        {item.subtitle && (
                            <p className="text-sm text-gray-500 font-light leading-relaxed mt-1.5">
                                {item.subtitle}
                            </p>
                        )}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] border w-fit ${tone.chip}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`}></span>
                        {item.status}
                    </span>
                </div>

                {item.detail && (
                    <p className="text-sm text-[#282728] font-medium mt-3 bg-[#f7f8f6] rounded-lg px-3.5 py-2.5">
                        {item.detail}
                    </p>
                )}

                <div className="mt-5 pt-4 border-t border-[#282728]/10 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                        {item.reference && (
                            <span className="inline-flex items-center gap-1 font-mono">
                                <Hash size={10} strokeWidth={2.5} /> {item.reference}
                            </span>
                        )}
                        <span>{fmtDate(item.date)}</span>
                    </div>
                    {item.cta_label && item.cta_href && (
                        <Link
                            href={item.cta_href}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#282728] hover:text-[#436235] border-b border-[#282728]/30 hover:border-[#436235] pb-1 transition-colors"
                        >
                            {item.cta_label} <ChevronRight size={12} strokeWidth={2.5} />
                        </Link>
                    )}
                </div>
            </article>
        </motion.li>
    );
}
