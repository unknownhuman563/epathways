import { useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { Plus, Pencil, Trash2, Home, Search } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

export default function Properties({ properties = {}, filters = {} }) {
    const rows = properties.data ?? [];
    const [search, setSearch] = useState(filters.search ?? "");
    const status = filters.status ?? "all";
    const roomType = filters.room_type ?? "all";
    const bedType = filters.bed_type ?? "all";
    const hasFilters = Boolean(search) || status !== "all" || roomType !== "all" || bedType !== "all";

    const applyFilters = (next = {}) => {
        const merged = {
            search: next.search !== undefined ? next.search : search,
            status: next.status !== undefined ? next.status : status,
            room_type: next.room_type !== undefined ? next.room_type : roomType,
            bed_type: next.bed_type !== undefined ? next.bed_type : bedType,
        };
        const query = {};
        if (merged.search) query.search = merged.search;
        if (merged.status !== "all") query.status = merged.status;
        if (merged.room_type !== "all") query.room_type = merged.room_type;
        if (merged.bed_type !== "all") query.bed_type = merged.bed_type;
        router.get("/portal/accommodation/properties", query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Debounce the search box so we don't hit the server on every keystroke.
    useEffect(() => {
        const t = setTimeout(() => {
            if ((filters.search ?? "") !== search) applyFilters({ search });
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const destroy = (property) => {
        if (confirm(`Delete "${property.name}"? This removes its images too.`)) {
            router.delete(`/portal/accommodation/properties/${property.id}`, {
                preserveScroll: true,
            });
        }
    };

    const money = (v) => (v == null ? "—" : `$${Number(v).toFixed(0)}`);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="Properties" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
                    <p className="text-sm text-gray-500">Listings shown on the public accommodation page.</p>
                </div>
                <Link
                    href="/portal/accommodation/properties/create"
                    className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
                >
                    <Plus size={18} /> New property
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, suburb or location…"
                        className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                </div>
                <select
                    value={status}
                    onChange={(e) => applyFilters({ status: e.target.value })}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                    <option value="all">All statuses</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                </select>
                <select
                    value={roomType}
                    onChange={(e) => applyFilters({ room_type: e.target.value })}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                    <option value="all">All room types</option>
                    <option value="single">Single</option>
                    <option value="ensuite">Ensuite</option>
                </select>
                <select
                    value={bedType}
                    onChange={(e) => applyFilters({ bed_type: e.target.value })}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                    <option value="all">All beds</option>
                    <option value="single">Single bed</option>
                    <option value="double">Double bed</option>
                </select>
            </div>

            {rows.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
                    <Home className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="font-semibold text-gray-900">{hasFilters ? "No matching properties" : "No properties yet"}</p>
                    <p className="text-sm text-gray-500">{hasFilters ? "Try adjusting your search or filter." : "Add your first listing to populate the accommodation page."}</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-3xl border border-gray-50 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Property</th>
                                <th className="px-6 py-4 font-semibold">Room type</th>
                                <th className="px-6 py-4 font-semibold">Rent (single / couple)</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rows.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                                {p.cover_image ? (
                                                    <img src={p.cover_image} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                                                        <Home size={18} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{p.name}</p>
                                                <p className="text-xs text-gray-500">{[p.suburb, p.location].filter(Boolean).join(" · ") || "—"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 capitalize text-gray-700">{p.room_type}</td>
                                    <td className="px-6 py-4 text-gray-700">
                                        {money(p.rent_single)}/wk · {money(p.rent_couple)}/wk
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            p.status === "available"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-gray-100 text-gray-500"
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/portal/accommodation/properties/${p.id}/edit`}
                                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                            >
                                                <Pencil size={16} />
                                            </Link>
                                            <button
                                                onClick={() => destroy(p)}
                                                className="rounded-lg p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination links={properties.links} />
        </div>
    );
}
