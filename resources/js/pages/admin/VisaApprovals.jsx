import { useMemo, useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    Plus, Award, Star, StarOff, Pencil, Trash2, Image as ImageIcon,
    X, Upload, Loader2, Eye, EyeOff, Globe, Calendar,
} from "lucide-react";
import PersonCombobox from "@/components/admin/PersonCombobox";

/**
 * /admin/visa-approvals — CRUD list for the marketing showcase.
 *
 * Table rows show the photo thumb + name + country + month/year + a
 * "Featured" star toggle + edit/delete. "Add approval" opens a modal
 * with the person combobox (searches leads / cases / students OR
 * accepts free-form typing) + country / month / year / photo / caption
 * / featured / published.
 */

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];

export default function VisaApprovals({ items = [] }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState(null); // item being edited or null for new

    const openNew  = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (item) => { setEditing(item); setModalOpen(true); };

    const remove = (item) => {
        if (! window.confirm(`Delete this approval for "${item.display_name}"? The image will be removed too.`)) return;
        router.delete(`/admin/visa-approvals/${item.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Removed'),
            onError:   () => toast.error('Could not remove — please try again.'),
        });
    };

    const toggleFeatured = (item) => {
        // Server enforces one-featured-at-a-time by unsetting others on save.
        const form = new FormData();
        form.append('_method', 'POST');
        form.append('display_name', item.display_name);
        if (item.lead) form.append('lead_id', item.lead.id);
        if (item.country) form.append('country', item.country);
        if (item.approved_at) {
            const [y, m] = item.approved_at.split('-');
            form.append('approved_year', String(parseInt(y, 10)));
            form.append('approved_month', String(parseInt(m, 10)));
        }
        if (item.caption) form.append('caption', item.caption);
        form.append('is_featured',  item.is_featured  ? '0' : '1');
        form.append('is_published', item.is_published ? '1' : '0');
        router.post(`/admin/visa-approvals/${item.id}`, form, {
            preserveScroll: true,
            forceFormData:  true,
            onSuccess: () => toast.success(item.is_featured ? 'Un-featured' : 'Featured'),
            onError:   () => toast.error('Update failed'),
        });
    };

    const stats = useMemo(() => ({
        total:     items.length,
        published: items.filter((i) => i.is_published).length,
        featured:  items.filter((i) => i.is_featured).length,
    }), [items]);

    return (
        <div className="max-w-6xl mx-auto pb-16 space-y-5">
            <Head title="Visa Approvals — Admin" />

            {/* Header */}
            <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-500 mb-1">Marketing</p>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Visa Approvals</h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        Approvals shown on the home-page carousel and the /visa-approved gallery. One entry can be "Featured" at a time — it becomes the hero card on the home page.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openNew}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-bold bg-gray-900 text-white hover:bg-black transition-colors"
                >
                    <Plus size={14} strokeWidth={2.5} /> Add approval
                </button>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-3">
                <SummaryTile label="Total"     value={stats.total} icon={Award} />
                <SummaryTile label="Published" value={stats.published} icon={Eye} />
                <SummaryTile label="Featured"  value={stats.featured} icon={Star} tone="amber" />
            </div>

            {/* List */}
            {items.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-gray-200 rounded-2xl bg-gray-50/40">
                    <Award size={32} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm font-semibold text-gray-700">No approvals yet</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        Click "Add approval" to create the first one. Approvals appear on the public home page and the /visa-approved gallery.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/60 border-b border-gray-100 text-[10.5px] font-bold uppercase tracking-wider text-gray-500">
                                    <th className="text-left px-4 py-3 w-[6%]"></th>
                                    <th className="text-left px-4 py-3">Person</th>
                                    <th className="text-left px-4 py-3 w-[16%]">Country</th>
                                    <th className="text-left px-4 py-3 w-[14%]">Approved</th>
                                    <th className="text-left px-4 py-3 w-[10%]">Status</th>
                                    <th className="text-right px-4 py-3 w-[18%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <Row
                                        key={item.id}
                                        item={item}
                                        onEdit={openEdit}
                                        onDelete={remove}
                                        onToggleFeatured={toggleFeatured}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <ApprovalModal
                    editing={editing}
                    onClose={() => setModalOpen(false)}
                    onSaved={() => setModalOpen(false)}
                />
            )}
        </div>
    );
}

function SummaryTile({ label, value, icon: Icon, tone = 'gray' }) {
    const toneCls = tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-700';
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
                <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{value}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneCls}`}>
                <Icon size={16} />
            </div>
        </div>
    );
}

