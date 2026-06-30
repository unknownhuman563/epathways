import { useMemo, useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { GraduationCap, Search, MapPin, Building2, Users, ExternalLink, Plus, X, Save } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";

const STATUS_STYLE = {
    published: "bg-emerald-100 text-emerald-700 border-emerald-200",
    draft:     "bg-amber-100 text-amber-700 border-amber-200",
    archived:  "bg-gray-100 text-gray-500 border-gray-200",
};

export default function EducationPrograms({ programs = [] }) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [addOpen, setAddOpen] = useState(false);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return programs.filter((p) => {
            const hay = `${p.title || ""} ${p.institution || ""} ${p.level || ""} ${p.location || ""}`.toLowerCase();
            const matchSearch = !q || hay.includes(q);
            const matchStatus = status === "all" || (p.status || "").toLowerCase() === status;
            return matchSearch && matchStatus;
        });
    }, [programs, search, status]);

    const counts = useMemo(() => ({
        all: programs.length,
        published: programs.filter((p) => (p.status || "").toLowerCase() === "published").length,
        draft: programs.filter((p) => (p.status || "").toLowerCase() === "draft").length,
        archived: programs.filter((p) => (p.status || "").toLowerCase() === "archived").length,
    }), [programs]);

    return (
        <div className="space-y-5 max-w-6xl mx-auto pb-12">
            <Head title="Programs — Education" />
            <PortalPageHeader
                eyebrow="Setup"
                title="Programs"
                description="The NZ programs you advise on — the same catalogue admin maintains."
                action={(
                    <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
                    >
                        <Plus size={14} /> Add Program
                    </button>
                )}
            />

            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-1.5">
                    {[
                        { k: "all", label: "All" },
                        { k: "published", label: "Published" },
                        { k: "draft", label: "Draft" },
                        { k: "archived", label: "Archived" },
                    ].map((s) => (
                        <button
                            key={s.k}
                            type="button"
                            onClick={() => setStatus(s.k)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                                status === s.k ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                            {s.label} <span className="opacity-60">· {counts[s.k] ?? 0}</span>
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search programs, institution…"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-xs placeholder-gray-400 focus:outline-none focus:border-gray-400"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Program</th>
                                <th className="px-3 py-3">Institution</th>
                                <th className="px-3 py-3">Level</th>
                                <th className="px-3 py-3">Location</th>
                                <th className="px-3 py-3">Enrolled</th>
                                <th className="px-3 py-3">Status</th>
                                <th className="px-3 py-3 text-right pr-4">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <GraduationCap size={22} />
                                            <p className="text-sm font-medium">No programs match your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-gray-900">{p.title}</div>
                                        {p.category && <div className="text-[10px] text-gray-400">{p.category}</div>}
                                    </td>
                                    <td className="px-3 py-3 text-gray-600">
                                        {p.institution ? (
                                            <span className="inline-flex items-center gap-1.5"><Building2 size={11} className="text-gray-300" />{p.institution}</span>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-3 py-3 text-gray-600">{p.level || <span className="text-gray-300">—</span>}</td>
                                    <td className="px-3 py-3 text-gray-600">
                                        {p.location ? (
                                            <span className="inline-flex items-center gap-1.5"><MapPin size={11} className="text-gray-300" />{p.location}</span>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="inline-flex items-center gap-1 text-gray-700 font-medium">
                                            <Users size={11} className="text-gray-300" />{p.enrolled ?? 0}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLE[(p.status || "").toLowerCase()] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                            {p.status || "—"}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 pr-4 text-right">
                                        {p.slug ? (
                                            <a
                                                href={`/program-details/${p.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                <ExternalLink size={11} /> Open
                                            </a>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddProgramModal open={addOpen} onClose={() => setAddOpen(false)} />
        </div>
    );
}

// Compact "Add Program" form for education staff. Posts the core fields to the
// shared ProgramController via the education-prefixed route; admin can enrich
// the rest (entry requirements, fees, outcomes) later from the full editor.
function AddProgramModal({ open, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: "",
        institution: "",
        location: "",
        level: 7,
        category: "bachelors",
        status: "draft",
        price_text: "",
        duration_months: "",
        intake_months: "",
        description: "",
        image: null,
    });

    if (! open) return null;

    const submit = (e) => {
        e.preventDefault();
        post("/portal/education/programs", {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };

    const IC = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:border-gray-400 outline-none transition-colors";

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-6" onClick={(e) => { if (e.target === e.currentTarget && ! processing) onClose(); }}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                            <GraduationCap size={16} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 leading-none">Add program</h2>
                            <p className="text-[11px] text-gray-500 mt-0.5">Add a program to the shared catalogue</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} disabled={processing} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-40">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                    {Object.keys(errors).length > 0 && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[12px]">
                            <ul className="list-disc pl-4 space-y-0.5">
                                {Object.values(errors).map((m, i) => <li key={i}>{m}</li>)}
                            </ul>
                        </div>
                    )}

                    <Field label="Program title" required>
                        <input type="text" required value={data.title} onChange={(e) => setData("title", e.target.value)} className={IC} maxLength={255} placeholder="e.g. Bachelor of Nursing" />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Institution">
                            <input type="text" value={data.institution} onChange={(e) => setData("institution", e.target.value)} className={IC} maxLength={255} />
                        </Field>
                        <Field label="Location">
                            <input type="text" value={data.location} onChange={(e) => setData("location", e.target.value)} className={IC} maxLength={255} placeholder="e.g. Auckland" />
                        </Field>
                        <Field label="Level (1–10)" required>
                            <input type="number" min={1} max={10} required value={data.level} onChange={(e) => setData("level", e.target.value)} className={IC} />
                        </Field>
                        <Field label="Category" required>
                            <select value={data.category} onChange={(e) => setData("category", e.target.value)} className={IC}>
                                <option value="diplomas">Diplomas</option>
                                <option value="bachelors">Bachelors</option>
                                <option value="masters">Masters</option>
                            </select>
                        </Field>
                        <Field label="Status" required>
                            <select value={data.status} onChange={(e) => setData("status", e.target.value)} className={IC}>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </Field>
                        <Field label="Price text">
                            <input type="text" value={data.price_text} onChange={(e) => setData("price_text", e.target.value)} className={IC} maxLength={255} placeholder="e.g. NZD 28,000 / year" />
                        </Field>
                        <Field label="Duration (months)">
                            <input type="number" min={0} value={data.duration_months} onChange={(e) => setData("duration_months", e.target.value)} className={IC} />
                        </Field>
                        <Field label="Intake months">
                            <input type="text" value={data.intake_months} onChange={(e) => setData("intake_months", e.target.value)} className={IC} maxLength={255} placeholder="e.g. Feb, Jul" />
                        </Field>
                    </div>

                    <Field label="Description">
                        <textarea value={data.description} onChange={(e) => setData("description", e.target.value)} rows={3} className={`${IC} resize-y`} placeholder="Short overview of the program…" />
                    </Field>

                    <Field label="Banner image">
                        <input type="file" accept="image/*" onChange={(e) => setData("image", e.target.files?.[0] || null)} className="text-xs" />
                    </Field>
                </form>

                <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
                    <button type="button" onClick={onClose} disabled={processing} className="px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-40">
                        Cancel
                    </button>
                    <button type="button" onClick={submit} disabled={processing} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-40">
                        <Save size={12} /> {processing ? "Saving…" : "Add program"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, required, children }) {
    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}
