// Lead Document Checklist — the canonical list of every document that
// might be required for a lead's NZ study/visa application. Status,
// date and notes per item are stored on the lead in the
// `document_checklist` JSON column, keyed by `id` below.
//
// `filename` is a suggested file-naming template. {FN}, {SN}, {LN} are
// replaced with the lead's first name, surname, and last-name (legacy)
// at render time so staff have a copy-paste-ready filename hint.

export const STATUSES = [
    { key: "not_applicable", label: "Not Applicable", chip: "bg-gray-100 text-gray-600 border-gray-200" },
    { key: "available",      label: "Available",      chip: "bg-amber-100 text-amber-800 border-amber-200" },
    { key: "in_progress",    label: "In Progress",    chip: "bg-purple-100 text-purple-800 border-purple-200" },
    { key: "uploaded",       label: "Uploaded",       chip: "bg-emerald-100 text-emerald-800 border-emerald-200" },
];
export const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.key, s.label]));
export const STATUS_CHIP  = Object.fromEntries(STATUSES.map((s) => [s.key, s.chip]));

// Per-section verification statuses used by the sequential lead-portal
// flow. Staff move sections through these from the Documents tab.
export const SECTION_STATUSES = {
    pending:          { label: "Awaiting upload",   chip: "bg-gray-100 text-gray-600 border-gray-200" },
    in_review:        { label: "Submitted",         chip: "bg-blue-100 text-blue-700 border-blue-200" },
    verified:         { label: "Verified",          chip: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    revisions_needed: { label: "Revisions needed",  chip: "bg-rose-100 text-rose-700 border-rose-200" },
};

// ── Department scoping ────────────────────────────────────────────────────
// Each section has a `scope` used by the (upcoming) 3-tab Documents browser
// (Sales · Education · Immigration):
//   'common'      → shows in ALL three department tabs (shared requirements
//                   like passport, birth certificate, TOR, police clearance)
//   'sales'       → only the Sales (leads) tab
//   'education'   → only the Education (students) tab
//   'immigration' → only the Immigration (cases) tab
//
// TO FINALISE THE COMMON SET: change any section's `scope` to 'common', and/or
// add new shared documents as items inside any `scope: 'common'` section
// (e.g. Personal Documents). Departments always see: common + their own scope.
// The existing per-lead Documents tab ignores `scope` and still shows all.
// Section order matters — it drives the visual order of the checklist on
// both the staff Documents tab and the public tracker. Offer & Academic
// leads because it's the first tranche of documents sales chases from a
// new student lead; agreements/info-form follow only once the offer is in.
export const CHECKLIST = [
    {
        key: "academic",
        scope: "education",
        section: "Offer and Academic Documents",
        items: [
            { id: "acad.cv", name: "Curriculum Vitae", filename: "CV-{FN}{SN}" },
            { id: "acad.offer_of_place", name: "Offer of Place", description: "Official letter from the New Zealand university.", filename: "OOP-{FN}{SN}" },
            { id: "acad.degree_diploma", name: "Degree Certificate or Diploma", filename: "CDPMA-{FN}{SN}" },
            { id: "acad.transcript", name: "Official Transcript of Records (TOR)", description: "From previous school(s) showing subjects, grades, and degree awarded.", filename: "TOR-{FN}{SN}" },
            { id: "acad.english_test", name: "PTE / IELTS Academic Test Result", filename: "PTE-{FN}{SN}" },
            { id: "acad.sop", name: "Statement of Purpose", description: "Explaining reason for studying in NZ, course relevance, and career goals.", filename: "SoP-{FN}{SN}" },
            { id: "acad.tuition_proof", name: "Proof of Tuition Fee Payment", description: "For applications already in NZ.", filename: "EOP-{FN}{SN}" },
        ],
    },
    {
        key: "agreements",
        scope: "sales",
        section: "Agreements",
        items: [
            { id: "agree.consultancy", name: "Consultancy Agreement", filename: "CA-{FN}{LN}", system: true },
            { id: "agree.engagement_english", name: "Engagement Agreement for English Review", filename: "Eng-{FN}{LN}", system: true },
        ],
    },
    {
        key: "information_form",
        scope: "sales",
        section: "Information Form",
        items: [
            { id: "info.svf", name: "SVF — Student Visa Form", filename: "SVF-{FN}{LN}" },
        ],
    },
    {
        key: "personal",
        scope: "common",
        section: "Personal Documents",
        items: [
            {
                id: "pers.passport",
                name: "Valid Passport (Original & Copy)",
                description: "Must be valid for the duration of study plus return date. Include clear copies of all identity pages and current visas/stamps.",
                filename: "PPT-{FN}{LN}-EXPddmmyyyy",
            },
            {
                id: "pers.passport_photos",
                name: "Passport Photos (2 digital images)",
                description: "900×1200 px and 2250×3000 px, 500 KB – 3 MB each, JPG, portrait, plain background.",
                filename: "FI-{FN}{SN}",
            },
            {
                id: "pers.medical",
                name: "Medical Certificate (Full Medical)",
                description: "From an INZ-approved panel physician.",
                filename: "MEDL-{FN}{SN}-ISSUEDddmmyyyy",
            },
            {
                id: "pers.police_clearance",
                name: "Police Clearance Certificate (NBI / PNP)",
                description: "Valid, issued within 12 months.",
                filename: "PCC-{FN}{SN}",
            },
        ],
    },
    {
        key: "immigration_forms",
        scope: "immigration",
        section: "Immigration Forms",
        items: [
            { id: "imm.inz1012", name: "Student Visa Application Form — INZ1012", filename: "INZ1012-{FN}{SN}" },
            { id: "imm.inz1226", name: "Student Visa Declaration — INZ1226",      filename: "INZ1226-{FN}{SN}" },
            { id: "imm.inz1014", name: "Financial Undertaking for Student (Sponsorship) — INZ1014", filename: "INZ1014-{FN}{SN}" },
        ],
    },
    {
        key: "employment_applicant",
        scope: "common",
        section: "Employment and Financial Documents (Applicant)",
        items: [
            { id: "appfin.coe", name: "Certificate of Employment / Work Reference", description: "From last employer — position, dates, duties.", filename: "COE-{FN}{SN}" },
            { id: "appfin.payslips", name: "Latest 3 Payslips", description: "From current or last employment.", filename: "PSLP-{FN}{SN}" },
            { id: "appfin.bank_statements", name: "Bank Statements — Last 6 Months (Applicant)", description: "Showing sufficient funds for tuition and living costs. For 18 months of study: minimum NZ$30,000 living funds.", filename: "BNKS-{FN}{SN}" },
            { id: "appfin.savings", name: "Proof of Savings / Fixed Deposits / Investments", filename: "PoS-{FN}{SN}" },
            { id: "appfin.property", name: "Property Ownership Documents", description: "Title deeds, tax declarations, or certificates.", filename: "POD-{FN}{SN}" },
            { id: "appfin.business_permit", name: "Business Permit / Registration", description: "Proof of business ownership or registration (if self-employed).", filename: "BusP-{FN}{SN}" },
        ],
    },
    {
        key: "employment_sponsor",
        scope: "common",
        section: "Employment and Financial Documents (Sponsor)",
        items: [
            { id: "spfin.bank_statements", name: "Sponsor's Bank Statements", description: "Last 6 months — sufficient funds for tuition + living costs.", filename: "SpBNKS-{FN}{SN}" },
            { id: "spfin.support_letter", name: "Sponsor's Letter of Support", description: "Confirming financial support and relationship to applicant.", filename: "SpSLet-{FN}{SN}" },
            { id: "spfin.passport", name: "Sponsor's Passport Copy", filename: "SpPPT-{FN}{SN}" },
            { id: "spfin.birth_cert", name: "Sponsor's Birth Certificate", filename: "SpBC-{FN}{SN}" },
            { id: "spfin.photos", name: "Photos with Sponsor", description: "Supporting relationship / proof of closeness.", filename: "SpPHOTO-{FN}{SN}" },
            { id: "spfin.business_permit", name: "Sponsor's Business Permit / Registration", filename: "SpBP-{FN}{SN}" },
            { id: "spfin.itr", name: "Income Tax Return (if self-employed)", filename: "SpITR-{FN}{SN}" },
            { id: "spfin.relationship_docs", name: "Government-Issued Relationship Documents", description: "PSA Marriage Cert, PSA Birth Cert, etc. proving relationship.", filename: "Depends on the document" },
        ],
    },
    {
        key: "partner",
        scope: "common",
        section: "Documents of Partner / Spouse",
        items: [
            { id: "part.passport",        name: "Passport of Partner",                            filename: "PartPPT-{FN}{SN}" },
            { id: "part.passport_photos", name: "Partner's Passport Photos (2 digital images)",   filename: "PartFI-{FN}{SN}" },
            { id: "part.police_clearance",name: "Police Clearance Certificate (NBI / PNP)",       filename: "PartPCC-{FN}{SN}" },
            { id: "part.birth_cert",      name: "Birth Certificate of Partner",                   filename: "PartBC-{FN}{SN}" },
        ],
    },
    {
        key: "partnership_proofs",
        scope: "common",
        section: "Proofs of Partnership",
        items: [
            { id: "prtn.timeline",        name: "Relationship Timeline", description: "Chronological summary of your relationship milestones.", filename: "RelTmln-{FN}{SN}" },
            { id: "prtn.marriage_cert",   name: "Marriage or Civil Union Certificates", description: "PSA-certified copy.", filename: "MC-{FN}{SN}" },
            { id: "prtn.children_bc",     name: "Birth Certificates of Children You Share", description: "PSA-certified copies.", filename: "ChBC-{FN}{SN}" },
            { id: "prtn.children_ppt",    name: "Passport of Any Children You Share", filename: "ChPPT-{FN}{SN}" },
            { id: "prtn.joint_property",  name: "Joint Ownership of Residential Property or Home Loan", description: "Title deeds, mortgage agreements, loan statements.", filename: "JointProp-{FN}{SN}" },
            { id: "prtn.joint_utilities", name: "Joint Utility Accounts", description: "Power, water, internet, phone bills in both names.", filename: "JointUtil-{FN}{SN}" },
            { id: "prtn.shared_mail",     name: "Mail Sent to Shared Address", description: "Letters, bills, statements addressed to both.", filename: "Mails-{FN}{SN}" },
            { id: "prtn.joint_bank",      name: "Joint Bank Accounts", description: "Frequent shared transactions.", filename: "JointBnk-{FN}{SN}" },
            { id: "prtn.joint_assets",    name: "Joint Ownership of Any Assets", description: "Vehicles, appliances, etc.", filename: "JointOwn-{FN}{SN}" },
            { id: "prtn.joint_credit",    name: "Joint Credit Cards or Hire Purchase Agreements", filename: "JointCC-{FN}{SN}" },
            { id: "prtn.gov_partnership", name: "Government Documents Declaring Partnership", description: "SSS, PhilHealth, GSIS, etc.", filename: "GovDocs-{FN}{SN}" },
            { id: "prtn.fin_agreements",  name: "Mutually Agreed Financial Arrangements", description: "Written agreements showing shared financial responsibilities.", filename: "FinAgr-{FN}{SN}" },
            { id: "prtn.correspondence",  name: "Correspondence Between Partners", description: "Cards, letters, emails, chat records.", filename: "Corres-{FN}{SN}" },
            { id: "prtn.social_media",    name: "Social Media Posts or Photos Together", filename: "SocMed-{FN}{SN}" },
            { id: "prtn.events",          name: "Events Attended Together", description: "Invitations or photos from birthdays, weddings, etc.", filename: "Events-{FN}{SN}" },
            { id: "prtn.travels",         name: "Travels Together", description: "Flight tickets, hotel bookings, travel photos.", filename: "Travels-{FN}{SN}" },
            { id: "prtn.letters_support", name: "Letters of Support Recognizing Your Partnership", description: "From family, neighbors, friends.", filename: "LetSup-{FN}{SN}" },
        ],
    },
    {
        key: "additional",
        scope: "common",
        section: "Additional Documents",
        items: [
            { id: "add.previous_visas", name: "Previous Visa Copies", description: "If applicable." },
            { id: "add.other_certs",    name: "Other Relevant Certificates", description: "Awards, diplomas, professional certificates." },
        ],
    },
];

export const IMPORTANT_NOTES = [
    "Non-English documents must include certified English translations.",
    "Originals or certified true copies should be submitted as requested.",
    "Ensure all documents are legible and consistent.",
    "Include alternatives where documents cannot be provided.",
];

// The "current" section is the first one that hasn't been verified yet.
// Everything before it = unlocked + completed. Everything after = locked.
export function currentSectionIndex(verifications = {}) {
    for (let i = 0; i < CHECKLIST.length; i++) {
        if (verifications[CHECKLIST[i].key]?.status !== "verified") return i;
    }
    return CHECKLIST.length; // all sections verified
}

export function isSectionUnlocked(sectionIndex, verifications = {}) {
    return sectionIndex <= currentSectionIndex(verifications);
}

// Expand {FN}, {SN}, {LN} placeholders in a filename template.
export function renderFilename(template, lead) {
    if (!template) return "";
    const fn = (lead?.first_name || "").replace(/\s+/g, "");
    const ln = (lead?.last_name  || "").replace(/\s+/g, "");
    const sn = ln.toUpperCase();
    return template
        .replace(/\{FN\}/g, fn || "FirstName")
        .replace(/\{LN\}/g, ln || "FamilyName")
        .replace(/\{SN\}/g, sn || "SURNAME");
}
