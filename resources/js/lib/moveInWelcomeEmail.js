// Builds the static "Move-in welcome" email associated with the `moved_in`
// onboarding stage (reached via the Convert to Tenant flow). The automation is
// not wired up yet — this is a preview only. Recipient name, home address, and
// the property's Wi-Fi password / passcode are pulled from the submission +
// linked property where available, falling back to placeholders.

const CONTACT_NAME = "Janille";
const CONTACT_PHONE = "+64 21 280 4611";
const CONTACT_EMAIL = "exaltinfo@epathways.co.nz";
const SIGN_OFF = "EXALT PROPERTY MANAGEMENT LTD";

const firstName = (s) => {
    const preferred = (s.preferred_name || "").trim();
    if (preferred) return preferred;
    const legal = (s.full_legal_name || "").trim();
    return legal ? legal.split(" ")[0] : "there";
};

export function buildMoveInWelcomeEmail(submission = {}) {
    const property = submission.property || {};

    const name = firstName(submission);
    const address = property.address || submission.property_interested || "your new home";
    const wifi = property.internet_passcode || "—";
    const passcode = property.house_code || "—";

    const subject = `Welcome to ${address}`;

    const body = `Kia Ora ${name},

Welcome to ${address}!

Your payment has now been confirmed, and we're excited to have you moving in.
Below are your move-in details and important property information:

Wi-Fi Password:
• ${wifi}

Property Passcode:
• ${passcode}

Group Chat:
• We will be adding you to the ${address} group chat today.
• This group chat will be used for property-related updates, announcements, and general communication.

Current Room Condition:
• Attached to this email are photos showing the current condition of the room before your move-in for your reference.

Move-In & Induction:
• You are welcome to move in anytime tomorrow.
• We will also be conducting a house induction where ${CONTACT_NAME} will assist and show you around the property, including:
  - Bathroom/toilet areas
  - Your allocated kitchen cupboard space
  - Your refrigerator space
  - General shared house guidelines and facilities

This is to help make your move-in experience smoother and ensure you feel comfortable and settled in the house.

If you have any questions before move-in, feel free to flick ${CONTACT_NAME} a message or call directly at ${CONTACT_PHONE}.

We're looking forward to having you with us.

Ngā mihi,
${SIGN_OFF}
📞 ${CONTACT_PHONE} | ✉️ ${CONTACT_EMAIL}`;

    return { subject, body, recipient: submission.email || "" };
}
