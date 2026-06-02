import { Head, Link, useForm, router } from "@inertiajs/react";
import { ArrowLeft, Trash2, Upload } from "lucide-react";

export default function PropertyForm({ property = null }) {
    const isEdit = Boolean(property);

    const { data, setData, post, transform, processing, errors } = useForm({
        name: property?.name ?? "",
        location: property?.location ?? "",
        room_type: property?.room_type ?? "single",
        has_wardrobe: property?.has_wardrobe ?? false,
        bed_type: property?.bed_type ?? "single",
        bathroom_type: property?.bathroom_type ?? "shared",
        includes: property?.includes ?? "",
        rent_single: property?.rent_single ?? "",
        rent_couple: property?.rent_couple ?? "",
        bills_excluded: property?.bills_excluded ?? true,
        description: property?.description ?? "",
        status: property?.status ?? "available",
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

    const field = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-rose-500 focus:ring-rose-500";
    const label = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";
    const err = (k) => errors[k] && <p className="mt-1 text-xs text-rose-600">{errors[k]}</p>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Head title={isEdit ? "Edit property" : "New property"} />

            <Link href="/portal/accommodation/properties" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900">
                <ArrowLeft size={16} /> Back to properties
            </Link>

            <form onSubmit={submit} className="space-y-6 rounded-3xl border border-gray-50 bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit property" : "New property"}</h1>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className={label}>Location / property name</label>
                        <input className={field} value={data.name} onChange={(e) => setData("name", e.target.value)} />
                        {err("name")}
                    </div>

                    <div className="md:col-span-2">
                        <label className={label}>Area / city (subtitle)</label>
                        <input className={field} value={data.location} onChange={(e) => setData("location", e.target.value)} placeholder="Auckland, NZ" />
                        {err("location")}
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
                        <input id="wardrobe" type="checkbox" checked={data.has_wardrobe} onChange={(e) => setData("has_wardrobe", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                        <label htmlFor="wardrobe" className="text-sm font-medium text-gray-700">Has wardrobe</label>
                    </div>

                    <div>
                        <label className={label}>Rent — single ($/week)</label>
                        <input type="number" step="0.01" className={field} value={data.rent_single} onChange={(e) => setData("rent_single", e.target.value)} />
                        {err("rent_single")}
                    </div>

                    <div>
                        <label className={label}>Rent — couple ($/week)</label>
                        <input type="number" step="0.01" className={field} value={data.rent_couple} onChange={(e) => setData("rent_couple", e.target.value)} />
                        {err("rent_couple")}
                    </div>

                    <div className="flex items-center gap-3 md:col-span-2">
                        <input id="bills" type="checkbox" checked={data.bills_excluded} onChange={(e) => setData("bills_excluded", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                        <label htmlFor="bills" className="text-sm font-medium text-gray-700">Bills excluded</label>
                    </div>

                    <div className="md:col-span-2">
                        <label className={label}>Includes (appliances / shared areas)</label>
                        <textarea rows={3} className={field} value={data.includes} onChange={(e) => setData("includes", e.target.value)} placeholder="The house also includes shared kitchen and living areas with a fridge, microwave, couch, TV, washing machine, and dining table." />
                        {err("includes")}
                    </div>

                    <div className="md:col-span-2">
                        <label className={label}>Description (optional)</label>
                        <textarea rows={3} className={field} value={data.description} onChange={(e) => setData("description", e.target.value)} />
                        {err("description")}
                    </div>

                    <div>
                        <label className={label}>Status</label>
                        <select className={field} value={data.status} onChange={(e) => setData("status", e.target.value)}>
                            <option value="available">Available</option>
                            <option value="unavailable">Unavailable</option>
                        </select>
                        {err("status")}
                    </div>
                </div>

                {/* Existing images (edit only) */}
                {isEdit && property.images?.length > 0 && (
                    <div>
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
                <div>
                    <label className={label}>{isEdit ? "Add more images" : "Images"}</label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 hover:border-rose-400 hover:text-rose-600">
                        <Upload size={18} />
                        <span>{data.images.length > 0 ? `${data.images.length} file(s) selected` : "Click to choose images"}</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setData("images", Array.from(e.target.files))} />
                    </label>
                    {err("images")}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Link href="/portal/accommodation/properties" className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</Link>
                    <button type="submit" disabled={processing} className="rounded-full bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                        {processing ? "Saving…" : isEdit ? "Save changes" : "Create property"}
                    </button>
                </div>
            </form>
        </div>
    );
}
