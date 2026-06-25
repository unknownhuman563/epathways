import { Head } from "@inertiajs/react";
import { Building2 } from "lucide-react";

const dash = (v) => (v == null || v === "" ? "—" : v);

export default function PaymentSchedule({ properties = [] }) {
    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <Head title="PM Payment Schedule" />

            <div>
                <h1 className="text-2xl font-bold text-gray-900">PM Payment Schedule</h1>
                <p className="text-sm text-gray-500">Property managers and their rent payout schedule, per property.</p>
            </div>

            {properties.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
                    <Building2 className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="font-semibold text-gray-900">No active properties</p>
                    <p className="text-sm text-gray-500">Add a property to manage its payment schedule.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-3xl border border-gray-50 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-4 py-4 font-semibold">Property</th>
                                <th className="px-4 py-4 font-semibold">Property manager</th>
                                <th className="px-4 py-4 font-semibold">Phone</th>
                                <th className="px-4 py-4 font-semibold">Email</th>
                                <th className="px-4 py-4 font-semibold">Payment schedule</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {properties.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3">
                                        <div className="text-gray-900">{p.address}</div>
                                        <div className="text-xs text-gray-500">{p.code ? `#${p.code}` : ""}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{dash(p.manager_name)}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {p.manager_phone ? <a href={`tel:${p.manager_phone}`} className="hover:text-[#1F5A8B]">{p.manager_phone}</a> : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {p.manager_email ? <a href={`mailto:${p.manager_email}`} className="hover:text-[#1F5A8B] hover:underline">{p.manager_email}</a> : "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        {p.payment_schedule ? (
                                            <span className="rounded-full bg-[#1F5A8B]/10 px-3 py-1 text-xs font-semibold text-[#1F5A8B]">{p.payment_schedule}</span>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
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
