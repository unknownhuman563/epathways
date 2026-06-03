import { Head, Link } from "@inertiajs/react";
import { Home, CheckCircle, EyeOff, Plus } from "lucide-react";

export default function AccommodationDashboard({ propertyStats = {}, recentProperties = [] }) {
    const money = (v) => (v == null ? "—" : `$${Number(v).toFixed(0)}`);

    const cards = [
        { label: "Total properties", value: propertyStats.total ?? 0, icon: <Home className="w-5 h-5" />, dark: true, foot: <span className="text-xs text-gray-400">all listings</span> },
        { label: "Available", value: propertyStats.available ?? 0, icon: <CheckCircle className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">shown on the public page</span> },
        { label: "Unavailable", value: propertyStats.unavailable ?? 0, icon: <EyeOff className="w-5 h-5" />, foot: <span className="text-xs text-gray-400">hidden from the public page</span> },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="Accommodation Dashboard" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Accommodation</h1>
                    <p className="text-sm text-gray-500">Manage the property listings shown on the public accommodation page.</p>
                </div>
                <Link
                    href="/portal/accommodation/properties/create"
                    className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
                >
                    <Plus size={18} /> New property
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {cards.map((c, i) => (
                    <div key={i} className={`p-6 rounded-3xl ${c.dark ? "bg-gray-900 text-white shadow-lg" : "bg-white text-gray-900 border border-gray-50 shadow-sm"}`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className={`text-sm font-medium ${c.dark ? "text-gray-300" : "text-gray-500"}`}>{c.label}</span>
                            <span className={`p-1.5 rounded-lg ${c.dark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-500"}`}>{c.icon}</span>
                        </div>
                        <p className="text-3xl font-bold tracking-tight">{c.value}</p>
                        <div className="mt-2">{c.foot}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5">
                    <h2 className="text-lg font-bold text-gray-900">Recent properties</h2>
                    <Link href="/portal/accommodation/properties" className="text-sm font-semibold text-rose-600 hover:text-rose-700">
                        View all
                    </Link>
                </div>

                {recentProperties.length === 0 ? (
                    <div className="border-t border-gray-50 px-6 py-12 text-center">
                        <Home className="mx-auto mb-3 text-gray-300" size={36} />
                        <p className="font-semibold text-gray-900">No properties yet</p>
                        <p className="text-sm text-gray-500">Add your first listing to populate the accommodation page.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm border-t border-gray-50">
                        <tbody className="divide-y divide-gray-50">
                            {recentProperties.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                                {p.cover_image ? (
                                                    <img src={p.cover_image} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                                                        <Home size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{p.name}</p>
                                                <p className="text-xs text-gray-500 capitalize">{p.room_type} · {p.suburb || p.location || "—"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">{money(p.rent_single)}/wk</td>
                                    <td className="px-6 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            p.status === "available"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-gray-100 text-gray-500"
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/portal/accommodation/properties/${p.id}/edit`} className="text-sm font-semibold text-gray-500 hover:text-gray-900">
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
