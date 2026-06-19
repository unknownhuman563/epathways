import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, X, Plus, History, Send, Trash2, Loader2 } from "lucide-react";
import { aiClient } from "@/lib/aiClient";

const STORAGE_KEY = "ai.activeConversationId";
const fmtTime = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short" }) : "";

/**
 * Right-side slide-out AI assistant panel (gray/white theme). Lists the
 * staffer's conversations, lets them switch / start / archive threads, and
 * chats turn-by-turn. Plain-text rendering (whitespace-pre-wrap) — no markdown
 * dependency. Full-width on mobile, 420px drawer on desktop. Persists the
 * active thread in localStorage.
 */
export default function AiChatPanel({ onClose }) {
    const [conversations, setConversations] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [aiDisabled, setAiDisabled] = useState(false);
    const [visible, setVisible] = useState(false); // drives the slide in/out
    const endRef = useRef(null);

    const scrollToEnd = () => endRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => { scrollToEnd(); }, [messages, sending]);

    // Slide in on mount (next frame so the transition has a from-state).
    useEffect(() => {
        const id = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(id);
    }, []);

    // Slide out, then unmount once the 200ms transition has finished.
    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 200);
    };

    const loadConversation = useCallback(async (id) => {
        const { ok, data } = await aiClient.getConversation(id);
        if (!ok) return;
        setActiveId(id);
        setMessages(data.messages ?? []);
        setShowHistory(false);
        localStorage.setItem(STORAGE_KEY, String(id));
    }, []);

    // Initial load: pull conversation list, restore last-active thread.
    useEffect(() => {
        (async () => {
            const { data } = await aiClient.listConversations();
            if (data.ai_disabled) { setAiDisabled(true); return; }
            const list = data.conversations ?? [];
            setConversations(list);
            const saved = Number(localStorage.getItem(STORAGE_KEY));
            if (saved && list.some((c) => c.id === saved)) {
                loadConversation(saved);
            }
        })();
    }, [loadConversation]);

    const newChat = () => {
        setActiveId(null);
        setMessages([]);
        setShowHistory(false);
        localStorage.removeItem(STORAGE_KEY);
    };

    const send = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setInput("");
        setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: "user", content: text }]);
        setSending(true);
        try {
            const { ok, data } = await aiClient.sendMessage(text, activeId);
            if (!ok) {
                setMessages((m) => [...m, { id: `err-${Date.now()}`, role: "assistant", content: data.error || "AI is unavailable right now. Please try again." }]);
                return;
            }
            const convo = data.conversation;
            if (convo && convo.id !== activeId) {
                setActiveId(convo.id);
                localStorage.setItem(STORAGE_KEY, String(convo.id));
            }
            if (convo) {
                setConversations((list) => {
                    const without = list.filter((c) => c.id !== convo.id);
                    return [{ id: convo.id, title: convo.title, last_message_at: convo.last_message_at }, ...without];
                });
            }
            if (data.message) setMessages((m) => [...m, data.message]);
        } finally {
            setSending(false);
        }
    };

    const archive = async (id, e) => {
        e.stopPropagation();
        await aiClient.archiveConversation(id);
        setConversations((list) => list.filter((c) => c.id !== id));
        if (id === activeId) newChat();
    };

    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <div className="fixed inset-0 z-[70]">
            {/* Subtle dim backdrop — click to close */}
            <div
                className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ease-out ${visible ? "opacity-100" : "opacity-0"}`}
                onClick={handleClose}
            />

            {/* Slim right-side panel: 420px desktop, full-width on mobile */}
            <div
                className={`absolute right-0 top-0 bottom-0 flex flex-col w-full sm:w-[420px] bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.12)] transition-transform duration-200 ease-out ${visible ? "translate-x-0" : "translate-x-full"}`}
            >
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-700">
                        <Sparkles size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-bold text-gray-900 leading-tight">ePathways Assistant</h2>
                        <p className="text-[11px] text-gray-400 leading-tight">Drafts only — always review before sending.</p>
                    </div>
                    <button onClick={() => setShowHistory((v) => !v)} title="Conversations" className={`p-1.5 rounded-lg hover:bg-gray-100 ${showHistory ? "bg-gray-100 text-gray-900" : "text-gray-500"}`}>
                        <History size={17} />
                    </button>
                    <button onClick={newChat} title="New chat" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
                        <Plus size={17} />
                    </button>
                    <button onClick={handleClose} title="Close" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
                        <X size={17} />
                    </button>
                </div>

                {aiDisabled ? (
                    <div className="flex-1 flex items-center justify-center p-8 text-center">
                        <p className="text-sm text-gray-500">The AI assistant is currently turned off.</p>
                    </div>
                ) : (
                    <>
                        {/* Conversation history */}
                        {showHistory && (
                            <div className="border-b border-gray-100 max-h-56 overflow-y-auto bg-gray-50/60">
                                {conversations.length === 0 ? (
                                    <p className="px-4 py-4 text-xs text-gray-400">No previous conversations.</p>
                                ) : (
                                    conversations.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => loadConversation(c.id)}
                                            className={`group w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-white ${c.id === activeId ? "bg-white" : ""}`}
                                        >
                                            <span className="flex-1 min-w-0 truncate text-sm text-gray-700">{c.title || "Untitled chat"}</span>
                                            <span className="text-[10px] text-gray-400 shrink-0">{fmtTime(c.last_message_at)}</span>
                                            <span onClick={(e) => archive(c.id, e)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-rose-600" title="Archive">
                                                <Trash2 size={13} />
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                            {messages.length === 0 && !sending ? (
                                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                    <Sparkles className="w-8 h-8 text-gray-400 mb-3" />
                                    <p className="text-sm font-medium text-gray-900">How can I help?</p>
                                    <p className="text-xs text-gray-500 mt-1">Ask me to draft a message, summarise a lead, or answer a question about your work.</p>
                                </div>
                            ) : (
                                messages.map((m) => (
                                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words ${m.role === "user" ? "bg-gray-800 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                                            {m.content}
                                        </div>
                                    </div>
                                ))
                            )}
                            {sending && (
                                <div className="flex justify-start">
                                    <div className="px-3.5 py-3 rounded-2xl bg-gray-100 text-gray-400 rounded-bl-sm">
                                        <Loader2 size={16} className="animate-spin" />
                                    </div>
                                </div>
                            )}
                            <div ref={endRef} />
                        </div>

                        {/* Composer */}
                        <div className="border-t border-gray-100 p-3">
                            <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 focus-within:border-gray-400">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={onKeyDown}
                                    rows={1}
                                    placeholder="Message the assistant…"
                                    className="flex-1 resize-none max-h-32 text-sm outline-none bg-transparent"
                                />
                                <button
                                    onClick={send}
                                    disabled={!input.trim() || sending}
                                    className="shrink-0 p-1.5 rounded-lg bg-gray-800 text-white disabled:opacity-40 hover:bg-gray-900"
                                    title="Send"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
