import { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    DollarSign, Receipt, Plus, Trash2, CheckCircle2, AlertCircle, UserPlus, Save,
} from "lucide-react";

// Case Financials — the money side of the immigration dashboard (fees, invoice,
// payment ledger). Staff enter the figures once; the system derives total
// payable, amount owed and "Account settled". No numbers are generated.

const PAYMENT_TYPES = [
    { value: "", label: "—" },
    { value: "pay_now", label: "Pay now" },
    { value: "pay_later", label: "Pay later" },
];

export default function FinancialsTab({ lead, financials = { record: null, payments: [], totals: {}, referred_by: null } }) {
    if (! lead?.id) return null;

    const r = financials.record || {};
    const t = financials.totals || {};
    const currency = r.currency || "NZD";
    const fmt = (n) => new Intl.NumberFormat("en-NZ", { style: "currency", currency }).format(Number(n || 0));

    const [form, setForm] = useState({
        service_fee_normal: r.service_fee_normal ?? "",
        service_fee_chargeable: r.service_fee_chargeable ?? "",
        inz_fee: r.inz_fee ?? "",
        other_fee: r.other_fee ?? "",
        disbursement: r.disbursement ?? "",
        payment_type: r.payment_type ?? "",
        inz_fee_paid_to: r.inz_fee_paid_to ?? "",
        issued_from: r.issued_from ?? "",
        invoice_no: r.invoice_no ?? "",
        invoice_sent_at: r.invoice_sent_at ?? "",
        currency,
        notes: r.notes ?? "",
        referred_by: financials.referred_by ?? "",
    });
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const [saving, setSaving] = useState(false);
    const saveFees = () => {
        setSaving(true);
        router.post(`/portal/immigration/cases/${lead.id}/financials`, form, {
            preserveScroll: true,
            onSuccess: () => toast.success("Financials saved"),
            onError: (e) => toast.error(Object.values(e)[0] || "Could not save"),
            onFinish: () => setSaving(false),
        });
    };

    return (
        <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Total payable" value={fmt(t.payable)} />
                <Stat label="Paid" value={fmt(t.paid)} tone="emerald" />
                <Stat label="Owed" value={fmt(t.owed)} tone={Number(t.owed) > 0 ? "rose" : "gray"} />
                <div className="rounded-xl border border-gray-100 bg-white p-3.5 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Status</span>
                    {t.settled ? (
                        <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600"><CheckCircle2 size={15} /> Settled</span>
                    ) : (
                        <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-amber-600"><AlertCircle size={15} /> Outstanding</span>
                    )}
                    <span className="text-[10.5px] text-gray-400 mt-0.5">Net after disbursement {fmt(t.net_after_disbursement)}</span>
                </div>
            </div>

            {/* Fees + invoice */}
            <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500 inline-flex items-center gap-2 mb-4">
                    <DollarSign size={14} /> Fees &amp; invoice
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Money label="Service fee (normal)" value={form.service_fee_normal} onChange={(v) => set("service_fee_normal", v)} />
                    <Money label="Service fee (chargeable)" value={form.service_fee_chargeable} onChange={(v) => set("service_fee_chargeable", v)} />
                    <Money label="INZ fee + other" value={form.inz_fee} onChange={(v) => set("inz_fee", v)} />
                    <Money label="Other fee" value={form.other_fee} onChange={(v) => set("other_fee", v)} />
                    <Money label="Disbursement" value={form.disbursement} onChange={(v) => set("disbursement", v)} placeholder="defaults to INZ fee" />
                    <Field label="Payment type">
                        <select value={form.payment_type} onChange={(e) => set("payment_type", e.target.value)} className={inputCls}>
                            {PAYMENT_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </Field>
                    <Text label="Invoice no." value={form.invoice_no} onChange={(v) => set("invoice_no", v)} placeholder="INV-0000" />
                    <Field label="Invoice sent">
                        <input type="date" value={form.invoice_sent_at || ""} onChange={(e) => set("invoice_sent_at", e.target.value)} className={inputCls} />
                    </Field>
                    <Text label="INZ fee paid to" value={form.inz_fee_paid_to} onChange={(v) => set("inz_fee_paid_to", v)} placeholder="Hendry / eP" />
                    <Text label="Issued from" value={form.issued_from} onChange={(v) => set("issued_from", v)} placeholder="TD / eP / ePM" />
                    <Text label="Currency" value={form.currency} onChange={(v) => set("currency", v)} />
                    <Text label="Referred by" value={form.referred_by} onChange={(v) => set("referred_by", v)} placeholder="e.g. Tarun" icon={<UserPlus size={12} />} />
                </div>
                <div className="mt-3">
                    <span className="block text-[11px] font-semibold text-gray-600 mb-1">Notes</span>
                    <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2}
                        className="w-full text-[13px] px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-gray-300 resize-y" />
                </div>
                <button type="button" onClick={saveFees} disabled={saving}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-black disabled:opacity-50">
                    <Save size={13} /> Save financials
                </button>
            </section>

            {/* Payment ledger */}
            <PaymentLedger leadId={lead.id} payments={financials.payments || []} fmt={fmt} owed={t.owed} />
        </div>
    );
}

