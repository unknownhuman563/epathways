import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { ArrowLeft, ImagePlus, Trash2, Loader2, Mail, Save, MousePointerClick } from "lucide-react";

const input = "w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300";

// The BOOK NOW + CALL buttons baked onto the CTA image, per department.
function LinksForm({ dept, bookingUrl, callNumber, effectiveBooking, effectiveCall }) {
    const [f, setF] = useState({ booking_url: bookingUrl || "", call_number: callNumber || "" });
    const [saving, setSaving] = useState(false);
    const dirty = f.booking_url !== (bookingUrl || "") || f.call_number !== (callNumber || "");

    const save = () => {
        setSaving(true);
        router.post(`/admin/email-branding/${dept}`, { booking_url: f.booking_url, call_number: f.call_number }, {
            preserveScroll: true, onFinish: () => setSaving(false),
        });
    };

    return (
        <div className="space-y-2 pt-3 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5"><MousePointerClick size={12} /> CTA buttons</p>
            <label className="block">
                <span className="block text-[10px] text-gray-400 mb-0.5">BOOK NOW link</span>
                <input className={input} value={f.booking_url} onChange={(e) => setF((p) => ({ ...p, booking_url: e.target.value }))} placeholder={effectiveBooking || "https://…"} />
            </label>
            <label className="block">
                <span className="block text-[10px] text-gray-400 mb-0.5">CALL number</span>
                <input className={input} value={f.call_number} onChange={(e) => setF((p) => ({ ...p, call_number: e.target.value }))} placeholder={effectiveCall || "+64 21 …"} />
            </label>
            <p className="text-[10px] text-gray-400">Blank = the global default. The whole CTA image links to the BOOK NOW URL.</p>
            <button onClick={save} disabled={!dirty || saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg hover:bg-black disabled:opacity-40">
                <Save size={12} /> {saving ? "Saving…" : "Save links"}
            </button>
        </div>
    );
}

// One banner/CTA slot for a department. Uploading or removing posts straight to
// the branding endpoint (multipart) and Inertia refreshes the previews.
function Slot({ dept, field, label, hint, url, isCustom }) {
    const [busy, setBusy] = useState(false);

    const upload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusy(true);
        router.post(`/admin/email-branding/${dept}`, { [field]: file }, {
            forceFormData: true, preserveScroll: true, onFinish: () => setBusy(false),
        });
    };
    const remove = () => {
        if (!window.confirm(`Remove the ${label.toLowerCase()} for ${dept}? It will fall back to the default.`)) return;
        setBusy(true);
        router.post(`/admin/email-branding/${dept}`, { [`remove_${field}`]: 1 }, {
            forceFormData: true, preserveScroll: true, onFinish: () => setBusy(false),
        });
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-gray-500">{label}</span>
                {isCustom
                    ? <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">Custom</span>
                    : <span className="text-[9px] font-bold uppercase tracking-wide text-gray-300">Default</span>}
            </div>
            <label className="relative block border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-pointer group">
                {busy && <span className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/80"><Loader2 size={18} className="animate-spin text-gray-400" /></span>}
                {url
                    ? <img src={url} alt={label} className="w-full h-24 object-cover" />
                    : <span className="flex items-center justify-center h-24 text-gray-300"><ImagePlus size={20} /></span>}
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 text-[11px] font-bold transition-all">Upload image</span>
                <input type="file" accept="image/*" onChange={upload} className="hidden" />
            </label>
            <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-gray-400">{hint}</span>
                {isCustom && (
                    <button type="button" onClick={remove} className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-rose-600">
                        <Trash2 size={11} /> Remove
                    </button>
                )}
            </div>
        </div>
    );
}

export default function EmailBranding({ items = [] }) {
    return (
        <div className="max-w-[1200px] mx-auto pb-12 space-y-6">
            <Head title="Email Branding" />

            <div>
                <Link href="/admin/message-templates" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-2">
                    <ArrowLeft size={14} /> Back to templates
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2"><Mail size={22} /> Email Branding</h1>
                <p className="text-sm text-gray-500 mt-1">Set each department's email banner &amp; CTA image. A template's Branding picker uses these; a per-template custom image still overrides. Blank = the default ePathways artwork.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((d) => (
                    <div key={d.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <h3 className="text-sm font-bold text-gray-900">{d.label}</h3>
                        <Slot dept={d.key} field="banner" label="Banner (top)" hint="Wide header, ~600px" url={d.banner_url} isCustom={d.has_custom_banner} />
                        <Slot dept={d.key} field="footer" label="CTA image" hint="Above the contact block" url={d.footer_url} isCustom={d.has_custom_footer} />
                        <LinksForm dept={d.key} bookingUrl={d.booking_url} callNumber={d.call_number} effectiveBooking={d.effective_booking_url} effectiveCall={d.effective_call_number} />
                    </div>
                ))}
            </div>
        </div>
    );
}
