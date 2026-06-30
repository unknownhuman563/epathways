import { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import { toast } from 'sonner';
import { Send, RefreshCw, MessageSquare, MessagesSquare, Loader2, ArrowLeft } from 'lucide-react';
import SocialLayout from '@/pages/admin/social/SocialLayout';
import { social } from '@/services/social';
import { Skeleton, PlatformIcon, EmptyState } from '@/components/social/atoms';

const fmtTime = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleString('en-NZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
};

function ConversationsPane() {
    const [conversations, setConversations] = useState(null);
    const [activeId, setActiveId] = useState(null);
    const [activeAccountId, setActiveAccountId] = useState(null);
    const [messages, setMessages] = useState(null);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const threadRef = useRef(null);
    const activeIdRef = useRef(null);
    const activeAccountIdRef = useRef(null);

    const loadConversations = () => {
        setConversations(null);
        social.inboxConversations().then(
            (r) => setConversations(r?.conversations || []),
            () => { setConversations([]); toast.error('Could not load conversations'); },
        );
    };
    useEffect(loadConversations, []);

    const openConversation = (c) => {
        setActiveId(c.id);
        setActiveAccountId(c.account_id);
        setMessages(null);
        // Optimistically clear the unread badge, then tell Zernio it's read.
        if (c.unread > 0) {
            setConversations((prev) => (prev || []).map((x) => (x.id === c.id ? { ...x, unread: 0 } : x)));
            social.inboxMarkRead(c.id, c.account_id).catch(() => {});
        }
        social.inboxMessages(c.id, c.account_id).then(
            (r) => setMessages(r?.messages || []),
            () => { setMessages([]); toast.error('Could not load messages'); },
        );
    };

    useEffect(() => { threadRef.current?.scrollTo(0, threadRef.current.scrollHeight); }, [messages]);

    const send = async () => {
        if (!reply.trim() || !activeId) return;
        setSending(true);
        const text = reply;
        try {
            await social.inboxSend(activeId, activeAccountId, text);
            setReply('');
            setMessages((prev) => [...(prev || []), { id: `tmp_${Date.now()}`, direction: 'out', text, at: new Date().toISOString() }]);
        } catch (err) {
            toast.error(err?.message || 'Could not send');
        } finally {
            setSending(false);
        }
    };

    // Keep the live selection in refs so the single polling loop reads current
    // values without resetting its interval on every open.
    useEffect(() => { activeIdRef.current = activeId; activeAccountIdRef.current = activeAccountId; }, [activeId, activeAccountId]);

    // Silent refreshers (no skeleton flash).
    const refreshConversations = () => {
        social.inboxConversations().then((r) => setConversations(r?.conversations || []), () => {});
    };
    const refreshMessages = () => {
        const id = activeIdRef.current;
        if (!id) return;
        social.inboxMessages(id, activeAccountIdRef.current).then((r) => {
            const next = r?.messages || [];
            // Only swap state when the set actually changed, so the thread
            // doesn't jump to the bottom while reading history.
            setMessages((prev) => (prev && prev.length === next.length && prev[prev.length - 1]?.id === next[next.length - 1]?.id) ? prev : next);
        }, () => {});
    };

    // Event-driven refresh: poll a cheap local "signal" every 0.8s; when the
    // Zernio webhook has bumped it, pull the latest list + open thread — so new
    // messages appear within ~0.8s of arriving, not on a fixed timer. A slow
    // fallback keeps things fresh even if the webhook isn't configured yet.
    useEffect(() => {
        let lastAt = null;
        const fast = setInterval(() => {
            social.inboxSignal().then((r) => {
                const at = r?.at || 0;
                if (lastAt === null) { lastAt = at; return; }
                if (at > lastAt) { lastAt = at; refreshConversations(); refreshMessages(); }
            }, () => {});
        }, 800);
        const slow = setInterval(() => { refreshConversations(); refreshMessages(); }, 30000);
        return () => { clearInterval(fast); clearInterval(slow); };
    }, []);

    const active = conversations?.find((c) => c.id === activeId);

    // Always two-column (list left, thread right). No responsive breakpoints —
    // those weren't engaging at some viewports — so the side-by-side is
    // guaranteed. min-w-0 lets each column shrink gracefully on narrow widths.
    return (
        <div className="flex gap-4 h-[72vh]">
            {/* Conversation list */}
            <div className="flex flex-col w-72 xl:w-80 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">Conversations</h3>
                    <button onClick={loadConversations} className="ml-auto text-gray-400 hover:text-gray-700" title="Refresh"><RefreshCw size={14} /></button>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                    {conversations === null ? (
                        <div className="p-4 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
                    ) : conversations.length === 0 ? (
                        <EmptyState icon={<MessagesSquare size={20} className="text-gray-500" />} title="No conversations" body="DMs from your connected platforms appear here." />
                    ) : conversations.map((c) => (
                        <button key={c.id} onClick={() => openConversation(c)} className={`w-full text-left px-4 py-3 flex items-center gap-2.5 hover:bg-gray-50 ${activeId === c.id ? 'bg-gray-50' : ''}`}>
                            <PlatformIcon id={c.platform} size={16} />
                            <span className="flex-1 min-w-0">
                                <span className="flex items-center gap-1.5">
                                    <span className="text-sm font-semibold text-gray-900 truncate">{c.name}</span>
                                    {c.unread > 0 && <span className="ml-auto shrink-0 text-[10px] font-bold bg-blue-600 text-white rounded-full px-1.5">{c.unread}</span>}
                                </span>
                                <span className="block text-xs text-gray-500 truncate">{c.snippet}</span>
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Thread */}
            <div className="flex flex-col flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
                {!activeId ? (
                    <EmptyState icon={<MessageSquare size={20} className="text-gray-500" />} title="Select a conversation" body="Pick a thread on the left to read and reply." />
                ) : (
                    <>
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                            <PlatformIcon id={active?.platform} size={16} />
                            <h3 className="text-sm font-bold text-gray-900">{active?.name || 'Conversation'}</h3>
                        </div>
                        <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/40">
                            {messages === null ? (
                                <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-8 w-2/3 rounded-lg" />)}</div>
                            ) : messages.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-8">No messages yet.</p>
                            ) : messages.map((m) => (
                                <div key={m.id} className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${m.direction === 'out' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-800'}`}>
                                        <p className="whitespace-pre-wrap">{m.text}</p>
                                        <p className={`text-[10px] mt-1 ${m.direction === 'out' ? 'text-blue-100' : 'text-gray-400'}`}>{fmtTime(m.at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-t border-gray-100 flex items-center gap-2">
                            <input
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                placeholder="Type a reply…"
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-300"
                            />
                            <button onClick={send} disabled={sending || !reply.trim()} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 text-sm font-semibold">
                                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function CommentsPane() {
    // Zernio's /inbox/comments returns POSTS that have comment activity; you
    // add a reply comment to a post by its id (+ accountId).
    const [posts, setPosts] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [text, setText] = useState('');

    const load = () => {
        setPosts(null);
        social.inboxComments().then(
            (r) => setPosts(r?.comments || []),
            () => { setPosts([]); toast.error('Could not load comments'); },
        );
    };
    useEffect(load, []);

    // Auto-refresh comment activity (silent — no skeleton flash).
    useEffect(() => {
        const id = setInterval(() => {
            social.inboxComments().then((r) => setPosts(r?.comments || []), () => {});
        }, 15000);
        return () => clearInterval(id);
    }, []);

    const sendReply = async (p) => {
        if (!text.trim()) return;
        try {
            await social.replyComment(p.post_id, p.account_id, text);
            toast.success('Reply posted');
            setReplyingTo(null); setText('');
        } catch (err) {
            toast.error(err?.message || 'Could not reply');
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Posts with comments</h3>
                <button onClick={load} className="ml-auto text-gray-400 hover:text-gray-700" title="Refresh"><RefreshCw size={14} /></button>
            </div>
            {posts === null ? (
                <div className="p-4 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : posts.length === 0 ? (
                <EmptyState icon={<MessageSquare size={20} className="text-gray-500" />} title="No comment activity" body="Posts that receive comments show up here." />
            ) : (
                <div className="divide-y divide-gray-50">
                    {posts.map((p) => (
                        <div key={p.id} className="px-4 py-3">
                            <div className="flex items-start gap-2.5">
                                <PlatformIcon id={p.platform} size={16} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-700">{p.content || '(no caption)'}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {p.comment_count} comment{p.comment_count === 1 ? '' : 's'} · {fmtTime(p.at)}
                                        {p.permalink && <> · <a href={p.permalink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View on platform</a></>}
                                    </p>
                                    {replyingTo === p.id ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
                                            <button onClick={() => sendReply(p)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold">Post</button>
                                            <button onClick={() => { setReplyingTo(null); setText(''); }} className="text-xs text-gray-500">Cancel</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setReplyingTo(p.id); setText(''); }} className="text-xs text-blue-600 font-medium mt-1 hover:underline">Reply</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function InboxPage() {
    const [tab, setTab] = useState('messages');

    return (
        <SocialLayout>
            <Head title="Inbox · Social" />
            <div className="flex items-center gap-1 mb-4 border-b border-gray-100">
                {[{ k: 'messages', label: 'Messages' }, { k: 'comments', label: 'Comments' }].map((t) => (
                    <button key={t.k} onClick={() => setTab(t.k)} className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px ${tab === t.k ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>{t.label}</button>
                ))}
            </div>
            {tab === 'messages' ? <ConversationsPane /> : <CommentsPane />}
        </SocialLayout>
    );
}
