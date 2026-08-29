import { useRef, useState } from "react";
import { router } from "@inertiajs/react";
import SignatureCanvas from "react-signature-canvas";
import {
    FileSignature, Eye, PenTool, Eraser, Upload, ShieldCheck,
    AlertCircle, Loader2, X,
} from "lucide-react";

/**
 * Shared e-signature modal — the uniform draw/upload capture used across the
 * app (mirrors SignatureCard's modes). Type your legal name, draw or upload a
 * signature, and POST it. The signature is sent as `signature_data` (a base64
 * PNG data URL) regardless of draw vs upload, so every backend path is identical.
 *
 * Props:
 *   postUrl      — where to POST { signer_name, signature_data, terms_accepted? }
 *   title        — modal heading
 *   requireTerms — show + require the "I have read and agree" checkbox (agent side)
 *   reviewUrl    — optional link to open the PDF before signing
 *   onClose      — close handler
 */
export default function AgreementSignModal({ postUrl, title = "Sign agreement", requireTerms = false, reviewUrl = null, onClose }) {
    const sigRef = useRef(null);
    const [mode, setMode] = useState("draw"); // draw | upload
    const [signerName, setSignerName] = useState("");
    const [terms, setTerms] = useState(false);
    const [hasInk, setHasInk] = useState(false);
    const [uploadData, setUploadData] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);

    const clear = () => { sigRef.current?.clear(); setHasInk(false); };

    const onPickFile = (e) => {
        const file = e.target.files?.[0];
        if (! file) return;
        const reader = new FileReader();
        reader.onload = () => setUploadData(reader.result);
        reader.readAsDataURL(file);
    };

    const signatureData = () =>
        mode === "upload" ? (uploadData || "") : (sigRef.current?.getCanvas().toDataURL("image/png") || "");

    const validate = () => {
        const e = {};
        if (! signerName.trim()) e.signer_name = "Please type your full legal name.";
        if (requireTerms && ! terms) e.terms_accepted = "You must agree to the terms to continue.";
        if (mode === "draw" && (! hasInk || sigRef.current?.isEmpty())) e.signature = "Please draw your signature below.";
        if (mode === "upload" && ! uploadData) e.signature = "Please choose a signature image to upload.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = (event) => {
        event.preventDefault();
        if (submitting) return;
        setServerError(null);
        if (! validate()) return;

        setSubmitting(true);
        const payload = { signer_name: signerName.trim(), signature_data: signatureData() };
        if (requireTerms) payload.terms_accepted = terms ? 1 : 0;

        router.post(postUrl, payload, {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onError: (errs) => {
                setErrors(errs);
                setServerError(Object.values(errs)[0] || "Signature could not be recorded.");
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                        <FileSignature size={17} /> {title}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X size={18} /></button>
                </div>

                <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-4">
                    {serverError && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-800">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" /> {serverError}
                        </div>
                    )}

                    {reviewUrl && (
                        <a href={reviewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-700 hover:text-gray-900 underline underline-offset-2">
                            <Eye size={13} /> Open the agreement to review before signing
                        </a>
                    )}

                    {requireTerms && (
                        <>
                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 w-4 h-4" />
                                <span className="text-sm text-gray-900">I have read and agree to the terms of this Referral Agent Agreement.</span>
                            </label>
                            {errors.terms_accepted && <p className="text-xs text-red-700 -mt-2">{errors.terms_accepted}</p>}
                        </>
                    )}

                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Type your full legal name</label>
                        <input
                            type="text"
                            value={signerName}
                            onChange={(e) => setSignerName(e.target.value)}
                            maxLength={200}
                            placeholder="e.g. Lillian Novida Ejorango"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                        />
                        {errors.signer_name && <p className="text-xs text-red-700 mt-1">{errors.signer_name}</p>}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Your signature</label>
                            <div className="flex items-center gap-2">
                                {[
                                    { key: "draw", label: "Draw", icon: <PenTool size={12} /> },
                                    { key: "upload", label: "Upload", icon: <Upload size={12} /> },
                                ].map((t) => (
                                    <button
                                        key={t.key}
                                        type="button"
                                        onClick={() => setMode(t.key)}
                                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 transition-colors ${mode === t.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                    >
                                        {t.icon} {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {mode === "draw" ? (
                            <>
                                <div className="border border-gray-300 rounded-md bg-white" style={{ touchAction: "none" }}>
                                    <SignatureCanvas
                                        ref={sigRef}
                                        onBegin={() => setHasInk(true)}
                                        penColor="#111"
                                        canvasProps={{ width: 720, height: 180, className: "w-full h-[180px]" }}
                                    />
                                </div>
                                <div className="flex justify-end mt-1.5">
                                    <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-900"><Eraser size={11} /> Clear</button>
                                </div>
                            </>
                        ) : (
                            <label className="border-2 border-dashed border-gray-300 rounded-md bg-white flex flex-col items-center justify-center h-[180px] cursor-pointer hover:border-gray-400 transition-colors">
                                {uploadData ? (
                                    <img src={uploadData} alt="Signature preview" className="max-h-[130px] max-w-[80%] object-contain" />
                                ) : (
                                    <>
                                        <Upload size={22} className="text-gray-300" />
                                        <span className="text-xs text-gray-400 mt-2">Click to choose a PNG or JPG</span>
                                        <span className="text-[10.5px] text-gray-300 mt-0.5">Transparent PNG works best</span>
                                    </>
                                )}
                                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={onPickFile} />
                            </label>
                        )}
                        {errors.signature && <p className="text-xs text-red-700 mt-1">{errors.signature}</p>}
                    </div>

                    <p className="text-[10.5px] text-gray-400 inline-flex items-center gap-1.5">
                        <ShieldCheck size={11} /> We record your typed name, signature, and timestamp for the audit trail.
                    </p>
                </form>

                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-white">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold bg-gray-900 text-white hover:bg-black disabled:opacity-50"
                    >
                        {submitting && <Loader2 size={13} className="animate-spin" />} Sign agreement →
                    </button>
                </div>
            </div>
        </div>
    );
}