function Row({ item, onEdit, onDelete, onToggleFeatured }) {
    return (
        <tr className="border-b border-gray-50 last:border-b-0 align-middle hover:bg-gray-50/40">
            {/* Thumb */}
            <td className="px-4 py-3">
                {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        <ImageIcon size={16} />
                    </div>
                )}
            </td>

            {/* Person */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{item.display_name}</span>
                    {item.is_featured && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                            <Star size={9} strokeWidth={2.5} /> Featured
                        </span>
                    )}
                    {item.lead && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                            Linked
                        </span>
                    )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                    {item.lead?.email || (item.lead ? `Lead #${item.lead.id}` : 'Custom entry')}
                </p>
                {item.caption && (
                    <p className="text-[11px] text-gray-500 mt-1 italic line-clamp-1 max-w-md">"{item.caption}"</p>
                )}
            </td>

            {/* Country */}
            <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-gray-700">
                    {item.country ? (
                        <><Globe size={11} className="text-gray-400" /> {item.country}</>
                    ) : (
                        <span className="text-gray-300">—</span>
                    )}
                </span>
            </td>

            {/* Approved date */}
            <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-gray-700 tabular-nums">
                    {item.approved_label ? (
                        <><Calendar size={11} className="text-gray-400" /> {item.approved_label}</>
                    ) : (
                        <span className="text-gray-300">—</span>
                    )}
                </span>
            </td>

            {/* Status */}
            <td className="px-4 py-3">
                {item.is_published ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <Eye size={10} /> Public
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider bg-gray-50 text-gray-500 border border-gray-200">
                        <EyeOff size={10} /> Hidden
                    </span>
                )}
            </td>

            {/* Actions */}
            <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                    <button
                        type="button"
                        onClick={() => onToggleFeatured(item)}
                        title={item.is_featured ? 'Un-feature' : 'Feature'}
                        className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-500 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200"
                    >
                        {item.is_featured ? <StarOff size={12} /> : <Star size={12} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(item)}
                        title="Edit"
                        className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    >
                        <Pencil size={12} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(item)}
                        title="Delete"
                        className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-400 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ── Modal ─────────────────────────────────────────────────────────────────

