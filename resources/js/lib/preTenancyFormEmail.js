// Builds the "Pre-tenancy form" email shown when an applicant is moved to the
// `pre_tenancy_form_sent` onboarding stage. The link points to the NATIVE
// per-submission system form (submission.pre_tenancy_form_url) — the Google
// Form is fully retired. Recipient name and house address are pulled from the
// submission / linked property where available, falling back to placeholders.

const SIGNER_NAME = "Janille";
const FOOTER_PHONE = "+64 21 227 8999";
const CONTACT_EMAIL = "exaltinfo@luvep.com";
const SIGN_OFF = "EXALT PROPERTY MANAGEMENT LTD";

const firstName = (s) => {
    const preferred = (s.preferred_name || "").trim();
    if (preferred) return preferred;
    const legal = (s.full_legal_name || "").trim();
    return legal ? legal.split(" ")[0] : "there";
};

export function buildPreTenancyFormEmail(submission = {}) {
    const property = submission.property || {};

    const name = firstName(submission);
    const address = property.address || submission.property_interested || "the property";
    const formUrl = submission.pre_tenancy_form_url || "";

    const subject = "Next Step for Your Room Application";

    const body = `Hi ${name},

Thanks for confirming your interest in proceeding with the room at ${address}. We're happy to hear that you'd like to move forward with the ensuite room at ${address}. ✨

As the next step, please complete the pre-tenancy form below so we can prepare your tenancy documents:

Exalt Property Pre-Tenancy Form link: ${formUrl}

Once submitted, we'll review everything and send the agreement via email for signing. Please let us know once you've completed the form.

Looking forward to having you with us.

Ngā mihi,
${SIGNER_NAME}
${SIGN_OFF}
📞 ${FOOTER_PHONE} | ✉️ ${CONTACT_EMAIL}`;

    return { subject, body, recipient: submission.email || "" };
}
