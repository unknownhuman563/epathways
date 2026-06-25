import { useState, useEffect } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import { ClipboardCheck, Plus, Pencil, Trash2, X, Search, CheckCircle2, XCircle } from "lucide-react";

const TYPE_LABEL = { mock: "Mock test", official_pte: "Official PTE", diy: "DIY", other: "Other" };
const inp = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—");

function Field({ label, error, children }) {
    return (
        <label className="block">
            <span className="block text-xs font-semibold text-gray-600 mb-1">{label}</span>
            {children}
            {error && <span className="block text-xs text-rose-600 mt-1">{error}</span>}
        </label>
    );
}

function PassPill({ passed }) {
    if (passed === null || passed === undefined) return <span className="text-xs text-gray-400">—</span>;
    return passed ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><CheckCircle2 size={14} /> Pass</span>
    ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600"><XCircle size={14} /> Fail</span>
    );
}

const EMPTY = {
    lead_id: "", assessment_type: "mock", assessment_date: "", english_class_id: "",
    overall_score: "", reading_score: "", writing_score: "", listening_score: "", speaking_score: "",
    passed: "", notes: "",
};

function AssessmentModal({ open, onClose, editing, types, learnerOptions, classOptions }) {
    const form = useForm(EMPTY);
    const { data, setData, errors, processing, reset, clearErrors } = form;

    useEffect(() => {
        if (open) {
            clearErrors();
            if (editing) {
                setData({
                    lead_id: editing.lead_id ?? "", assessment_type: editing.assessment_type ?? "mock",
                    assessment_date: editing.assessment_date ?? "", english_class_id: editing.english_class_id ?? "",
                    overall_score: editing.overall_score ?? "", reading_score: editing.reading_score ?? "",
                    writing_score: editing.writing_score ?? "", listening_score: editing.listening_score ?? "",
                    speaking_score: editing.speaking_score ?? "",
                    passed: editing.passed === null || editing.passed === undefined ? "" : editing.passed ? "1" : "0",
                    notes: editing.notes ?? "",
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
        // Normalize the tri-state pass/fail before sending.
        form.transform((d) => ({ ...d, passed: d.passed === "" ? null : d.passed === "1" }));
        const opts = { preserveScroll: true, onSuccess: onClose };
        if (editing) form.put(`/portal/english/assessments/${editing.id}`, opts);
        else form.post("/portal/english/assessments", opts);
    };

    const scoreMax = data.assessment_type === "other" ? 9 : 90;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit assessment" : "Record assessment"}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <form onSubmit={submit} className="p-6 space-y-4">
                    <Field label="Learner" error={errors.lead_id}>
                        <select value={data.lead_id} onChange={(e) => setData("lead_id", e.target.value)} className={inp}>
                            <option value="">Select a learner…</option>
                            {learnerOptions.map((l) => <option key={l.id} value={l.id}>{l.name} {l.email ? `· ${l.email}` : ""}</option>)}
                        </select>
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Type" error={errors.assessment_type}>
                            <select value={data.assessment_type} onChange={(e) => setData("assessment_type", e.target.value)} className={inp}>
                                {types.map((t) => <option key={t} value={t}>{TYPE_LABEL[t] || t}</option>)}
                            </select>
                        </Field>
                        <Field label="Date" error={errors.assessment_date}>
                            <input type="date" value={data.assessment_date || ""} onChange={(e) => setData("assessment_date", e.target.value)} className={inp} />
                        </Field>
                    </div>
                    <Field label="Class (optional)" error={errors.english_class_id}>
                        <select value={data.english_class_id} onChange={(e) => setData("english_class_id", e.target.value)} className={inp}>
                            <option value="">None</option>
                            {classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </Field>
                    <Field label={`Overall score (0–${scoreMax})`} error={errors.overall_score}>
                        <input type="number" step="0.5" min={0} max={scoreMax} value={data.overall_score} onChange={(e) => setData("overall_score", e.target.value)} className={inp} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        {["reading", "writing", "listening", "speaking"].map((k) => (
                            <Field key={k} label={`${k[0].toUpperCase()}${k.slice(1)}`} error={errors[`${k}_score`]}>
                                <input type="number" step="0.5" min={0} max={scoreMax} value={data[`${k}_score`]} onChange={(e) => setData(`${k}_score`, e.target.value)} className={inp} />
                            </Field>
                        ))}
                    </div>
                    <Field label="Result" error={errors.passed}>
                        <select value={data.passed} onChange={(e) => setData("passed", e.target.value)} className={inp}>
                            <option value="">Not graded</option>
                            <option value="1">Pass</option>
                            <option value="0">Fail</option>
                        </select>
                    </Field>
                    <Field label="Notes" error={errors.notes}>
                        <textarea rows={2} value={data.notes} onChange={(e) => setData("notes", e.target.value)} className={inp} />
                    </Field>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                        <button type="submit" disabled={processing} className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50">
                            {editing ? "Save changes" : "Record"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Assessments({ assessments = [], stats = {}, types = [], learnerOptions = [], classOptions = [], filters = {} }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState(filters.search ?? "");

    const applyFilters = (next = {}) => {
        const params = {
            type: next.type !== undefined ? next.type : filters.type ?? "",
            date_from: next.date_from !== undefined ? next.date_from : filters.date_from ?? "",
            date_to: next.date_to !== undefined ? next.date_to : filters.date_to ?? "",
            search: next.search !== undefined ? next.search : search,
        };
        Object.keys(params).forEach((k) => !params[k] && delete params[k]);
        router.get("/portal/english/assessments", params, { preserveState: true, preserveScroll: true, replace: true });
    };

    const remove = (a) => {
        if (!window.confirm(`Delete the ${TYPE_LABEL[a.assessment_type] || a.assessment_type} record for ${a.learner}?`)) return;
        router.delete(`/portal/english/assessments/${a.id}`, { preserveScroll: true });
    };

    const cards = [
        { label: "This month", value: stats.this_month ?? 0 },
        { label: "Average score", value: stats.average_score ?? "—" },
        { label: "Pass rate", value: stats.pass_rate === null || stats.pass_rate === undefined ? "—" : `${stats.pass_rate}%` },
        { label: "Total recorded", value: stats.total ?? 0 },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="English Assessments" />

            <header className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardCheck className="w-6 h-6 text-emerald-600" /> Assessments
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Mock and official test scores per learner.</p>
                </div>
                <button onClick={() => { setEditing(null); setModalOpen(true); }} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 flex items-center gap-2">
                    <Plus size={15} /> Record assessment
                </button>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c, i) => (
                    <div key={i} className="p-5 rounded-3xl bg-white border border-gray-50 shadow-sm">
                        <p className="text-sm font-medium text-gray-500">{c.label}</p>
                        <p className="text-3xl font-bold tracking-tight mt-1">{c.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <form onSubmit={(e) => { e.preventDefault(); applyFilters({ search }); }} className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search learner…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                </form>
                <select value={filters.type ?? ""} onChange={(e) => applyFilters({ type: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">All types</option>
                    {types.map((t) => <option key={t} value={t}>{TYPE_LABEL[t] || t}</option>)}
                </select>
                <input type="date" value={filters.date_from ?? ""} onChange={(e) => applyFilters({ date_from: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500" title="From" />
                <input type="date" value={filters.date_to ?? ""} onChange={(e) => applyFilters({ date_to: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500" title="To" />
            </div>

            <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Learner</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Overall</th>
                                <th className="px-6 py-3">Result</th>
                                <th className="px-6 py-3">By</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {assessments.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-400">No assessments recorded yet.</td></tr>
                            ) : (
                                assessments.map((a) => (
                                    <tr key={a.id} className="hover:bg-gray-50/40">
                                        <td className="px-6 py-3"><div className="font-semibold text-gray-900 text-sm">{a.learner}</div><div className="text-xs text-gray-400">{a.email || "—"}</div></td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{TYPE_LABEL[a.assessment_type] || a.assessment_type}</td>
                                        <td className="px-6 py-3 text-sm text-gray-500">{fmtDate(a.assessment_date)}</td>
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{a.overall_score ?? "—"}</td>
                                        <td className="px-6 py-3"><PassPill passed={a.passed} /></td>
                                        <td className="px-6 py-3 text-sm text-gray-500">{a.administered_by || "—"}</td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => { setEditing(a); setModalOpen(true); }} className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg" title="Edit"><Pencil size={15} /></button>
                                                <button onClick={() => remove(a)} className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete"><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AssessmentModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} types={types} learnerOptions={learnerOptions} classOptions={classOptions} />
        </div>
    );
}
