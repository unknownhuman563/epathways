import { motion } from "framer-motion";
import { Check } from "react-feather";
import QuickLeadForm from "./QuickLeadForm";

// Single premium soft-capture mounted directly above the Footer on the
// home + pillar pages. Editorial two-column layout — left holds an
// invitation and three quiet trust signals, right holds the form. No
// urgency theatrics, no modal, no popup; it's a confident close to the
// page, not an interruption.
export default function BeforeFooterCTA({
    source = "before-footer",
    eyebrow = "Get started",
    headline = "Talk to a human.",
    sublineAccent = "In Tagalog, English or Hindi.",
    paragraph = "Whatever your stage — student, professional, family — our licensed advisers reply within 24 hours with a clear next step.",
    trust = [
        "Licensed by the Immigration Advisers Authority (IAA)",
        "Partnered with NZQA-accredited institutions",
        "Free and obligation-free first response",
    ],
}) {
    return (
        <section className="bg-[#282728] text-white font-urbanist relative overflow-hidden">
            {/* Subtle accent — a single hairline of brand green at the top
                edge replaces border-noise from a full border-t. */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#436235]/60 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-20 sm:py-24 lg:py-28">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                    {/* Left — editorial */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="lg:col-span-7"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.35em]">
                                {eyebrow}
                            </span>
                            <div className="h-px w-12 bg-[#436235]/50"></div>
                        </div>

                        <h2 className="text-4xl sm:text-5xl lg:text-[64px] font-medium text-white leading-[1.05] tracking-tight mb-3">
                            {headline}
                        </h2>
                        <p className="text-2xl sm:text-3xl lg:text-[34px] font-light text-white/55 leading-tight mb-8">
                            {sublineAccent}
                        </p>

                        <p className="text-base sm:text-lg text-white/70 font-light leading-relaxed max-w-xl mb-10">
                            {paragraph}
                        </p>

                        <ul className="space-y-3.5">
                            {trust.map((t, i) => (
                                <li key={i} className="flex items-start gap-3.5">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#436235] flex-shrink-0"></span>
                                    <span className="text-sm text-white/75 font-light leading-relaxed">
                                        {t}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Right — refined form card sitting on the dark plate */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                        className="lg:col-span-5"
                    >
                        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-[20px] p-7 sm:p-9 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
                            <p className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.35em] mb-2">
                                Your details
                            </p>
                            <h3 className="text-xl sm:text-2xl font-medium text-white tracking-tight mb-1">
                                Leave 3 short details
                            </h3>
                            <p className="text-sm text-white/55 font-light mb-7">
                                We'll reply within 24 hours.
                            </p>

                            <QuickLeadForm
                                source={source}
                                variant="dark"
                                headline=""
                                subtext=""
                                className="!p-0 !bg-transparent !border-0 !shadow-none"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
