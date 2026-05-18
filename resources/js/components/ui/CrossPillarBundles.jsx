import { Link } from "@inertiajs/react";
import { ArrowRight } from "react-feather";

// "You may also need…" strip shown at the bottom of each pillar page.
// Pass `exclude` as one of "education" | "immigration" | "accommodation" so
// the current page's pillar is omitted. Drives cross-sell: most NZ-bound
// families need at least two of these.
const PILLARS = {
    education: {
        href: "/education-journey",
        eyebrow: "Studying in NZ",
        title: "Education pathway",
        body: "Programmes from diplomas to doctorates, with intake calendars and fee transparency.",
        tone: "bg-[#436235]",
    },
    immigration: {
        href: "/immigration",
        eyebrow: "Working & settling",
        title: "Immigration & visas",
        body: "Skilled-migrant, partner, work and resident pathways — managed by licensed advisers.",
        tone: "bg-[#282728]",
    },
    accommodation: {
        href: "/accommodation",
        eyebrow: "Where you'll live",
        title: "Accommodation",
        body: "Student-friendly homestays, apartments and arrival support across Auckland and beyond.",
        tone: "bg-[#1c2c26]",
    },
};

export default function CrossPillarBundles({ exclude }) {
    const others = Object.entries(PILLARS).filter(([key]) => key !== exclude);

    return (
        <section className="py-16 sm:py-20 bg-white border-t border-gray-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-10">
                    <p className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.3em] mb-2">
                        You may also need
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-[#282728]">
                        Most families bundle their journey
                    </h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
                        Education, immigration and accommodation work better together — we coordinate all three under one team.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {others.map(([key, p]) => (
                        <Link
                            key={key}
                            href={p.href}
                            className={`group relative overflow-hidden rounded-2xl ${p.tone} text-white p-7 sm:p-8 hover:shadow-2xl transition-all hover:-translate-y-0.5`}
                        >
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70 mb-3">
                                {p.eyebrow}
                            </p>
                            <h4 className="text-xl sm:text-2xl font-bold mb-2 leading-tight">
                                {p.title}
                            </h4>
                            <p className="text-sm opacity-85 leading-relaxed mb-5">
                                {p.body}
                            </p>
                            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] border-b border-white/40 pb-1 group-hover:border-white transition-colors">
                                Explore <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
