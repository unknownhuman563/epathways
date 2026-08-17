import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { Plus, Trash2, Pencil, X, Save, Video, Eye, EyeOff } from "lucide-react";

const fbSrc = (url, w) => `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=${w}&t=0`;
// Accept a full embed <iframe>/plugin URL too — pull the real video URL from href=.
const cleanUrl = (v) => { const m = String(v).match(/[?&]href=([^&"'\s]+)/i); return m ? decodeURIComponent(m[1]) : v; };
const input = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30 focus:border-[#436235]";

function Editor({ item, onClose }) {
    const editing = !!item;
    const [f, setF] = useState({
        url: item?.url || "",
        orientation: item?.orientation || "portrait",
        caption: item?.caption || "",
        sort_order: item?.sort_order ?? "",
        is_published: item?.is_published ?? true,
    });
    const [saving, setSaving] = useState(false);
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

    const save = () => {
        setSaving(true);
        const opts = { preserveScroll: true, onSuccess: () => onClose(), onFinish: () => setSaving(false) };
        if (editing) router.put(`/admin/video-testimonials/${item.id}`, f, opts);
        else router.post("/admin/video-testimonials", f, opts);
    };
    const canSave = f.url.trim().startsWith("http") && !saving;
    const previewW = f.orientation === "landscape" ? 320 : 200;
    const previewH = f.orientation === "landscape" ? 180 : 356;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-8" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-gradient-to-br from-gray-50 to-white">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400 mb-1">Video testimonial</p>
                        <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit testimonial" : "Add testimonial"}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <label className="block">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Facebook video URL or embed code</span>
                        <input className={input} value={f.url} onChange={(e) => setF((p) => ({ ...p, url: cleanUrl(e.target.value) }))} placeholder="Paste the video link or the full <iframe> embed code" />
                        <span className="block text-[11px] text-gray-400 mt-1">Use Facebook's <b>Embed</b> option (or a <code>/videos/</code> or <code>/watch</code> permalink) — plain share links and music-copyright reels won't embed.</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Orientation</span>
                            <select className={input} value={f.orientation} onChange={set("orientation")}>
                                <option value="portrait">Portrait (reel)</option>
                                <option value="landscape">Landscape</option>
                            </select>
                        </label>
                        <label className="block">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Order</span>
                            <input type="number" className={input} value={f.sort_order} onChange={set("sort_order")} placeholder="auto" />
                        </label>
                    </div>
                    <label className="block">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Caption (optional)</span>
                        <input className={input} value={f.caption} onChange={set("caption")} placeholder="e.g. Maria — Student Visa approved" />
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={f.is_published} onChange={set("is_published")} className="accent-[#436235] w-4 h-4" />
                        <span className="text-sm text-gray-700">Published (shown on the landing page)</span>
                    </label>

                    {f.url.trim().startsWith("http") && (
                        <div className="pt-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Preview</p>
                            <div className="rounded-xl overflow-hidden bg-black inline-block" style={{ width: previewW, height: previewH }}>
                                <iframe src={fbSrc(f.url, previewW)} width={previewW} height={previewH} style={{ border: "none" }} scrolling="no" frameBorder="0" allowFullScreen title="Preview" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-100">Cancel</button>
                    <button onClick={save} disabled={!canSave} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#436235] text-white text-sm font-bold rounded-xl hover:bg-[#375029] disabled:opacity-60">
                        <Save size={15} /> {saving ? "Saving…" : editing ? "Save changes" : "Add testimonial"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function VideoTestimonials({ items = [] }) {
    const [editing, setEditing] = useState(null);
    const [adding, setAdding] = useState(false);

    const togglePublish = (t) => router.put(`/admin/video-testimonials/${t.id}`, { ...t, is_published: !t.is_published }, { preserveScroll: true });
    const remove = (t) => { if (window.confirm("Remove this testimonial?")) router.delete(`/admin/video-testimonials/${t.id}`, { preserveScroll: true }); };

    return (
        <div className="max-w-[1200px] mx-auto pb-12 space-y-6">
            <Head title="Video Testimonials" />

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2"><Video size={22} /> Video Testimonials</h1>
                    <p className="text-sm text-gray-500 mt-1">Facebook video/reel testimonials shown on the landing page under the client reviews.</p>
                </div>
                <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#436235] text-white text-sm font-bold rounded-xl hover:bg-[#375029] w-max">
                    <Plus size={16} /> Add testimonial
                </button>
            </div>

            {items.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
                    <Video size={28} className="mx-auto mb-2 text-gray-300" /> No testimonials yet. Click “Add testimonial”.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((t) => {
                        const land = t.orientation === "landscape";
                        const w = land ? 300 : 180;
                        const h = land ? 169 : 320;
                        return (
                            <div key={t.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col items-center gap-3 ${t.is_published ? "border-gray-100" : "border-amber-200 bg-amber-50/30"}`}>
                                <div className="rounded-xl overflow-hidden bg-black" style={{ width: w, height: h }}>
                                    <iframe src={fbSrc(t.url, w)} width={w} height={h} style={{ border: "none" }} scrolling="no" frameBorder="0" allowFullScreen title={t.caption || "Testimonial"} loading="lazy" />
                                </div>
                                <div className="w-full text-center">
                                    {t.caption && <p className="text-sm font-semibold text-gray-800 truncate">{t.caption}</p>}
                                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">{t.orientation} · #{t.sort_order}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => togglePublish(t)} title={t.is_published ? "Unpublish" : "Publish"} className={`p-2 rounded-lg ${t.is_published ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"}`}>
                                        {t.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
                                    </button>
                                    <button onClick={() => setEditing(t)} title="Edit" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><Pencil size={15} /></button>
                                    <button onClick={() => remove(t)} title="Remove" className="p-2 rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {adding && <Editor item={null} onClose={() => setAdding(false)} />}
            {editing && <Editor item={editing} onClose={() => setEditing(null)} />}
        </div>
    );
}
