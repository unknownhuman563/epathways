import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

// International phone input — a searchable country dropdown (flag + dial code)
// beside the national number. Emits the full "+<dial> <number>" string via
// onChange. Self-contained: flag emoji are derived from the ISO code, no lib.

const COUNTRIES = [
    { n: "New Zealand", iso: "NZ", d: "64" },
    { n: "Australia", iso: "AU", d: "61" },
    { n: "Philippines", iso: "PH", d: "63" },
    { n: "India", iso: "IN", d: "91" },
    { n: "China", iso: "CN", d: "86" },
    { n: "United States", iso: "US", d: "1" },
    { n: "United Kingdom", iso: "GB", d: "44" },
    { n: "Canada", iso: "CA", d: "1" },
    { n: "Nepal", iso: "NP", d: "977" },
    { n: "Sri Lanka", iso: "LK", d: "94" },
    { n: "Pakistan", iso: "PK", d: "92" },
    { n: "Bangladesh", iso: "BD", d: "880" },
    { n: "Vietnam", iso: "VN", d: "84" },
    { n: "Thailand", iso: "TH", d: "66" },
    { n: "Indonesia", iso: "ID", d: "62" },
    { n: "Malaysia", iso: "MY", d: "60" },
    { n: "Singapore", iso: "SG", d: "65" },
    { n: "Japan", iso: "JP", d: "81" },
    { n: "South Korea", iso: "KR", d: "82" },
    { n: "Fiji", iso: "FJ", d: "679" },
    { n: "United Arab Emirates", iso: "AE", d: "971" },
    { n: "Saudi Arabia", iso: "SA", d: "966" },
    { n: "Qatar", iso: "QA", d: "974" },
    { n: "South Africa", iso: "ZA", d: "27" },
    { n: "Germany", iso: "DE", d: "49" },
    { n: "France", iso: "FR", d: "33" },
    { n: "Italy", iso: "IT", d: "39" },
    { n: "Spain", iso: "ES", d: "34" },
    { n: "Netherlands", iso: "NL", d: "31" },
    { n: "Ireland", iso: "IE", d: "353" },
    { n: "Brazil", iso: "BR", d: "55" },
    { n: "Mexico", iso: "MX", d: "52" },
    { n: "Nigeria", iso: "NG", d: "234" },
    { n: "Kenya", iso: "KE", d: "254" },
    { n: "Egypt", iso: "EG", d: "20" },
    { n: "Turkey", iso: "TR", d: "90" },
    { n: "Russia", iso: "RU", d: "7" },
    { n: "Hong Kong", iso: "HK", d: "852" },
    { n: "Taiwan", iso: "TW", d: "886" },
    { n: "Myanmar", iso: "MM", d: "95" },
    { n: "Cambodia", iso: "KH", d: "855" },
];

const flag = (iso) => iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

export default function PhoneField({ value = "", onChange, error, placeholder = "Phone number" }) {
    // Derive the country + national number from the stored value once.
    const initial = useMemo(() => {
        const v = (value || "").trim();
        if (v.startsWith("+")) {
            const sorted = [...COUNTRIES].sort((a, b) => b.d.length - a.d.length);
            const match = sorted.find((c) => v.startsWith("+" + c.d));
            if (match) return { country: match, number: v.slice(("+" + match.d).length).trim() };
        }
        return { country: COUNTRIES[0], number: v.replace(/^\+/, "") };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [country, setCountry] = useState(initial.country);
    const [number, setNumber] = useState(initial.number);
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const ref = useRef(null);

    useEffect(() => {
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    // E.164: a full international number is at most 15 digits (country code +
    // national). Cap the national part accordingly, with a sensible floor.
    const maxDigits = Math.max(6, 15 - country.d.length);

    const emit = (c, n) => onChange(`+${c.d} ${n}`.trim());

    const filtered = COUNTRIES.filter((c) => {
        const s = q.trim().toLowerCase();
        return !s || c.n.toLowerCase().includes(s) || c.d.includes(s.replace("+", ""));
    });

    return (
        <div className="relative" ref={ref}>
            <div className={`flex items-center border-b transition-colors ${error ? "border-red-500" : "border-gray-200"} focus-within:border-[#009688]`}>
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className="flex items-center gap-1.5 pr-2.5 py-3 text-[#282728] flex-shrink-0"
                >
                    <span className="text-lg leading-none">{flag(country.iso)}</span>
                    <span className="text-sm font-medium">+{country.d}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                <input
                    type="tel"
                    inputMode="numeric"
                    value={number}
                    maxLength={maxDigits}
                    onChange={(e) => {
                        // Digits only, capped so the full number stays within the
                        // 15-digit E.164 limit (total = country code + national).
                        const n = e.target.value.replace(/\D/g, "").slice(0, maxDigits);
                        setNumber(n);
                        emit(country, n);
                    }}
                    placeholder={placeholder}
                    className="flex-1 min-w-0 bg-transparent py-3 text-[#282728] outline-none"
                />
            </div>

            {open && (
                <div className="absolute z-40 mt-1 w-72 max-w-[calc(100vw-3rem)] max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl">
                    <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                autoFocus
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search country or code…"
                                className="w-full pl-8 pr-2 py-1.5 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#009688]"
                            />
                        </div>
                    </div>
                    {filtered.length === 0 ? (
                        <p className="px-3 py-4 text-sm text-gray-400 text-center">No match</p>
                    ) : filtered.map((c) => (
                        <button
                            key={c.iso}
                            type="button"
                            onClick={() => { const n = number.slice(0, Math.max(6, 15 - c.d.length)); setCountry(c); setNumber(n); emit(c, n); setOpen(false); setQ(""); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-gray-50 ${c.iso === country.iso ? "bg-[#009688]/5" : ""}`}
                        >
                            <span className="text-lg leading-none">{flag(c.iso)}</span>
                            <span className="flex-1 truncate text-gray-700">{c.n}</span>
                            <span className="text-gray-400">+{c.d}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
