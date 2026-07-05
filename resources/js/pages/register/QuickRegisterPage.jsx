import { useForm, Head } from "@inertiajs/react";
import { Upload, FileText, X, CheckCircle, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import heroBg from "@assets/banner/register.png";

// Standalone registration page — collects a richer applicant profile so the
// team can assess + prepare a proposal before the consultation. Posts to
// /register (storeRegistration). The detailed assessment-style version lives
// at /register/full.

const GENDERS = ['Male', 'Female'];
const CIVIL_STATUSES = ['Single', 'Married', 'Widowed', 'Separated/Divorced', 'Single with Partner'];
const ATTAINMENTS = [
    'Doctorate (PhD / EdD / DBA)',
    "Master's Degree",
    'Postgraduate Diploma / Certificate',
    "Bachelor's Degree",
    'Associate Degree',
    'Technical-Vocational (TESDA / TVET)',
    'High School Graduate',
    'Other',
];
const PATHWAYS = ['Study + Work Pathways', 'Work Pathway', 'Other'];
const BRING_CHILDREN = ['Yes', 'No', 'Other'];

export default function QuickRegisterPage() {
    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        // Personal
        first_name: '', last_name: '', email: '', phone: '',
        age: '', gender: '', marital_status: '', country_of_origin: '',
        // Education & interest
        highest_attainment: '', bachelor_course: '', occupation: '',
        pathway_interest: '', pathway_interest_other: '',
        // Partner / spouse (married)
        partner_full_name: '', partner_age: '', partner_education_level: '',
        partner_education_level_other: '', partner_work_experience: '', partner_years_experience: '',
        // Children
        number_of_children: '', children_ages: '', bring_children: '', bring_children_other: '',
        // Additional
        advisor_question: '',
        // Documents
        cv_files: [], passport_files: [], diploma_files: [], transcript_files: [],
        // Consents (map to the two server-required flags)
        terms_accepted: false, declaration_accepted: false,
    });

    const isMarried = data.marital_status === 'Married';
    const isBachelor = data.highest_attainment === "Bachelor's Degree";

    const submit = (e) => {
        e.preventDefault();
        // Guard against oversized uploads so the visitor gets a clear message
        // instead of a raw "413 Content Too Large" from the server.
        const allFiles = [...(data.cv_files || []), ...(data.passport_files || []), ...(data.diploma_files || []), ...(data.transcript_files || [])];
        const MB = 1024 * 1024;
        const tooBig = allFiles.find((f) => f.size > 10 * MB);
        if (tooBig) {
            alert(`"${tooBig.name}" is larger than 10MB. Please upload a smaller file (max 10MB each).`);
            return;
        }
        const total = allFiles.reduce((sum, f) => sum + (f.size || 0), 0);
        if (total > 200 * MB) {
            alert('Your documents total more than 200MB. Please remove some files or upload smaller versions, then try again.');
            return;
        }
        post('/register', { forceFormData: true });
    };

    const IC = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-[#282728] bg-white focus:border-[#282728] focus:ring-1 focus:ring-[#282728] outline-none transition-all placeholder:text-gray-400";
    const LBL = "block text-[10.5px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-1.5";
    const err = (k) => errors[k] && <p className="text-[11px] text-red-500 mt-1">{errors[k]}</p>;

    return (
        <div className="min-h-screen bg-[#f6f6f5] font-urbanist text-[#282728] flex flex-col">
            <Head title="Register — ePathways" />
            <Navbar />

            {/* Hero banner — constrained to the form's width so its margins match */}
            <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 pt-8 md:pt-10">
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                    <img src={heroBg} alt="Register with ePathways" className="w-full h-auto block" />
                </div>
            </div>

            {/* Welcome copy — same width / margin as the banner + form */}
            <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 pt-8">
                <span className="text-[11px] font-bold tracking-[0.32em] uppercase text-[#436235]">Registration</span>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-2 leading-[1.12] text-[#282728]">Kia ora! Welcome to ePathways</h1>
                <p className="mt-4 text-gray-600 leading-relaxed">
                    Helping people turn their New Zealand dreams into reality — please take a few minutes to complete this registration form so we can get to know you, accurately assess your application, and keep our records up to date. The details you share allow our advisers to tailor the most suitable study, work, and migration pathways to your background and goals, and to prepare personalised guidance and opportunities ahead of your consultation.
                </p>
            </div>

            {/* Form */}
            <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 mt-6 pb-16">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-9">
                    {wasSuccessful ? (
                        <div className="py-12 text-center flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-[#282728]/[0.06] flex items-center justify-center mb-5">
                                <CheckCircle size={30} className="text-[#282728]" />
                            </div>
                            <h2 className="text-2xl font-semibold tracking-tight">You're registered</h2>
                            <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">Thank you — a specialist will review your details and reach out shortly to prepare your proposal.</p>
                            <a href="/" className="mt-7 px-6 py-2.5 rounded-lg bg-[#282728] text-white text-sm font-semibold hover:bg-black transition-colors">Back to home</a>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-9">

                            {/* Personal Information */}
                            <Section title="Personal Information">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="First name *">
                                        <input type="text" required value={data.first_name} onChange={e => setData('first_name', e.target.value)} className={IC} />
                                        {err('first_name')}
                                    </Field>
                                    <Field label="Last name *">
                                        <input type="text" required value={data.last_name} onChange={e => setData('last_name', e.target.value)} className={IC} />
                                        {err('last_name')}
                                    </Field>
                                    <Field label="Email *">
                                        <input type="email" required value={data.email} onChange={e => setData('email', e.target.value)} className={IC} />
                                        {err('email')}
                                    </Field>
                                    <Field label="Phone *">
                                        <input type="tel" required value={data.phone} onChange={e => setData('phone', e.target.value)} className={IC} placeholder="+63 …" />
                                        {err('phone')}
                                    </Field>
                                    <Field label="Age">
                                        <input type="number" min={0} max={120} value={data.age} onChange={e => setData('age', e.target.value)} className={IC} />
                                    </Field>
                                    <Field label="Gender">
                                        <select value={data.gender} onChange={e => setData('gender', e.target.value)} className={IC}>
                                            <option value="">Select</option>
                                            {GENDERS.map(g => <option key={g}>{g}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Civil status">
                                        <select value={data.marital_status} onChange={e => setData('marital_status', e.target.value)} className={IC}>
                                            <option value="">Select</option>
                                            {CIVIL_STATUSES.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Country of origin">
                                        <input type="text" value={data.country_of_origin} onChange={e => setData('country_of_origin', e.target.value)} className={IC} />
                                    </Field>
                                </div>
                            </Section>

                            {/* Education & Interest */}
                            <Section title="Education & Interest">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Current education attainment *">
                                        <select required value={data.highest_attainment} onChange={e => setData('highest_attainment', e.target.value)} className={IC}>
                                            <option value="">Select attainment</option>
                                            {ATTAINMENTS.map(a => <option key={a}>{a}</option>)}
                                        </select>
                                        {err('highest_attainment')}
                                    </Field>
                                    {isBachelor && (
                                        <Field label="If Bachelor's Degree, what course / program?">
                                            <input type="text" value={data.bachelor_course} onChange={e => setData('bachelor_course', e.target.value)} className={IC} placeholder="e.g. BS Nursing" />
                                        </Field>
                                    )}
                                    <Field label="Current job / occupation">
                                        <input type="text" value={data.occupation} onChange={e => setData('occupation', e.target.value)} className={IC} />
                                    </Field>
                                    <Field label="What pathway are you interested in?">
                                        <select value={data.pathway_interest} onChange={e => setData('pathway_interest', e.target.value)} className={IC}>
                                            <option value="">Select pathway</option>
                                            {PATHWAYS.map(p => <option key={p}>{p}</option>)}
                                        </select>
                                    </Field>
                                    {data.pathway_interest === 'Other' && (
                                        <Field label="Other pathway">
                                            <input type="text" value={data.pathway_interest_other} onChange={e => setData('pathway_interest_other', e.target.value)} className={IC} />
                                        </Field>
                                    )}
                                </div>
                            </Section>

                            {/* Partner / Spouse — married only */}
                            {isMarried && (
                                <Section title="Partner / Spouse Information">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="Full name of partner / spouse">
                                            <input type="text" value={data.partner_full_name} onChange={e => setData('partner_full_name', e.target.value)} className={IC} />
                                        </Field>
                                        <Field label="Age of partner / spouse">
                                            <input type="number" min={0} max={120} value={data.partner_age} onChange={e => setData('partner_age', e.target.value)} className={IC} />
                                        </Field>
                                        <Field label="Partner / spouse current education level">
                                            <select value={data.partner_education_level} onChange={e => setData('partner_education_level', e.target.value)} className={IC}>
                                                <option value="">Select level</option>
                                                {ATTAINMENTS.map(a => <option key={a}>{a}</option>)}
                                            </select>
                                        </Field>
                                        {data.partner_education_level === 'Other' && (
                                            <Field label="Other — partner education level">
                                                <input type="text" value={data.partner_education_level_other} onChange={e => setData('partner_education_level_other', e.target.value)} className={IC} />
                                            </Field>
                                        )}
                                        <Field label="Partner / spouse current work experience">
                                            <input type="text" value={data.partner_work_experience} onChange={e => setData('partner_work_experience', e.target.value)} className={IC} />
                                        </Field>
                                        <Field label="Partner / spouse years of experience">
                                            <input type="text" value={data.partner_years_experience} onChange={e => setData('partner_years_experience', e.target.value)} className={IC} placeholder="e.g. 5 years" />
                                        </Field>
                                    </div>
                                </Section>
                            )}

                            {/* Children — only meaningful for married registrants
                                (or civil statuses that imply a partnership).
                                Single registrants skip the section entirely. */}
                            {isMarried && (
                                <Section title="Children">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="Number of children (if any)">
                                            <input type="number" min={0} max={30} value={data.number_of_children} onChange={e => setData('number_of_children', e.target.value)} className={IC} />
                                        </Field>
                                        <Field label="Child age(s)" hint="Separate by commas, e.g. 5, 8, 12">
                                            <input type="text" value={data.children_ages} onChange={e => setData('children_ages', e.target.value)} className={IC} placeholder="5, 8, 12" />
                                        </Field>
                                        <Field label="Will you bring your children?">
                                            <select value={data.bring_children} onChange={e => setData('bring_children', e.target.value)} className={IC}>
                                                <option value="">Select</option>
                                                {BRING_CHILDREN.map(o => <option key={o}>{o}</option>)}
                                            </select>
                                        </Field>
                                        {data.bring_children === 'Other' && (
                                            <Field label="Other — will you bring your children?">
                                                <input type="text" value={data.bring_children_other} onChange={e => setData('bring_children_other', e.target.value)} className={IC} />
                                            </Field>
                                        )}
                                    </div>
                                </Section>
                            )}

                            {/* Additional */}
                            <Section title="Additional Information (Optional)">
                                <Field label="Do you have any specific question for our advisor?" hint="We'll try to address it during the consultation.">
                                    <textarea rows={4} value={data.advisor_question} onChange={e => setData('advisor_question', e.target.value)} className={`${IC} resize-y`} placeholder="Write your questions here…" />
                                </Field>
                            </Section>

                            {/* Documents — all optional. Attaching any of these
                                helps the adviser prepare, but the meeting can
                                still be booked without them. */}
                            <Section title="Documents (Optional)" subtitle="Upload any of these to help us assess your qualifications before the meeting. You can also send them later.">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FilePick label="Attach CV" files={data.cv_files} onChange={f => setData('cv_files', f)} />
                                    <FilePick label="Passport" files={data.passport_files} onChange={f => setData('passport_files', f)} />
                                    <FilePick label="Diploma" files={data.diploma_files} onChange={f => setData('diploma_files', f)} />
                                    <FilePick label="Transcript of Record" files={data.transcript_files} onChange={f => setData('transcript_files', f)} />
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">PDF, DOC/DOCX, XLS/CSV, JPG/JPEG, PNG, GIF — max 10 files each.</p>
                            </Section>

                            {/* Consents */}
                            <div className="space-y-3 pt-2">
                                <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input type="checkbox" required checked={data.terms_accepted} onChange={e => setData('terms_accepted', e.target.checked)} className="mt-0.5 accent-[#282728] w-4 h-4" />
                                    <span className="text-[12px] text-gray-600 leading-relaxed">I consent to receive follow-up communication regarding this consultation, including reminders and related offers from ePathways.</span>
                                </label>
                                <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input type="checkbox" required checked={data.declaration_accepted} onChange={e => setData('declaration_accepted', e.target.checked)} className="mt-0.5 accent-[#282728] w-4 h-4" />
                                    <span className="text-[12px] text-gray-600 leading-relaxed">I understand that the consultation may be recorded for future viewing purposes.</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#282728] text-white text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Submitting…' : <>Submit registration <ArrowRight size={16} /></>}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}

function Section({ title, subtitle, children }) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#282728]">{title}</h2>
                {subtitle && <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">{subtitle}</p>}
                <div className="h-px bg-gray-100 mt-3" />
            </div>
            {children}
        </section>
    );
}

function Field({ label, hint, children }) {
    return (
        <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-1.5">{label}</label>
            {children}
            {hint && <p className="text-[10.5px] text-gray-400 mt-1">{hint}</p>}
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
                <input id={id} type="file" multiple accept=".pdf,.doc,.docx,.xls,.csv,.jpg,.jpeg,.png,.gif" className="hidden" onChange={e => { if (e.target.files?.length) add(e.target.files); e.target.value = ''; }} />
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
