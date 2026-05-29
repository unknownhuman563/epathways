import { useEffect, useState } from "react";
import { Head, useForm, Link } from "@inertiajs/react";
import { Star, FileText, MessageCircle, CheckCircle, ArrowRight, Camera, Home } from "react-feather";

// Standalone public review-submission page — same form the
// "Write a review" modal uses, but rendered as a full page so staff can
// share a direct link with clients (e.g. via email or WhatsApp).
//
// Accepts `?dept=education|immigration|both` to scope the submission. Name
// and email can also be prefilled via `?name=...&email=...` so clients
// don't have to retype info staff already have.

const QUESTIONS = [
    "What made you choose ePathways?",
    "How was your overall experience working with ePathways?",
    "Would you recommend us to friends and family — and why?",
];

const TYPE_OPTIONS = {
    immigration: {
        label: "Visa type",
        placeholder: "Which visa did we help you with?",
        options: [
            "Student Visa", "Work Visa (AEWV)", "Skilled Migrant Category",
            "Resident Visa", "Partnership Visa", "Visitor Visa",
            "Post-Study Work Visa", "Other",
        ],
    },
    education: {
        label: "Programme type",
        placeholder: "Which programme did we help you with?",
        options: [
            "Diploma (Level 5–6)", "Bachelor's Degree (Level 7)",
            "Postgraduate Diploma (Level 8)", "Master's Degree (Level 9)",
            "PhD (Level 10)", "Foundation / Pathway",
            "English Proficiency (IELTS / PTE prep)", "Other",
        ],
    },
};

