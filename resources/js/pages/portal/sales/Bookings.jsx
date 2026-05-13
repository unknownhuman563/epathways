import { useState, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import { Search } from "lucide-react";

const BOOKING_STYLES = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Confirmed: "bg-blue-100 text-blue-700 border-blue-200",
    Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Cancelled: "bg-red-100 text-red-700 border-red-200",
};
const bookingClass = (s) => BOOKING_STYLES[s] || "bg-gray-100 text-gray-700 border-gray-200";

function BookingRow({ b, statuses }) {
    const [form, setForm] = useState({
        appointment_date: b.appointment_date || "",
        appointment_time: b.appointment_time || "",
        consultant_name: b.consultant_name || "",
        status: b.status || "Pending",
    });
    const [saving, setSaving] = useState(false);

    const dirty =
        form.appointment_date !== (b.appointment_date || "") ||
        form.appointment_time !== (b.appointment_time || "") ||
        form.consultant_name !== (b.consultant_name || "") ||
        form.status !== (b.status || "Pending");

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const save = () => {
        setSaving(true);
        router.post(`/portal/sales/bookings/${b.id}`, form, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    const input = "text-xs rounded-lg border border-gray-200 bg-white py-1.5 px-2 outline-none focus:ring-2 focus:ring-blue-500";

    return (
        <tr className="align-top hover:bg-gray-50/40">
            <td className="px-6 py-3">
                <div className="font-semibold text-gray-900 text-sm">{b.name}</div>
                <div className="text-xs text-gray-400">{b.email || "—"}{b.phone ? ` · ${b.phone}` : ""}</div>
                {b.lead_ref && <div className="text-[11px] text-gray-300 font-mono">{b.lead_ref}</div>}
            </td>
            <td className="px-6 py-3 text-sm text-gray-600">
                {b.service_type || "—"}
                {b.platform && <div className="text-xs text-gray-400">{b.platform}</div>}
            </td>
            <td className="px-6 py-3">
                <div className="flex flex-wrap items-center gap-2">
                    <input type="date" value={form.appointment_date} onChange={(e) => set("appointment_date", e.target.value)} className={input} />
                    <input type="text" value={form.appointment_time} onChange={(e) => set("appointment_time", e.target.value)} placeholder="e.g. 2:00 PM" className={`${input} w-24`} />
                    <input type="text" value={form.consultant_name} onChange={(e) => set("consultant_name", e.target.value)} placeholder="Consultant" className={`${input} w-28`} />
                </div>
            </td>
            <td className="px-6 py-3">
                <div className="flex flex-col gap-1.5">
                    <span className={`inline-flex w-fit px-2.5 py-1 rounded-full text-xs font-bold border ${bookingClass(b.status)}`}>{b.status}</span>
                    <select value={form.status} onChange={(e) => set("status", e.target.value)} className="text-xs rounded-lg border border-gray-200 bg-white py-1.5 pl-2 pr-7 outline-none hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </td>
            <td className="px-6 py-3 text-right pr-6">
                <button
                    onClick={save}
                    disabled={!dirty || saving}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {saving ? "Saving…" : "Save"}
                </button>
            </td>
        </tr>
    );
}

export default function SalesBookings({ bookings = [], statuses = [] }) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return bookings.filter((b) => {
            const hay = `${b.name || ""} ${b.email || ""} ${b.service_type || ""} ${b.consultant_name || ""} ${b.lead_ref || ""}`.toLowerCase();
            const matchSearch = !q || hay.includes(q);
            const matchStatus = statusFilter === "All" || b.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [bookings, search, statusFilter]);

    return (
        <div className="space-y-5 max-w-7xl mx-auto">
            <Head title="Bookings — Sales Portal" />

            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Consultation Bookings</h1>
                <p className="text-sm text-gray-500 mt-1">Schedule appointments and update booking status inline.</p>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search client, email or service…"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {["All", ...statuses].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${statusFilter === s ? "bg-gray-900 text-white border-gray-900 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Client</th>
                                <th className="px-6 py-3">Service</th>
                                <th className="px-6 py-3">Schedule &amp; consultant</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right pr-6">Save</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm">No bookings match your filters.</td></tr>
                            ) : filtered.map((b) => <BookingRow key={b.id} b={b} statuses={statuses} />)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
