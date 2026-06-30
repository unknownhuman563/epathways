// Social client API — thin wrapper around the Laravel-proxied /webhook/social/*
// endpoints. Every request inherits the user's session cookie + CSRF token
// so n8n / OpenRouter / Zernio credentials never reach the browser.
//
// The matching backend lives at app/Http/Controllers/AiAdsWebhookController.php.
// When SOCIAL_WEBHOOK_BASE is unset in .env the controller returns stub
// fixtures so the UI is fully testable without n8n being live.

function csrf() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

async function request(method, path, { body, query } = {}) {
    let url = `/webhook/social/${path}`;
    if (query && typeof query === 'object') {
        const qs = new URLSearchParams();
        Object.entries(query).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') qs.append(k, v);
        });
        const qsStr = qs.toString();
        if (qsStr) url += `?${qsStr}`;
    }

    const isFormData = body instanceof FormData;
    const headers = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': csrf(),
    };
    if (body && !isFormData) headers['Content-Type'] = 'application/json';

    const res = await fetch(url, {
        method,
        headers,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
        credentials: 'same-origin',
    });

    let data = null;
    try { data = await res.json(); } catch { /* upstream might be empty */ }

    if (!res.ok) {
        const err = new Error(data?.error || data?.message || `HTTP ${res.status}`);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export const social = {
    // Stats strip ────────────────────────────────────────────────────────
    stats:           ()      => request('GET',  'stats'),

    // Campaign form → variant generation ─────────────────────────────────
    // `formData` is a FormData (the form has an optional file upload).
    generateVariants:(formData) => request('POST', 'generate-variants', { body: formData }),

    // Variant review queue ───────────────────────────────────────────────
    listVariants:    ()                           => request('GET',  'list-variants'),
    updateVariant:   (variantId, patch)           => request('POST', 'update-variant',  { body: { variantId, ...patch } }),
    rejectVariant:   (variantId)                  => request('POST', 'reject-variant',  { body: { variantId } }),
    approveVariant:  (variantId, scheduleAt, platformIds = []) =>
                                                     request('POST', 'approve-variant', { body: { variantId, scheduleAt, platformIds } }),

    // Scheduler ──────────────────────────────────────────────────────────
    listScheduled:   ({ from, to } = {})          => request('GET',  'list-scheduled',  { query: { from, to } }),
    reschedule:      (postId, newScheduleAt)      => request('POST', 'reschedule',      { body: { postId, newScheduleAt } }),
    cancelPost:      (postId)                     => request('POST', 'cancel-post',     { body: { postId } }),

    // Quick post / Compose ───────────────────────────────────────────────
    // `formData` is a FormData (text + platforms[] + optional media + optional schedule_at).
    quickPost:       (formData)                   => request('POST', 'quick-post',      { body: formData }),

    // Accounts ───────────────────────────────────────────────────────────
    listAccounts:    ()                           => request('GET',  'list-accounts'),
    startOauth:      (platform)                   => request('POST', 'start-oauth',     { body: { platform } }),
    disconnectAccount:(accountId)                 => request('POST', 'disconnect',      { body: { accountId } }),

    // Inbox ────────────────────────────────────────────────────────────────
    inboxConversations: ()                        => request('GET',  'inbox-conversations'),
    inboxMessages:   (conversationId, accountId)  => request('GET',  'inbox-messages',  { query: { conversationId, accountId } }),
    inboxSend:       (conversationId, accountId, text) => request('POST', 'inbox-send',  { body: { conversationId, accountId, text } }),
    inboxMarkRead:   (conversationId, accountId)  => request('POST', 'inbox-read',      { body: { conversationId, accountId } }),
    inboxSignal:     ()                           => request('GET',  'inbox-signal'),
    inboxComments:   ()                           => request('GET',  'inbox-comments'),
    replyComment:    (postId, accountId, text)    => request('POST', 'inbox-reply-comment', { body: { postId, accountId, text } }),

    // Ads ──────────────────────────────────────────────────────────────────
    publishedPosts:  ()                           => request('GET',  'published-posts'),
    adsList:         ()                           => request('GET',  'ads-list'),
    adAccounts:      ()                           => request('GET',  'ad-accounts'),
    boostPost:       (payload)                    => request('POST', 'ads-boost',       { body: payload }),
    adAnalytics:     (adId)                       => request('GET',  'ad-analytics',    { query: { adId } }),
    targetingSearch: (params)                     => request('GET',  'ad-targeting-search', { query: params }),
    aiTargeting:     (payload)                    => request('POST', 'ai-targeting',    { body: payload }),
    adAudiences:     (params)                     => request('GET',  'ad-audiences',    { query: params }),
    saveAudience:    (payload)                    => request('POST', 'ad-audience-save', { body: payload }),

    // Performance ────────────────────────────────────────────────────────────
    performance:     ({ fromDate, toDate } = {})  => request('GET',  'analytics',       { query: { fromDate, toDate } }),
};
