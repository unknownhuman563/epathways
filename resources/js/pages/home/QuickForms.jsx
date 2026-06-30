import { Link } from "@inertiajs/react";
import { ClipboardCheck, GraduationCap, Globe, ArrowRight } from "lucide-react";

// Quick-access cards for the three top-of-funnel forms a visitor most
// commonly lands here to start. Sits below "Our Trusted Partners" and
// above the About section. Single CTA per card; the Visa Assessment
// entry is one link that leads to the visa-type picker (handles all four
// visa flows behind it).

const FORMS = [
    {
        key: "pre-assessment",
        title: "Pre Assessment",
        description: "Get a quick read on your eligibility. Takes about 10 minutes.",
        icon: ClipboardCheck,
        href: "/free-assessment",
        cta: "Start pre assessment",
    },
    {
        key: "enrolment",
        title: "Enrolment",
        description: "Begin your enrolment with us once you've picked a programme.",
        icon: GraduationCap,
        href: "/education-enrolment",
        cta: "Start enrolment",
    },
    {
        key: "visa-assessment",
        title: "Visa Assessment",
        description: "Submit a visa-specific assessment — Resident, Work, Student or Visitor.",
        icon: Globe,
        href: "/immigration-assessment",
        cta: "Start visa assessment",
    },
];

export default function QuickForms() {
    return (
        <section className="bg-white py-14">
            <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                <div className="text-center mb-10">
                    <p className="text-sm font-semibold tracking-widest text-gray-500 uppercase mb-2">
                        Get started
                    </p>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#282728]">
                        Pick a form and we'll take it from there
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {FORMS.map((f) => {
                        const Icon = f.icon;
                        return (
                            <Link
                                key={f.key}
                                href={f.href}
                                className="group relative flex flex-col gap-3 p-6 rounded-2xl border border-gray-200 bg-white hover:border-gray-900 hover:shadow-lg transition-all"
                            >
                                <div className="w-11 h-11 rounded-xl bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors">
                                    <Icon size={20} className="text-gray-700 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-[#282728]">{f.title}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
                                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[#282728] group-hover:gap-2.5 transition-all">
                                    {f.cta}
                                    <ArrowRight size={15} strokeWidth={2.25} />
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
