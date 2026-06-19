import { useState } from "react";
import { Sparkles } from "lucide-react";
import AiChatPanel from "./AiChatPanel";

/**
 * Topbar entry point for the ePathways AI assistant. Renders a sparkle
 * button beside the notification bell; clicking opens the slide-out panel.
 * Hidden entirely when AI is disabled for the tenant (aiEnabled=false).
 */
export default function AiChatButton({ aiEnabled = true }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!aiEnabled) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                title="ePathways AI Assistant"
                aria-label="Open AI assistant"
                className="relative p-2 rounded-full text-purple-600 hover:bg-purple-50 transition-colors"
            >
                <Sparkles className="w-5 h-5" />
            </button>

            {isOpen && <AiChatPanel onClose={() => setIsOpen(false)} />}
        </>
    );
}
