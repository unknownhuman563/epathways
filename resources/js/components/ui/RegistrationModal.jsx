import { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { X, Upload, FileText, CheckCircle, ArrowRight } from "lucide-react";

// "Register your interest" pop modal used from the home page's "Start your
// application" section. Clean single-column premium form in a dark-gray /
// white palette. Low-friction: name, contact, course interest, and the
// important CV + Passport uploads, posting to the same /register endpoint as
// the full form. The detailed 9-step version lives at /register.

const LEVELS = [
    'Diploma (Level 5-6)',
    'Bachelor Degree (Level 7)',
    'Postgraduate Diploma (Level 8)',
    "Master's Degree (Level 9)",
    'Doctorate (Level 10)',
];

export default function RegistrationModal({ open, onClose }) {
    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        experience: '',
        highest_attainment: '',
        cv_files: [],
        passport_files: [],
        terms_accepted: false,
        declaration_accepted: false,
    });

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape' && !processing) onClose?.(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [open, processing, onClose]);

    if (!open) return null;

    const setConsent = (checked) => setData(d => ({ ...d, terms_accepted: checked, declaration_accepted: checked }));

    const submit = (e) => {
        e.preventDefault();
        post('/register', { forceFormData: true, preserveScroll: true });
    };

    const IC = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-[#282728] bg-white focus:border-[#282728] focus:ring-1 focus:ring-[#282728] outline-none transition-all placeholder:text-gray-400";
    const LBL = "block text-[10.5px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-1.5";
    const err = (k) => errors[k] && <p className="text-[11px] text-red-500 mt-1">{errors[k]}</p>;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#0c0c0c]/70 backdrop-blur-sm p-0 sm:p-6 font-urbanist"
            onClick={(e) => { if (e.target === e.currentTarget && !processing) onClose?.(); }}
        >
            <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[96vh] overflow-hidden flex flex-col">

                {/* Close */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={processing}
                    aria-label="Close"
                    className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white text-[#282728] flex items-center justify-center shadow-sm hover:bg-gray-100 transition-colors disabled:opacity-40"
                >
                    <X size={16} />
                </button>

                {/* Form panel */}
                <div className="w-full flex flex-col max-h-[96vh]">
                    {wasSuccessful ? (
                        <div className="px-8 py-16 text-center flex-1 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-[#282728]/[0.06] flex items-center justify-center mb-5">
                                <CheckCircle size={30} className="text-[#282728]" />
                            </div>
                            <h3 className="text-2xl font-semibold text-[#282728] tracking-tight">You're registered</h3>
                            <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">Thank you — a specialist will reach out shortly. Keep an eye on your inbox.</p>
                            <button type="button" onClick={onClose} className="mt-7 px-6 py-2.5 rounded-lg bg-[#282728] text-white text-sm font-semibold hover:bg-black transition-colors">
                                Done
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="px-7 pt-7 pb-4 md:pt-9">
                                <span className="text-[10.5px] font-bold tracking-[0.22em] uppercase text-gray-400">Quick registration</span>
                                <h2 className="text-2xl font-semibold text-[#282728] tracking-tight mt-1.5">Register your interest</h2>
                            </div>

                            <form onSubmit={submit} className="flex-1 overflow-y-auto px-7 pb-7 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className={LBL}>First name *</label>
                                        <input type="text" required value={data.first_name} onChange={e => setData('first_name', e.target.value)} className={IC} />
                                        {err('first_name')}
                                    </div>
                                    <div>
                                        <label className={LBL}>Last name *</label>
                                        <input type="text" required value={data.last_name} onChange={e => setData('last_name', e.target.value)} className={IC} />
                                        {err('last_name')}
                                    </div>
                                    <div>
                                        <label className={LBL}>Email *</label>
                                        <input type="email" required value={data.email} onChange={e => setData('email', e.target.value)} className={IC} />
                                        {err('email')}
                                    </div>
                                    <div>
                                        <label className={LBL}>Phone *</label>
                                        <input type="tel" required value={data.phone} onChange={e => setData('phone', e.target.value)} className={IC} placeholder="+63 …" />
                                        {err('phone')}
                                    </div>
                                    <div>
                                        <label className={LBL}>Experience *</label>
                                        <input type="text" required value={data.experience} onChange={e => setData('experience', e.target.value)} className={IC} placeholder="e.g. 3 years nursing" />
                                        {err('experience')}
                                    </div>
                                    <div>
                                        <label className={LBL}>Highest attainment *</label>
                                        <select required value={data.highest_attainment} onChange={e => setData('highest_attainment', e.target.value)} className={IC}>
                                            <option value="">Select attainment</option>
                                            {LEVELS.map(l => <option key={l}>{l}</option>)}
                                        </select>
                                        {err('highest_attainment')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <FilePick label="CV / Résumé" files={data.cv_files} onChange={f => setData('cv_files', f)} />
                                    <FilePick label="Passport copy" files={data.passport_files} onChange={f => setData('passport_files', f)} />
                                </div>

                                <label className="flex items-start gap-2.5 cursor-pointer pt-0.5">
                                    <input type="checkbox" required checked={data.terms_accepted} onChange={e => setConsent(e.target.checked)} className="mt-0.5 accent-[#282728] w-4 h-4" />
                                    <span className="text-[12px] text-gray-500 leading-relaxed">I agree to ePathways' terms and confirm the information I've provided is accurate.</span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#282728] text-white text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50"
                                >
                                    {processing ? 'Submitting…' : <>Submit registration <ArrowRight size={16} /></>}
                                </button>
                                <p className="text-center text-[11px] text-gray-400">Want the detailed form? <a href="/register" className="text-[#282728] font-semibold underline-offset-2 hover:underline">Open the full registration</a>.</p>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function FilePick({ label, files = [], onChange }) {
    const id = `reg-${label.replace(/\W+/g, '-').toLowerCase()}`;
    const add = (picked) => onChange([...(files || []), ...Array.from(picked)].slice(0, 10));
    const remove = (idx) => onChange((files || []).filter((_, i) => i !== idx));
    return (
        <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-1.5">{label}</label>
            <label htmlFor={id} className="flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2.5 text-center cursor-pointer hover:border-[#282728] hover:bg-gray-50 transition-colors">
                <Upload size={14} className="text-gray-400" />
                <span className="text-[12px] font-semibold text-gray-600">{files?.length ? `${files.length} file(s)` : 'Upload'}</span>
                <input id={id} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={e => { if (e.target.files?.length) add(e.target.files); e.target.value = ''; }} />
            </label>
            {(files || []).length > 0 && (
                <ul className="mt-1.5 space-y-1">
                    {files.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                            <FileText size={11} className="text-gray-400 flex-shrink-0" />
                            <span className="flex-1 truncate">{f.name}</span>
                            <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-600"><X size={11} /></button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
