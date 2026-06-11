import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
    School as SchoolIcon, Plus, Pencil, Trash2, Globe, MapPin, Search, X, Check,
} from "lucide-react";

// Schools catalog — admin CRUD. Mirrors the Programs page in shape:
// header tile + searchable list + a single Add/Edit modal.

export default function SchoolsPage({ schools = [] }) {
    const [q, setQ]               = useState("");
    const [editing, setEditing]   = useState(null); // null = closed; {} = new; object = edit

    const filtered = schools.filter((s) => {
        if (! q.trim()) return true;
        const needle = q.trim().toLowerCase();
        return [s.name, s.country, s.city, s.website]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(needle));
    });

    const remove = (school) => {
        if (! window.confirm(`Remove "${school.name}"? Students already linked stay; just the FK clears.`)) return;
        router.delete(`/admin/schools/${school.id}`, { preserveScroll: true });
    };

    return (
        <div className="space-y-4 max-w-[1200px] mx-auto">
            <Head title="Schools — Admin" />

            {/* Header */}
            <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Schools</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {schools.length} institution{schools.length === 1 ? "" : "s"} in the catalog
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setEditing({})}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                >
                    <Plus size={15} /> New school
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-2">
                <Search size={14} className="text-gray-400" />
                <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by name, country, or city…"
                    className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
                />
                {q && (
                    <button
                        type="button"
                        onClick={() => setQ("")}
                        className="text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-700"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            <th className="px-4 py-3">School</th>
                            <th className="px-4 py-3">Country / city</th>
                            <th className="px-4 py-3">Website</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-[12px] text-gray-400">
                                    {schools.length === 0
                                        ? "No schools yet — click \"New school\" to add the first one."
                                        : "No schools match your search."}
                                </td>
                            </tr>
                        ) : filtered.map((s) => (
                            <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                                            <SchoolIcon size={13} />
                                        </span>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-gray-900 truncate">{s.name}</div>
                                            {s.description && (
                                                <div className="text-[11px] text-gray-500 truncate max-w-[280px]">{s.description}</div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                    {(s.country || s.city) ? (
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin size={11} className="text-gray-400" />
                                            {[s.city, s.country].filter(Boolean).join(", ")}
                                        </span>
                                    ) : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3">
                                    {s.website ? (
                                        <a href={s.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 font-medium truncate max-w-[200px]">
                                            <Globe size={11} />
                                            <span className="truncate">{s.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                                        </a>
                                    ) : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                        s.status === "active"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-gray-100 text-gray-600 border-gray-200"
                                    }`}>
                                        {s.status || "active"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setEditing(s)}
                                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                                            title="Edit"
                                        >
                                            <Pencil size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => remove(s)}
                                            className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600"
                                            title="Remove"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editing && (
                <SchoolFormModal
                    initial={editing.id ? editing : null}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}

function SchoolFormModal({ initial, onClose }) {
    const [form, setForm] = useState({
        name:        initial?.name        ?? "",
        country:     initial?.country     ?? "",
        city:        initial?.city        ?? "",
        website:     initial?.website     ?? "",
        description: initial?.description ?? "",
        status:      initial?.status      ?? "active",
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        const url = initial ? `/admin/schools/${initial.id}` : "/admin/schools";
        router.post(url, form, {
            preserveScroll: true,
            onSuccess: () => onClose?.(),
            onError: (errs) => setErrors(errs || {}),
            onFinish: () => setSaving(false),
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-6"
            onClick={(e) => { if (e.target === e.currentTarget && ! saving) onClose?.(); }}
        >
            <div
                className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900">{initial ? "Edit school" : "New school"}</h2>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500" disabled={saving}>
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                    <ModalField label="Name" required error={errors.name}>
                        <input type="text" required value={form.name} onChange={set("name")} maxLength={191} className={inputClass} placeholder="e.g. Auckland Institute of Studies" />
                    </ModalField>

                    <div className="grid grid-cols-2 gap-3">
                        <ModalField label="Country" error={errors.country}>
                            <input type="text" value={form.country} onChange={set("country")} maxLength={120} className={inputClass} placeholder="New Zealand" />
                        </ModalField>
                        <ModalField label="City" error={errors.city}>
                            <input type="text" value={form.city} onChange={set("city")} maxLength={120} className={inputClass} placeholder="Auckland" />
                        </ModalField>
                    </div>

                    <ModalField label="Website" error={errors.website}>
                        <input type="url" value={form.website} onChange={set("website")} maxLength={512} className={inputClass} placeholder="https://…" />
                    </ModalField>

                    <ModalField label="Description" error={errors.description}>
                        <textarea value={form.description} onChange={set("description")} rows={3} maxLength={5000} className={`${inputClass} resize-y`} placeholder="Short note on the institution…" />
                    </ModalField>

                    <ModalField label="Status">
                        <div className="inline-flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                            {[["active", "Active"], ["inactive", "Inactive"]].map(([v, l]) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, status: v }))}
                                    className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                        form.status === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                                    }`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </ModalField>
                </form>

                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-40">
                        Cancel
                    </button>
                    <button type="button" onClick={submit} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-40">
                        <Check size={12} />
                        {saving ? "Saving…" : initial ? "Save changes" : "Add school"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const inputClass = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:border-gray-400 outline-none transition-colors";

function ModalField({ label, required, error, children }) {
    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-[10.5px] text-red-600">{error}</p>}
        </div>
    );
}
