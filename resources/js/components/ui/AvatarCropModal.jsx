import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, Move } from "lucide-react";

// Self-contained circular avatar cropper. Given a picked image (object URL or
// data URL), lets the user drag to reposition + zoom so the face sits centred
// in the circle, then exports a square PNG File via canvas. No dependencies.
//
// Props:
//   src        – image URL to crop (object URL / data URL)
//   fileName   – base name for the produced File
//   onCancel() – dismiss without saving
//   onDone(file, previewDataUrl) – receives the cropped File + a preview URL
//
// Geometry: the image is scaled "cover" so it always fills the circle. `scale`
// is display-px-per-natural-px; `offset` is the image's top-left in viewport
// px. Everything is clamped so the image can never reveal a gap.

const VIEWPORT = 256;   // on-screen crop diameter (px)
const OUTPUT = 256;     // exported image size (px)
const MAX_ZOOM = 3;

export default function AvatarCropModal({ src, fileName = "avatar.png", onCancel, onDone }) {
    const imgRef = useRef(null);
    const [nat, setNat] = useState(null);        // { w, h } natural size
    const [baseScale, setBaseScale] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const drag = useRef(null);

    const scale = baseScale * zoom;

    // Clamp the offset so the image always fully covers the viewport.
    const clamp = useCallback((off, s, n) => {
        const dW = n.w * s, dH = n.h * s;
        const minX = VIEWPORT - dW, minY = VIEWPORT - dH;
        return {
            x: Math.min(0, Math.max(minX, off.x)),
            y: Math.min(0, Math.max(minY, off.y)),
        };
    }, []);

    // Load natural dimensions, seed a centred "cover" fit.
    const onImgLoad = (e) => {
        const w = e.target.naturalWidth, h = e.target.naturalHeight;
        const bs = VIEWPORT / Math.min(w, h); // smaller side fills the circle at zoom 1
        const n = { w, h };
        setNat(n);
        setBaseScale(bs);
        setZoom(1);
        const s = bs;
        setOffset({ x: (VIEWPORT - w * s) / 2, y: (VIEWPORT - h * s) / 2 });
    };

    // Zoom around the viewport centre so the focused point stays put.
    const applyZoom = (nextZoom) => {
        if (!nat) return;
        const z = Math.min(MAX_ZOOM, Math.max(1, nextZoom));
        const s1 = baseScale * zoom;
        const s2 = baseScale * z;
        const c = VIEWPORT / 2;
        const srcX = (c - offset.x) / s1;
        const srcY = (c - offset.y) / s1;
        const next = clamp({ x: c - srcX * s2, y: c - srcY * s2 }, s2, nat);
        setZoom(z);
        setOffset(next);
    };

    const onPointerDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
    };
    const onPointerMove = (e) => {
        if (!drag.current || !nat) return;
        const dx = e.clientX - drag.current.px;
        const dy = e.clientY - drag.current.py;
        setOffset(clamp({ x: drag.current.ox + dx, y: drag.current.oy + dy }, scale, nat));
    };
    const onPointerUp = (e) => {
        drag.current = null;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    };
    const onWheel = (e) => {
        e.preventDefault();
        applyZoom(zoom - e.deltaY * 0.0015);
    };

    // Escape to cancel.
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onCancel?.(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onCancel]);

    const apply = () => {
        if (!nat || !imgRef.current) return;
        const s = scale;
        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT;
        canvas.height = OUTPUT;
        const ctx = canvas.getContext("2d");
        // Source rectangle (in natural px) currently under the viewport.
        const sx = -offset.x / s;
        const sy = -offset.y / s;
        const sSize = VIEWPORT / s;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(imgRef.current, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT);
        canvas.toBlob((blob) => {
            if (!blob) return;
            const name = fileName.replace(/\.[^.]+$/, "") + ".png";
            const file = new File([blob], name, { type: "image/png" });
            onDone?.(file, canvas.toDataURL("image/png"));
        }, "image/png");
    };

    const dW = nat ? nat.w * scale : 0;
    const dH = nat ? nat.h * scale : 0;

    return createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}>
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Adjust photo</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5 inline-flex items-center gap-1"><Move size={11} /> Drag to reposition · scroll or slide to zoom</p>
                    </div>
                    <button type="button" onClick={onCancel} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X size={18} /></button>
                </div>

                <div className="px-5 py-5 flex flex-col items-center gap-4">
                    <div
                        className="relative bg-gray-100 rounded-full overflow-hidden ring-1 ring-gray-200 cursor-grab active:cursor-grabbing touch-none select-none"
                        style={{ width: VIEWPORT, height: VIEWPORT }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onWheel={onWheel}
                    >
                        <img
                            ref={imgRef}
                            src={src}
                            alt=""
                            onLoad={onImgLoad}
                            draggable={false}
                            style={{ position: "absolute", left: offset.x, top: offset.y, width: dW || undefined, height: dH || undefined, maxWidth: "none" }}
                        />
                        {/* Circle guide overlay */}
                        <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.04)_inset]" />
                    </div>

                    <div className="w-full flex items-center gap-3">
                        <button type="button" onClick={() => applyZoom(zoom - 0.25)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"><ZoomOut size={16} /></button>
                        <input
                            type="range"
                            min={1}
                            max={MAX_ZOOM}
                            step={0.01}
                            value={zoom}
                            onChange={(e) => applyZoom(parseFloat(e.target.value))}
                            className="flex-1 accent-gray-900"
                        />
                        <button type="button" onClick={() => applyZoom(zoom + 0.25)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"><ZoomIn size={16} /></button>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-gray-100">
                    <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                    <button type="button" onClick={apply} className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors">Apply</button>
                </div>
            </div>
        </div>,
        document.body
    );
}
