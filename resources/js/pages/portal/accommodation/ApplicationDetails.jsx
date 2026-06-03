import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, Trash2 } from "lucide-react";

function statusBadgeClass(status) {
    switch (status) {
        case "new":
            return "bg-blue-50 text-blue-700";
        case "reviewed":
            return "bg-amber-50 text-amber-700";
        case "shortlisted":
            return "bg-emerald-50 text-emerald-700";
        case "declined":
            return "bg-gray-100 text-gray-500";
        default:
            return "bg-gray-100 text-gray-500";
    }
}

function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function displayBool(value) {
    if (value === true || value === 1 || value === "1") return "Yes";
    if (value === false || value === 0 || value === "0") return "No";
    return "—";
}

function displayValue(value) {
    if (value === null || value === undefined || value === "") return "—";
    return value;
}

/** A single label/value row inside a section card */
function Row({ label, value }) {
    return (
        <div className="flex gap-4 py-2.5 border-b border-gray-50 last:border-0">
            <dt className="w-48 shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wide pt-0.5">
                {label}
            </dt>
            <dd className="flex-1 text-sm text-gray-800 break-words">{value}</dd>
        </div>
    );
}

/** A grouped section card */
function Section({ title, children }) {
    return (
        <div className="rounded-3xl border border-gray-50 bg-white p-6 shadow-sm space-y-1">
            <h2 className="text-sm font-semibold text-rose-600 uppercase tracking-wide mb-3">
                {title}
            </h2>
            <dl className="divide-y divide-gray-50">{children}</dl>
        </div>
    );
}

export default function ApplicationDetails({ submission, statuses = [] }) {
    const handleStatusChange = (e) => {
        router.patch(
            `/portal/accommodation/applications/${submission.id}/status`,
            { status: e.target.value },
            { preserveScroll: true }
        );
    };

    const handleDelete = () => {
        if (confirm(`Delete lead from "${submission.full_legal_name}"? This cannot be undone.`)) {
            router.delete(`/portal/accommodation/applications/${submission.id}`);
        }
    };

    // Helper: show visa/nationality with "Other" fallback
    const visaStatus =
        submission.visa_status === "Other" && submission.visa_status_other
            ? `Other — ${submission.visa_status_other}`
            : displayValue(submission.visa_status);

    const nationality =
        submission.nationality === "Other" && submission.nationality_other
            ? `Other — ${submission.nationality_other}`
            : displayValue(submission.nationality);

    const rentFunding =
        submission.rent_funding === "Other" && submission.rent_funding_other
            ? `Other — ${submission.rent_funding_other}`
            : displayValue(submission.rent_funding);

    const employmentStatus =
        submission.employment_status === "Other" && submission.employment_status_other
            ? `Other — ${submission.employment_status_other}`
            : displayValue(submission.employment_status);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Head title={`Lead — ${submission.full_legal_name}`} />

            {/* Back link */}
            <Link
                href="/portal/accommodation/applications"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-600 transition-colors"
            >
                <ArrowLeft size={15} />
                Back to leads
            </Link>

            {/* Page header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {submission.full_legal_name}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {submission.preferred_name && (
                            <span className="mr-2">"{submission.preferred_name}"</span>
                        )}
                        Submitted {formatDate(submission.created_at)}
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Form type badge (cold / hot) */}
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            submission.form_type === "hot" ? "bg-rose-50 text-rose-700" : "bg-sky-50 text-sky-700"
                        }`}
                    >
                        {submission.form_type || "cold"}
                    </span>

                    {/* Status badge */}
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(submission.status)}`}
                    >
                        {submission.status}
                    </span>

                    {/* Status changer */}
                    <select
                        defaultValue={submission.status}
                        onChange={handleStatusChange}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 capitalize"
                    >
                        {statuses.map((s) => (
                            <option key={s} value={s} className="capitalize">
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                        ))}
                    </select>

                    {/* Delete */}
                    <button
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-100 transition-colors"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                </div>
            </div>

            {/* Section 1 — Personal Details */}
            <Section title="Personal Details">
                <Row label="Full legal name" value={displayValue(submission.full_legal_name)} />
                <Row label="ID / Licence number" value={displayValue(submission.id_number)} />
                <Row label="Visa status" value={visaStatus} />
                <Row label="Nationality" value={nationality} />
                <Row label="Preferred name" value={displayValue(submission.preferred_name)} />
                <Row label="Email" value={displayValue(submission.email)} />
                <Row label="Mobile" value={displayValue(submission.mobile)} />
                <Row label="Age" value={displayValue(submission.age)} />
            </Section>

            {/* Section 2 — Property & Room Interest */}
            <Section title="Property & Room Interest">
                {submission.property_interested && (
                    <Row label="Property of interest" value={submission.property_interested} />
                )}
                <Row label="Room type" value={displayValue(submission.room_type_interest)} />
                <Row label="Preferred start date" value={formatDate(submission.tenancy_start_date)} />
                <Row label="Stay duration" value={displayValue(submission.stay_duration)} />
            </Section>

            {/* Section 3 — Occupancy */}
            <Section title="Occupancy">
                <Row label="Occupants" value={displayValue(submission.occupants)} />
                <Row label="Occupant ages" value={displayValue(submission.occupant_ages)} />
                <Row label="Children" value={displayBool(submission.has_children)} />
                <Row label="Children ages" value={displayValue(submission.children_ages)} />
                <Row label="Pets" value={displayBool(submission.has_pets)} />
                <Row label="Pet details" value={displayValue(submission.pet_details)} />
            </Section>

            {/* Section 4 — Employment / Study */}
            <Section title="Employment / Study">
                <Row label="Rent funding" value={rentFunding} />
                <Row label="Current status" value={employmentStatus} />
            </Section>

            {/* Section 5 — Rental Background */}
            <Section title="Rental Background">
                <Row label="Current address" value={displayValue(submission.current_address)} />
                <Row label="Rented before" value={displayBool(submission.has_rented_before)} />
                <Row label="Time at current address" value={displayValue(submission.current_address_duration)} />
                <Row label="Living situation" value={displayValue(submission.living_situation)} />
                <Row label="Reason for moving" value={displayValue(submission.reason_for_moving)} />
            </Section>

            {/* Section 6 — Lifestyle & Compatibility */}
            <Section title="Lifestyle & Compatibility">
                <Row label="Smokes / vapes" value={displayBool(submission.smokes_or_vapes)} />
                <Row label="Drinks alcohol" value={displayValue(submission.drinks_alcohol)} />
                <Row label="Work hours" value={displayValue(submission.work_hours)} />
                <Row label="Flatmate description" value={displayValue(submission.flatmate_description)} />
            </Section>

            {/* Section 7 — Viewing Availability */}
            <Section title="Viewing Availability">
                <Row label="Available within 7 days" value={displayBool(submission.viewing_available_7days)} />
                <Row label="Preferred viewing time" value={displayValue(submission.preferred_viewing_time)} />
            </Section>

            {/* Section 8 — Declaration & Consent */}
            <Section title="Declaration & Consent">
                <Row label="Confirmed accurate" value={displayBool(submission.confirm_accurate)} />
                <Row label="Consent to collection" value={displayBool(submission.consent_collection)} />
            </Section>
        </div>
    );
}
