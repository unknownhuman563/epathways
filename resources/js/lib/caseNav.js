// Portal-aware case navigation. The case profile renders in BOTH the immigration
// manager portal (/portal/immigration/…) and the adviser portal
// (/portal/immigration-adviser/…). Navigation links inside it must target the
// portal the user is actually in, or clicking one flips the sidebar to the other
// portal. Data-action POST/fetch calls do NOT use this — they hit the manager
// endpoints and redirect back, so they never change the chrome.
//
// The two portals also differ in URL shape (the manager profile has a /profile
// suffix; engagement/invoice sit under /cases on the manager but at the root on
// the adviser), so this resolves each destination per portal.
export function caseNav() {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const adviser = path.startsWith("/portal/immigration-adviser");
    const base = adviser ? "/portal/immigration-adviser" : "/portal/immigration";

    return {
        adviser,
        base,
        cases: `${base}/cases`,
        profile: (id) => (adviser ? `${base}/cases/${id}` : `${base}/cases/${id}/profile`),
        engagement: (leadId) => (adviser ? `${base}/engagement?case=${leadId}` : `${base}/cases/engagement?case=${leadId}`),
        invoice: adviser ? `${base}/invoice` : `${base}/cases/invoice`,
    };
}
