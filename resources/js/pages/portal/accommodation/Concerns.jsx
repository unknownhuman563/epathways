import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import { MessageSquareWarning } from "lucide-react";

const STATUS_LABEL = { new: "New", investigating: "Investigating", checked: "Checked", fixed: "Fixed" };
const STATUS_DOT = { new: "bg-blue-500", investigating: "bg-amber-500", checked: "bg-indigo-500", fixed: "bg-emerald-500" };

const fmtDateTime = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
};

const SELECT = "rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium focus:border-[#1F5A8B] focus:ring-1 focus:ring-[#1F5A8B]";

export default function Concerns({ concerns = [], statuses = [], team = [] }) {
    // Local status/assignee per concern for optimistic inline editing.
    const [rows, setRows] = useState(() => {
        const m = {};
        for (const c of concerns) m[c.id] = { status: c.status, assignee: c.assigned_to_user_id ?? "" };
        return m;
    });

    const save = (id, field, value, payload) => {
        const prev = rows[id];
        setRows((r) => ({ ...r, [id]: { ...r[id], [field]: value } }));
        router.patch(`/portal/accommodation/concerns/${id}`, payload, {
            preserveScroll: true,
            preserveState: true,
            onError: () => {
                setRows((r) => ({ ...r, [id]: prev }));
                toast.error("Could not save");
            },
        });
    };

    return (
        <div className="mx-auto max-w-7xl space-y-5">
            <Head title="Concerns" />

            <div>
                <h1 className="text-2xl font-bold text-gray-900">Concerns</h1>
                <p className="text-sm text-gray-500">Tenant concerns, matched to their property — set a status and assign who's looking into each one.</p>
            </div>

            {concerns.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
                    <MessageSquareWarning className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="font-semibold text-gray-900">No concerns yet</p>
                    <p className="text-sm text-gray-500">Submissions from the public concern form will appear here.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-3xl border border-gray-50 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-4 py-4 font-semibold">Property</th>
                                <th className="px-4 py-4 font-semibold">Tenant</th>
                                <th className="px-4 py-4 font-semibold">Email</th>
                                <th className="px-4 py-4 font-semibold">Concern</th>
                                <th className="px-4 py-4 font-semibold">Status</th>
                                <th className="px-4 py-4 font-semibold">Assigned to</th>
                                <th className="px-4 py-4 font-semibold">Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {concerns.map((c) => {
                                const row = rows[c.id] || { status: c.status, assignee: "" };
                                return (
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
                                            <p className="max-w-xs whitespace-pre-wrap break-words text-gray-700">{c.message}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[row.status] ?? "bg-gray-300"}`} />
                                                <select
                                                    className={SELECT}
                                                    value={row.status}
                                                    onChange={(e) => save(c.id, "status", e.target.value, { status: e.target.value })}
                                                >
                                                    {statuses.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>)}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                className={SELECT}
                                                value={row.assignee}
                                                onChange={(e) => save(c.id, "assignee", e.target.value, { assigned_to_user_id: e.target.value === "" ? null : e.target.value })}
                                            >
                                                <option value="">Unassigned</option>
                                                {team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">{fmtDateTime(c.created_at)}</td>
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
