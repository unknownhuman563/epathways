import { useState } from "react";
import { Head } from "@inertiajs/react";
import { MessageSquare, Mail, ChevronDown } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import Pagination from "@/components/ui/Pagination";

const fmt = (iso) =>
    iso ? new Date(iso).toLocaleString("en-NZ", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

/**
 * Lead-side message history — emails the ePathways team has sent this lead.
 * READ-ONLY for now (two-way replies arrive in Build 14). Scoped server-side
 * to the logged-in lead's own record.
 */
export default function LeadMessages({ messages = { data: [], links: [] } }) {
    const rows = messages?.data ?? [];
    const [openId, setOpenId] = useState(null);

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Messages" />
            <PortalPageHeader
                eyebrow="Stay in touch"
                title="Your messages"
                description="Messages from your ePathways adviser. Reply by email for now — in-portal replies coming soon."
            />

            {rows.length === 0 ? (
                <section className="bg-white rounded-2xl border border-[#282728]/15 p-10 sm:p-12 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#436235]/10 text-[#436235] mb-4">
                        <MessageSquare size={22} />
                    </div>
                    <h3 className="text-xl font-medium tracking-tight text-[#282728] mb-2">No messages yet</h3>
                    <p className="text-sm text-[#282728]/70 font-light max-w-md mx-auto">
                        Your adviser will be in touch as your application progresses.
                    </p>
                </section>
            ) : (
                <section className="bg-white rounded-2xl border border-[#282728]/15 overflow-hidden divide-y divide-[#282728]/10">
                    {rows.map((m) => {
                        const open = openId === m.id;
                        return (
                            <div key={m.id} className="px-5 sm:px-6 py-4">
                                <button onClick={() => setOpenId(open ? null : m.id)} className="w-full flex items-start gap-3.5 text-left">
                                    <span className="mt-0.5 w-10 h-10 rounded-xl bg-[#436235]/10 text-[#436235] flex items-center justify-center shrink-0">
                                        <Mail size={16} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-[#282728] truncate">{m.subject || "(no subject)"}</p>
                                        {!open && <p className="text-xs text-[#282728]/60 mt-0.5 truncate">{(m.body || "").slice(0, 110)}</p>}
                                        <p className="text-[11px] text-[#282728]/45 mt-1">From {m.from} · {fmt(m.created_at)}</p>
                                    </div>
                                    <ChevronDown size={15} className={`text-[#282728]/30 shrink-0 mt-1 transition-transform ${open ? "rotate-180" : ""}`} />
                                </button>
                                {open && (
                                    <div className="mt-3 ml-[3.4rem] rounded-xl bg-[#436235]/[0.04] border border-[#282728]/10 p-4">
                                        <p className="text-sm text-[#282728]/85 font-light leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </section>
            )}

            {rows.length > 0 && <Pagination links={messages.links} />}
        </div>
    );
}
