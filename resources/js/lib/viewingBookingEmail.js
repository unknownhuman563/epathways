// Builds the static "Viewing booking" email shown when an applicant is moved to
// the `viewing_email_sent` onboarding stage. The email automation is not wired
// up yet — this only renders a preview for staff. Dynamic fields (recipient,
// property, room type, base rent) are pulled from the submission / linked
// property where available, falling back to the template's original values.

// Booking calendar + sign-off are fixed for now (no automation behind them).
export const VIEWING_BOOKING_CALENDAR_URL = "https://calendar.app.google/zH9mNZihJypkdvg86";
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

const money = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? `$${n.toFixed(0)}` : null;
};

export function buildViewingBookingEmail(submission = {}) {
    const property = submission.property || {};

    const name = firstName(submission);
    const address = property.address || submission.property_interested || "89C Archibald Road, Kelston";
    const roomType = submission.room_type_interest || property.room_type || "Ensuite Room";
    const rent = money(property.rent_single) || "$350";

    const subject = `Your viewing booking details — ${address}`;

    const body = `Hi ${name},

Thanks so much for completing the registration form.
Here are the details for the room you're interested in viewing:

Property: ${address}
Room Type:
• ${roomType}

Room Features:
• Private bathroom and toilet
• Built-in walk-in wardrobe

Common Area Features:
• Shared kitchen
• Shared lounge area
• Fridge, washing machine, dining table, and couch included

Rent:
• ${rent}/week rent
• Utilities: $40 per adult per week
• Standard total weekly cost for your family (2 adults and 1 child): $430/week
• As a final offer, we can provide the room for $410/week total for your family

Additional Notes:
• Suitable for a small family
• Peaceful and comfortable living environment

Weekly rent is paid in advance every Friday before 12:00 PM.
For example, payment made on Friday covers the following week's stay (Monday to Sunday).

You can now book your viewing through the Google Calendar link below:
BOOK HERE ${VIEWING_BOOKING_CALENDAR_URL}

If you have any questions before the viewing, feel free to flick a message or call ${CONTACT_NAME} directly at ${CONTACT_PHONE}.
${CONTACT_NAME} will be guiding you through the process from viewing to move-in.

Ngā mihi,
${SIGN_OFF}
${CONTACT_PHONE} | ${CONTACT_EMAIL}`;

    return { subject, body, recipient: submission.email || "" };
}
