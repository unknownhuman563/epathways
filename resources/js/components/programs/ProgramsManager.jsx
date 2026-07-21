import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { GraduationCap, Search, MapPin, Building2, Users, ExternalLink, Plus, Pencil, Trash2 } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
// Reuse the admin's full multi-step program editor (Basics → Details & Fees,
// incl. entry requirements, employment outcomes, tuition/fees) so education
// and sales get the exact same rich form — only the portalBase URL differs.
import { ProgramModal } from "@/pages/admin/Programs";

const STATUS_STYLE = {
    published: "bg-emerald-100 text-emerald-700 border-emerald-200",
    draft:     "bg-amber-100 text-amber-700 border-amber-200",
    archived:  "bg-gray-100 text-gray-500 border-gray-200",
};

/**
 * Shared Programs catalogue manager (list + add/edit/delete). Both the
 * education and sales portals render this — only `portalBase` differs
 * (e.g. "/portal/education" or "/portal/sales"); all CRUD posts to the same
 * ProgramController under that prefix.
 */
export default function ProgramsManager({ programs = [], schools = [], portalBase, description }) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [editing, setEditing] = useState(undefined); // undefined = closed, null = add, object = edit

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

    const remove = (p) => {
        if (!window.confirm(`Delete "${p.title}"? This can't be undone.`)) return;
        router.delete(`${portalBase}/programs/${p.id}`, { preserveScroll: true });
    };

    return (
        <div className="space-y-5 max-w-6xl mx-auto pb-12">
            <PortalPageHeader
                eyebrow="Setup"
                title="Programs"
                description={description || "The NZ programs you advise on — the shared catalogue."}
                action={(
                    <button
                        type="button"
                        onClick={() => setEditing(null)}
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
                                <th className="px-3 py-3 text-right pr-4">Actions</th>
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
                                    <td className="px-3 py-3 pr-4">
                                        <div className="flex items-center justify-end gap-1">
                                            {p.slug && (
                                                <a href={`/program-details/${p.slug}`} target="_blank" rel="noopener noreferrer" title="Open public page"
                                                    className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                                                    <ExternalLink size={13} />
                                                </a>
                                            )}
                                            <button type="button" onClick={() => setEditing(p)} title="Edit"
                                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100">
                                                <Pencil size={13} />
                                            </button>
                                            <button type="button" onClick={() => remove(p)} title="Delete"
                                                className="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ProgramModal
                open={editing !== undefined}
                editing={editing || null}
                schools={schools}
                portalBase={portalBase}
                onClose={() => setEditing(undefined)}
            />
        </div>
    );
}
