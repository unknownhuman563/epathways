import { Link } from "@inertiajs/react";
import { LifeBuoy, ArrowRight } from "lucide-react";

const PRIORITY_DOT = { low: "bg-gray-300", normal: "bg-gray-400", high: "bg-amber-500", urgent: "bg-rose-500" };
const ago = (iso) => {
    if (!iso) return "";
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d}d ago`;
};

/**
 * Compact dashboard widget — open system-request count + the latest few,
 * linking to the full board. Triagers see it; it does not duplicate the board.
 */
export default function OpenRequestsCard({ summary = { open_count: 0, recent: [] } }) {
    const { open_count = 0, recent = [] } = summary || {};

    return (
        <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><LifeBuoy size={16} /></span>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">System Tickets</h3>
                        <p className="text-[11px] text-gray-400">{open_count} open</p>
                    </div>
                </div>
                <Link href="/admin/system-tickets" className="text-xs font-medium text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
                    View all <ArrowRight size={12} />
                </Link>
            </div>

            <div className="divide-y divide-gray-50">
                {recent.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-gray-400">No open tickets 🎉</p>
                ) : (
                    recent.map((t) => (
                        <Link key={t.id} href="/admin/system-tickets" className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[t.priority] || "bg-gray-300"}`} />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                                <p className="text-[11px] text-gray-400 capitalize">{t.department || "—"} · {ago(t.created_at)}</p>
                            </div>
                            <span className="text-[10px] text-gray-300 tabular-nums shrink-0">{t.ticket_ref}</span>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
