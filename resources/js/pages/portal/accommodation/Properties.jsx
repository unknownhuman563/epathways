import { Head, Link, router } from "@inertiajs/react";
import { Plus, Pencil, Trash2, Home } from "lucide-react";

export default function Properties({ properties = [] }) {
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

            {properties.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
                    <Home className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="font-semibold text-gray-900">No properties yet</p>
                    <p className="text-sm text-gray-500">Add your first listing to populate the accommodation page.</p>
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
                            {properties.map((p) => (
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
                                                <p className="text-xs text-gray-500">{p.location || "—"}</p>
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
        </div>
    );
}
