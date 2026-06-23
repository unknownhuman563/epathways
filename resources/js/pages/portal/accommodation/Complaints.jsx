import { Head } from "@inertiajs/react";
import { MessageSquareWarning } from "lucide-react";

const fmtDateTime = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
};

export default function Complaints({ complaints = [] }) {
    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <Head title="Complaints" />

            <div>
                <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
                <p className="text-sm text-gray-500">Tenant complaints, matched to their property by email.</p>
            </div>

            {complaints.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
                    <MessageSquareWarning className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="font-semibold text-gray-900">No complaints yet</p>
                    <p className="text-sm text-gray-500">Submissions from the public complaint form will appear here.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-3xl border border-gray-50 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-4 py-4 font-semibold">Property</th>
                                <th className="px-4 py-4 font-semibold">Tenant</th>
                                <th className="px-4 py-4 font-semibold">Email</th>
                                <th className="px-4 py-4 font-semibold">Complaint</th>
                                <th className="px-4 py-4 font-semibold">Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {complaints.map((c) => (
                                <tr key={c.id} className="align-top hover:bg-gray-50/50">
                                    <td className="px-4 py-3">
                                        {c.property_address ? (
                                            <>
                                                <div className="text-gray-900">{c.property_address}</div>
                                                <div className="text-xs text-gray-500">{c.property_code ? `#${c.property_code}` : ""}</div>
                                            </>
                                        ) : (
                                            <span className="text-xs italic text-amber-600">Not matched</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{c.tenant_name || c.name}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <a href={`mailto:${c.email}`} className="hover:text-[#1F5A8B] hover:underline">{c.email}</a>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="max-w-md whitespace-pre-wrap break-words text-gray-700">{c.message}</p>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">{fmtDateTime(c.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
