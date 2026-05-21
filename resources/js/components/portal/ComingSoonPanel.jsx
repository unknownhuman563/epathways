import { Clock } from "lucide-react";

// Stub panel used by lead-portal sections that aren't built out yet.
// Lists planned features so leads (and reviewers) can see what's coming.
export default function ComingSoonPanel({ icon = null, title, lines = [] }) {
    return (
        <section className="bg-white rounded-2xl border border-[#282728]/15 p-8 sm:p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#436235]/10 text-[#436235] mb-4">
                {icon || <Clock size={22} />}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#436235] mb-2">
                Coming soon
            </p>
            <h3 className="text-xl sm:text-2xl font-medium tracking-tight text-[#282728] mb-3">
                {title}
            </h3>
            {lines.length > 0 && (
                <ul className="text-sm text-[#282728]/70 font-light leading-relaxed space-y-1.5 max-w-lg mx-auto text-left mt-5">
                    {lines.map((l, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="text-[#436235] mt-1.5">•</span>
                            <span>{l}</span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
