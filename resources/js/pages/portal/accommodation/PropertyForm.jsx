import { useEffect, useMemo, useState } from "react";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { ArrowLeft, Trash2, Upload, X, Loader2, ChevronDown, Lock } from "lucide-react";
import { compressImage } from "@/lib/compressImage";

// <input type="date"> needs a bare YYYY-MM-DD; the API serializes dates as ISO.
const dateValue = (v) => (v ? String(v).slice(0, 10) : "");

const FIELD_CLS = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1F5A8B] focus:ring-[#1F5A8B]";
const LABEL_CLS = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

// Module-level so its identity is stable across renders — defining a component
// inside PropertyForm would remount every input on each keystroke (focus loss).
function Field({ name, label, type = "text", placeholder, span2 = false, step, value, error, onChange }) {
    return (
        <div className={span2 ? "md:col-span-2" : ""}>
            <label className={LABEL_CLS}>{label}</label>
            <input
                type={type}
                step={step}
                className={FIELD_CLS}
                value={value ?? ""}
                placeholder={placeholder}
                onChange={(e) => onChange(name, e.target.value)}
            />
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        </div>
    );
}

function Section({ title, hint, internal = false, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="rounded-3xl border border-gray-50 bg-white shadow-sm">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between px-8 py-5 text-left"
            >
                <span className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{title}</span>
                    {internal && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                            <Lock size={10} /> Internal
                        </span>
                    )}
                    {hint && <span className="text-xs text-gray-400">{hint}</span>}
                </span>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && <div className="border-t border-gray-50 px-8 py-6">{children}</div>}
        </div>
    );
}

