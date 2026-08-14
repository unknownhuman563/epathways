import { Head, Link } from "@inertiajs/react";
import { ClipboardList, ArrowRight, CheckCircle2, FileText, Lock } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";

const ACCENT = "#009688";
const ICONS = { visa: FileText, free: CheckCircle2, inz: ClipboardList };

// Lead portal → Forms hub. Visa Assessment + Free Assessment are always open
// (assess / edit anytime); INZ Forms unlocks only once an adviser generates it.
export default function LeadForms({ cards = [] }) {
    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-16">
            <Head title="Forms" />
            <PortalPageHeader
                eyebrow="Application"
                title="Forms"
                description="Your assessment and application forms. Open your visa assessment to review or update your answers."
            />

            <div className="space-y-2.5 max-w-3xl">
                {cards.map((c) => <FormCard key={c.key} card={c} />)}
            </div>
        </div>
    );
}

function FormCard({ card }) {
    const Icon = ICONS[card.key] || FileText;
    const available = card.available;

    const body = (
        <>
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: available ? `${ACCENT}14` : "#f3f4f6" }}
            >
                <Icon size={18} style={{ color: available ? ACCENT : "#9ca3af" }} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <h2 className={`text-[14.5px] font-semibold ${available ? "text-gray-900" : "text-gray-500"}`}>{card.title}</h2>
                    <span
                        className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                        style={available
                            ? { color: ACCENT, backgroundColor: `${ACCENT}14` }
                            : { color: "#9ca3af", backgroundColor: "#f3f4f6" }}
                    >
                        {!available && <Lock size={9} />}
                        {card.status}
                    </span>
                </div>
                <p className="text-[12.5px] text-gray-500 mt-0.5 leading-snug">{card.subtitle}</p>
            </div>
            {available && (
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold flex-shrink-0 self-center" style={{ color: ACCENT }}>
                    {card.cta} <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
            )}
        </>
    );

    if (!available) {
        return (
            <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3.5" title="Available once your adviser prepares it">
                {body}
            </div>
        );
    }

    return (
        <Link href={card.href} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white shadow-sm px-4 py-3.5 hover:border-[#009688]/40 hover:shadow transition-all group">
            {body}
        </Link>
    );
}
