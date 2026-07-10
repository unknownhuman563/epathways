import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Mail, Search, Send, User, Inbox, AlertTriangle, RefreshCw } from 'lucide-react';

// Email Replies — conversation view per lead. Inbound (from the mailbox) and
// outbound (staff replies) messages live in one thread.
export default function Replies({ threads = [], unreadCount = 0, imapConfigured = false, mailbox, search = '', basePath = '/admin/email/replies' }) {
    const [selectedId, setSelectedId] = useState(threads[0]?.lead_id ?? null);
    const [q, setQ] = useState(search);
    const selected = threads.find((t) => t.lead_id === selectedId) || null;

    const replyForm = useForm({ body: '' });
    const [syncing, setSyncing] = useState(false);

    const openThread = (t) => {
        setSelectedId(t.lead_id);
        if (t.unread > 0) router.post(`${basePath}/${t.lead_id}/read`, {}, { preserveScroll: true, preserveState: true });
    };

    const submitSearch = (e) => {
        e.preventDefault();
        router.get(basePath, { q }, { preserveState: true, replace: true });
    };

    const syncNow = () => {
        setSyncing(true);
        router.post(`${basePath}/sync`, {}, { preserveScroll: true, onFinish: () => setSyncing(false) });
    };

    const sendReply = (e) => {
        e.preventDefault();
        if (!selected) return;
        replyForm.post(`${basePath}/${selected.lead_id}/reply`, {
            preserveScroll: true,
            onSuccess: () => replyForm.reset('body'),
        });
    };

    const fmt = (iso) => {
        if (!iso) return '';
        try { return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
        catch { return iso; }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-5 pb-8">
            <Head title="Email Replies" />

            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Mail size={22} /> Email Replies
                        {unreadCount > 0 && <span className="text-xs font-bold bg-emerald-600 text-white rounded-full px-2 py-0.5">{unreadCount} new</span>}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Conversations with leads, pulled from {mailbox ? <strong>{mailbox}</strong> : 'the monitored inbox'}.
                    </p>
                </div>
                <button
                    onClick={syncNow}
                    disabled={syncing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold shadow-sm disabled:opacity-60"
                >
                    <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing…' : 'Sync now'}
                </button>
            </div>

            {!imapConfigured && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-900">
                        <p className="font-semibold">Mailbox not connected yet</p>
                        <p className="mt-0.5 text-amber-800/90">Set <code>IMAP_USERNAME</code> and <code>IMAP_PASSWORD</code> (a Google App Password) in the server environment, then replies sync automatically.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
                {/* Thread list */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <form onSubmit={submitSearch} className="p-3 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lead or subject…"
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-gray-200" />
                        </div>
                    </form>
                    <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-50">
                        {threads.length === 0 ? (
                            <div className="p-10 text-center text-gray-500">
                                <Inbox className="w-9 h-9 mx-auto mb-3 text-gray-200" />
                                <p className="text-sm font-semibold text-gray-600">No replies yet</p>
                                <p className="text-xs mt-1">Lead replies will appear here. Hit <strong>Sync now</strong> to check.</p>
                            </div>
                        ) : threads.map((t) => (
                            <button key={t.lead_id} onClick={() => openThread(t)}
                                className={`w-full text-left p-3.5 hover:bg-gray-50 transition-colors ${selectedId === t.lead_id ? 'bg-emerald-50/60' : ''}`}>
                                <div className="flex items-center gap-2">
                                    {t.unread > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                                    <span className={`text-sm truncate ${t.unread > 0 ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                                        {t.lead?.name || t.lead?.email}
                                    </span>
                                    <span className="ml-auto text-[11px] text-gray-400 shrink-0">{fmt(t.last_at)}</span>
                                </div>
                                <p className="text-[13px] text-gray-700 truncate mt-0.5">{t.subject || '(no subject)'}</p>
                                <p className="text-xs text-gray-500 truncate mt-0.5">{t.last_snippet}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conversation */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[420px] flex flex-col">
                    {!selected ? (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-10">Select a conversation.</div>
                    ) : (
                        <>
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">{selected.lead?.name || selected.lead?.email}</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">{selected.lead?.email}</p>
                                </div>
                                {selected.lead && (
                                    <Link href={`/admin/leads/${selected.lead.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline">
                                        <User size={12} /> View lead
                                    </Link>
                                )}
                            </div>

                            {/* Messages */}
                            <div className="p-5 flex-1 overflow-y-auto max-h-[50vh] space-y-3">
                                {selected.messages.map((m) => {
                                    const out = m.direction === 'outbound';
                                    return (
                                        <div key={m.id} className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${out ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                                <div className={`text-[11px] mb-1 ${out ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    {out ? 'You' : (m.from_name || m.from_email)} · {fmt(m.received_at)}
                                                </div>
                                                {m.body_html && !out ? (
                                                    <div className="[&_a]:underline break-words" dangerouslySetInnerHTML={{ __html: m.body_html }} />
                                                ) : (
                                                    <div className="whitespace-pre-wrap break-words">{m.body_text}</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reply box */}
                            <form onSubmit={sendReply} className="p-4 border-t border-gray-100 bg-gray-50/50">
                                <textarea value={replyForm.data.body} onChange={(e) => replyForm.setData('body', e.target.value)} rows={3}
                                    placeholder={`Reply to ${selected.lead?.email}…`}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-300 resize-y" />
                                {replyForm.errors.body && <span className="text-xs text-rose-600">{replyForm.errors.body}</span>}
                                <div className="flex justify-end mt-2">
                                    <button type="submit" disabled={replyForm.processing || !replyForm.data.body.trim()}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed">
                                        <Send size={14} /> {replyForm.processing ? 'Sending…' : 'Send reply'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
