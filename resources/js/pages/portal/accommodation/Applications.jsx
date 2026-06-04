import { useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ClipboardList, Eye, Search } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

function formTypeBadgeClass(type) {
    return type === "hot" ? "bg-rose-50 text-rose-700" : "bg-sky-50 text-sky-700";
}

function statusBadgeClass(status) {
    switch (status) {
        case "new":
            return "bg-blue-50 text-blue-700";
        case "reviewed":
            return "bg-amber-50 text-amber-700";
        case "shortlisted":
            return "bg-emerald-50 text-emerald-700";
        case "declined":
            return "bg-gray-100 text-gray-500";
        default:
            return "bg-gray-100 text-gray-500";
    }
}

function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function Applications({ submissions = {}, statuses = [], filters = {} }) {
    const rows = submissions.data ?? [];
    const currentStatus = filters.status ?? "all";
    const formType = filters.form_type ?? "all";
    const [search, setSearch] = useState(filters.search ?? "");

    const applyFilters = (next = {}) => {
        const merged = {
            search: next.search !== undefined ? next.search : search,
            status: next.status !== undefined ? next.status : currentStatus,
            form_type: next.form_type !== undefined ? next.form_type : formType,
        };
        const query = {};
        if (merged.search) query.search = merged.search;
        if (merged.status !== "all") query.status = merged.status;
        if (merged.form_type !== "all") query.form_type = merged.form_type;
        router.get("/portal/accommodation/applications", query, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    // Debounce the search box.
    useEffect(() => {
        const t = setTimeout(() => {
            if ((filters.search ?? "") !== search) applyFilters({ search });
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="Leads" />

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
                <p className="text-sm text-gray-500">
                    Expression of Interest submissions from the public form.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, email or mobile…"
                        className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                </div>
                <select
                    value={currentStatus}
                    onChange={(e) => applyFilters({ status: e.target.value })}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                    <option value="all">All statuses</option>
                    {statuses.map((s) => (
                        <option key={s} value={s} className="capitalize">
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                    ))}
                </select>
                <select
                    value={formType}
                    onChange={(e) => applyFilters({ form_type: e.target.value })}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                    <option value="all">All types</option>
                    <option value="hot">Hot</option>
                    <option value="cold">Cold</option>
                </select>
            </div>

            {/* Empty state */}
            {rows.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
                    <ClipboardList className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="font-semibold text-gray-900">No leads yet</p>
                    <p className="text-sm text-gray-500">
                        Submissions from the public Expression of Interest form will appear here.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-3xl border border-gray-50 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Applicant</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold">Room type</th>
                                <th className="px-6 py-4 font-semibold">Preferred start</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Submitted</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rows.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-900">
                                            {sub.full_legal_name}
                                        </p>
                                        {sub.preferred_name && (
                                            <p className="text-xs text-gray-400">
                                                {sub.preferred_name}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${formTypeBadgeClass(sub.form_type)}`}
                                        >
                                            {sub.form_type || "cold"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">
                                        {sub.room_type_interest || "—"}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">
                                        {formatDate(sub.tenancy_start_date)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(sub.status)}`}
                                        >
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {formatDate(sub.created_at)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/portal/accommodation/applications/${sub.id}`}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
                                        >
                                            <Eye size={14} /> View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination links={submissions.links} />
        </div>
    );
}
