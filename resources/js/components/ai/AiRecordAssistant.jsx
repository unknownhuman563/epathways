import { Link } from "@inertiajs/react";
import { Sparkles } from "lucide-react";

/**
 * Floating "Ask AI" trigger on a record page. Opens the dedicated Assistant
 * page scoped to this record (grounded answers + immigration guardrail are
 * enforced server-side). One assistant surface, not a separate widget.
 *
 * Props:
 *   subjectId — the Lead id the assistant should scope to
 *   label     — unused now (kept for call-site compatibility)
 */
export default function AiRecordAssistant({ subjectId }) {
    if (!subjectId) return null;

    return (
        <Link
            href={`/assistant?subject_id=${subjectId}`}
            className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-gray-900 text-white pl-4 pr-5 py-3 shadow-lg hover:bg-gray-800 transition-colors"
        >
            <Sparkles size={18} className="text-amber-300" />
            <span className="text-sm font-semibold">Ask AI</span>
        </Link>
    );
}
