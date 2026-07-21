import React, { useState, useMemo, useEffect } from "react";
import { Head, router, Link } from "@inertiajs/react";
import { toast } from "sonner";
import {
    ReceiptText, Search, Plus, X, Download, Eye, Trash2,
    FileText, Loader2, AlertTriangle,
} from "lucide-react";

const rowInitials = (name = "") =>
    (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("") || "?";

const fmtSize = (bytes) => {
    if (! bytes) return "—";
    return bytes < 1024 * 1024
        ? `${Math.max(1, Math.round(bytes / 1024))} KB`
        : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const fmtDate = (iso) => {
    if (! iso) return "—";
    return new Date(iso).toLocaleString(undefined, {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

const money = (n) => (n === null || n === undefined || n === "" ? "—" : `$${Number(n).toFixed(2)}`);

/**
 * Invoice workspace. "New" opens a modal with the invoice settings on the
 * left (case, number, dates, fee lines) and a live preview of the tax
 * invoice on the right. Amounts default from the case's visa fees.
 */
export default function Invoice({ cases = [], generated = [], nextNumber = null }) {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
            <Head title="Invoice — Immigration" />

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center">
                        <ReceiptText size={18} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Invoice</h1>
                        <p className="text-sm text-gray-500">Generate a tax invoice for a case.</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors flex items-center gap-2 flex-shrink-0"
                >
                    <Plus size={14} strokeWidth={2.5} /> New
                </button>
            </div>

            {/* Generated invoices — one row per case */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                    <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500">Generated invoices</h2>
                </div>

                {generated.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-gray-400">
                        No invoices generated yet. Click <span className="font-semibold text-gray-600">New</span> to start.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-gray-100 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3">Profile</th>
                                    <th className="px-3 py-3">Name</th>
                                    <th className="px-3 py-3">Contacts</th>
                                    <th className="px-3 py-3">Invoices</th>
                                    <th className="px-3 py-3">Created</th>
                                    <th className="px-3 py-3 text-right pr-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {generated.map((c) => (
                                    <tr key={c.case_id} className="hover:bg-gray-50/60 transition-colors align-top">
                                        <td className="px-4 py-3">
                                            <Link href={`/portal/immigration/cases/${c.case_id}/profile`} className="inline-block">
                                                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 text-gray-500 text-[11px] font-bold ring-1 ring-gray-200">
                                                    {c.avatar_url
                                                        ? <img src={c.avatar_url} alt={c.case_name} className="w-full h-full object-cover" />
                                                        : rowInitials(c.case_name)}
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-3 py-3">
                                            <Link
                                                href={`/portal/immigration/cases/${c.case_id}/profile`}
                                                className="font-semibold text-gray-900 hover:text-gray-700 hover:underline underline-offset-2"
                                            >
                                                {c.case_name}
                                            </Link>
                                            {c.case_ref && <div className="text-[10px] text-gray-400 font-mono mt-0.5">{c.case_ref}</div>}
                                            <div className="text-[10px] text-gray-400 mt-1">
                                                {c.invoices.length} invoice{c.invoices.length === 1 ? "" : "s"}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            {c.email && <div className="text-[11px] text-gray-600 truncate max-w-[220px]">{c.email}</div>}
                                            {c.phone && <div className="text-[11px] text-gray-500 truncate max-w-[220px] mt-0.5">{c.phone}</div>}
                                            {! c.email && ! c.phone && <span className="text-[11px] text-gray-300">—</span>}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-col gap-2">
                                                {c.invoices.map((iv) => (
                                                    <div key={iv.id} className="flex items-center gap-2 h-5">
                                                        <FileText size={13} className="text-gray-400 shrink-0" />
                                                        <span className="text-[12px] font-semibold text-gray-800 font-mono">{iv.number || "Invoice"}</span>
                                                        <span className="text-[10px] text-gray-400">{fmtSize(iv.size)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="text-[12px] text-gray-700 font-medium">{fmtDate(c.latest_created_at)}</div>
                                            {c.latest_by && (
                                                <div className="text-[11px] text-gray-500 mt-0.5">
                                                    by <span className="font-medium text-gray-600">{c.latest_by}</span>
                                                </div>
                                            )}
                                        </td>
                                        {/* Actions — View/Download per invoice (aligned to the
                                            Invoices column), then the row-level delete. */}
                                        <td className="px-3 py-3 pr-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-2 items-end">
                                                {c.invoices.map((iv) => (
                                                    <div key={iv.id} className="flex items-center justify-end gap-3 h-5">
                                                        <a href={iv.view_url} target="_blank" rel="noopener noreferrer"
                                                           className="text-[11px] font-semibold text-gray-600 hover:text-gray-900 inline-flex items-center gap-1">
                                                            <Eye size={12} /> View
                                                        </a>
                                                        <a href={iv.download_url}
                                                           className="text-[11px] font-semibold text-gray-600 hover:text-gray-900 inline-flex items-center gap-1">
                                                            <Download size={12} /> Download
                                                        </a>
                                                    </div>
                                                ))}
                                                <div className="pt-1 mt-0.5 border-t border-gray-100 w-full flex justify-end">
                                                    <DeleteInvoicesButton caseId={c.case_id} caseName={c.case_name} count={c.invoices.length} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalOpen && (
                <NewInvoiceModal cases={cases} nextNumber={nextNumber} onClose={() => setModalOpen(false)} />
            )}
        </div>
    );
}

function DeleteInvoicesButton({ caseId, caseName, count }) {
    const [busy, setBusy] = useState(false);
    const remove = () => {
        if (! confirm(`Delete all ${count} invoice${count === 1 ? "" : "s"} for ${caseName}? This removes the files permanently.`)) return;
        setBusy(true);
        router.delete(`/admin/leads/${caseId}/invoice/documents`, {
            preserveScroll: true,
            onError: () => toast.error("Could not delete the invoices."),
            onFinish: () => setBusy(false),
        });
    };
    return (
        <button
            type="button" onClick={remove} disabled={busy}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 disabled:opacity-40"
        >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete
        </button>
    );
}

function NewInvoiceModal({ cases, nextNumber, onClose }) {
    const [caseSearch, setCaseSearch] = useState("");
    const [selectedCase, setSelectedCase] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);

    const today = new Date().toISOString().slice(0, 10);
    const plus7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

    const [form, setForm] = useState({
        invoice_number: nextNumber || "",
        invoice_date: today,
        due_date: plus7,
    });
    // Fully editable line items — starts from the visa's fees, staff can
    // edit any row or add their own.
    const [items, setItems] = useState([]);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const setItem = (i, k, v) => setItems((list) => list.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
    const addItem = () => setItems((list) => [...list, { description: "", quantity: 1, unit_price: "" }]);
    const removeItem = (i) => setItems((list) => list.filter((_, idx) => idx !== i));

    // Pre-fill the standard lines from the picked case's visa fees.
    useEffect(() => {
        if (! selectedCase) return;
        const visa = selectedCase.inz_visa_type || "Visa";
        const seed = [];
        if (selectedCase.professional_fees) {
            seed.push({
                description: `Consulting and Service Fee - [${visa} Application] (assessing client's eligibility, documents review, providing advice and lodging the above visa application on behalf of client) - pay in advance`,
                quantity: 1,
                unit_price: selectedCase.professional_fees,
            });
        }
        if (selectedCase.inz_application_fee) {
            seed.push({
                description: `Disbursement - INZ [${visa}] application fee - pay in advance`,
                quantity: 1,
                unit_price: selectedCase.inz_application_fee,
            });
        }
        setItems(seed.length ? seed : [{ description: "", quantity: 1, unit_price: "" }]);
    }, [selectedCase]);

    const filteredCases = useMemo(() => {
        const q = caseSearch.trim().toLowerCase();
        const list = q
            ? cases.filter((c) => [c.name, c.lead_id, c.email, c.inz_visa_type]
                .some((v) => (v || "").toString().toLowerCase().includes(q)))
            : cases;
        return list.slice(0, 50);
    }, [cases, caseSearch]);

    const lineAmount = (it) => (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
    const total = items.reduce((sum, it) => sum + lineAmount(it), 0);
    const missingFees = selectedCase && ! selectedCase.professional_fees && ! selectedCase.inz_application_fee;

    const previewUrl = useMemo(() => {
        if (! selectedCase) return null;
        const p = new URLSearchParams({
            invoice_number: form.invoice_number || "",
            invoice_date: form.invoice_date || "",
            due_date: form.due_date || "",
            items: JSON.stringify(items),
        });
        return `/admin/leads/${selectedCase.id}/invoice/preview?${p.toString()}`;
    }, [selectedCase, form, items]);

    // Debounce preview reloads while typing amounts.
    const [debouncedUrl, setDebouncedUrl] = useState(null);
    useEffect(() => {
        if (! previewUrl) { setDebouncedUrl(null); return; }
        setPreviewLoading(true);
        const t = setTimeout(() => setDebouncedUrl(previewUrl), 450);
        return () => clearTimeout(t);
    }, [previewUrl]);

    const generate = () => {
        if (! selectedCase) return;
        setSubmitting(true);
        router.post(`/admin/leads/${selectedCase.id}/invoice/generate`, { ...form, items }, {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onError: () => toast.error("Could not generate the invoice."),
            onFinish: () => setSubmitting(false),
        });
    };

    const inputCls = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:bg-white focus:border-gray-300";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40" onClick={onClose}>
            <div className="bg-white w-full max-w-[1400px] h-[94vh] shadow-xl flex flex-col overflow-hidden rounded-lg"
                 onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <ReceiptText size={16} className="text-gray-700" /> New invoice
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>

                <div className="flex-1 flex flex-col sm:flex-row min-h-0">
                    {/* ── Settings (left) ── */}
                    <div className="sm:w-[420px] sm:flex-none border-r border-gray-100 overflow-y-auto">
                        {/* Case */}
                        <div className="p-4 border-b border-gray-100">
                            <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">Case</label>
                            {selectedCase ? (
                                <div className="mt-2 flex items-center gap-2 bg-gray-900 border border-gray-900 rounded-lg px-3 py-2.5">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-white truncate">{selectedCase.name}</p>
                                        <p className="text-[11px] text-gray-300 truncate">{selectedCase.inz_visa_type || "No visa set"}</p>
                                    </div>
                                    <button onClick={() => setSelectedCase(null)} className="text-gray-400 hover:text-white"><X size={15} /></button>
                                </div>
                            ) : (
                                <>
                                    <div className="relative mt-2">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input autoFocus value={caseSearch} onChange={(e) => setCaseSearch(e.target.value)}
                                               placeholder="Search a case…" className={`${inputCls} pl-9`} />
                                    </div>
                                    <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-50">
                                        {filteredCases.length === 0 && (
                                            <div className="px-3 py-4 text-center text-xs text-gray-400">No cases found.</div>
                                        )}
                                        {filteredCases.map((c) => (
                                            <button key={c.id} onClick={() => setSelectedCase(c)}
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors">
                                                <p className="text-xs font-semibold text-gray-900 truncate">{c.name}</p>
                                                <p className="text-[10.5px] text-gray-400 truncate">{c.lead_id} · {c.inz_visa_type || "No visa"}</p>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Invoice details */}
                        <div className="p-4 border-b border-gray-100 space-y-3">
                            <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">Invoice details</label>
                            <div>
                                <span className="block text-[11px] font-semibold text-gray-600 mb-1">Invoice number</span>
                                <input value={form.invoice_number} onChange={(e) => set("invoice_number", e.target.value)}
                                       className={`${inputCls} font-mono`} placeholder="INV-0117" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="block text-[11px] font-semibold text-gray-600 mb-1">Invoice date</span>
                                    <input type="date" value={form.invoice_date} onChange={(e) => set("invoice_date", e.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <span className="block text-[11px] font-semibold text-gray-600 mb-1">Due date</span>
                                    <input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} className={inputCls} />
                                </div>
                            </div>
                        </div>

                        {/* Line items — fully editable, add as many as needed */}
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">Line items</label>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="text-[11px] font-semibold text-gray-800 hover:text-black inline-flex items-center gap-1"
                                >
                                    <Plus size={12} /> Add item
                                </button>
                            </div>

                            {items.length === 0 && (
                                <p className="text-[11px] text-gray-400">No items yet — click <span className="font-semibold">Add item</span>.</p>
                            )}

                            {items.map((it, i) => (
                                <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-2 bg-gray-50/50">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Item {i + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(i)}
                                            title="Remove item"
                                            className="text-rose-600 hover:text-rose-700"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>

                                    <textarea
                                        rows={3}
                                        value={it.description}
                                        onChange={(e) => setItem(i, "description", e.target.value)}
                                        placeholder="Description"
                                        className={`${inputCls} resize-y leading-snug`}
                                    />

                                    <div className="grid grid-cols-3 gap-2 items-end">
                                        <div>
                                            <span className="block text-[10px] font-semibold text-gray-500 mb-1">Qty</span>
                                            <input type="number" step="0.01" min="0" value={it.quantity}
                                                   onChange={(e) => setItem(i, "quantity", e.target.value)} className={inputCls} />
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-semibold text-gray-500 mb-1">Unit price</span>
                                            <input type="number" step="0.01" min="0" value={it.unit_price}
                                                   onChange={(e) => setItem(i, "unit_price", e.target.value)} className={inputCls} placeholder="0.00" />
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-[10px] font-semibold text-gray-500 mb-1">Amount</span>
                                            <span className="block text-[13px] font-bold text-gray-900 tabular-nums py-2">
                                                {money(lineAmount(it))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Total NZD</span>
                                <span className="text-base font-bold text-gray-900 tabular-nums">{money(total)}</span>
                            </div>

                            {missingFees && (
                                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                                    <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-[11px] text-amber-700 leading-snug">
                                        This visa has no fees on the <span className="font-semibold">Visas</span> page — enter the amounts manually.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Live preview (right) ── */}
                    <div className="flex-1 min-w-0 min-h-[240px] bg-gray-100 relative">
                        {! selectedCase ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                                <ReceiptText size={30} className="text-gray-300" />
                                <p className="text-sm font-semibold text-gray-500 mt-2">Pick a case to preview</p>
                                <p className="text-xs text-gray-400 mt-1">The live invoice preview will appear here.</p>
                            </div>
                        ) : (
                            <>
                                {previewLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100/70 z-10">
                                        <Loader2 size={22} className="text-gray-700 animate-spin" />
                                    </div>
                                )}
                                {debouncedUrl && (
                                    <iframe
                                        key={debouncedUrl}
                                        src={debouncedUrl}
                                        title="Invoice preview"
                                        className="w-full h-full bg-white"
                                        onLoad={() => setPreviewLoading(false)}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-4 flex-shrink-0">
                    <p className="text-xs text-gray-400">
                        {selectedCase ? <>Total <span className="font-semibold text-gray-700">{money(total)}</span> · {form.invoice_number}</> : "No case selected"}
                    </p>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800">Cancel</button>
                        <button
                            onClick={generate}
                            disabled={! selectedCase || total <= 0 || submitting}
                            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? <Loader2 size={14} className="animate-spin" /> : <ReceiptText size={14} />} Generate invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
