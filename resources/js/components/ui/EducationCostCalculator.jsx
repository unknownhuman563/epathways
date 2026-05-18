import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, DollarSign } from "react-feather";
import { Link } from "@inertiajs/react";

// ─── Indicative fee constants ────────────────────────────────────────────────
// These are sane defaults for 2026 NZ international-student costs. Update
// when actual numbers change — single source of truth. All values in NZD.

const TUITION_PER_YEAR = {
    diploma:  { it: 18000, engineering: 19000, health: 22000, business: 17000, other: 17000 },
    bachelor: { it: 28000, engineering: 35000, health: 36000, business: 27000, other: 26000 },
    postgrad: { it: 35000, engineering: 42000, health: 48000, business: 34000, other: 33000 },
};

const CITY = {
    Auckland:     { livingPerYear: 22000, accomMultiplier: 1.00 },
    Wellington:   { livingPerYear: 20000, accomMultiplier: 0.95 },
    Christchurch: { livingPerYear: 18000, accomMultiplier: 0.85 },
    Other:        { livingPerYear: 17000, accomMultiplier: 0.80 },
};

const ACCOM_PER_YEAR = {
    homestay:  { label: "Homestay (meals included)", base: 15000 },
    shared:    { label: "Shared flat / room",         base: 11000 },
    private:   { label: "Private apartment / studio", base: 18000 },
};

const HOUSEHOLD_MULTIPLIER = {
    alone:   { label: "Just me",          mult: 1.00 },
    partner: { label: "With partner",     mult: 1.55 },
    family:  { label: "Partner + child",  mult: 2.10 },
};

const LEVEL_LABEL = { diploma: "Diploma", bachelor: "Bachelor", postgrad: "Postgrad / Masters" };
const FIELD_LABEL = { it: "IT / Computer Science", engineering: "Engineering", health: "Healthcare / Nursing", business: "Business / Management", other: "Other" };

const VISA_FEE = 750;                // INZ student visa application
const INSURANCE_PER_YEAR = 800;      // mandatory cover for international students
const ARRIVAL_COSTS = 1500;          // approximate first-month settle-in

// Indicative NZD → PHP rate. Updated periodically; quotes are still in NZD.
// Tweak when the real rate drifts significantly.
const PHP_PER_NZD = 33;

const CURRENCIES = {
    NZD: { code: "NZD", locale: "en-NZ", factor: 1 },
    PHP: { code: "PHP", locale: "en-PH", factor: PHP_PER_NZD },
};

const fmt = (amountNZD, currency = "NZD") => {
    const cfg = CURRENCIES[currency] ?? CURRENCIES.NZD;
    return new Intl.NumberFormat(cfg.locale, {
        style: "currency",
        currency: cfg.code,
        maximumFractionDigits: 0,
    }).format(Math.max(0, Math.round(amountNZD * cfg.factor)));
};

