import { useForm, usePage, Link } from "@inertiajs/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const PRIMARY = "#1F5A8B";
const FIELD = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1F5A8B]/30 focus:border-[#1F5A8B] transition";

export default function Concern({ properties = [] }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({ name: "", email: "", property_id: "", message: "" });

    const submit = (e) => {
        e.preventDefault();
        post("/accommodation/concern");
    };

    if (flash?.success) {
        return (
            <div className="flex min-h-screen flex-col bg-[#fafafa] font-urbanist text-black">
                <Navbar />
                <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
                    <div className="w-full max-w-xl rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm sm:p-10">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16" style={{ backgroundColor: `${PRIMARY}15` }}>
                            <svg className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: PRIMARY }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="mb-3 text-xl font-bold text-gray-900 sm:text-2xl">Thanks — your concern has been submitted.</h1>
                        <p className="mb-8 text-sm leading-relaxed text-gray-500">Our property management team will look into it and be in touch via the email you provided.</p>
                        <Link href="/accommodation" className="inline-block w-full rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto" style={{ backgroundColor: PRIMARY }}>
                            Back to accommodation
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#fafafa] font-urbanist text-black">
            <Navbar />

            <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
                <h1 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl">Raise a Concern</h1>
                <p className="mb-8 text-sm leading-relaxed text-gray-500">
                    Living in one of our properties and something's not right? Let us know below. Enter the name and email
                    on your tenancy and pick your property — we'll make sure the right person looks into it.
                </p>

                <form onSubmit={submit} className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-800">Full Name <span className="text-red-500">*</span></label>
                        <input className={FIELD} value={data.name} onChange={(e) => setData("name", e.target.value)} placeholder="Your name" />
                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-800">Email <span className="text-red-500">*</span></label>
                        <input type="email" className={FIELD} value={data.email} onChange={(e) => setData("email", e.target.value)} placeholder="you@example.com" />
                        <p className="mt-1 text-xs text-gray-400">Use the email on your tenancy so we can match you to your tenant record.</p>
                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-800">Property / House <span className="text-red-500">*</span></label>
                        <select className={FIELD} value={data.property_id} onChange={(e) => setData("property_id", e.target.value)}>
                            <option value="">Select your property…</option>
                            {properties.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                        <p className="mt-1 text-xs text-gray-400">Pick the property you're staying at — this routes your concern correctly even if your email has a typo.</p>
                        {errors.property_id && <p className="mt-1 text-sm text-red-500">{errors.property_id}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-800">Concern <span className="text-red-500">*</span></label>
                        <textarea rows={6} className={FIELD} value={data.message} onChange={(e) => setData("message", e.target.value)} placeholder="Describe the issue with your room or property…" />
                        {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
                    </div>
                    <button type="submit" disabled={processing} className="w-full rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 sm:w-auto" style={{ backgroundColor: PRIMARY }}>
                        {processing ? "Submitting…" : "Submit concern"}
                    </button>
                </form>
            </main>

            <Footer />
        </div>
    );
}
