import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { Users, Search } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function StageBadge({ stage }) {
    if (!stage) return <span className="text-xs text-gray-400">—</span>;
    return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 text-xs font-medium">
            {stage}
        </span>
    );
}

export default function Learners({ learners = { data: [], links: [] }, stages = [], filters = {} }) {
    const [search, setSearch] = useState(filters.search ?? "");
    const rows = learners?.data ?? [];

    const applyFilters = (next = {}) => {
        const params = {
            stage: next.stage !== undefined ? next.stage : filters.stage ?? "",
            search: next.search !== undefined ? next.search : search,
        };
        // Drop empties so the URL stays clean.
        Object.keys(params).forEach((k) => !params[k] && delete params[k]);
        router.get("/portal/english/learners", params, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="English Learners" />

            <header className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-emerald-600" /> Learners
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Leads enrolled with the English team (PTE / DIY prep).</p>
                </div>
            </header>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        applyFilters({ search });
                    }}
                    className="relative flex-1 min-w-[220px] max-w-sm"
                >
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, email, phone…"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                </form>

                <select
                    value={filters.stage ?? ""}
                    onChange={(e) => applyFilters({ stage: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                    <option value="">All stages</option>
                    {stages.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Learner</th>
                                <th className="px-6 py-3">Phone</th>
                                <th className="px-6 py-3">Stage</th>
                                <th className="px-6 py-3">Last activity</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <p className="text-sm font-semibold text-gray-600">No English learners yet.</p>
                                        <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                                            Add a learner from the leads page by toggling “is_english_student”.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((l) => (
                                    <tr key={l.id} className="hover:bg-gray-50/40">
                                        <td className="px-6 py-3">
                                            <div className="font-semibold text-gray-900 text-sm">{l.name}</div>
                                            <div className="text-xs text-gray-400">{l.email || "—"}</div>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{l.phone || "—"}</td>
                                        <td className="px-6 py-3">
                                            <StageBadge stage={l.english_stage} />
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-500">{fmtDate(l.last_activity)}</td>
                                        <td className="px-6 py-3 text-right">
                                            <Link
                                                href={`/portal/english/leads/${l.id}`}
                                                className="text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                                            >
                                                View profile
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination links={learners?.links ?? []} />
        </div>
    );
}