// Premium two-column cost calculator for the education-journey page.
// Pure client-side math, no backend. The CTA at the bottom routes to
// /booking — sales can convert the high-intent visitor with the actual
// quote against the visitor's stated programme.
export default function EducationCostCalculator() {
    const [level, setLevel]         = useState("bachelor");
    const [field, setField]         = useState("it");
    const [years, setYears]         = useState(3);
    const [city, setCity]           = useState("Auckland");
    const [accom, setAccom]         = useState("shared");
    const [household, setHousehold] = useState("alone");
    const [currency, setCurrency]   = useState("NZD");

    const calc = useMemo(() => {
        const tuitionPerYear = TUITION_PER_YEAR[level][field];
        const livingPerYear  = CITY[city].livingPerYear * HOUSEHOLD_MULTIPLIER[household].mult;
        const accomPerYear   = ACCOM_PER_YEAR[accom].base * CITY[city].accomMultiplier;
        const insurance      = INSURANCE_PER_YEAR * years;
        const tuition        = tuitionPerYear * years;
        const living         = livingPerYear * years;
        const accomTotal     = accomPerYear * years;
        const total          = tuition + living + accomTotal + insurance + VISA_FEE + ARRIVAL_COSTS;
        const perYearAvg     = total / Math.max(1, years);

        return {
            lines: [
                { label: "Tuition",                  detail: `${fmt(tuitionPerYear, currency)} × ${years} yr`,      amount: tuition },
                { label: "Accommodation",            detail: `${ACCOM_PER_YEAR[accom].label}, ${city}`,             amount: accomTotal },
                { label: "Living expenses",          detail: `${HOUSEHOLD_MULTIPLIER[household].label}, ${city}`,   amount: living },
                { label: "Health insurance",         detail: `Mandatory, ${years} yr cover`,                        amount: insurance },
                { label: "Visa application",         detail: "INZ student visa fee",                                amount: VISA_FEE },
                { label: "Arrival & settle-in",      detail: "First-month essentials",                              amount: ARRIVAL_COSTS },
            ],
            total,
            perYearAvg,
        };
    }, [level, field, years, city, accom, household, currency]);

    return (
        <section id="cost-calculator" className="py-24 sm:py-28 lg:py-32 bg-white font-urbanist border-t border-[#282728]/15">
            <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
                {/* Header */}
                <div className="text-center mb-14 lg:mb-16 max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        className="flex items-center justify-center gap-4 mb-5"
                    >
                        <div className="h-px w-12 bg-[#436235]/50"></div>
                        <span className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.35em]">
                            Cost calculator
                        </span>
                        <div className="h-px w-12 bg-[#436235]/50"></div>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-3xl sm:text-4xl lg:text-5xl font-medium text-[#282728] tracking-tight leading-[1.1] mb-5"
                    >
                        Estimate your <span className="text-[#436235] font-light italic">total NZ study cost.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        className="text-base text-gray-500 font-light leading-relaxed"
                    >
                        Indicative estimates based on 2026 averages. Adjust the controls — your total updates live.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-[#282728]/15 border border-[#282728]/15 rounded-[20px] overflow-hidden"
                >
                    {/* ── Left: controls (white) */}
                    <div className="lg:col-span-7 bg-white p-8 sm:p-10 lg:p-12">
                        <p className="text-xs font-bold text-[#282728] uppercase tracking-[0.25em] mb-7 pb-4 border-b border-[#282728]/20">
                            Tell us your plan
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Field label="Programme level">
                                <Select value={level} onChange={setLevel} options={Object.entries(LEVEL_LABEL).map(([v, l]) => [v, l])} />
                            </Field>
                            <Field label="Field of study">
                                <Select value={field} onChange={setField} options={Object.entries(FIELD_LABEL).map(([v, l]) => [v, l])} />
                            </Field>

                            <Field label={`Duration · ${years} year${years > 1 ? "s" : ""}`}>
                                <input
                                    type="range"
                                    min={1}
                                    max={4}
                                    step={1}
                                    value={years}
                                    onChange={(e) => setYears(Number(e.target.value))}
                                    className="w-full mt-3 accent-[#436235] cursor-pointer"
                                />
                                <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-semibold uppercase tracking-[0.15em]">
                                    <span>1 yr</span><span>2 yr</span><span>3 yr</span><span>4 yr</span>
                                </div>
                            </Field>
                            <Field label="City of study">
                                <Select value={city} onChange={setCity} options={Object.keys(CITY).map((k) => [k, k])} />
                            </Field>

                            <Field label="Accommodation">
                                <Select value={accom} onChange={setAccom} options={Object.entries(ACCOM_PER_YEAR).map(([v, o]) => [v, o.label])} />
                            </Field>
                            <Field label="Household">
                                <Select value={household} onChange={setHousehold} options={Object.entries(HOUSEHOLD_MULTIPLIER).map(([v, o]) => [v, o.label])} />
                            </Field>
                        </div>
                    </div>

                    {/* ── Right: live total (dark) */}
                    <div className="lg:col-span-5 bg-[#282728] text-white p-8 sm:p-10 lg:p-12 flex flex-col">
                        {/* Header row — eyebrow + currency toggle */}
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5">
                                <DollarSign size={16} strokeWidth={2.5} className="text-[#a8c89a]" />
                                <p className="text-xs font-bold text-[#a8c89a] uppercase tracking-[0.25em]">
                                    Estimated total
                                </p>
                            </div>
                            {/* Currency segmented toggle */}
                            <div className="inline-flex p-1 rounded-full bg-white/10 border border-white/15">
                                {["NZD", "PHP"].map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setCurrency(c)}
                                        className={`px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] transition-all ${
                                            currency === c
                                                ? "bg-white text-[#282728]"
                                                : "text-white/60 hover:text-white"
                                        }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-3">
                            <span className="text-5xl sm:text-6xl font-light tracking-tight tabular-nums leading-none text-white">
                                {fmt(calc.total, currency)}
                            </span>
                        </div>
                        <p className="text-base text-white/80 font-light mb-8">
                            ≈ {fmt(calc.perYearAvg, currency)} / year · over {years} year{years > 1 ? "s" : ""}
                        </p>

                        {/* Itemised breakdown */}
                        <ul className="space-y-4 mb-8 flex-grow">
                            {calc.lines.map((line) => (
                                <li
                                    key={line.label}
                                    className="flex items-start justify-between gap-4 pb-4 border-b border-white/20 last:border-b-0"
                                >
                                    <div className="min-w-0">
                                        <p className="text-[15px] font-semibold text-white leading-tight">{line.label}</p>
                                        <p className="text-xs text-white/70 font-normal mt-1 truncate">
                                            {line.detail}
                                        </p>
                                    </div>
                                    <span className="text-[15px] font-semibold text-white tabular-nums whitespace-nowrap pt-0.5">
                                        {fmt(line.amount, currency)}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <Link
                            href="/booking"
                            className="inline-flex items-center justify-center gap-3 bg-white text-[#282728] text-xs font-bold px-7 py-4 rounded-xl hover:bg-gray-100 active:scale-[0.99] transition-all uppercase tracking-[0.2em]"
                        >
                            Get a personalised quote
                            <ArrowRight size={14} strokeWidth={2.5} />
                        </Link>
                        <p className="text-xs text-white/60 font-normal text-center mt-4 leading-relaxed">
                            {currency === "PHP"
                                ? `Indicative only · Converted from NZD at ~1 NZD = ${PHP_PER_NZD} PHP`
                                : "Indicative only · Actual fees depend on programme & institution"}
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#282728]/70 mb-2.5">
                {label}
            </label>
            {children}
        </div>
    );
}

function Select({ value, onChange, options }) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl text-base font-medium bg-white border border-[#282728]/25 text-[#282728] outline-none focus:border-[#436235] hover:border-[#282728]/50 transition-colors cursor-pointer"
        >
            {options.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
            ))}
        </select>
    );
}
