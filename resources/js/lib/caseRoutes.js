// Portal-relative endpoint bases for the immigration Case Profile.
//
// The exact same Case Profile page is served to immigration staff (under
// /portal/immigration) and to a recruiting agent looking at their OWN referral's
// case (under /portal/agent, gated by the `referral_cases` module + row-scoped by
// the `lead.scope` middleware). Its write endpoints therefore cannot be
// hardcoded to /portal/immigration or /admin — those groups 403 for an agent.
//
// These helpers resolve the right base from the current URL so every button
// stays inside the portal the viewer actually opened the case from. Mirrors the
// `portalBase()` pattern the shared Leads/Students screens already use.

/** True when the Case Profile is open inside the recruiting-agent portal. */
export const isAgentCasePortal = () =>
    typeof window !== "undefined" && window.location.pathname.startsWith("/portal/agent");

/**
 * Base for immigration case-action endpoints (`/cases/{id}/...`,
 * `/intakes/...`). Staff: /portal/immigration ; owning agent: /portal/agent
 * (the same controllers, mirrored under the agent portal behind lead.scope).
 */
export const immBase = () => (isAgentCasePortal() ? "/portal/agent" : "/portal/immigration");

/**
 * Base for lead-scoped endpoints staff reach under `/admin/leads`. Agents reach
 * the same handlers mirrored under their own portal (see $leadProfileRoutes /
 * $agentCaseLeadRoutes in routes/web.php). Already includes the `/leads` segment
 * — callers append `/{id}/...`.
 */
export const leadBase = () => (isAgentCasePortal() ? "/portal/agent/leads" : "/admin/leads");

/** Single-document download URL (staff: /admin/documents/{id}; agent mirror). */
export const docDownloadUrl = (id, { inline = false } = {}) =>
    `${isAgentCasePortal() ? "/portal/agent/documents" : "/admin/documents"}/${id}/download${inline ? "?inline=1" : ""}`;
