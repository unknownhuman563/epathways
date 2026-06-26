import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import CaseHealthBadge from "@/components/ai/CaseHealthBadge";

// CSRF: prefer XSRF-TOKEN cookie (kept fresh by Laravel) and fall back to
// the meta tag. The meta tag in app.blade.php is stamped at first paint
// and goes stale after session rotation, hence the cookie-first preference.
function csrfHeaders() {
    const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="));
    const xsrf = cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
    const meta = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
    return xsrf
        ? { "X-XSRF-TOKEN": xsrf, "X-CSRF-TOKEN": meta }
        : { "X-CSRF-TOKEN": meta };
}

// Build 10's CaseHealthBadge already drives the AI case-health UI. This
// tab embeds it plus a Re-analyze action that hits the existing refresh
// endpoint. The badge component reads/writes ai_record_analyses; we
// don't need a separate fetch here.

export default function AIHealthTab({ lead }) {
    const [refreshing, setRefreshing] = useState(false);

    if (! lead?.id) return null;

    const refresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            await fetch(`/api/ai/cases/${lead.id}/analysis/refresh`, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    ...csrfHeaders(),
                    "Accept": "application/json",
                },
            });
            // Badge polls/refreshes on its own — give it a beat and reload.
            setTimeout(() => window.location.reload(), 600);
        } catch {
            setRefreshing(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h2 className="text-base font-bold text-gray-900 inline-flex items-center gap-2">
                        <Sparkles size={15} className="text-gray-400" />
                        AI Case Health
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Procedural / compliance read from CaseAnalysisService. Cached 24h; click Re-analyze to refresh.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={refresh}
                    disabled={refreshing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "Re-analyzing…" : "Re-analyze"}
                </button>
            </div>

            <section className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Health badge</span>
                    <CaseHealthBadge caseId={lead.id} />
                </div>
            </section>
        </div>
    );
}
