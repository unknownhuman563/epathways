import { ClipboardList, Send, ExternalLink } from "lucide-react";
import { Link } from "@inertiajs/react";

const VISA_LABEL = {
    resident: "Resident Visa (SMC)",
    work:     "Work Visa (AEWV)",
    student:  "Student Visa",
    visitor:  "Visitor Visa",
};

const FIELD_GROUPS = {
    resident: [
        { title: "Personal", fields: ["first_name", "last_name", "dob", "gender", "nationality", "email", "phone"] },
        { title: "Passport & visa", fields: ["passport_number", "passport_expiry", "current_visa_type", "nz_arrival_date"] },
        { title: "Employment", fields: ["job_title", "employment_type", "hourly_rate"] },
        { title: "Qualifications", fields: ["highest_qualification", "qualification_institution", "nzqa_status"] },
    ],
    work: [
        { title: "Identity", fields: ["first_name", "family_name", "dob", "gender", "country_of_citizenship", "email", "phone"] },
        { title: "Job offer", fields: ["current_job_title", "current_employer_name", "current_job_start"] },
        { title: "NZ immigration history", fields: ["current_country", "previous_nz_visa", "australian_pr"] },
    ],
    student: [
        { title: "Identity", fields: ["first_name", "family_name", "dob", "gender", "country_of_citizenship", "email", "phone"] },
        { title: "Study plan", fields: ["programmes", "school_name", "study_period_from", "study_period_to", "tuition_fee_nzd"] },
        { title: "Funds", fields: ["available_funds", "has_sponsor", "sponsor_relationship"] },
    ],
    visitor: [
        { title: "Identity", fields: ["first_name", "family_name", "dob", "gender", "country_of_citizenship", "email", "phone", "town_city", "region"] },
        { title: "Visit details", fields: ["purpose_of_visit", "intended_stay_length", "intended_from", "intended_to"] },
        { title: "Funds", fields: ["travel_funds_description", "can_provide_statements"] },
    ],
};

export default function AssessmentTab({ lead, intake }) {
    if (! intake) {
        return <EmptyState lead={lead} />;
    }

    const { type, data } = intake;
    const groups = FIELD_GROUPS[type] || FIELD_GROUPS.work;

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h2 className="text-base font-bold text-gray-900">Visa assessment submission</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {VISA_LABEL[type] || type} · submitted {formatDate(data.created_at)}
                        {data.intake_id && <span className="ml-2 font-mono text-gray-400">{data.intake_id}</span>}
                    </p>
                </div>
                {data.assessment_id && (
                    <Link
                        href={type === "resident"
                            ? `/admin/immigration/resident-intakes/${data.id}`
                            : `/portal/immigration/intakes/${type}/${data.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                        Open full intake <ExternalLink size={11} />
                    </Link>
                )}
            </div>

            {groups.map((group) => (
                <SectionCard key={group.title} title={group.title}>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                        {group.fields.map((field) => (
                            <Field key={field} label={prettyLabel(field)} value={data[field]} />
                        ))}
                    </dl>
                </SectionCard>
            ))}
        </div>
    );
}

function EmptyState({ lead }) {
    return (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <ClipboardList size={32} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm font-semibold text-gray-700">No assessment data on file</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                This case was created from a sales lead, not from a public visa-interest form. To gather a full intake,
                send the client an assessment form.
            </p>
            <button
                type="button"
                disabled
                title="Send assessment — wired by Build 11.E"
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold border border-gray-200 bg-white text-gray-500 cursor-not-allowed"
            >
                <Send size={12} /> Send Assessment Form
            </button>
        </div>
    );
}

function SectionCard({ title, children }) {
    return (
        <section className="bg-white border border-gray-100 rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">{title}</h3>
            {children}
        </section>
    );
}

function Field({ label, value }) {
    return (
        <div className="min-w-0">
            <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">{label}</dt>
            <dd className="text-sm text-gray-900 mt-0.5 truncate">{formatValue(value)}</dd>
        </div>
    );
}

const prettyLabel = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—";

function formatValue(v) {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (Array.isArray(v)) return v.length ? `${v.length} entr${v.length === 1 ? "y" : "ies"}` : "—";
    if (typeof v === "object") return "—";
    return String(v);
}
