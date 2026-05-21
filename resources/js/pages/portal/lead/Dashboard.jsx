import { Head, Link } from "@inertiajs/react";
import {
    User, Mail, Phone, MapPin, Hash, Clock, FileText, ClipboardList,
    Calendar, Megaphone, ArrowRight, ChevronRight, Check, AlertCircle,
    Sparkles, MapPinned,
} from "lucide-react";

const STATUS_CHIP = {
    New: "bg-blue-50 text-blue-700 border-blue-200",
    Contacted: "bg-amber-50 text-amber-700 border-amber-200",
    Qualified: "bg-purple-50 text-purple-700 border-purple-200",
    Processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Closed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const statusChip = (s) => STATUS_CHIP[s] || "bg-gray-50 text-gray-600 border-gray-200";

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" }) : "—";
const fmtShort = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short" }) : "";

export default function LeadDashboard({
    lead,
    submissionsCounts = {},
    nextActivity = null,
    latestAnnouncement = null,
    documentSummary = { total: 0, pending: 0, approved: 0, rejected: 0 },
    roadmap = [],
    currentPhase = null,
    preEngagement = false,
}) {
    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-16">
            <Head title="My ePathways Portal" />

            {/* ── Hero ───────────────────────────────────────────────────── */}
            <section className="relative bg-[#282728] text-white rounded-[24px] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#436235]/60 to-transparent"></div>
                <div className="p-8 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
                    <div className="lg:col-span-2">
                        <p className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.35em] mb-3">
                            Welcome back
                        </p>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.1]">
                            Hi, {lead.first_name}.
                        </h1>
                        <p className="text-base text-white/65 font-light leading-relaxed mt-4 max-w-xl">
                            Your portal home. Track what you&apos;ve submitted, see what&apos;s next, and follow ePathways news — all in one place.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] border ${statusChip(lead.status)}`}>
                            <Clock size={11} strokeWidth={2.5} /> {lead.status || "New"}
                        </span>
                        {lead.stage && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] bg-[#436235]/20 text-[#a8c89a] border border-[#436235]/40">
                                {lead.stage}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] bg-white/[0.06] text-white/55 border border-white/10">
                            <Hash size={10} strokeWidth={2.5} /> {lead.lead_id}
                        </span>
                    </div>
                </div>
            </section>

            {/* ── Your journey roadmap ───────────────────────────────────── */}
            {roadmap.length > 0 && (
                <>
                    <SectionHeader title="Your journey" eyebrow="Where you are now" />
                    <JourneyRoadmap roadmap={roadmap} currentPhase={currentPhase} preEngagement={preEngagement} />
                </>
            )}

            {/* ── My submissions ─────────────────────────────────────────── */}
            <SectionHeader title="My submissions" eyebrow="At a glance" href="/portal/lead/submissions" cta="View all" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <SubmissionCard
                    icon={<ClipboardList size={18} />}
                    title="Free Assessment"
                    state={submissionsCounts.assessment_submitted ? "Submitted" : "Not submitted"}
                    detail={
                        submissionsCounts.assessment_submitted
                            ? (submissionsCounts.ai_status === "completed" ? "Reviewed by our team" : "In review")
                            : "Start when ready"
                    }
                    href={submissionsCounts.assessment_submitted ? "/portal/lead/submissions" : "/free-assessment"}
                    tone={submissionsCounts.assessment_submitted ? "success" : "muted"}
                />
                <SubmissionCard
                    icon={<Calendar size={18} />}
                    title="Consultations"
                    state={submissionsCounts.bookings ? `${submissionsCounts.bookings} booked` : "None yet"}
                    detail={submissionsCounts.bookings ? "Check status in My Submissions" : "Book a 1:1 anytime"}
                    href={submissionsCounts.bookings ? "/portal/lead/submissions" : "/booking"}
                    tone={submissionsCounts.bookings ? "success" : "muted"}
                />
                <SubmissionCard
                    icon={<FileText size={18} />}
                    title="Documents"
                    state={documentSummary.total ? `${documentSummary.total} uploaded` : "None yet"}
                    detail={
                        documentSummary.pending
                            ? `${documentSummary.pending} awaiting review`
                            : documentSummary.approved
                                ? `${documentSummary.approved} approved`
                                : "When your adviser requests them"
                    }
                    href="/portal/lead/documents"
                    tone={documentSummary.pending ? "pending" : documentSummary.total ? "success" : "muted"}
                />
            </div>

            {/* ── Two-col: next activity + latest announcement ───────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <TeaserCard
                    eyebrow="Next activity"
                    icon={<Calendar size={14} />}
                    href="/portal/lead/activities"
                    cta="See all activities"
                    empty={!nextActivity}
                    emptyText="No upcoming activities just yet. Check back soon."
                >
                    {nextActivity && (
                        <>
                            <div className="flex items-baseline gap-3 mb-3">
                                <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.22em]">
                                    {nextActivity.type || "Event"}
                                </span>
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                                    {fmtShort(nextActivity.date_from)}
                                </span>
                            </div>
                            <h3 className="text-xl font-medium text-[#282728] leading-snug tracking-tight mb-2">
                                {nextActivity.name}
                            </h3>
                            {nextActivity.description && (
                                <p className="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">
                                    {nextActivity.description}
                                </p>
                            )}
                        </>
                    )}
                </TeaserCard>

                <TeaserCard
                    eyebrow="Latest from ePathways"
                    icon={<Megaphone size={14} />}
                    href="/portal/lead/announcements"
                    cta="All announcements"
                    empty={!latestAnnouncement}
                    emptyText="Nothing new right now."
                >
                    {latestAnnouncement && (
                        <>
                            <div className="flex items-baseline gap-3 mb-3">
                                <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.22em]">
                                    {latestAnnouncement.subtitle}
                                </span>
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                                    {fmtShort(latestAnnouncement.date)}
                                </span>
                            </div>
                            <h3 className="text-xl font-medium text-[#282728] leading-snug tracking-tight line-clamp-3">
                                {latestAnnouncement.title}
                            </h3>
                        </>
                    )}
                </TeaserCard>
            </div>

            {/* ── My details ─────────────────────────────────────────────── */}
            <SectionHeader title="My details" eyebrow="On file" />
            <section className="bg-white rounded-2xl border border-[#282728]/15 overflow-hidden">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#282728]/10">
                    <DetailRow icon={<User size={14} />} label="Full name" value={`${lead.first_name} ${lead.last_name}`.trim()} />
                    <DetailRow icon={<Mail size={14} />} label="Email" value={lead.email || "—"} />
                    <DetailRow icon={<Phone size={14} />} label="Phone" value={lead.phone || "—"} />
                    <DetailRow icon={<MapPin size={14} />} label="Country" value={lead.residence_country || "—"} />
                    <DetailRow icon={<Sparkles size={14} />} label="Joined ePathways" value={fmtDate(lead.created_at)} fullWidth />
                </dl>
            </section>
        </div>
    );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function SectionHeader({ title, eyebrow, href = null, cta = null }) {
    return (
        <div className="flex items-end justify-between gap-4">
            <div>
                <p className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.32em] mb-1.5">
                    {eyebrow}
                </p>
                <h2 className="text-xl sm:text-2xl font-medium text-[#282728] tracking-tight">{title}</h2>
            </div>
            {href && cta && (
                <Link
                    href={href}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#282728] hover:text-[#436235] border-b border-[#282728]/30 hover:border-[#436235] pb-1 transition-colors"
                >
                    {cta} <ArrowRight size={12} strokeWidth={2.5} />
                </Link>
            )}
        </div>
    );
}

function SubmissionCard({ icon, title, state, detail, href, tone }) {
    const TONES = {
        success: { ring: "border-[#436235]/30 hover:border-[#436235]", dot: "bg-[#436235]", chip: "bg-[#436235]/10 text-[#436235]" },
        pending: { ring: "border-amber-200 hover:border-amber-300",   dot: "bg-amber-500",   chip: "bg-amber-50 text-amber-700" },
        muted:   { ring: "border-[#282728]/15 hover:border-[#282728]/30", dot: "bg-gray-300", chip: "bg-gray-50 text-gray-500" },
    };
    const t = TONES[tone] || TONES.muted;

    return (
        <Link
            href={href}
            className={`group block bg-white rounded-2xl border ${t.ring} p-6 transition-colors hover:shadow-[0_24px_48px_-24px_rgba(40,39,40,0.15)]`}
        >
            <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#436235]/10 text-[#436235] flex items-center justify-center">
                    {icon}
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-md ${t.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`}></span>
                    {state}
                </span>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-1.5">{title}</p>
            <p className="text-base text-[#282728] font-medium leading-snug mb-4">{detail}</p>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#282728] group-hover:text-[#436235] transition-colors">
                Open <ChevronRight size={12} strokeWidth={2.5} />
            </span>
        </Link>
    );
}

