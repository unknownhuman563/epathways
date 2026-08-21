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
 * AI "Case Health" badge for immigration cases — procedural/compliance read
 * (Hot / Warm / Cold / Critical) with a one-line rationale. Analysis runs on
 * first open and is cached server-side for 24h; the refresh control forces a
 * re-analysis. Renders nothing when AI is off or the user lacks access.
 */
const HEALTH_ACCENT = {
    hot: "text-red-300", warm: "text-orange-300", cold: "text-sky-300",
    critical: "text-red-300", unknown: "text-gray-300",
};
const fmtGen = (iso) => (iso ? new Date(iso).toLocaleString("en-NZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null);

export default function CaseHealthBadge({ caseId, variant = "badge" }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [disabled, setDisabled] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        let active = true;
        setLoading(true);
        aiClient.caseAnalysis(caseId).then(({ data }) => {
            if (!active) return;
            if (data.ai_disabled) setDisabled(true);
            else setAnalysis(data.analysis ?? null);
        }).finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [caseId]);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const { ok, data } = await aiClient.refreshCaseAnalysis(caseId);
            if (ok && data.analysis) setAnalysis(data.analysis);
        } finally {
            setRefreshing(false);
        }
    }, [caseId]);

    if (disabled) return null;

    // Dark "CASE SUMMARY · AI" card for the case-profile header.
    if (variant === "card") {
        const gen = analysis && fmtGen(analysis.generated_at || analysis.updated_at || analysis.analyzed_at);
        return (
            <div className="rounded-2xl bg-gray-900 text-white p-4">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4fd1c5] inline-flex items-center gap-1.5"><Sparkles size={12} /> Case summary · AI</p>
                    <button onClick={refresh} disabled={refreshing || loading} className="text-[12px] font-semibold text-white/70 hover:text-white inline-flex items-center gap-1 disabled:opacity-50">
                        <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Refresh
                    </button>
                </div>
                {loading ? (
                    <p className="mt-2.5 text-[13px] text-white/60 inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Analysing case…</p>
                ) : !analysis ? (
                    <p className="mt-2.5 text-[13px] text-white/50">No AI summary available for this case.</p>
                ) : (
                    <>
                        <p className="mt-2 text-[13.5px] leading-relaxed text-white/90">
                            <span className={`font-bold capitalize ${HEALTH_ACCENT[analysis.health] || HEALTH_ACCENT.unknown}`}>Case {analysis.health}. </span>
                            {analysis.summary}
                        </p>
                        {gen && <p className="mt-2.5 text-[11px] text-white/40">Generated {gen}</p>}
                    </>
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin" /> AI analysing case…
            </span>
        );
    }
    if (!analysis) return null;

    const tone = COLORS[analysis.health] || COLORS.unknown;

    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${tone}`} title={analysis.summary}>
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="font-semibold capitalize">Case: {analysis.health}</span>
            <span className="text-sm max-w-[420px] truncate hidden md:inline">{analysis.summary}</span>
            <button
                onClick={refresh}
                disabled={refreshing}
                title="Re-run AI case analysis"
                className="ml-0.5 p-0.5 rounded hover:bg-black/5 disabled:opacity-50"
            >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            </button>
        </span>
    );
}
