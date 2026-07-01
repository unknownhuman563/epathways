import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { User, Save } from "lucide-react";

// Case Profile "Personal" tab — edit the applicant's personal details.
// Posts to /portal/immigration/cases/{id}/personal (CaseProfileController).

const IC = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:border-gray-400 outline-none transition-colors";

const GENDERS = ["", "Male", "Female", "Other", "Prefer not to say"];
const MARITAL = ["", "Single", "Married", "De facto", "Divorced", "Widowed", "Separated"];

export default function PersonalTab({ lead = {} }) {
    const { data, setData, post, processing, errors } = useForm({
        first_name:        lead.first_name || "",
        middle_name:       lead.middle_name || "",
        last_name:         lead.last_name || "",
        suffix:            lead.suffix || "",
        gender:            lead.gender || "",
        marital_status:    lead.marital_status || "",
        dob:               lead.dob || "",
        email:             lead.email || "",
        phone:             lead.phone || "",
        citizenship:       lead.citizenship || "",
        residence_country: lead.residence_country || "",
        passport_number:   lead.passport_number || "",
        passport_expiry:   lead.passport_expiry || "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(`/portal/immigration/cases/${lead.id}/personal`, {
            preserveScroll: true,
            onSuccess: () => toast.success("Personal details saved."),
            onError: () => toast.error("Please fix the highlighted fields."),
        });
    };

    return (
        <form onSubmit={submit} className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 inline-flex items-center gap-2">
                    <User size={13} className="text-gray-400" /> Personal details
                </h3>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                    <Save size={13} /> {processing ? "Saving…" : "Save changes"}
                </button>
            </div>

            {Object.keys(errors).length > 0 && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[12px]">
                    <ul className="list-disc pl-4 space-y-0.5">
                        {Object.values(errors).map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="First name" required>
                    <input type="text" required value={data.first_name} onChange={(e) => setData("first_name", e.target.value)} className={IC} maxLength={120} />
                </Field>
                <Field label="Middle name">
                    <input type="text" value={data.middle_name} onChange={(e) => setData("middle_name", e.target.value)} className={IC} maxLength={120} />
                </Field>
                <Field label="Last name">
                    <input type="text" value={data.last_name} onChange={(e) => setData("last_name", e.target.value)} className={IC} maxLength={120} />
                </Field>

                <Field label="Suffix">
                    <input type="text" value={data.suffix} onChange={(e) => setData("suffix", e.target.value)} className={IC} maxLength={20} placeholder="Jr., Sr., III…" />
                </Field>
                <Field label="Gender">
                    <select value={data.gender} onChange={(e) => setData("gender", e.target.value)} className={IC}>
                        {GENDERS.map((g) => <option key={g} value={g}>{g || "—"}</option>)}
                    </select>
                </Field>
                <Field label="Marital status">
                    <select value={data.marital_status} onChange={(e) => setData("marital_status", e.target.value)} className={IC}>
                        {MARITAL.map((m) => <option key={m} value={m}>{m || "—"}</option>)}
                    </select>
                </Field>

                <Field label="Date of birth">
                    <input type="date" value={data.dob || ""} onChange={(e) => setData("dob", e.target.value)} className={IC} />
                </Field>
                <Field label="Email" required>
                    <input type="email" required value={data.email} onChange={(e) => setData("email", e.target.value)} className={IC} maxLength={255} />
                </Field>
                <Field label="Phone">
                    <input type="text" value={data.phone} onChange={(e) => setData("phone", e.target.value)} className={IC} maxLength={40} />
                </Field>

                <Field label="Citizenship">
                    <input type="text" value={data.citizenship} onChange={(e) => setData("citizenship", e.target.value)} className={IC} maxLength={120} />
                </Field>
                <Field label="Country of residence">
                    <input type="text" value={data.residence_country} onChange={(e) => setData("residence_country", e.target.value)} className={IC} maxLength={120} />
                </Field>
                <div className="hidden lg:block" />

                <Field label="Passport number">
                    <input type="text" value={data.passport_number} onChange={(e) => setData("passport_number", e.target.value)} className={IC} maxLength={60} />
                </Field>
                <Field label="Passport expiry">
                    <input type="date" value={data.passport_expiry || ""} onChange={(e) => setData("passport_expiry", e.target.value)} className={IC} />
                </Field>
            </div>
        </form>
    );
}

function Field({ label, required, children }) {
    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}