function TeaserCard({ eyebrow, icon, href, cta, empty, emptyText, children }) {
    return (
        <Link
            href={href}
            className="group block bg-white rounded-2xl border border-[#282728]/15 p-7 sm:p-8 hover:border-[#436235]/40 transition-colors hover:shadow-[0_24px_48px_-24px_rgba(40,39,40,0.15)]"
        >
            <div className="flex items-center gap-2 mb-5">
                <span className="text-[#436235]">{icon}</span>
                <p className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.32em]">{eyebrow}</p>
            </div>
            {empty ? (
                <div className="py-6 text-center">
                    <AlertCircle size={20} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400 font-light">{emptyText}</p>
                </div>
            ) : (
                children
            )}
            <div className="mt-7 pt-5 border-t border-[#282728]/10">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#282728] group-hover:text-[#436235] transition-colors">
                    {cta} <ArrowRight size={12} strokeWidth={2.5} />
                </span>
            </div>
        </Link>
    );
}

function JourneyRoadmap({ roadmap = [], currentPhase = null, preEngagement = false }) {
    // If the lead's stage is still in PROCESS (pre-engagement), they shouldn't
    // really have portal access yet — but if they do, show a friendly "we're
    // setting up your engagement" notice instead of pretending they're in
    // phase 1 already.
    if (preEngagement) {
        return (
            <section className="bg-white border border-[#436235]/30 rounded-2xl p-8 sm:p-10 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#436235]/10 text-[#436235] mb-4">
                    <Sparkles size={20} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#436235] mb-2">
                    Engagement being set up
                </p>
                <h3 className="text-2xl font-medium tracking-tight text-[#282728] mb-3">
                    Welcome to ePathways
                </h3>
                <p className="text-sm text-[#282728]/70 font-light leading-relaxed max-w-xl mx-auto">
                    We&apos;re still finalising your consultancy agreement and payment. Once those are sorted, your full journey roadmap — Agreement, Enrolment, and Visa — will unlock here. Your adviser will be in touch shortly.
                </p>
            </section>
        );
    }

    return (
        <div className="space-y-5">
            {/* Current-phase callout — the friendly, plain-English summary of
                where the lead actually is right now. */}
            {currentPhase && (
                <section className="bg-[#436235] text-white rounded-2xl overflow-hidden">
                    <div className="p-7 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                        <div className="lg:col-span-9">
                            <div className="flex items-center gap-2.5 mb-3">
                                <MapPinned size={14} className="text-[#a8c89a]" />
                                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#a8c89a]">
                                    {currentPhase.department ? `With ${currentPhase.department}` : 'Outcome'}
                                </p>
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-white leading-tight">
                                {currentPhase.label}
                            </h3>
                            <p className="text-sm sm:text-base text-white/80 font-light mt-3 leading-relaxed max-w-2xl">
                                {currentPhase.lead_copy}
                            </p>
                        </div>
                        <div className="lg:col-span-3 flex lg:justify-end">
                            <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.08] border border-white/15">
                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
                                    Step
                                </span>
                                <span className="text-base font-medium text-white">
                                    {currentPhase.index + 1} / {roadmap.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Stepper — every phase as a node, with the current one swelled
                up. Horizontal at lg+, stacks vertically below. */}
            <ol className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                {roadmap.map((p, i) => {
                    const isDone     = p.state === 'done';
                    const isCurrent  = p.state === 'current';
                    const isUpcoming = p.state === 'upcoming';

                    return (
                        <li
                            key={p.key}
                            className={`relative rounded-2xl p-5 border transition-all ${
                                isCurrent
                                    ? 'bg-white border-[#436235] shadow-[0_24px_48px_-24px_rgba(67,98,53,0.35)]'
                                    : isDone
                                        ? 'bg-[#436235]/5 border-[#436235]/20'
                                        : 'bg-white border-[#282728]/10 opacity-70'
                            }`}
                        >
                            {/* Node circle + connector */}
                            <div className="flex items-center justify-between mb-3">
                                <span
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                        isDone
                                            ? 'bg-[#436235] text-white'
                                            : isCurrent
                                                ? 'bg-[#436235] text-white ring-4 ring-[#436235]/15'
                                                : 'bg-[#282728]/5 text-[#282728]/40 border border-[#282728]/15'
                                    }`}
                                >
                                    {isDone ? <Check size={14} strokeWidth={3} /> : i + 1}
                                </span>
                                <span
                                    className={`text-[9px] font-bold uppercase tracking-[0.22em] ${
                                        isCurrent
                                            ? 'text-[#436235]'
                                            : isDone
                                                ? 'text-[#436235]/70'
                                                : 'text-[#282728]/30'
                                    }`}
                                >
                                    {isCurrent ? 'You are here' : isDone ? 'Done' : 'Up next'}
                                </span>
                            </div>

                            <p
                                className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-1 ${
                                    isCurrent ? 'text-[#436235]' : 'text-[#282728]/40'
                                }`}
                            >
                                {p.department || 'Outcome'}
                            </p>
                            <h4
                                className={`text-base font-medium leading-snug tracking-tight ${
                                    isCurrent ? 'text-[#282728]' : isUpcoming ? 'text-[#282728]/60' : 'text-[#282728]/80'
                                }`}
                            >
                                {p.label}
                            </h4>
                            <p
                                className={`text-[11px] mt-1.5 leading-relaxed ${
                                    isCurrent ? 'text-[#282728]/70' : 'text-[#282728]/40'
                                }`}
                            >
                                {p.description}
                            </p>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

function DetailRow({ icon, label, value, fullWidth = false }) {
    return (
        <div className={`bg-white px-6 py-5 flex items-start gap-4 ${fullWidth ? "sm:col-span-2" : ""}`}>
            <div className="w-9 h-9 rounded-xl bg-[#436235]/10 text-[#436235] flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-medium text-[#282728] truncate">{value}</p>
            </div>
        </div>
    );
}
