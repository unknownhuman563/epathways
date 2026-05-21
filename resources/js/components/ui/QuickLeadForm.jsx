import { useForm } from "@inertiajs/react";
import { useState } from "react";
import { Check, Loader, ArrowRight } from "react-feather";

const INTEREST_OPTIONS = ["Education", "Immigration", "Accommodation", "General"];

// Inline lead capture used on dead-end pages, the fee-guide magnet, and
// inside BeforeFooterCTA. Posts to /quick-lead which writes into the same
// `leads` table as the full assessment, tagged with `source`.
//
// Variants:
//   - "card"    (default) — refined white card on neutral backgrounds
//   - "compact" — single horizontal row, e.g. in tight banners
//   - "dark"    — inverted palette, fits on dark sections / before-footer
export default function QuickLeadForm({
    source,
    defaultInterest = "General",
    variant = "card",
    headline = "Get your free NZ pathway check",
    subtext = "Our team replies within 24 hours. No obligation.",
    className = "",
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        phone: "",
        interest: defaultInterest,
        source,
    });

    const [done, setDone] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post("/quick-lead", {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setDone(true);
                reset("name", "email", "phone");
            },
        });
    };

    const isDark = variant === "dark";
    const isCompact = variant === "compact";

    if (done) {
        return (
            <div
                className={`rounded-2xl p-7 sm:p-8 text-center ${
                    isDark
                        ? "bg-white/[0.04] border border-white/10 text-white"
                        : "bg-[#436235]/[0.06] border border-[#436235]/20 text-[#282728]"
                } ${className}`}
            >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#436235] flex items-center justify-center">
                    <Check className="text-white" size={22} strokeWidth={2.5} />
                </div>
                <p className="text-lg font-medium tracking-tight mb-1.5">You're on the list</p>
                <p className={`text-sm font-light leading-relaxed ${isDark ? "text-white/65" : "text-gray-500"}`}>
                    Our team will reach out within 24 hours. For a faster reply, message us on WhatsApp.
                </p>
            </div>
        );
    }

    // Premium input styling — larger padding, more refined borders, focus
    // state that lifts to the brand green without harsh outline rings.
    const inputBase = isDark
        ? "bg-white/[0.04] border border-white/[0.12] text-white placeholder-white/35 focus:border-[#436235] focus:bg-white/[0.06]"
        : "bg-white border border-gray-200 text-[#282728] placeholder-gray-300 focus:border-[#436235] focus:bg-white";

    const labelBase = isDark ? "text-white/45" : "text-gray-400";
    const hasHeader = !isCompact && (headline || subtext);

    return (
        <form
            onSubmit={submit}
            className={`${
                isDark
                    ? "bg-transparent"
                    : "bg-white border border-gray-100 shadow-[0_30px_60px_-30px_rgba(40,39,40,0.18)]"
            } ${isDark ? "" : "rounded-[20px]"} ${isCompact ? "p-4 sm:p-5" : isDark ? "p-0" : "p-7 sm:p-9"} ${className}`}
        >
            {hasHeader && (
                <div className="mb-6">
                    {headline && (
                        <h3
                            className={`text-xl sm:text-2xl font-medium tracking-tight mb-1.5 ${
                                isDark ? "text-white" : "text-[#282728]"
                            }`}
                        >
                            {headline}
                        </h3>
                    )}
                    {subtext && (
                        <p className={`text-sm font-light leading-relaxed ${isDark ? "text-white/55" : "text-gray-500"}`}>
                            {subtext}
                        </p>
                    )}
                </div>
            )}

            <div
                className={`${
                    isCompact
                        ? "flex flex-col sm:flex-row gap-2.5"
                        : "grid grid-cols-1 sm:grid-cols-2 gap-4"
                }`}
            >
                <div className={isCompact ? "flex-1" : ""}>
                    <label className={`block text-[10px] font-semibold uppercase tracking-[0.22em] mb-2 ${labelBase}`}>
                        Full name
                    </label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        placeholder="Maria Santos"
                        autoComplete="name"
                        className={`w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200 ${inputBase}`}
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1.5 font-light">{errors.name}</p>}
                </div>

                <div className={isCompact ? "flex-1" : ""}>
                    <label className={`block text-[10px] font-semibold uppercase tracking-[0.22em] mb-2 ${labelBase}`}>
                        Email
                    </label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        placeholder="maria@example.com"
                        autoComplete="email"
                        inputMode="email"
                        className={`w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200 ${inputBase}`}
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1.5 font-light">{errors.email}</p>}
                </div>

                <div className={isCompact ? "flex-1" : ""}>
                    <label className={`block text-[10px] font-semibold uppercase tracking-[0.22em] mb-2 ${labelBase}`}>
                        Mobile / WhatsApp
                    </label>
                    <input
                        type="tel"
                        value={data.phone}
                        onChange={(e) => setData("phone", e.target.value)}
                        placeholder="+63 9XX XXX XXXX"
                        autoComplete="tel"
                        inputMode="tel"
                        className={`w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200 ${inputBase}`}
                    />
                    {errors.phone && <p className="text-red-400 text-xs mt-1.5 font-light">{errors.phone}</p>}
                </div>

                {!isCompact && (
                    <div>
                        <label className={`block text-[10px] font-semibold uppercase tracking-[0.22em] mb-2 ${labelBase}`}>
                            Interested in
                        </label>
                        <select
                            value={data.interest}
                            onChange={(e) => setData("interest", e.target.value)}
                            className={`w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200 ${inputBase}`}
                        >
                            {INTEREST_OPTIONS.map((opt) => (
                                <option key={opt} value={opt} className="text-[#282728]">
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={processing}
                className={`mt-5 w-full ${
                    isCompact ? "sm:w-auto sm:self-end" : ""
                } px-7 py-4 rounded-xl bg-[#436235] text-white text-[11px] font-bold uppercase tracking-[0.22em] flex items-center justify-center gap-3 hover:bg-[#385029] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
            >
                {processing ? (
                    <>
                        <Loader size={15} className="animate-spin" />
                        Sending
                    </>
                ) : (
                    <>
                        Get my free check
                        <ArrowRight size={15} strokeWidth={2.5} />
                    </>
                )}
            </button>

            {!isCompact && (
                <p className={`mt-4 text-[10px] text-center font-light ${isDark ? "text-white/30" : "text-gray-400"}`}>
                    By submitting, you agree to be contacted by ePathways. We never share your details.
                </p>
            )}
        </form>
    );
}
