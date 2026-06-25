// Builds the static "Post-viewing follow-up" email shown when an applicant is
// moved to the `post_viewing_followup` onboarding stage. Like the viewing
// booking email, the automation is not wired up yet — this only renders a
// preview. Recipient name and house address are pulled from the submission /
// linked property where available, falling back to placeholders.

const CONTACT_NAME = "Janille";
const CONTACT_PHONE = "+64 21 280 4611";
const FOOTER_PHONE = "+64 21 227 8999";
const CONTACT_EMAIL = "exaltinfo@epathways.co.nz";
const SIGN_OFF = "EXALT PROPERTY MANAGEMENT LTD";

const firstName = (s) => {
    const preferred = (s.preferred_name || "").trim();
    if (preferred) return preferred;
    const legal = (s.full_legal_name || "").trim();
    return legal ? legal.split(" ")[0] : "there";
};

export function buildPostViewingFollowupEmail(submission = {}) {
    const property = submission.property || {};

    const name = firstName(submission);
    const address = property.address || submission.property_interested || "the property";

    const subject = "Follow-Up After Your Viewing";

    const body = `Hey ${name},

Thanks again for coming to the viewing today.

Just checking in to see if you'd be keen to proceed with the room at ${address}.

If you would like to move forward, please reply to this email to confirm, and we'll send through the pre-tenancy form as the next step of the process.

Feel free to flick ${CONTACT_NAME} a message or call directly at ${CONTACT_PHONE} if you have any questions.

Ngā mihi,

${SIGN_OFF}
📞 ${FOOTER_PHONE} | ✉️ ${CONTACT_EMAIL}`;

    return { subject, body, recipient: submission.email || "" };
}