const inputCls = "w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:bg-white focus:border-gray-300";

function Field({ label, children }) {
    return (
        <div>
            <span className="block text-[11px] font-semibold text-gray-600 mb-1">{label}</span>
            {children}
        </div>
    );
}
function Money({ label, value, onChange, placeholder }) {
    return (
        <Field label={label}>
            <input type="number" step="0.01" min="0" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
        </Field>
    );
}
function Text({ label, value, onChange, placeholder, icon }) {
    return (
        <Field label={<span className="inline-flex items-center gap-1">{icon}{label}</span>}>
            <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
        </Field>
    );
}
function Stat({ label, value, tone = "gray" }) {
    const c = tone === "emerald" ? "text-emerald-600" : tone === "rose" ? "text-rose-600" : "text-gray-900";
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{label}</span>
            <p className={`text-xl font-bold tabular-nums mt-1 ${c}`}>{value}</p>
        </div>
    );
}

function PaymentLedger({ leadId, payments, fmt, owed }) {
    const [row, setRow] = useState({ paid_at: "", amount: "", method: "", reference: "" });
    const [adding, setAdding] = useState(false);

    const add = () => {
        if (! row.paid_at || ! row.amount) return toast.error("Date and amount are required");
        setAdding(true);
        router.post(`/portal/immigration/cases/${leadId}/financials/payments`, row, {
            preserveScroll: true,
            onSuccess: () => { toast.success("Payment recorded"); setRow({ paid_at: "", amount: "", method: "", reference: "" }); },
            onError: (e) => toast.error(Object.values(e)[0] || "Could not record"),
            onFinish: () => setAdding(false),
        });
    };
    const remove = (id) => {
        if (! window.confirm("Remove this payment?")) return;
        router.delete(`/portal/immigration/cases/${leadId}/financials/payments/${id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success("Payment removed"),
        });
    };

    return (
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
                <h3 className="text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500 inline-flex items-center gap-2">
                    <Receipt size={14} /> Payment ledger
                </h3>
                <span className="text-[11px] text-gray-400">Owed <span className={`font-bold tabular-nums ${Number(owed) > 0 ? "text-rose-600" : "text-emerald-600"}`}>{fmt(owed)}</span></span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50/60 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            <th className="text-left px-4 py-2">Date</th>
                            <th className="text-left px-4 py-2">Amount</th>
                            <th className="text-left px-4 py-2">Method</th>
                            <th className="text-left px-4 py-2">Reference</th>
                            <th className="text-left px-4 py-2">By</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {payments.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-4 text-[12px] text-gray-400">No payments recorded yet.</td></tr>
                        )}
                        {payments.map((p) => (
                            <tr key={p.id}>
                                <td className="px-4 py-2 text-[12px] text-gray-700 tabular-nums">{p.paid_at}</td>
                                <td className="px-4 py-2 text-[13px] font-semibold text-gray-900 tabular-nums">{fmt(p.amount)}</td>
                                <td className="px-4 py-2 text-[12px] text-gray-600">{p.method || "—"}</td>
                                <td className="px-4 py-2 text-[12px] text-gray-600">{p.reference || "—"}</td>
                                <td className="px-4 py-2 text-[11px] text-gray-400">{p.recorded_by || "—"}</td>
                                <td className="px-4 py-2 text-right">
                                    <button type="button" onClick={() => remove(p.id)} className="text-gray-300 hover:text-rose-600"><Trash2 size={14} /></button>
                                </td>
                            </tr>
                        ))}
                        {/* Add row */}
                        <tr className="bg-gray-50/40">
                            <td className="px-4 py-2"><input type="date" value={row.paid_at} onChange={(e) => setRow({ ...row, paid_at: e.target.value })} className={inputCls} /></td>
                            <td className="px-4 py-2"><input type="number" step="0.01" min="0" placeholder="0.00" value={row.amount} onChange={(e) => setRow({ ...row, amount: e.target.value })} className={inputCls} /></td>
                            <td className="px-4 py-2"><input placeholder="Bank / CC / cash" value={row.method} onChange={(e) => setRow({ ...row, method: e.target.value })} className={inputCls} /></td>
                            <td className="px-4 py-2"><input placeholder="e.g. Instalment 1" value={row.reference} onChange={(e) => setRow({ ...row, reference: e.target.value })} className={inputCls} /></td>
                            <td className="px-4 py-2"></td>
                            <td className="px-4 py-2 text-right">
                                <button type="button" onClick={add} disabled={adding}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-black disabled:opacity-50">
                                    <Plus size={12} /> Add
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
}
