import { Link } from "@inertiajs/react";
import {
    ClipboardCheck, GraduationCap, Globe, ArrowUpRight,
    Clock, FileText, Users,
} from "lucide-react";
import registerBg from "@assets/Services/settlement.png";

// Three top-of-funnel CTAs that frame how a visitor enters the funnel.
// Renders below "Our Trusted Partners" and above the About section so
// the trust strip warms them up and the cards convert.
//
// Visual treatment:
//   - Light section, generous breathing room
//   - Step numbers (01/02/03) lend a sense of journey without forcing one
//   - Per-card metadata chip (time / scope) tells the visitor what they're
//     committing to before they click
//   - The middle card sits visually elevated by default (slightly larger
//     shadow + ring) because Enrolment is the highest-intent action of
//     the three — already programme-aware, ready to commit
//   - Single CTA per card (per spec — Visa Assessment is one link;
//     the picker page behind it branches to the four visa types)

const FORMS = [
    {
        key:        "pre-assessment",
        step:       "01",
        eyebrow:    "Scoping",
        title:      "Pre Assessment",
        meta:       { icon: Clock, label: "10 minutes" },
        description:
            "A quick eligibility read across study, work and immigration pathways. " +
            "Best if you're still figuring out where you fit.",
        icon:       ClipboardCheck,
        href:       "/free-assessment",
        cta:        "Start pre assessment",
    },
    {
        key:        "enrolment",
        step:       "02",
        eyebrow:    "Education",
        title:      "Enrolment",
        meta:       { icon: FileText, label: "Programme required" },
        description:
            "Lock in your seat once you've picked a programme. We'll handle the " +
            "school endorsement and prepare your file for the visa step.",
        icon:       GraduationCap,
        href:       "/education-enrolment",
        cta:        "Start enrolment",
        featured:   true,
    },
    {
        key:        "visa-assessment",
        step:       "03",
        eyebrow:    "Immigration",
        title:      "Visa Assessment",
        meta:       { icon: Users, label: "Resident · Work · Student · Visitor" },
        description:
            "A visa-specific intake that maps your case to INZ requirements. " +
            "One entry point — we'll route you to the right form.",
        icon:       Globe,
        href:       "/immigration-assessment",
        cta:        "Start visa assessment",
    },
];

export default function QuickForms() {
    return (
        <section className="bg-white py-20">
            <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                {/* Section header */}
                <div className="max-w-2xl mx-auto text-center mb-12 md:mb-14">
                    <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-gray-500 mb-3">
                        Start your application
                    </p>
                    <h2 className="text-3xl md:text-[40px] font-bold tracking-tight text-[#0c1611] leading-[1.1]">
                        Three ways to begin
                    </h2>
                    <p className="mt-4 text-[15px] text-gray-600 leading-relaxed">
                        Whether you're scoping eligibility, locking in a programme, or filing for a visa —
                        pick the right starting point and we'll guide the rest.
                    </p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
                    {FORMS.map((f) => (
                        <FormCard key={f.key} form={f} />
                    ))}
                </div>

                {/* Quick-register band — image-backed dark band linking to the
                    /register page (name, contact, experience + CV / Passport). */}
                <div className="relative mt-10 rounded-2xl overflow-hidden text-white px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                    {/* Background image + dark overlay (solid base + gradient) so
                        the text stays readable over the bright photo. */}
                    <img src={registerBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[#0c0c0c]/80" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c0c]/95 via-[#0c0c0c]/70 to-[#0c0c0c]/40" />

                    <div className="relative z-10">
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight">Just want to register?</h3>
                        <p className="text-[13.5px] text-white/80 mt-1 max-w-xl leading-relaxed">
                            Register your interest in about 2 minutes — share your details and upload your CV &amp; passport, and our team will reach out.
                        </p>
                    </div>
                    <Link
                        href="/register"
                        className="relative z-10 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#0c1611] text-sm font-bold whitespace-nowrap hover:bg-gray-100 transition-colors shadow-lg"
                    >
                        Register now
                    </Link>
                </div>

                {/* Foot note — sets expectations for the not-sure visitor */}
                <p className="text-center text-[12px] text-gray-400 mt-8">
                    Not sure where to start? The Pre Assessment is the safest first step — it points you to the right form at the end.
                </p>
            </div>
        </section>
    );
}

function FormCard({ form: f }) {
    const Icon     = f.icon;
    const MetaIcon = f.meta.icon;
    return (
        <Link
            href={f.href}
            className={`group relative flex flex-col h-full rounded-2xl bg-white transition-all duration-300 ${
                f.featured
                    ? "ring-1 ring-[#0c1611]/15 shadow-md hover:shadow-2xl hover:-translate-y-1"
                    : "ring-1 ring-gray-200 hover:ring-[#0c1611] hover:shadow-xl hover:-translate-y-1"
            }`}
        >
            {/* Top strip — step number + eyebrow */}
            <div className="flex items-start justify-between px-6 pt-6">
                <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-gray-400">
                    {f.eyebrow}
                </span>
                <span className="font-mono text-[11px] font-bold text-gray-300 tracking-wider">
                    {f.step}
                </span>
            </div>

            {/* Body */}
            <div className="px-6 pt-5 pb-6 flex-1 flex flex-col">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors ${
                    f.featured
                        ? "bg-[#0c1611] text-white"
                        : "bg-gray-100 text-[#0c1611] group-hover:bg-[#0c1611] group-hover:text-white"
                }`}>
                    <Icon size={22} strokeWidth={1.75} />
                </div>

                <h3 className="text-xl md:text-[22px] font-bold tracking-tight text-[#0c1611] leading-snug">
                    {f.title}
                </h3>

                <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                    <MetaIcon size={11} strokeWidth={2} />
                    <span>{f.meta.label}</span>
                </div>

                <p className="mt-4 text-[13.5px] text-gray-600 leading-relaxed">
                    {f.description}
                </p>

                <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-[#0c1611] tracking-tight">
                        {f.cta}
                    </span>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        f.featured
                            ? "bg-[#0c1611] text-white group-hover:translate-x-1"
                            : "bg-gray-100 text-[#0c1611] group-hover:bg-[#0c1611] group-hover:text-white group-hover:translate-x-1"
                    }`}>
                        <ArrowUpRight size={14} strokeWidth={2.25} />
                    </span>
                </div>
            </div>
        </Link>
    );
}
