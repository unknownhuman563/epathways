import { useEffect, useMemo, useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import SignatureCanvas from "react-signature-canvas";
import {
    FileSignature, Eraser, ShieldCheck, AlertCircle, Loader2, FileText,
    Eye, Download, CheckCircle2, X, Upload, Type, PenLine,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Standalone engagement-signing page. Reached from the "engagement documents
// ready" email via a per-lead token; shows ONLY the engagement pack. The client
// reviews the documents and e-signs the Written Agreement here.

const ACCENT = "#0f766e";

export default function EngagementPack({ token, client = {}, documents = [] }) {
    const [signing, setSigning] = useState(null); // the signable doc being signed
    const [viewing, setViewing] = useState(null); // the doc open in the preview modal
    const [agreed, setAgreed] = useState({});     // doc id -> "I agree" ticked

    const agreement = documents.find((d) => d.signable) || null;
    const others = documents.filter((d) => !d.signable);

    // The other documents are acknowledged (optionally) from inside their view modal.
    const setDocAgreed = (id, v) => setAgreed((a) => ({ ...a, [id]: v }));

    return (
        <>
            <Navbar />
            <Head title="Your engagement documents — ePathways Migration" />
            <main className="min-h-screen bg-gray-50 py-10 px-4">
                <div className="max-w-3xl mx-auto space-y-6">
                    <header className="space-y-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] inline-flex items-center gap-1.5" style={{ color: ACCENT }}>
                            <FileSignature size={12} /> Engagement documents
                        </p>
                        <h1 className="text-2xl font-bold text-gray-900">Your engagement pack</h1>
                        <p className="text-sm text-gray-600">
                            {client.first_name ? `Hi ${client.first_name}, ` : ""}please review the documents below and sign your engagement agreement.
                        </p>
                    </header>

                    {documents.length === 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                            <FileText size={26} className="mx-auto text-gray-300" />
                            <p className="mt-3 text-sm text-gray-600">No engagement documents are available on this link.</p>
                        </div>
                    )}

                    {/* The agreement to sign */}
                    {agreement && (
                        <section className="bg-white border-2 rounded-2xl overflow-hidden shadow-sm" style={{ borderColor: `${ACCENT}33` }}>
                            <div className="px-5 py-4 flex items-start gap-3" style={{ backgroundColor: `${ACCENT}0d` }}>
                                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: ACCENT }}>
                                    <FileSignature size={19} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-[15px] font-bold text-gray-900">{agreement.title}</h2>
                                    <p className="text-[12px] text-gray-500">Requires your signature</p>
                                </div>
                                {agreement.signed && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                                        <CheckCircle2 size={12} /> Signed
                                    </span>
                                )}
                            </div>
                            <div className="px-5 py-4 flex items-center gap-2 flex-wrap">
                                <button type="button" onClick={() => setViewing(agreement)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-gray-700 text-[13px] font-semibold hover:bg-gray-50">
                                    <Eye size={14} /> View
                                </button>
                                <a href={agreement.download_url}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-gray-700 text-[13px] font-semibold hover:bg-gray-50">
                                    <Download size={14} /> Download
                                </a>
                                {agreement.signed ? (
                                    <span className="text-[12px] text-gray-500 ml-1">
                                        Signed{agreement.signer_name ? ` by ${agreement.signer_name}` : ""}{agreement.signed_at ? ` · ${new Date(agreement.signed_at).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                                    </span>
                                ) : (
                                    <button type="button" onClick={() => setSigning(agreement)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-[13px] font-bold hover:opacity-90 ml-auto" style={{ backgroundColor: ACCENT }}>
                                        <FileSignature size={14} /> Review &amp; sign
                                    </button>
                                )}
                            </div>
                        </section>
                    )}

                    {/* The rest of the pack — view / download only */}
                    {others.length > 0 && (
                        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                Your documents
                            </div>
                            <ul className="divide-y divide-gray-50">
                                {others.map((d) => (
                                    <li key={d.id} className="px-5 py-3.5 flex items-center gap-3">
                                        <span className="w-9 h-9 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0"><FileText size={16} /></span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[13px] font-semibold text-gray-800 truncate">{d.title}</span>
                                            {d.size ? <span className="block text-[11px] text-gray-400">{formatBytes(d.size)}</span> : null}
                                        </span>
                                        {(d.signed || agreed[d.id]) && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                                                <CheckCircle2 size={13} /> Agreed
                                            </span>
                                        )}
                                        <button type="button" onClick={() => setViewing(d)} title="View & agree"
                                            className="inline-flex items-center justify-center p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"><Eye size={14} /></button>
                                        <a href={d.download_url} title="Download"
                                            className="inline-flex items-center justify-center p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"><Download size={14} /></a>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            </main>
            <Footer />

            {signing && (
                <SignModal doc={signing} clientName={client.name} onClose={() => setSigning(null)} />
            )}
            {viewing && (
                <DocViewModal
                    doc={viewing}
                    agreeable={!viewing.signable && !viewing.signed}
                    agreed={!!agreed[viewing.id]}
                    onAgree={(v) => setDocAgreed(viewing.id, v)}
                    onClose={() => setViewing(null)}
                />
            )}
        </>
    );
}

// In-page document preview — opens the PDF in a modal instead of a new tab. When
// `agreeable`, an acknowledgement checkbox sits below the document.
function DocViewModal({ doc, agreeable = false, agreed = false, onAgree, onClose }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3" onClick={onClose}>
            <div className="w-[95vw] max-w-[1200px] h-[92vh] max-h-[calc(100vh-1.5rem)] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 flex-shrink-0">
                    <h2 className="text-sm font-bold text-gray-900 inline-flex items-center gap-2 min-w-0">
                        <FileText size={15} style={{ color: ACCENT }} /> <span className="truncate">{doc.title}</span>
                    </h2>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <a href={doc.download_url} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-[12px] font-semibold hover:bg-gray-50">
                            <Download size={13} /> Download
                        </a>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
                    </div>
                </div>
                <div className="flex-1 min-h-0 bg-gray-100">
                    <iframe src={doc.view_url} title={doc.title} className="w-full h-full border-0" />
                </div>
                {agreeable && (
                    <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-3 flex-shrink-0 flex-wrap">
                        <label className="inline-flex items-start gap-2.5 text-[13px] text-gray-800 cursor-pointer">
                            <input type="checkbox" checked={agreed} onChange={(e) => onAgree(e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded border-gray-300 flex-shrink-0" style={{ accentColor: ACCENT }} />
                            <span>I confirm I have read and understood <span className="font-semibold">{doc.title}</span>, and I have received a copy of it.</span>
                        </label>
                        <button type="button" onClick={onClose}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-[13px] font-bold hover:opacity-90 flex-shrink-0" style={{ backgroundColor: ACCENT }}>
                            {agreed ? "Done" : "Close"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function SignModal({ doc, clientName, onClose }) {
    const sigRef = useRef(null);
    const iframeRef = useRef(null);
    const fileRef = useRef(null);
    const [signerName, setSignerName] = useState(clientName || "");
    const [sigMode, setSigMode] = useState("auto"); // auto | draw | upload
    const [drawData, setDrawData] = useState("");
    const [uploadData, setUploadData] = useState("");
    const [agreeChecked, setAgreeChecked] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);

    // Auto-generated signature: the typed name rendered in a script font.
    const autoData = useMemo(() => renderNameSignature(signerName), [signerName]);
    // The effective signature depends on the active mode.
    const sigData = sigMode === "auto" ? autoData : sigMode === "draw" ? drawData : uploadData;

    // Live preview: the HTML agreement listens for the signature via postMessage
    // and drops it into the signature slot in real time.
    const pushToPreview = (value) => {
        try {
            iframeRef.current?.contentWindow?.postMessage({ type: "applicant-signature", value: value || "" }, "*");
        } catch { /* same-origin here, so this won't throw */ }
    };
    // Reflect the current signature on the document whenever it changes / mode switches.
    useEffect(() => { pushToPreview(sigData); }, [sigData]); // eslint-disable-line react-hooks/exhaustive-deps
    const onIframeLoad = () => setTimeout(() => pushToPreview(sigData), 80);

    // Drawing finished — read the pad (react-signature-canvas alpha doesn't fire
    // onEnd reliably, so we also read on pointer/mouse/touch release).
    const onDrawEnd = () => setDrawData(sigRef.current?.getCanvas()?.toDataURL("image/png") || "");
    const clearDraw = () => { sigRef.current?.clear(); setDrawData(""); };

    // Upload an e-signature image.
    const onUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setUploadData(String(reader.result || ""));
        reader.readAsDataURL(file);
    };

    const submit = (e) => {
        e.preventDefault();
        if (submitting) return;
        setServerError(null);
        const errs = {};
        if (!signerName.trim()) errs.signer_name = "Please type your full legal name.";
        if (!sigData) errs.signature = sigMode === "draw" ? "Please draw your signature." : sigMode === "upload" ? "Please upload your signature image." : "Type your name to generate a signature.";
        if (!agreeChecked) errs.agree = "Please tick the box to confirm you agree.";
        setErrors(errs);
        if (Object.keys(errs).length) return;

        setSubmitting(true);
        router.post(doc.sign_url, { signer_name: signerName.trim(), signature_data: sigData }, {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onError: (er) => { setErrors(er); setServerError(Object.values(er)[0] || "Signature could not be recorded."); },
            onFinish: () => setSubmitting(false),
        });
    };

    const TABS = [
        { key: "auto", label: "Auto-generated", icon: Type },
        { key: "draw", label: "Draw", icon: PenLine },
        { key: "upload", label: "Upload", icon: Upload },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3" onClick={onClose}>
            <div className="w-[95vw] max-w-[1400px] h-[92vh] max-h-[calc(100vh-1.5rem)] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 flex-shrink-0">
                    <h2 className="text-sm font-bold text-gray-900 inline-flex items-center gap-2"><FileSignature size={15} style={{ color: ACCENT }} /> Adopt your signature — {doc.title}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
                </div>

                <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
                    {/* Live document preview — signature appears on it in real time. */}
                    <div className="flex-1 min-w-0 min-h-[300px] bg-gray-100 border-b lg:border-b-0 lg:border-r border-gray-100">
                        <iframe ref={iframeRef} onLoad={onIframeLoad} src={doc.preview_url || doc.view_url} title={doc.title} className="w-full h-full border-0" />
                    </div>

                    {/* Sign form */}
                    <form onSubmit={submit} className="lg:w-[440px] flex-shrink-0 p-5 space-y-4 overflow-y-auto">
                        {serverError && (
                            <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-100 text-xs text-red-800">
                                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {serverError}
                            </div>
                        )}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Your full name <span className="text-red-500">*</span></label>
                            <input type="text" value={signerName} onChange={(e) => setSignerName(e.target.value)} maxLength={120}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-gray-900" placeholder="e.g. Maria Cruz" />
                            {errors.signer_name && <p className="text-xs text-red-700 mt-1">{errors.signer_name}</p>}
                        </div>

                        {/* Signature mode tabs */}
                        <div>
                            <div className="flex items-center gap-1 border-b border-gray-200">
                                {TABS.map((t) => {
                                    const active = sigMode === t.key;
                                    return (
                                        <button key={t.key} type="button" onClick={() => setSigMode(t.key)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold border-b-2 -mb-px ${active ? "" : "border-transparent text-gray-400 hover:text-gray-700"}`}
                                            style={active ? { borderColor: ACCENT, color: ACCENT } : {}}>
                                            <t.icon size={13} /> {t.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Signature preview</p>

                                {/* Auto-generated */}
                                {sigMode === "auto" && (
                                    <div className="border border-gray-300 rounded-md bg-white h-[172px] flex items-center justify-center overflow-hidden">
                                        {autoData
                                            ? <img src={autoData} alt="Signature preview" className="max-h-[150px] max-w-full" />
                                            : <p className="text-[12px] text-gray-400 px-4 text-center">Type your name above to generate a signature.</p>}
                                    </div>
                                )}

                                {/* Draw */}
                                {sigMode === "draw" && (
                                    <>
                                        <div className="border border-gray-300 rounded-md bg-white" style={{ touchAction: "none" }}
                                            onPointerUp={onDrawEnd} onMouseUp={onDrawEnd} onTouchEnd={onDrawEnd}>
                                            <SignatureCanvas ref={sigRef} onEnd={onDrawEnd} penColor="#111"
                                                canvasProps={{ width: 480, height: 170, className: "w-full h-[170px]" }} />
                                        </div>
                                        <button type="button" onClick={clearDraw} className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-900"><Eraser size={11} /> Clear</button>
                                    </>
                                )}

                                {/* Upload */}
                                {sigMode === "upload" && (
                                    <div className="border border-gray-300 rounded-md bg-white h-[172px] flex flex-col items-center justify-center gap-2 overflow-hidden">
                                        {uploadData
                                            ? <img src={uploadData} alt="Uploaded signature" className="max-h-[130px] max-w-full" />
                                            : <p className="text-[12px] text-gray-400">Upload a photo or scan of your signature.</p>}
                                        <button type="button" onClick={() => fileRef.current?.click()}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-[12px] font-semibold hover:bg-gray-50">
                                            <Upload size={13} /> {uploadData ? "Choose another" : "Choose image (PNG/JPG)"}
                                        </button>
                                        <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onUpload} />
                                    </div>
                                )}
                            </div>
                            {errors.signature && <p className="text-xs text-red-700 mt-1">{errors.signature}</p>}
                        </div>

                        {/* Acknowledgement — below the signature. */}
                        <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
                            <label className="flex items-start gap-2.5 text-[13px] text-gray-800 cursor-pointer leading-snug">
                                <input type="checkbox" checked={agreeChecked} onChange={(e) => setAgreeChecked(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 rounded border-gray-300 flex-shrink-0" style={{ accentColor: ACCENT }} />
                                <span>By signing, I agree that the name and signature above may be used to electronically sign this document. I have read and understood the agreement, and I agree to be bound by its terms.</span>
                            </label>
                            {errors.agree && <p className="text-xs text-red-700 mt-1.5 ml-6">{errors.agree}</p>}
                        </div>

                        <p className="text-[10.5px] text-gray-400 inline-flex items-start gap-1.5">
                            <ShieldCheck size={12} className="flex-shrink-0 mt-0.5" />
                            We record your typed name, signature and timestamp for the audit trail.
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button type="button" onClick={onClose} className="px-3 py-2 text-[13px] font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
                            <button type="submit" disabled={submitting}
                                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-white text-[13px] font-bold hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: ACCENT }}>
                                {submitting && <Loader2 size={13} className="animate-spin" />} Adopt &amp; sign →
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Render a typed name into a script-font signature image (data URL).
function renderNameSignature(name) {
    const text = (name || "").trim();
    if (!text || typeof document === "undefined") return "";
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111827";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    const fontAt = (px) => `italic ${px}px "Segoe Script","Brush Script MT","Snell Roundhand","Apple Chancery","Comic Sans MS",cursive`;
    let size = 76;
    ctx.font = fontAt(size);
    while (size > 26 && ctx.measureText(text).width > 560) {
        size -= 4;
        ctx.font = fontAt(size);
    }
    ctx.fillText(text, 300, 105);
    return canvas.toDataURL("image/png");
}

function formatBytes(n) {
    if (!n) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
