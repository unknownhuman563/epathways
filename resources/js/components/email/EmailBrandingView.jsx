import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { ArrowLeft, ImagePlus, Trash2, Loader2, Mail, Save, MousePointerClick, Eye, EyeOff } from "lucide-react";

const input = "w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300";

// The BOOK NOW + CALL buttons baked onto the CTA image, per department.
function LinksForm({ basePath, dept, bookingUrl, callNumber, effectiveBooking, effectiveCall }) {
    const [f, setF] = useState({ booking_url: bookingUrl || "", call_number: callNumber || "" });
    const [saving, setSaving] = useState(false);
    const dirty = f.booking_url !== (bookingUrl || "") || f.call_number !== (callNumber || "");

    const save = () => {
        setSaving(true);
        router.post(`${basePath}/${dept}`, { booking_url: f.booking_url, call_number: f.call_number }, {
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

// Editable text footer (copyright/company, website, e-mail, WhatsApp,
// location), per department. Blank fields fall back to the global default
// (shown as the placeholder).
function FooterForm({ basePath, dept, item }) {
    const init = {
        footer_company: item.footer_company || "",
        footer_website_label: item.footer_website_label || "",
        footer_website_url: item.footer_website_url || "",
        footer_email: item.footer_email || "",
        footer_whatsapp: item.footer_whatsapp || "",
        footer_location: item.footer_location || "",
    };
    const [f, setF] = useState(init);
    const [saving, setSaving] = useState(false);
    const eff = item.effective_footer || {};
    const dirty = Object.keys(init).some((k) => f[k] !== init[k]);
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

    const save = () => {
        setSaving(true);
        router.post(`${basePath}/${dept}`, f, { preserveScroll: true, onFinish: () => setSaving(false) });
    };

    return (
        <div className="space-y-2 pt-3 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5"><Mail size={12} /> Footer text</p>
            <label className="block">
                <span className="block text-[10px] text-gray-400 mb-0.5">Company (in the copyright line)</span>
                <input className={input} value={f.footer_company} onChange={set("footer_company")} placeholder={eff.company || "ePathways"} />
            </label>
            <div className="grid grid-cols-2 gap-2">
                <label className="block">
                    <span className="block text-[10px] text-gray-400 mb-0.5">Website label</span>
                    <input className={input} value={f.footer_website_label} onChange={set("footer_website_label")} placeholder={eff.website_label || "epathways.co.nz"} />
                </label>
                <label className="block">
                    <span className="block text-[10px] text-gray-400 mb-0.5">Website link</span>
                    <input className={input} value={f.footer_website_url} onChange={set("footer_website_url")} placeholder={eff.website_url || "https://…"} />
                </label>
            </div>
            <label className="block">
                <span className="block text-[10px] text-gray-400 mb-0.5">E-mail</span>
                <input className={input} value={f.footer_email} onChange={set("footer_email")} placeholder={eff.email || "info@epathways.co.nz"} />
            </label>
            <label className="block">
                <span className="block text-[10px] text-gray-400 mb-0.5">WhatsApp (one per line)</span>
                <textarea rows={2} className={`${input} resize-y`} value={f.footer_whatsapp} onChange={set("footer_whatsapp")} placeholder={eff.whatsapp || "+64 21 …"} />
            </label>
            <label className="block">
                <span className="block text-[10px] text-gray-400 mb-0.5">Location</span>
                <textarea rows={2} className={`${input} resize-y`} value={f.footer_location} onChange={set("footer_location")} placeholder={eff.location || "Street, City, Country"} />
            </label>
            <p className="text-[10px] text-gray-400">Blank = the global default (shown as the greyed placeholder).</p>
            <button onClick={save} disabled={!dirty || saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg hover:bg-black disabled:opacity-40">
                <Save size={12} /> {saving ? "Saving…" : "Save footer"}
            </button>
        </div>
    );
}

// One banner/CTA slot for a department. Uploading, removing, or hiding posts
// straight to the branding endpoint and Inertia refreshes the previews.
function Slot({ basePath, dept, field, label, hint, url, isCustom, hidden }) {
    const [busy, setBusy] = useState(false);

    const post = (payload) => {
        setBusy(true);
        router.post(`${basePath}/${dept}`, payload, {
            forceFormData: true, preserveScroll: true, onFinish: () => setBusy(false),
        });
    };
    const upload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        post({ [field]: file, [`hide_${field}`]: 0 }); // uploading un-hides
    };
    const removeUpload = () => {
        if (!window.confirm(`Remove the uploaded ${label.toLowerCase()} for ${dept}? It falls back to the default.`)) return;
        post({ [`remove_${field}`]: 1 });
    };
    const setHidden = (v) => post({ [`hide_${field}`]: v ? 1 : 0 });

    const status = hidden ? "None" : (isCustom ? "Custom" : "Default");
    const statusTone = hidden ? "text-rose-500" : (isCustom ? "text-emerald-600" : "text-gray-300");

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-gray-500">{label}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wide ${statusTone}`}>{status}</span>
            </div>

            {hidden ? (
                <div className="flex flex-col items-center justify-center h-24 border border-dashed border-gray-200 rounded-lg bg-gray-50 text-gray-400 gap-1">
                    <EyeOff size={16} />
                    <span className="text-[10px]">Not shown in emails</span>
                </div>
            ) : (
                <label className="relative block border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-pointer group">
                    {busy && <span className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/80"><Loader2 size={18} className="animate-spin text-gray-400" /></span>}
                    {url
                        ? <img src={url} alt={label} className="w-full h-24 object-cover" />
                        : <span className="flex items-center justify-center h-24 text-gray-300"><ImagePlus size={20} /></span>}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 text-[11px] font-bold transition-all">Upload image</span>
                    <input type="file" accept="image/*" onChange={upload} className="hidden" />
                </label>
            )}

            <div className="flex items-center justify-between mt-1 gap-2">
                <span className="text-[10px] text-gray-400">{hint}</span>
                <div className="flex items-center gap-2.5 shrink-0">
                    {isCustom && !hidden && (
                        <button type="button" onClick={removeUpload} className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-rose-600">
                            <Trash2 size={11} /> Remove
                        </button>
                    )}
                    {hidden ? (
                        <button type="button" onClick={() => setHidden(false)} className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-gray-700">
                            <Eye size={11} /> Show
                        </button>
                    ) : (
                        <button type="button" onClick={() => setHidden(true)} className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-rose-600">
                            <EyeOff size={11} /> Hide
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Shared Email Branding page, reused by the admin area and every department
// portal. `basePath` drives the update posts; `templatesPath` the back link.
export default function EmailBrandingView({ items = [], basePath = "/admin/email-branding", templatesPath = "/admin/message-templates" }) {
    return (
        <div className="max-w-[1200px] mx-auto pb-12 space-y-6">
            <Head title="Email Branding" />

            <div>
                <Link href={templatesPath} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-2">
                    <ArrowLeft size={14} /> Back to templates
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2"><Mail size={22} /> Email Branding</h1>
                <p className="text-sm text-gray-500 mt-1">Set each department's email banner &amp; CTA image. A template's Branding picker uses these; a per-template custom image still overrides. Blank = the default ePathways artwork.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((d) => (
                    <div key={d.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <h3 className="text-sm font-bold text-gray-900">{d.label}</h3>
                        <Slot basePath={basePath} dept={d.key} field="banner" label="Banner (top)" hint="Wide header, ~600px" url={d.banner_url} isCustom={d.has_custom_banner} hidden={d.hide_banner} />
                        <Slot basePath={basePath} dept={d.key} field="footer" label="CTA image" hint="Above the contact block" url={d.footer_url} isCustom={d.has_custom_footer} hidden={d.hide_footer} />
                        <LinksForm basePath={basePath} dept={d.key} bookingUrl={d.booking_url} callNumber={d.call_number} effectiveBooking={d.effective_booking_url} effectiveCall={d.effective_call_number} />
                        <FooterForm basePath={basePath} dept={d.key} item={d} />
                    </div>
                ))}
            </div>
        </div>
    );
}
