import { useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, FileText, MessageCircle, CheckCircle, ArrowRight, Loader, Camera } from "react-feather";

// Real questions replacing the lorem-ipsum placeholders that were in the
// inline form. These match how the sales team frames their post-approval
// debrief, so the answers actually map to publishable copy. Q1 used to be
// "What visa or service did we help you with?" but the dropdown above
// already captures that, so it's been replaced with a story-driven prompt.
const QUESTIONS = [
    "What made you choose ePathways?",
    "How was your overall experience working with ePathways?",
    "Would you recommend us to friends and family — and why?",
];

// Department-aware dropdown options. The DB column is `visa_type` regardless
// of department — for education it's a programme/qualification type but
// we reuse the same field so a single admin column / public payload covers
// both. "Other" lets the user fall back to free text in the next field.
const TYPE_OPTIONS = {
    immigration: {
        label: "Visa type",
        placeholder: "Which visa did we help you with?",
        options: [
            "Student Visa",
            "Work Visa (AEWV)",
            "Skilled Migrant Category",
            "Resident Visa",
            "Partnership Visa",
            "Visitor Visa",
            "Post-Study Work Visa",
            "Other",
        ],
    },
    education: {
        label: "Programme type",
        placeholder: "Which programme did we help you with?",
        options: [
            "Diploma (Level 5–6)",
            "Bachelor's Degree (Level 7)",
            "Postgraduate Diploma (Level 8)",
            "Master's Degree (Level 9)",
            "PhD (Level 10)",
            "Foundation / Pathway",
            "English Proficiency (IELTS / PTE prep)",
            "Other",
        ],
    },
};

