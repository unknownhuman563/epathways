import { useState, useMemo, useEffect } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import { Languages, Plus, Pencil, Trash2, X, UserPlus, Search } from "lucide-react";

const STATUS_LABEL = {
    scheduled: "Scheduled",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
};
const STATUS_STYLE = {
    scheduled: "bg-blue-50 text-blue-700 border-blue-100",
    in_progress: "bg-amber-50 text-amber-700 border-amber-100",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status] || STATUS_STYLE.scheduled}`}>
            {STATUS_LABEL[status] || status}
        </span>
    );
}

const EMPTY = { name: "", description: "", instructor_id: "", schedule_text: "", location: "", capacity: 0, status: "scheduled", starts_at: "", ends_at: "" };
const inp = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";

function ClassFormModal({ open, onClose, editing, statuses, instructorOptions }) {
    const form = useForm(EMPTY);
    const { data, setData, errors, processing, reset, clearErrors } = form;

    useEffect(() => {
        if (open) {
            clearErrors();
            if (editing) {
                setData({
                    name: editing.name ?? "", description: editing.description ?? "",
                    instructor_id: editing.instructor_id ?? "", schedule_text: editing.schedule_text ?? "",
                    location: editing.location ?? "", capacity: editing.capacity ?? 0,
                    status: editing.status ?? "scheduled", starts_at: editing.starts_at ?? "", ends_at: editing.ends_at ?? "",
                });
            } else {
                reset();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editing]);

    if (!open) return null;

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: onClose };
        if (editing) form.put(`/portal/english/classes/${editing.id}`, opts);
        else form.post("/portal/english/classes", opts);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit class" : "New class"}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <form onSubmit={submit} className="p-6 space-y-4">
                    <Field label="Name" error={errors.name}>
                        <input value={data.name} onChange={(e) => setData("name", e.target.value)} className={inp} />
                    </Field>
                    <Field label="Description" error={errors.description}>
                        <textarea value={data.description} onChange={(e) => setData("description", e.target.value)} rows={2} className={inp} />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Instructor" error={errors.instructor_id}>
                            <select value={data.instructor_id} onChange={(e) => setData("instructor_id", e.target.value)} className={inp}>
                                <option value="">Unassigned</option>
                                {instructorOptions.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                            </select>
                        </Field>
                        <Field label="Status" error={errors.status}>
                            <select value={data.status} onChange={(e) => setData("status", e.target.value)} className={inp}>
                                {statuses.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>)}
                            </select>
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Schedule" error={errors.schedule_text}>
                            <input value={data.schedule_text} onChange={(e) => setData("schedule_text", e.target.value)} placeholder="Mon/Wed 6-8pm" className={inp} />
                        </Field>
                        <Field label="Capacity" error={errors.capacity}>
                            <input type="number" min={0} value={data.capacity} onChange={(e) => setData("capacity", e.target.value)} className={inp} />
                        </Field>
                    </div>
                    <Field label="Location" error={errors.location}>
                        <input value={data.location} onChange={(e) => setData("location", e.target.value)} className={inp} />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Starts" error={errors.starts_at}>
                            <input type="date" value={data.starts_at || ""} onChange={(e) => setData("starts_at", e.target.value)} className={inp} />
                        </Field>
                        <Field label="Ends" error={errors.ends_at}>
                            <input type="date" value={data.ends_at || ""} onChange={(e) => setData("ends_at", e.target.value)} className={inp} />
                        </Field>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                        <button type="submit" disabled={processing} className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50">
                            {editing ? "Save changes" : "Create class"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DetailModal({ cls, onClose, learnerOptions }) {
    const [leadId, setLeadId] = useState("");
    const [q, setQ] = useState("");
    const enrolledIds = useMemo(() => new Set((cls?.enrollments ?? []).map((e) => e.lead_id)), [cls]);
    const available = useMemo(
        () => learnerOptions.filter((l) => !enrolledIds.has(l.id) && (`${l.name} ${l.email}`).toLowerCase().includes(q.toLowerCase())),
        [learnerOptions, enrolledIds, q]
    );

    if (!cls) return null;

    const enroll = () => {
        if (!leadId) return;
        router.post(`/portal/english/classes/${cls.id}/enroll`, { lead_id: leadId }, {
            preserveScroll: true,
            onSuccess: () => { setLeadId(""); setQ(""); },
        });
    };
    const withdraw = (enrollmentId) =>
        router.delete(`/portal/english/classes/${cls.id}/enroll/${enrollmentId}`, { preserveScroll: true });

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{cls.name}</h2>
                        <p className="text-xs text-gray-500">{cls.schedule_text || "No schedule"} · {cls.instructor || "Unassigned"}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-5">
                    <div className="flex items-center gap-3 text-sm">
                        <StatusBadge status={cls.status} />
                        <span className="text-gray-500">{cls.enrolled_count} / {cls.capacity || "∞"} enrolled</span>
                    </div>
                    {cls.description && <p className="text-sm text-gray-600">{cls.description}</p>}

                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Enrolled learners</h3>
                        <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
                            {(cls.enrollments ?? []).length === 0 ? (
                                <p className="px-4 py-6 text-center text-sm text-gray-400">No learners enrolled yet.</p>
                            ) : (
                                cls.enrollments.map((e) => (
                                    <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{e.name}</div>
                                            <div className="text-xs text-gray-400">{e.email || "—"}</div>
                                        </div>
                                        <button onClick={() => withdraw(e.id)} className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1">
                                            <Trash2 size={13} /> Remove
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><UserPlus size={15} /> Enroll a learner</h3>
                        <div className="relative mb-2">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter learners…" className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div className="flex gap-2">
                            <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500">
                                <option value="">Select a learner…</option>
                                {available.map((l) => <option key={l.id} value={l.id}>{l.name} {l.email ? `· ${l.email}` : ""}</option>)}
                            </select>
                            <button onClick={enroll} disabled={!leadId} className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">Enroll</button>
                        </div>
                        {available.length === 0 && <p className="text-xs text-gray-400 mt-2">No more English learners available to enroll.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, error, children }) {
    return (
        <label className="block">
            <span className="block text-xs font-semibold text-gray-600 mb-1">{label}</span>
            {children}
            {error && <span className="block text-xs text-rose-600 mt-1">{error}</span>}
        </label>
    );
}

export default function Classes({ classes = [], statuses = [], instructorOptions = [], learnerOptions = [], filters = {}, focusClassId = null }) {
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [detailId, setDetailId] = useState(focusClassId);

    const detail = useMemo(() => classes.find((c) => c.id === detailId) || null, [classes, detailId]);

    const setStatusFilter = (status) => {
        const params = status ? { status } : {};
        router.get("/portal/english/classes", params, { preserveState: true, preserveScroll: true, replace: true });
    };

    const remove = (cls) => {
        if (!window.confirm(`Remove class "${cls.name}"?`)) return;
        router.delete(`/portal/english/classes/${cls.id}`, { preserveScroll: true });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="English Classes" />

            <header className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Languages className="w-6 h-6 text-emerald-600" /> Classes
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Group sessions with enrolled English learners.</p>
                </div>
                <button onClick={() => { setEditing(null); setFormOpen(true); }} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 flex items-center gap-2">
                    <Plus size={15} /> New class
                </button>
            </header>

            <div className="flex flex-wrap gap-2">
                <button onClick={() => setStatusFilter("")} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${!filters.status ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}>All</button>
                {statuses.map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filters.status === s ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                        {STATUS_LABEL[s] || s}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Class</th>
                                <th className="px-6 py-3">Instructor</th>
                                <th className="px-6 py-3">Schedule</th>
                                <th className="px-6 py-3">Enrolled</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {classes.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-400">No classes yet. Create one to get started.</td></tr>
                            ) : (
                                classes.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/40 cursor-pointer" onClick={() => setDetailId(c.id)}>
                                        <td className="px-6 py-3"><div className="font-semibold text-gray-900 text-sm">{c.name}</div><div className="text-xs text-gray-400">{c.location || "—"}</div></td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{c.instructor || "Unassigned"}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{c.schedule_text || "—"}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{c.enrolled_count} / {c.capacity || "∞"}</td>
                                        <td className="px-6 py-3"><StatusBadge status={c.status} /></td>
                                        <td className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => { setEditing(c); setFormOpen(true); }} className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg" title="Edit"><Pencil size={15} /></button>
                                                <button onClick={() => remove(c)} className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete"><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ClassFormModal open={formOpen} onClose={() => setFormOpen(false)} editing={editing} statuses={statuses} instructorOptions={instructorOptions} />
            <DetailModal cls={detail} onClose={() => setDetailId(null)} learnerOptions={learnerOptions} />
        </div>
    );
}
