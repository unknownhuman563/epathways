// Registry of onboarding stages that trigger a (still-static) automated email.
// Moving an applicant into one of these stages opens StageEmailModal, which
// previews the email and — on confirm — advances the stage. The email sending
// itself is not implemented yet.

import { buildViewingBookingEmail } from "./viewingBookingEmail";
import { buildPostViewingFollowupEmail } from "./postViewingFollowupEmail";
import { buildPreTenancyFormEmail } from "./preTenancyFormEmail";
import { buildMoveInWelcomeEmail } from "./moveInWelcomeEmail";

export const STAGE_EMAILS = {
    viewing_email_sent: {
        title: "Viewing booking email",
        build: buildViewingBookingEmail,
    },
    post_viewing_followup: {
        title: "Post-viewing follow-up email",
        build: buildPostViewingFollowupEmail,
    },
    pre_tenancy_form_sent: {
        title: "Pre-tenancy form email",
        build: buildPreTenancyFormEmail,
    },
    // moved_in is reached via the Convert to Tenant flow, not a plain status
    // PATCH, so its email is preview-only — it doesn't advance the stage.
    moved_in: {
        title: "Move-in welcome email",
        build: buildMoveInWelcomeEmail,
        previewOnly: true,
    },
};

export const hasStageEmail = (stage) => Object.prototype.hasOwnProperty.call(STAGE_EMAILS, stage);
