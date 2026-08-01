import { Link } from "@inertiajs/react";
import { Sparkles } from "lucide-react";

/**
 * Topbar entry point for the ePathways AI assistant. Opens the dedicated
 * Assistant page (one context-aware surface for the whole app). Hidden when
 * AI is disabled for the tenant.
 */
export default function AiChatButton({ aiEnabled = true }) {
    if (!aiEnabled) return null;

    return (
        <Link
            href="/assistant"
            title="ePathways AI Assistant"
            aria-label="Open AI assistant"
            className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors inline-flex"
        >
            <Sparkles className="w-5 h-5" />
        </Link>
    );
}