export default function LeaveReviewPage({
    department = "immigration",
    prefill = {},
}) {
    const otherDept = department === "education" ? "immigration" : "education";
    const primaryConfig = TYPE_OPTIONS[department] || TYPE_OPTIONS.immigration;
    const otherConfig = TYPE_OPTIONS[otherDept] || TYPE_OPTIONS.immigration;
    const primaryField = department === "education" ? "program_type" : "visa_type";
    const otherField = department === "education" ? "visa_type" : "program_type";

    const { data, setData, post, processing, errors, transform } = useForm({
        name: prefill.name || "",
        email: prefill.email || "",
        mode: "questions",
        rating: 0,
        answer_1: "",
        answer_2: "",
        answer_3: "",
        paragraph: "",
        department,
        visa_type: "",
        program_type: "",
        photo: null,
        also_other_dept: false,
    });

    const [done, setDone] = useState(false);
    const [hoverStar, setHoverStar] = useState(0);
    const [photoPreview, setPhotoPreview] = useState(null);

    useEffect(() => {
        if (!data.photo) { setPhotoPreview(null); return; }
        const url = URL.createObjectURL(data.photo);
        setPhotoPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [data.photo]);

    transform((d) => ({
        ...d,
        department: d.also_other_dept ? "both" : department,
    }));

    const submit = (e) => {
        e.preventDefault();
        post("/user-reviews", {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setDone(true),
        });
    };

    return (
        <div className="min-h-screen bg-white font-urbanist">
            <Head title="Leave a review · ePathways" />

            {/* Slim header — just brand, no nav */}
            <header className="border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-6 sm:px-10 py-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#282728] flex items-center justify-center text-white text-xs font-black">eP</div>
                    <div>
                        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-500 leading-none">ePathways</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-none">Client review</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 sm:px-10 py-10 sm:py-14">
                {done ? (
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-10 sm:p-14 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#282728] flex items-center justify-center">
                            <CheckCircle size={28} className="text-white" strokeWidth={2} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#282728] mb-3">
                            Thank you for sharing
                        </h1>
                        <p className="text-sm text-gray-700 leading-relaxed max-w-md mx-auto mb-8">
                            Your review is in moderation. Once approved by our team it will appear publicly to help future clients on their journey.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-[#282728] hover:bg-black text-white text-[11px] font-bold uppercase tracking-[0.22em] px-7 py-3.5 rounded-xl transition-colors"
                        >
                            <Home size={14} strokeWidth={2.5} />
                            Back to ePathways
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="mb-8">
                            <p className="text-[10px] font-bold text-[#282728] uppercase tracking-[0.32em] mb-2">
                                Share your story
                            </p>
                            <h1 className="text-3xl sm:text-4xl font-bold text-[#282728] tracking-tight mb-3">
                                Write a review
                            </h1>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                Two minutes. Your honest experience helps future clients navigate their journey to New Zealand.
                            </p>
                        </div>

                        <form onSubmit={submit} className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 sm:p-12 lg:p-14 space-y-8">
                            {/* Rating */}
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-3">
                                    Your rating
                                </label>
                                <div className="flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map((n) => {
                                        const active = (hoverStar || data.rating) >= n;
                                        return (
                                            <button key={n} type="button"
                                                onMouseEnter={() => setHoverStar(n)}
                                                onMouseLeave={() => setHoverStar(0)}
                                                onClick={() => setData("rating", n)}
                                                className="p-1 transition-transform hover:scale-110 active:scale-95"
                                                aria-label={`Rate ${n} of 5`}>
                                                <Star size={32} strokeWidth={1.5}
                                                    className={active ? "fill-amber-400 text-amber-400" : "fill-transparent text-gray-300"} />
                                            </button>
                                        );
                                    })}
                                    {data.rating > 0 && (
                                        <span className="ml-3 text-xs font-medium text-gray-700">{data.rating} of 5</span>
                                    )}
                                </div>
                                {errors.rating && <p className="text-xs text-red-500 mt-1.5">{errors.rating}</p>}
                            </div>

                            {/* Identity */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-2">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" value={data.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        placeholder="Your full name" autoComplete="name"
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#282728] transition-colors" />
                                    {errors.name && <p className="text-xs text-red-500 mt-1.5">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-2">
                                        Email <span className="text-gray-500 normal-case tracking-normal font-light">(optional)</span>
                                    </label>
                                    <input type="email" value={data.email}
                                        onChange={(e) => setData("email", e.target.value)}
                                        placeholder="email@example.com" autoComplete="email"
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#282728] transition-colors" />
                                </div>
                            </div>

                            {/* Primary type */}
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-2">
                                    {primaryConfig.label} <span className="text-gray-500 normal-case tracking-normal font-light">(optional)</span>
                                </label>
                                <select value={data[primaryField]}
                                    onChange={(e) => setData(primaryField, e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#282728] transition-colors cursor-pointer">
                                    <option value="">{primaryConfig.placeholder}</option>
                                    {primaryConfig.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            {/* Cross-dept opt-in */}
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" checked={!!data.also_other_dept}
                                        onChange={(e) => {
                                            const next = e.target.checked;
                                            setData("also_other_dept", next);
                                            if (!next) setData(otherField, "");
                                        }}
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-[#282728] focus:ring-[#282728]/30 focus:ring-2 cursor-pointer" />
                                    <span className="text-[11px] text-gray-700">
                                        I also used ePathways for {otherDept === "immigration" ? "my visa processing" : "my education programme"}
                                    </span>
                                </label>
                                {data.also_other_dept && (
                                    <div className="mt-3 pl-5 border-l-2 border-[#282728]/30">
                                        <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-2">
                                            {otherConfig.label}
                                        </label>
                                        <select value={data[otherField]}
                                            onChange={(e) => setData(otherField, e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#282728] transition-colors cursor-pointer">
                                            <option value="">{otherConfig.placeholder}</option>
                                            {otherConfig.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Photo */}
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-2">
                                    Your photo <span className="text-gray-500 normal-case tracking-normal font-light">(optional)</span>
                                </label>
                                <div className="flex items-center gap-4">
                                    {photoPreview ? (
                                        <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-[#282728]/30 flex-shrink-0">
                                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => setData("photo", null)}
                                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs hover:bg-black transition-colors">×</button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer w-16 h-16 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#282728]/50 hover:text-[#282728] hover:bg-[#282728]/5 transition-colors flex-shrink-0">
                                            <Camera size={20} strokeWidth={1.5} />
                                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                                                onChange={(e) => setData("photo", e.target.files?.[0] || null)} />
                                        </label>
                                    )}
                                    <p className="text-xs text-gray-700 leading-relaxed flex-1">
                                        A square headshot looks best. JPG / PNG / WEBP, up to 4MB.
                                    </p>
                                </div>
                            </div>

                            {/* Mode toggle */}
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-3">
                                    How would you like to share?
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button type="button" onClick={() => setData("mode", "questions")}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.18em] border transition-all ${
                                            data.mode === "questions" ? "bg-[#282728] text-white border-[#282728]"
                                                : "bg-white text-gray-700 border-gray-200 hover:border-[#282728]/40 hover:text-[#282728]"
                                        }`}>
                                        <FileText size={13} strokeWidth={2.25} /> 3 Questions
                                    </button>
                                    <button type="button" onClick={() => setData("mode", "paragraph")}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.18em] border transition-all ${
                                            data.mode === "paragraph" ? "bg-[#282728] text-white border-[#282728]"
                                                : "bg-white text-gray-700 border-gray-200 hover:border-[#282728]/40 hover:text-[#282728]"
                                        }`}>
                                        <MessageCircle size={13} strokeWidth={2.25} /> Paragraph
                                    </button>
                                </div>
                            </div>

                            {/* Answers */}
                            {data.mode === "questions" ? (
                                <div className="space-y-5">
                                    {[1, 2, 3].map((n) => (
                                        <div key={n}>
                                            <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-2">
                                                <span className="inline-flex w-5 h-5 rounded-full bg-[#282728] text-white items-center justify-center mr-2 text-[10px]">{n}</span>
                                                {QUESTIONS[n - 1]} <span className="text-red-500">*</span>
                                            </label>
                                            <textarea value={data[`answer_${n}`]} rows={3}
                                                onChange={(e) => setData(`answer_${n}`, e.target.value)}
                                                placeholder="Your answer..."
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#282728] transition-colors resize-y" />
                                            {errors[`answer_${n}`] && <p className="text-xs text-red-500 mt-1.5">{errors[`answer_${n}`]}</p>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-2">
                                        Your review <span className="text-red-500">*</span>
                                    </label>
                                    <textarea value={data.paragraph} rows={6}
                                        onChange={(e) => setData("paragraph", e.target.value)}
                                        placeholder="Tell us about your experience with ePathways..."
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#282728] transition-colors resize-y" />
                                    {errors.paragraph && <p className="text-xs text-red-500 mt-1.5">{errors.paragraph}</p>}
                                </div>
                            )}

                            <button type="submit" disabled={processing}
                                className="w-full inline-flex items-center justify-center gap-3 bg-[#282728] text-white text-[11px] font-bold uppercase tracking-[0.22em] px-7 py-4 rounded-xl hover:bg-black active:scale-[0.99] transition-all disabled:opacity-60">
                                {processing ? "Submitting…" : "Submit review"}
                                <ArrowRight size={14} strokeWidth={2.5} />
                            </button>
                        </form>
                    </>
                )}

                <p className="text-center text-[10px] text-gray-500 mt-8 tracking-wider">
                    Reviews are moderated before being published.
                </p>
            </main>
        </div>
    );
}
