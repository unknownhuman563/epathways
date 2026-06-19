// Minimal JSON client for the AI endpoints (web auth group, so session +
// CSRF). GETs mirror the existing NotificationBell fetch; writes add the
// CSRF token from the <meta name="csrf-token"> tag in app.blade.php as the
// X-CSRF-TOKEN header (what Laravel's VerifyCsrfToken expects).

const csrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";

async function request(url, { method = "GET", body } = {}) {
    const headers = {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
    };
    if (method !== "GET") {
        headers["Content-Type"] = "application/json";
        headers["X-CSRF-TOKEN"] = csrfToken();
    }

    const res = await fetch(url, {
        method,
        headers,
        credentials: "same-origin",
        body: body ? JSON.stringify(body) : undefined,
    });

    let data = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    return { ok: res.ok, status: res.status, data: data || {} };
}

export const aiClient = {
    listConversations: () => request("/api/ai/conversations"),
    getConversation: (id) => request(`/api/ai/conversations/${id}`),
    sendMessage: (message, conversationId = null) =>
        request("/api/ai/messages", {
            method: "POST",
            body: { message, conversation_id: conversationId },
        }),
    archiveConversation: (id) => request(`/api/ai/conversations/${id}`, { method: "DELETE" }),
    leadAnalysis: (leadId) => request(`/api/ai/leads/${leadId}/analysis`),
    refreshLeadAnalysis: (leadId) =>
        request(`/api/ai/leads/${leadId}/analysis/refresh`, { method: "POST" }),
};