function ApprovalModal({ editing, onClose, onSaved }) {
    const now = new Date();
    const seedMonth = editing?.approved_at ? parseInt(editing.approved_at.split('-')[1], 10) : (now.getMonth() + 1);
    const seedYear  = editing?.approved_at ? parseInt(editing.approved_at.split('-')[0], 10) : now.getFullYear();

    const [person, setPerson] = useState({
        lead_id: editing?.lead?.id ?? null,
        name:    editing?.display_name || '',
        country: null,
    });
    const [country, setCountry]     = useState(editing?.country || '');
    const [month, setMonth]         = useState(seedMonth);
    const [year, setYear]           = useState(seedYear);
    const [caption, setCaption]     = useState(editing?.caption || '');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(editing?.image_url || null);
    const [removeImage, setRemoveImage]   = useState(false);
    const [isFeatured, setIsFeatured]     = useState(!! editing?.is_featured);
    const [isPublished, setIsPublished]   = useState(editing ? !! editing.is_published : true);
    const [submitting, setSubmitting]     = useState(false);
    const [error, setError]               = useState(null);
    const fileInputRef = useRef(null);

    // If person picker suggests a country and country field is empty, pre-fill.
    const handlePerson = (v) => {
        setPerson(v);
        if (v?.country && ! country) setCountry(v.country);
    };

    const pickFile = () => fileInputRef.current?.click();
    const onFile = (e) => {
        const f = e.target.files?.[0];
        if (! f) return;
        setImageFile(f);
        setRemoveImage(false);
        // Local preview
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(f);
    };
    const clearImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setRemoveImage(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const submit = (e) => {
        e?.preventDefault();
        if (! person.name.trim()) {
            setError('Please pick or type a person.');
            return;
        }
        setError(null);
        setSubmitting(true);

        const form = new FormData();
        if (person.lead_id) form.append('lead_id', person.lead_id);
        form.append('display_name',    person.name.trim());
        form.append('country',         country.trim());
        form.append('approved_month',  month);
        form.append('approved_year',   year);
        form.append('caption',         caption.trim());
        form.append('is_featured',     isFeatured  ? '1' : '0');
        form.append('is_published',    isPublished ? '1' : '0');
        if (imageFile) form.append('image', imageFile);
        if (removeImage) form.append('remove_image', '1');

        const url = editing ? `/admin/visa-approvals/${editing.id}` : '/admin/visa-approvals';
        router.post(url, form, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { toast.success(editing ? 'Approval updated' : 'Approval added'); onSaved?.(); },
            onError:   (errs) => { setError(Object.values(errs)[0] || 'Save failed'); },
            onFinish:  () => setSubmitting(false),
        });
    };

    // Year options: 5 back, 1 forward
    const yearOptions = [];
    for (let y = now.getFullYear() - 5; y <= now.getFullYear() + 1; y++) yearOptions.push(y);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto"
            role="dialog" aria-modal="true"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 inline-flex items-center gap-2">
                            <Award size={15} className="text-gray-400" />
                            {editing ? 'Edit approval' : 'Add approval'}
                        </h2>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                            Shows on the home-page carousel and the /visa-approved gallery.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <X size={16} />
                    </button>
                </header>

                <form onSubmit={submit} className="px-6 py-5 space-y-5">
                    {error && (
                        <div className="text-xs px-3 py-2 rounded-md bg-red-50 border border-red-100 text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Person combobox */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                            Person <span className="text-red-500">*</span>
                        </label>
                        <PersonCombobox value={person} onChange={handlePerson} />
                        <p className="text-[10.5px] text-gray-400 mt-1.5">
                            Pick a Lead, Case or Student from the CRM — or type a name if this person isn't in the system.
                        </p>
                    </div>

                    {/* Country + Month + Year row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Country
                            </label>
                            <input
                                type="text"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                placeholder="e.g. Philippines"
                                maxLength={100}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Month
                            </label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-amber-500"
                            >
                                {MONTHS.map((m, i) => (
                                    <option key={m} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Year
                            </label>
                            <select
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-amber-500"
                            >
                                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Image upload */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                            Photo
                        </label>
                        <div className="flex items-start gap-4">
                            {imagePreview ? (
                                <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        title="Remove"
                                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/95 shadow flex items-center justify-center text-gray-700 hover:text-red-700"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-28 h-28 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0 bg-gray-50">
                                    <ImageIcon size={22} />
                                </div>
                            )}
                            <div className="flex-1">
                                <button
                                    type="button"
                                    onClick={pickFile}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                >
                                    <Upload size={12} /> {imagePreview ? 'Replace photo' : 'Upload photo'}
                                </button>
                                <p className="text-[10.5px] text-gray-400 mt-2 leading-relaxed">
                                    JPG, PNG or WEBP up to 5MB. This is the picture shown on the home-page card and the /visa-approved gallery.
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={onFile}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Caption */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                            Caption (optional)
                        </label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            rows={2}
                            maxLength={500}
                            placeholder="A short quote or line to show under the photo."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-500 resize-none"
                        />
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center gap-5 flex-wrap">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isFeatured}
                                onChange={(e) => setIsFeatured(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <span className="text-xs font-semibold text-gray-700 inline-flex items-center gap-1">
                                <Star size={11} className="text-amber-500" /> Featured on home page
                            </span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isPublished}
                                onChange={(e) => setIsPublished(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <span className="text-xs font-semibold text-gray-700 inline-flex items-center gap-1">
                                <Eye size={11} className="text-gray-500" /> Published (visible on public pages)
                            </span>
                        </label>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold bg-gray-900 text-white hover:bg-black disabled:opacity-50"
                        >
                            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Award size={12} />}
                            {editing ? 'Save changes' : 'Add approval'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
