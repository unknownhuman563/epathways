import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { ClipboardList, Eye } from "lucide-react";

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

export default function Applications({ submissions = [], statuses = [] }) {
    const [filterStatus, setFilterStatus] = useState("all");

    const visible =
        filterStatus === "all"
            ? submissions
            : submissions.filter((s) => s.status === filterStatus);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="Applications" />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
                    <p className="text-sm text-gray-500">
                        Expression of Interest submissions from the public form.
                    </p>
                </div>

                {/* Status filter */}
                <div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                        <option value="all">All statuses</option>
                        {statuses.map((s) => (
                            <option key={s} value={s} className="capitalize">
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Empty state */}
            {visible.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
                    <ClipboardList className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="font-semibold text-gray-900">No applications yet</p>
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
                            {visible.map((sub) => (
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
        </div>
    );
}
