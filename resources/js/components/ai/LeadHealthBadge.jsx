import { useState, useEffect, useCallback } from "react";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { aiClient } from "@/lib/aiClient";

const COLORS = {
    hot:      "bg-red-100 text-red-800 border-red-300",
    warm:     "bg-orange-100 text-orange-800 border-orange-300",
    cold:     "bg-blue-100 text-blue-800 border-blue-300",
    critical: "bg-red-200 text-red-900 border-red-500 animate-pulse",
    unknown:  "bg-gray-100 text-gray-600 border-gray-300",
};

/**
 * AI "Lead Health" badge — Hot / Warm / Cold / Critical with a one-line
 * rationale. Analysis runs on first open and is cached server-side for 24h;
 * the refresh control forces a re-analysis. Renders nothing when AI is off.
 */
export default function LeadHealthBadge({ leadId }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [disabled, setDisabled] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        let active = true;
        setLoading(true);
        aiClient.leadAnalysis(leadId).then(({ data }) => {
            if (!active) return;
            if (data.ai_disabled) setDisabled(true);
            else setAnalysis(data.analysis ?? null);
        }).finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [leadId]);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const { ok, data } = await aiClient.refreshLeadAnalysis(leadId);
            if (ok && data.analysis) setAnalysis(data.analysis);
        } finally {
            setRefreshing(false);
        }
    }, [leadId]);

    if (disabled) return null;
    if (loading) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin" /> AI analysing…
            </span>
        );
    }
    if (!analysis) return null;

    const tone = COLORS[analysis.health] || COLORS.unknown;

    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${tone}`} title={analysis.summary}>
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="font-semibold capitalize">{analysis.health}</span>
            <span className="text-sm max-w-[420px] truncate hidden md:inline">{analysis.summary}</span>
            <button
                onClick={refresh}
                disabled={refreshing}
                title="Re-run AI analysis"
                className="ml-0.5 p-0.5 rounded hover:bg-black/5 disabled:opacity-50"
            >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            </button>
        </span>
    );
}