// Modal-based review submission. Posts to the existing POST /user-reviews
// endpoint (no backend changes to the route signature). New reviews land
// with is_published=false and only appear publicly after an admin flips
// the publish toggle on the admin Reviews page.
export default function ReviewModal({ open, onClose, department = "immigration" }) {
    // The dept the visitor opened the modal from is the "primary" one.
    // The other one is offered as a cross-dept opt-in checkbox.
    const otherDept = department === "education" ? "immigration" : "education";
    const primaryConfig = TYPE_OPTIONS[department] || TYPE_OPTIONS.immigration;
    const otherConfig = TYPE_OPTIONS[otherDept] || TYPE_OPTIONS.immigration;

    const { data, setData, post, processing, errors, reset, clearErrors, transform } = useForm({
        name: "",
        email: "",
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

    // Map the primary dropdown value into the right backend column based on
    // which page the modal was opened from.
    const primaryField = department === "education" ? "program_type" : "visa_type";
    const otherField = department === "education" ? "visa_type" : "program_type";

    // Tag the review as 'both' at submission time when the cross-dept
    // checkbox is ticked, so a single review can surface on both pages.
    transform((d) => ({
        ...d,
        department: d.also_other_dept ? "both" : department,
    }));

    const [done, setDone] = useState(false);
    const [hoverStar, setHoverStar] = useState(0);
    const [photoPreview, setPhotoPreview] = useState(null);

    // Revoke the blob URL when the file changes or modal closes — leaks
    // memory otherwise and the preview gets stale.
    useEffect(() => {
        if (!data.photo) {
            setPhotoPreview(null);
            return;
        }
        const url = URL.createObjectURL(data.photo);
        setPhotoPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [data.photo]);

    // Body scroll lock + ESC to close (only when not in success state — the
    // success card has its own dismiss button).
    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = "hidden";
        const onKey = (e) => {
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKey);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleClose = () => {
        // Reset internal state so the next open is fresh, but don't blow
        // away in-progress typing while still open.
        setDone(false);
        setHoverStar(0);
        reset();
        clearErrors();
        onClose?.();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/user-reviews", {
            preserveScroll: true,
            // Forces multipart/form-data so the optional photo file
            // actually gets sent. Inertia would otherwise serialise as JSON
            // and the file would be dropped on the floor.
            forceFormData: true,
            onSuccess: () => {
                setDone(true);
            },
        });
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 font-urbanist"
            >
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full sm:max-w-2xl bg-white sm:rounded-[24px] rounded-t-[24px] shadow-[0_40px_80px_rgba(0,0,0,0.45)] max-h-[92vh] overflow-y-auto"
                >
                    {/* Close */}
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close"
                        className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>

                    {done ? (
                        <div className="p-10 sm:p-14 text-center">
                            <motion.div
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                                className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#436235] flex items-center justify-center"
                            >
                                <CheckCircle size={28} className="text-white" strokeWidth={2} />
                            </motion.div>
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#282728] mb-3">
                                Thank you for sharing
                            </h3>
                            <p className="text-sm text-gray-700 font-normal leading-relaxed max-w-md mx-auto mb-8">
                                Your review is in moderation. Once approved by our team it will appear here to help future clients on their journey.
                            </p>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#436235] hover:text-[#385029] transition-colors"
                            >
                                Close
                                <ArrowRight size={14} strokeWidth={2.5} />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-7 sm:p-10">
                            {/* Header */}
                            <div className="mb-7">
                                <p className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.32em] mb-2">
                                    Share your story
                                </p>
                                <h3 className="text-2xl sm:text-3xl font-medium text-[#282728] tracking-tight mb-1.5">
                                    Write a review
                                </h3>
                                <p className="text-sm text-gray-700 font-normal">
                                    Two minutes. Your honest experience helps future clients.
                                </p>
                            </div>

                            {/* Rating */}
                            <div className="mb-7">
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-3">
                                    Your rating
                                </label>
                                <div className="flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map((n) => {
                                        const active = (hoverStar || data.rating) >= n;
                                        return (
                                            <button
                                                key={n}
                                                type="button"
                                                onMouseEnter={() => setHoverStar(n)}
                                                onMouseLeave={() => setHoverStar(0)}
                                                onClick={() => setData("rating", n)}
                                                className="p-1 transition-transform hover:scale-110 active:scale-95"
                                                aria-label={`Rate ${n} of 5`}
                                            >
                                                <Star
                                                    size={28}
                                                    strokeWidth={1.5}
                                                    className={
                                                        active
                                                            ? "fill-[#436235] text-[#436235]"
                                                            : "fill-transparent text-gray-300"
                                                    }
                                                />
                                            </button>
                                        );
                                    })}
                                    {data.rating > 0 && (
                                        <span className="ml-3 text-xs font-medium text-gray-500">
                                            {data.rating} of 5
                                        </span>
                                    )}
                                </div>
                                {errors.rating && (
                                    <p className="text-xs text-red-500 mt-1.5 font-light">{errors.rating}</p>
                                )}
                            </div>

                            {/* Identity */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-2">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        placeholder="Your full name"
                                        autoComplete="name"
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#436235] transition-colors"
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-500 mt-1.5 font-light">{errors.name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-2">
                                        Email <span className="text-gray-500 normal-case tracking-normal font-light">(optional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData("email", e.target.value)}
                                        placeholder="email@example.com"
                                        autoComplete="email"
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#436235] transition-colors"
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-red-500 mt-1.5 font-light">{errors.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* Visa / programme type — labelled per department.
                                Same DB column on the backend; just different
                                option lists. Optional, so the placeholder is
                                a "skip" affordance. */}
                            {/* Primary dropdown — visa type on /immigration,
                                programme type on /education-journey. */}
                            <div className="mb-5">
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-2">
                                    {primaryConfig.label} <span className="text-gray-500 normal-case tracking-normal font-light">(optional)</span>
                                </label>
                                <select
                                    value={data[primaryField]}
                                    onChange={(e) => setData(primaryField, e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#436235] transition-colors cursor-pointer"
                                >
                                    <option value="">{primaryConfig.placeholder}</option>
                                    {primaryConfig.options.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                {errors[primaryField] && (
                                    <p className="text-xs text-red-500 mt-1.5 font-light">{errors[primaryField]}</p>
                                )}
                            </div>

                            {/* Cross-dept opt-in — if the client also used
                                services from the OTHER department, expose
                                the second dropdown and tag the submission
                                so it shows on both public pages + home. */}
                            <div className="mb-7">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={!!data.also_other_dept}
                                        onChange={(e) => {
                                            const next = e.target.checked;
                                            setData("also_other_dept", next);
                                            if (!next) setData(otherField, "");
                                        }}
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-[#436235] focus:ring-[#436235]/30 focus:ring-2 cursor-pointer"
                                    />
                                    <span className="text-[11px] text-gray-700 font-normal">
                                        I also used ePathways for {otherDept === "immigration" ? "my visa processing" : "my education programme"}
                                    </span>
                                </label>

                                {data.also_other_dept && (
                                    <div className="mt-3 pl-5 border-l-2 border-[#436235]/30">
                                        <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-2">
                                            {otherConfig.label}
                                        </label>
                                        <select
                                            value={data[otherField]}
                                            onChange={(e) => setData(otherField, e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#436235] transition-colors cursor-pointer"
                                        >
                                            <option value="">{otherConfig.placeholder}</option>
                                            {otherConfig.options.map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                        {errors[otherField] && (
                                            <p className="text-xs text-red-500 mt-1.5 font-light">{errors[otherField]}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Optional photo upload — shows as the avatar on
                                the public review card. JPG / PNG / WEBP up
                                to 4MB. */}
                            <div className="mb-7">
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-2">
                                    Your photo <span className="text-gray-500 normal-case tracking-normal font-light">(optional)</span>
                                </label>
                                <div className="flex items-center gap-4">
                                    {photoPreview ? (
                                        <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-[#436235]/30 flex-shrink-0">
                                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setData("photo", null)}
                                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs hover:bg-black transition-colors"
                                                aria-label="Remove photo"
                                            >
                                                <X size={11} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer w-16 h-16 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#436235]/50 hover:text-[#436235] hover:bg-[#436235]/5 transition-colors flex-shrink-0">
                                            <Camera size={20} strokeWidth={1.5} />
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                className="hidden"
                                                onChange={(e) => setData("photo", e.target.files?.[0] || null)}
                                            />
                                        </label>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-700 font-normal leading-relaxed">
                                            A square headshot looks best. JPG / PNG / WEBP, up to 4MB.
                                        </p>
                                        {data.photo && (
                                            <p className="text-[10px] text-gray-600 mt-1 truncate">
                                                {data.photo.name} · {(data.photo.size / 1024).toFixed(0)} KB
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {errors.photo && (
                                    <p className="text-xs text-red-500 mt-1.5 font-light">{errors.photo}</p>
                                )}
                            </div>

                            {/* Mode toggle */}
                            <div className="mb-7">
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-3">
                                    How would you like to share?
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setData("mode", "questions")}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.18em] border transition-all ${
                                            data.mode === "questions"
                                                ? "bg-[#282728] text-white border-[#282728]"
                                                : "bg-white text-gray-500 border-gray-200 hover:border-[#436235]/40 hover:text-[#282728]"
                                        }`}
                                    >
                                        <FileText size={13} strokeWidth={2.25} /> 3 Questions
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData("mode", "paragraph")}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.18em] border transition-all ${
                                            data.mode === "paragraph"
                                                ? "bg-[#282728] text-white border-[#282728]"
                                                : "bg-white text-gray-500 border-gray-200 hover:border-[#436235]/40 hover:text-[#282728]"
                                        }`}
                                    >
                                        <MessageCircle size={13} strokeWidth={2.25} /> Paragraph
                                    </button>
                                </div>
                            </div>

                            {/* Mode body */}
                            <AnimatePresence mode="wait">
                                {data.mode === "questions" ? (
                                    <motion.div
                                        key="questions"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-5"
                                    >
                                        {QUESTIONS.map((q, idx) => {
                                            const key = `answer_${idx + 1}`;
                                            return (
                                                <div key={key}>
                                                    <label className="flex items-start gap-2.5 text-sm font-medium text-[#282728] mb-2">
                                                        <span className="w-6 h-6 rounded-full bg-[#436235] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="leading-snug">
                                                            {q} <span className="text-red-500">*</span>
                                                        </span>
                                                    </label>
                                                    <textarea
                                                        rows={3}
                                                        value={data[key]}
                                                        onChange={(e) => setData(key, e.target.value)}
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#436235] transition-colors resize-none leading-relaxed"
                                                        placeholder="Your answer…"
                                                    />
                                                    {errors[key] && (
                                                        <p className="text-xs text-red-500 mt-1.5 font-light">{errors[key]}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="paragraph"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <label className="block text-sm font-medium text-[#282728] mb-2">
                                            Your review <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={7}
                                            value={data.paragraph}
                                            onChange={(e) => setData("paragraph", e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-sm outline-none focus:border-[#436235] transition-colors resize-none leading-relaxed"
                                            placeholder="Share your experience with ePathways in your own words…"
                                        />
                                        {errors.paragraph && (
                                            <p className="text-xs text-red-500 mt-1.5 font-light">{errors.paragraph}</p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Footer */}
                            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                                <p className="text-[10px] text-gray-600 font-normal leading-relaxed max-w-xs">
                                    Reviews are moderated before publishing. We never share your email.
                                </p>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center gap-2.5 bg-[#436235] text-white text-[11px] font-bold px-8 py-3.5 rounded-xl hover:bg-[#385029] transition-colors uppercase tracking-[0.22em] disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {processing ? (
                                        <>
                                            <Loader size={14} className="animate-spin" />
                                            Sending
                                        </>
                                    ) : (
                                        <>
                                            Submit review
                                            <ArrowRight size={14} strokeWidth={2.5} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
