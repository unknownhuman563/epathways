import { useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ClipboardList, Eye, Search, LayoutGrid, Table2 } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import OnboardingKanban from "@/components/onboarding/OnboardingKanban";
import { STATUS_STYLES, statusLabel, tempBadge, daysStyle, initials } from "@/lib/onboardingMeta";

const fmtDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

export default function Applications({ view = "table", submissions = {}, board = [], options = {}, filters = {} }) {
    const rows = submissions.data ?? [];
    const [search, setSearch] = useState(filters.search ?? "");
    const status = filters.status ?? "all";
    const formType = filters.form_type ?? "all";
    const temperature = filters.lead_temperature ?? "all";
    const sort = filters.sort ?? "latest";
    const activePipeline = filters.active_pipeline !== "0"; // default ON
    const assignedMe = filters.assigned_to === "me";
    const stalling = Boolean(filters.days_at_stage_min);

    const apply = (next = {}) => {
        const merged = {
            view, search, status, form_type: formType, lead_temperature: temperature, sort,
            active_pipeline: activePipeline ? "1" : "0",
            assigned_to: assignedMe ? "me" : undefined,
            days_at_stage_min: stalling ? "7" : undefined,
            ...next,
        };
        const q = {};
        if (merged.view && merged.view !== "table") q.view = merged.view;
        if (merged.search) q.search = merged.search;
        if (merged.status !== "all") q.status = merged.status;
        if (merged.form_type !== "all") q.form_type = merged.form_type;
        if (merged.lead_temperature !== "all") q.lead_temperature = merged.lead_temperature;
        if (merged.sort !== "latest") q.sort = merged.sort;
        if (merged.active_pipeline === "0") q.active_pipeline = "0";
        if (merged.assigned_to === "me") q.assigned_to = "me";
        if (merged.days_at_stage_min) q.days_at_stage_min = merged.days_at_stage_min;
        router.get("/portal/accommodation/onboarding", q, { preserveScroll: true, preserveState: true, replace: true });
    };

    useEffect(() => {
        const t = setTimeout(() => { if ((filters.search ?? "") !== search) apply({ search }); }, 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const select = "rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1F5A8B]";
    const chip = (on) => `rounded-xl border px-3 py-2 text-sm font-medium shadow-sm ${on ? "border-[#1F5A8B] bg-[#1F5A8B]/10 text-[#1F5A8B]" : "border-gray-200 bg-white text-gray-600"}`;
    const tabBtn = (on) => `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${on ? "bg-white text-[#1F5A8B] shadow-sm" : "text-gray-500"}`;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="Onboarding" />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Onboarding</h1>
                    <p className="text-sm text-gray-500">Applicant pipeline — from Expression of Interest through to move-in.</p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-xl bg-gray-100 p-1">
                    <button onClick={() => apply({ view: "table" })} className={tabBtn(view === "table")}><Table2 size={15} /> Table</button>
                    <button onClick={() => apply({ view: "pipeline" })} className={tabBtn(view === "pipeline")}><LayoutGrid size={15} /> Pipeline</button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or mobile…" className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1F5A8B]" />
                </div>
                {view === "table" && (
                    <select value={status} onChange={(e) => apply({ status: e.target.value })} className={select}>
                        <option value="all">All stages</option>
                        {(options.statuses ?? []).map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                )}
                <select value={sort} onChange={(e) => apply({ sort: e.target.value })} className={select}>
                    <option value="latest">Sort: Newest</option>
                    <option value="days_at_stage">Sort: Days at stage</option>
                    <option value="stage_order">Sort: Stage order</option>
                </select>
                <button onClick={() => apply({ lead_temperature: temperature === "hot" ? "cold" : temperature === "cold" ? "all" : "hot" })} className={chip(temperature !== "all")}>
                    {temperature === "all" ? "Hot / Cold" : temperature === "hot" ? "🔥 Hot" : "❄ Cold"}
                </button>
                <button onClick={() => apply({ active_pipeline: activePipeline ? "0" : "1" })} className={chip(activePipeline)}>Active pipeline</button>
                <button onClick={() => apply({ assigned_to: assignedMe ? undefined : "me" })} className={chip(assignedMe)}>Assigned to me</button>
                <button onClick={() => apply({ days_at_stage_min: stalling ? undefined : "7" })} className={chip(stalling)}>Stalling 7d+</button>
            </div>

            {/* Pipeline (kanban) view */}
            {view === "pipeline" ? (
                board.length === 0 ? (
                    <EmptyState />
                ) : (
                    <OnboardingKanban board={board} options={options} />
                )
            ) : rows.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="overflow-x-auto rounded-3xl border border-gray-50 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-5 py-4 font-semibold">Applicant</th>
                                <th className="px-5 py-4 font-semibold">Type</th>
                                <th className="px-5 py-4 font-semibold">Property</th>
                                <th className="px-5 py-4 font-semibold">Assigned</th>
                                <th className="px-5 py-4 font-semibold">Days</th>
                                <th className="px-5 py-4 font-semibold">Stage</th>
                                <th className="px-5 py-4 font-semibold">Submitted</th>
                                <th className="px-5 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rows.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50/50">
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-gray-900">{sub.full_legal_name}</p>
                                        {sub.preferred_name && <p className="text-xs text-gray-400">{sub.preferred_name}</p>}
                                    </td>
                                    <td className="px-5 py-4 text-xs text-gray-500">{tempBadge(sub.lead_temperature || sub.form_type) || "—"}</td>
                                    <td className="px-5 py-4 text-gray-700">
                                        {sub.property?.code ? `#${sub.property.code}` : (sub.property?.address || sub.property_interested || "—")}
                                    </td>
                                    <td className="px-5 py-4">
                                        {sub.assigned_to ? (
                                            <span className="inline-flex items-center gap-2 text-gray-700">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1F5A8B] text-[9px] font-bold text-white">{initials(sub.assigned_to.name)}</span>
                                                <span className="text-xs">{sub.assigned_to.name}</span>
                                            </span>
                                        ) : <span className="text-xs text-gray-400">Unassigned</span>}
                                    </td>
                                    <td className={`px-5 py-4 ${daysStyle(sub.days_at_current_stage)}`}>{sub.days_at_current_stage ?? 0}d</td>
                                    <td className="px-5 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[sub.status] ?? "bg-gray-100 text-gray-500"}`}>{statusLabel(sub.status)}</span>
                                    </td>
                                    <td className="px-5 py-4 text-gray-500">{fmtDate(sub.created_at)}</td>
                                    <td className="px-5 py-4 text-right">
                                        <Link href={`/portal/accommodation/applications/${sub.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-[#1F5A8B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#184A73]">
                                            <Eye size={14} /> View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === "table" && <Pagination links={submissions.links} />}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
            <ClipboardList className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="font-semibold text-gray-900">No applications in onboarding yet</p>
            <p className="text-sm text-gray-500">Submissions from the public Expression of Interest form will appear here.</p>
        </div>
    );
}
