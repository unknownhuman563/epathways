import { useRef, useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { PenTool, Upload, Trash2, Check, Eraser } from "lucide-react";

/**
 * Staff e-signature card. Staff either draw a signature on the canvas or
 * upload an image; it's saved to their account and rendered onto the
 * engagement documents they sign.
 *
 * Props:
 *   signature  — { data_uri, updated_at } | null (current saved signature)
 *   saveUrl    — POST endpoint (accepts signature_data OR signature_image)
 *   deleteUrl  — DELETE endpoint
 *   accent     — tailwind bg-* for the primary button (default dark gray)
 */
export default function SignatureCard({ signature, saveUrl, deleteUrl, accent = "bg-gray-900" }) {
    const [mode, setMode] = useState("draw"); // draw | upload
    const [saving, setSaving] = useState(false);
    const [hasDrawing, setHasDrawing] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadPreview, setUploadPreview] = useState(null);

    const canvasRef = useRef(null);
    const drawing = useRef(false);
    const last = useRef({ x: 0, y: 0 });

    // Prep the canvas backing store once mounted.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#111827";
    }, [mode]);

    const pos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        // Map CSS pixels → canvas backing pixels.
        return {
            x: cx * (canvasRef.current.width / rect.width),
            y: cy * (canvasRef.current.height / rect.height),
        };
    };

    const start = (e) => {
        e.preventDefault();
        drawing.current = true;
        last.current = pos(e);
    };
    const move = (e) => {
        if (!drawing.current) return;
        e.preventDefault();
        const ctx = canvasRef.current.getContext("2d");
        const p = pos(e);
        ctx.beginPath();
        ctx.moveTo(last.current.x, last.current.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        last.current = p;
        setHasDrawing(true);
    };
    const end = () => { drawing.current = false; };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawing(false);
    };

    const onPickFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadFile(file);
        setUploadPreview(URL.createObjectURL(file));
    };

    const saveDraw = () => {
        if (!hasDrawing) return;
        const dataUrl = canvasRef.current.toDataURL("image/png");
        setSaving(true);
        router.post(saveUrl, { signature_data: dataUrl }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    const saveUpload = () => {
        if (!uploadFile) return;
        setSaving(true);
        router.post(saveUrl, { signature_image: uploadFile }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { setUploadFile(null); setUploadPreview(null); },
            onFinish: () => setSaving(false),
        });
    };

    const remove = () => {
        setSaving(true);
        router.delete(deleteUrl, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-1">
                <PenTool size={16} className="text-gray-700" />
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-900">Signature</h2>
            </div>
            <p className="text-[11px] text-gray-500 mb-4">
                Your e-signature is placed on the engagement documents you sign (Written Agreement).
            </p>

            {/* Current signature */}
            {signature?.data_uri && (
                <div className="mb-4 flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <img src={signature.data_uri} alt="Current signature" className="h-12 max-w-[220px] object-contain" />
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-gray-700 flex items-center gap-1.5">
                            <Check size={12} className="text-emerald-600" /> Signature on file
                        </p>
                        {signature.updated_at && (
                            <p className="text-[10.5px] text-gray-400">
                                Updated {new Date(signature.updated_at).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={remove}
                        disabled={saving}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1.5 disabled:opacity-40"
                    >
                        <Trash2 size={13} /> Remove
                    </button>
                </div>
            )}

            {/* Mode tabs */}
            <div className="flex items-center gap-2 mb-3">
                {[
                    { key: "draw", label: "Draw", icon: <PenTool size={13} /> },
                    { key: "upload", label: "Upload", icon: <Upload size={13} /> },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setMode(t.key)}
                        className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors ${mode === t.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {mode === "draw" ? (
                <div>
                    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white overflow-hidden">
                        <canvas
                            ref={canvasRef}
                            width={560}
                            height={170}
                            className="w-full h-[170px] touch-none cursor-crosshair block"
                            onMouseDown={start}
                            onMouseMove={move}
                            onMouseUp={end}
                            onMouseLeave={end}
                            onTouchStart={start}
                            onTouchMove={move}
                            onTouchEnd={end}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                        <button
                            onClick={clearCanvas}
                            className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 inline-flex items-center gap-1.5"
                        >
                            <Eraser size={13} /> Clear
                        </button>
                        <button
                            onClick={saveDraw}
                            disabled={!hasDrawing || saving}
                            className={`px-4 py-1.5 ${accent} text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-40`}
                        >
                            {saving ? "Saving…" : "Save signature"}
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <label className="rounded-xl border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center h-[170px] cursor-pointer hover:border-gray-300 transition-colors">
                        {uploadPreview ? (
                            <img src={uploadPreview} alt="Signature preview" className="max-h-[130px] max-w-[80%] object-contain" />
                        ) : (
                            <>
                                <Upload size={22} className="text-gray-300" />
                                <span className="text-xs text-gray-400 mt-2">Click to choose a PNG or JPG</span>
                                <span className="text-[10.5px] text-gray-300 mt-0.5">Transparent PNG works best</span>
                            </>
                        )}
                        <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={onPickFile} />
                    </label>
                    <div className="flex items-center justify-end mt-3">
                        <button
                            onClick={saveUpload}
                            disabled={!uploadFile || saving}
                            className={`px-4 py-1.5 ${accent} text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-40`}
                        >
                            {saving ? "Saving…" : "Save signature"}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
