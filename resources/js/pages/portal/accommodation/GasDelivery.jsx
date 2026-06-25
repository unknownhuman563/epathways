import { Head } from "@inertiajs/react";
import { Flame } from "lucide-react";

const fmtDate = (v) => {
    if (!v) return null;
    const d = new Date(`${v}T00:00:00`);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString();
};

const daysSince = (v) => {
    if (!v) return null;
    const d = new Date(`${v}T00:00:00`);
    if (isNaN(d.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((today - d) / 86400000);
};

const sinceLabel = (n) => (n == null ? "—" : n <= 0 ? "Today" : n === 1 ? "1 day ago" : `${n} days ago`);

export default function GasDelivery({ properties = [] }) {
    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <Head title="Gas Delivery Tracker" />

            <div>
                <h1 className="text-2xl font-bold text-gray-900">Gas Delivery Tracker</h1>
                <p className="text-sm text-gray-500">Bottled-gas usage and the last recorded gas delivery, per property.</p>
            </div>

            {properties.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
                    <Flame className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="font-semibold text-gray-900">No active properties</p>
                    <p className="text-sm text-gray-500">Add a property to track its gas deliveries.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-3xl border border-gray-50 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-4 py-4 font-semibold">Property</th>
                                <th className="px-4 py-4 font-semibold">Bottled gas</th>
                                <th className="px-4 py-4 font-semibold">Last gas delivery</th>
                                <th className="px-4 py-4 font-semibold">Days since</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {properties.map((p) => {
                                const since = p.uses_bottled_gas ? daysSince(p.last_gas_purchase) : null;
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900">{p.address}</div>
                                            <div className="text-xs text-gray-500">{p.code ? `#${p.code}` : ""}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {p.uses_bottled_gas ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                                    <Flame size={12} /> Yes
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">No</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {p.uses_bottled_gas ? (fmtDate(p.last_gas_purchase) ?? <span className="text-gray-400">Not recorded</span>) : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className={`px-4 py-3 ${since != null && since > 30 ? "font-semibold text-amber-600" : "text-gray-600"}`}>
                                            {p.uses_bottled_gas ? sinceLabel(since) : <span className="text-gray-300">—</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