export default function PropertyForm({ property = null, options = {}, next_code = null }) {
    const isEdit = Boolean(property);
    const propertyTypes = options.property_types ?? [];
    const paymentSchedules = options.payment_schedules ?? [];

    const { data, setData, post, transform, processing, errors } = useForm({
        // Identification
        code: property?.code ?? next_code ?? "",
        address: property?.address ?? "",
        city: property?.city ?? "",
        region: property?.region ?? "",
        property_type: property?.property_type ?? "",
        total_rooms: property?.total_rooms ?? "",
        is_active: property?.is_active ?? true,
        // Public listing
        name: property?.name ?? "",
        location: property?.location ?? "",
        suburb: property?.suburb ?? "",
        room_type: property?.room_type ?? "single",
        has_wardrobe: property?.has_wardrobe ?? false,
        bed_type: property?.bed_type ?? "single",
        bathroom_type: property?.bathroom_type ?? "shared",
        includes: property?.includes ?? "",
        rent_single: property?.rent_single ?? "",
        rent_couple: property?.rent_couple ?? "",
        bills_excluded: property?.bills_excluded ?? true,
        description: property?.description ?? "",
        map_url: property?.map_url ?? "",
        status: property?.status ?? "available",
        // Property manager
        property_manager_name: property?.property_manager_name ?? "",
        property_manager_phone: property?.property_manager_phone ?? "",
        property_manager_email: property?.property_manager_email ?? "",
        pm_payment_schedule: property?.pm_payment_schedule ?? "",
        // Financial
        bond_total_nzd: property?.bond_total_nzd ?? "",
        advance_total_nzd: property?.advance_total_nzd ?? "",
        // Utilities & codes
        mercury_account_number: property?.mercury_account_number ?? "",
        mercury_account_holder: property?.mercury_account_holder ?? "",
        property_icp: property?.property_icp ?? "",
        house_code: property?.house_code ?? "",
        internet_passcode: property?.internet_passcode ?? "",
        power_due_date: dateValue(property?.power_due_date),
        water_due_date: dateValue(property?.water_due_date),
        internet_due_date: dateValue(property?.internet_due_date),
        uses_bottled_gas: property?.uses_bottled_gas ?? false,
        last_gas_purchase: dateValue(property?.last_gas_purchase),
        // Notes
        notes: property?.notes ?? "",
        images: [],
    });

    const submit = (e) => {
        e.preventDefault();
        const url = isEdit
            ? `/portal/accommodation/properties/${property.id}`
            : "/portal/accommodation/properties";

        // forceFormData is required for file uploads; _method spoofs PUT on edit.
        if (isEdit) {
            transform((d) => ({ ...d, _method: "put" }));
        }
        post(url, { forceFormData: true });
    };

    const deleteImage = (image) => {
        if (confirm("Remove this image?")) {
            router.delete(
                `/portal/accommodation/properties/${property.id}/images/${image.id}`,
                { preserveScroll: true }
            );
        }
    };

    // Object-URL previews for files the user just picked (revoked on change/unmount).
    const previews = useMemo(
        () => data.images.map((file) => ({ file, url: URL.createObjectURL(file) })),
        [data.images]
    );

    useEffect(() => {
        return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
    }, [previews]);

    const removeNewImage = (index) => {
        setData("images", data.images.filter((_, i) => i !== index));
    };

    // Compress each picked image in the browser before adding it to the upload,
    // so large phone photos don't exceed the server's request-size limit (413).
    const [compressing, setCompressing] = useState(false);

    const handleFiles = async (e) => {
        const files = Array.from(e.target.files);
        e.target.value = ""; // reset so the same file can be re-picked after removal
        if (files.length === 0) return;

        setCompressing(true);
        try {
            const processed = await Promise.all(files.map((f) => compressImage(f)));
            setData("images", [...data.images, ...processed]);
        } finally {
            setCompressing(false);
        }
    };

    const field = FIELD_CLS;
    const label = LABEL_CLS;
    const err = (k) => errors[k] && <p className="mt-1 text-xs text-rose-600">{errors[k]}</p>;

    // Bound helper for the reusable text Field — keeps call sites terse.
    const f = (name, label, extra = {}) => (
        <Field name={name} label={label} value={data[name]} error={errors[name]} onChange={setData} {...extra} />
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <Head title={isEdit ? "Edit property" : "New property"} />

            <Link href={isEdit ? `/portal/accommodation/properties/${property.id}` : "/portal/accommodation/properties"} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900">
                <ArrowLeft size={16} /> Back
            </Link>

            <form onSubmit={submit} className="space-y-5">
                <div className="rounded-3xl border border-gray-50 bg-white p-8 shadow-sm space-y-6">
                    <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit property" : "New property"}</h1>

                    {/* Identification */}
                    <div>
                        <h2 className="mb-3 text-sm font-bold text-gray-900">Identification</h2>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label className={label}>Property # (code)</label>
                                <input className={field} value={data.code} onChange={(e) => setData("code", e.target.value)} placeholder="e.g. 13" />
                                {err("code")}
                            </div>
                            <div>
                                <label className={label}>Property type</label>
                                <select className={field} value={data.property_type} onChange={(e) => setData("property_type", e.target.value)}>
                                    <option value="">Select type</option>
                                    {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                                {err("property_type")}
                            </div>
                            <div className="md:col-span-2">
                                <label className={label}>Address</label>
                                <input className={field} value={data.address} onChange={(e) => setData("address", e.target.value)} placeholder="e.g. 21 Vazey Way, Hobsonville" />
                                {err("address")}
                            </div>
                            {f("city", "City", { placeholder: "Auckland" })}
                            {f("region", "Region (optional)", { placeholder: "North Shore" })}
                            {f("total_rooms", "Total rooms", { type: "number", placeholder: "5" })}
                            <div className="flex items-center gap-3 pt-7">
                                <input id="is_active" type="checkbox" checked={data.is_active} onChange={(e) => setData("is_active", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#1F5A8B] focus:ring-[#1F5A8B]" />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active in portfolio</label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Public listing (existing marketing fields) */}
                <Section title="Public listing" hint="Shown on the public accommodation page" defaultOpen={!isEdit}>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <label className={label}>Listing name / title</label>
                            <input className={field} value={data.name} onChange={(e) => setData("name", e.target.value)} />
                            {err("name")}
                        </div>
                        <div className="md:col-span-2">
                            <label className={label}>Area / city (subtitle)</label>
                            <input className={field} value={data.location} onChange={(e) => setData("location", e.target.value)} placeholder="Auckland, NZ" />
                            {err("location")}
                        </div>
                        <div className="md:col-span-2">
                            <label className={label}>Suburb</label>
                            <select className={field} value={data.suburb} onChange={(e) => setData("suburb", e.target.value)}>
                                <option value="">Select a suburb</option>
                                <option value="Hobsonville">Hobsonville</option>
                                <option value="Glenfield">Glenfield</option>
                                <option value="Kelston">Kelston</option>
                                <option value="Hillsborough">Hillsborough</option>
                                <option value="Sunnynook">Sunnynook</option>
                            </select>
                            {err("suburb")}
                        </div>
                        <div>
                            <label className={label}>Room type</label>
                            <select className={field} value={data.room_type} onChange={(e) => setData("room_type", e.target.value)}>
                                <option value="single">Single</option>
                                <option value="ensuite">Ensuite</option>
                            </select>
                            {err("room_type")}
                        </div>
                        <div>
                            <label className={label}>Bed / mattress</label>
                            <select className={field} value={data.bed_type} onChange={(e) => setData("bed_type", e.target.value)}>
                                <option value="single">Single bed mattress</option>
                                <option value="double">Double bed mattress</option>
                            </select>
                            {err("bed_type")}
                        </div>
                        <div>
                            <label className={label}>Toilet & bathroom</label>
                            <select className={field} value={data.bathroom_type} onChange={(e) => setData("bathroom_type", e.target.value)}>
                                <option value="shared">Shared</option>
                                <option value="private">Private</option>
                            </select>
                            {err("bathroom_type")}
                        </div>
                        <div className="flex items-center gap-3 pt-7">
                            <input id="wardrobe" type="checkbox" checked={data.has_wardrobe} onChange={(e) => setData("has_wardrobe", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#1F5A8B] focus:ring-[#1F5A8B]" />
                            <label htmlFor="wardrobe" className="text-sm font-medium text-gray-700">Has wardrobe</label>
                        </div>
                        {f("rent_single", "Rent — single ($/week)", { type: "number", step: "0.01" })}
                        {f("rent_couple", "Rent — couple ($/week)", { type: "number", step: "0.01" })}
                        <div className="flex items-center gap-3 md:col-span-2">
                            <input id="bills" type="checkbox" checked={data.bills_excluded} onChange={(e) => setData("bills_excluded", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#1F5A8B] focus:ring-[#1F5A8B]" />
                            <label htmlFor="bills" className="text-sm font-medium text-gray-700">Bills excluded</label>
                        </div>
                        <div className="md:col-span-2">
                            <label className={label}>Includes (appliances / shared areas)</label>
                            <textarea rows={3} className={field} value={data.includes} onChange={(e) => setData("includes", e.target.value)} placeholder="Shared kitchen and living areas with fridge, microwave, couch, TV, washing machine, and dining table." />
                            {err("includes")}
                        </div>
                        <div className="md:col-span-2">
                            <label className={label}>Description (optional)</label>
                            <textarea rows={3} className={field} value={data.description} onChange={(e) => setData("description", e.target.value)} />
                            {err("description")}
                        </div>
                        <div className="md:col-span-2">
                            <label className={label}>Google Maps link (optional)</label>
                            <input className={field} value={data.map_url} onChange={(e) => setData("map_url", e.target.value)} placeholder="Paste a Google Maps link to show the location on the listing" />
                            {err("map_url")}
                        </div>
                        <div>
                            <label className={label}>Listing status</label>
                            <select className={field} value={data.status} onChange={(e) => setData("status", e.target.value)}>
                                <option value="available">Available</option>
                                <option value="unavailable">Unavailable</option>
                            </select>
                            {err("status")}
                        </div>
                    </div>

                    {/* Existing images (edit only) */}
                    {isEdit && property.images?.length > 0 && (
                        <div className="mt-5">
                            <label className={label}>Current images</label>
                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                                {property.images.map((img) => (
                                    <div key={img.id} className="group relative overflow-hidden rounded-xl border border-gray-100">
                                        <img src={img.url} alt="" className="h-24 w-full object-cover" />
                                        <button type="button" onClick={() => deleteImage(img)} className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 p-1.5 text-rose-600 opacity-0 transition group-hover:opacity-100">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New images */}
                    <div className="mt-5">
                        <label className={label}>{isEdit ? "Add more images" : "Images"}</label>
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 hover:border-[#1F5A8B] hover:text-[#1F5A8B]">
                            {compressing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                            <span>
                                {compressing
                                    ? "Optimizing images…"
                                    : data.images.length > 0
                                        ? `${data.images.length} file(s) selected — add more`
                                        : "Click to choose images"}
                            </span>
                            <input type="file" multiple accept="image/*" className="hidden" disabled={compressing} onChange={handleFiles} />
                        </label>
                        <p className="mt-1.5 text-xs text-gray-400">Images are automatically resized before upload.</p>
                        {err("images")}

                        {previews.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                                {previews.map((p, i) => (
                                    <div key={i} className="group relative overflow-hidden rounded-xl border border-gray-100">
                                        <img src={p.url} alt={p.file.name} className="h-24 w-full object-cover" />
                                        <button type="button" onClick={() => removeNewImage(i)} className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 p-1.5 text-rose-600 opacity-0 transition group-hover:opacity-100">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Section>

                {/* Property manager */}
                <Section title="Property manager" internal hint="External PM — not Exalt staff">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {f("property_manager_name", "PM name", { span2: true })}
                        {f("property_manager_phone", "PM phone")}
                        {f("property_manager_email", "PM email", { type: "email" })}
                        <div className="md:col-span-2">
                            <label className={label}>PM payment schedule</label>
                            <select className={field} value={data.pm_payment_schedule} onChange={(e) => setData("pm_payment_schedule", e.target.value)}>
                                <option value="">Select schedule</option>
                                {paymentSchedules.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {err("pm_payment_schedule")}
                        </div>
                    </div>
                </Section>

                {/* Financial */}
                <Section title="Bond & advance" internal>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {f("bond_total_nzd", "Bond total (NZD)", { type: "number", step: "0.01" })}
                        {f("advance_total_nzd", "Advance total (NZD)", { type: "number", step: "0.01" })}
                    </div>
                </Section>

                {/* Utilities & codes */}
                <Section title="Utilities & access codes" internal hint="Power, ICP, door & wifi codes">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {f("mercury_account_number", "Mercury account #", { placeholder: "120234173" })}
                        {f("mercury_account_holder", "Account holder", { placeholder: "Dinah" })}
                        {f("property_icp", "Property ICP", { placeholder: "1002154990QT858" })}
                        {f("house_code", "House / door code", { placeholder: "20124*" })}
                        {f("internet_passcode", "Wifi password", { placeholder: "29@vazeywf", span2: true })}
                        {f("power_due_date", "Power due date", { type: "date" })}
                        {f("water_due_date", "Water due date", { type: "date" })}
                        {f("internet_due_date", "Internet due date", { type: "date" })}
                        <div className="flex items-center gap-3 pt-7">
                            <input id="gas" type="checkbox" checked={data.uses_bottled_gas} onChange={(e) => setData("uses_bottled_gas", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#1F5A8B] focus:ring-[#1F5A8B]" />
                            <label htmlFor="gas" className="text-sm font-medium text-gray-700">Uses bottled (LPG) gas</label>
                        </div>
                        {data.uses_bottled_gas && f("last_gas_purchase", "Last gas purchase", { type: "date" })}
                    </div>
                </Section>

                {/* Notes */}
                <Section title="Notes" internal>
                    <textarea rows={4} className={field} value={data.notes} onChange={(e) => setData("notes", e.target.value)} placeholder="Internal notes about this property…" />
                    {err("notes")}
                </Section>

                <div className="flex justify-end gap-3 pt-2">
                    <Link href="/portal/accommodation/properties" className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</Link>
                    <button type="submit" disabled={processing || compressing} className="rounded-full bg-[#1F5A8B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#184A73] disabled:opacity-50">
                        {processing ? "Saving…" : isEdit ? "Save changes" : "Create property"}
                    </button>
                </div>
            </form>
        </div>
    );
}
