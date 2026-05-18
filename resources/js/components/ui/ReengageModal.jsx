import { useEffect, useState } from "react";
import QuickLeadForm from "./QuickLeadForm";
import { X } from "react-feather";
import useGlobalPage from "./useGlobalPage";

// Re-engagement modal that fires under either trigger:
//   1. Visitor has been on the page 25s+ without scrolling past the fold
//   2. Visitor's mouse leaves the viewport from the top edge (exit intent)
//
// Throttled to once per 14 days via a separate localStorage key so it does
// NOT conflict with the existing welcome Modal (different cadence + intent).
// Suppressed on:
//   - Admin/portal/auth surfaces
//   - The free-assessment funnel itself (don't interrupt mid-conversion)
//   - The booking page (same reason)
//   - The /assessment-result page (post-conversion)
const DISMISS_KEY = "epathways_reengage_dismissed_at";
const SUBMITTED_KEY = "epathways_reengage_submitted_at";
const SHOW_AGAIN_AFTER_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const SUBMIT_SUPPRESS_MS = 90 * 24 * 60 * 60 * 1000;  // 90 days after a real submit
const TIME_TRIGGER_MS = 25_000;

const SUPPRESS_PREFIXES = ["/admin", "/portal", "/login", "/free-assessment", "/booking", "/assessment-result", "/quick-lead"];

export default function ReengageModal() {
    const page = useGlobalPage();
    const url = page?.url || "";
    const flash = page?.props?.flash || {};

    const [isOpen, setIsOpen] = useState(false);

    // Path-based suppression — re-evaluated on every Inertia navigation.
    const isSuppressed = SUPPRESS_PREFIXES.some(p => url.startsWith(p));

    // Persist a "submitted" flag when a quick-lead submission lands so we
    // don't badger the same visitor across pages.
    useEffect(() => {
        if (flash?.quick_lead_ok) {
            try {
                window.localStorage.setItem(SUBMITTED_KEY, String(Date.now()));
            } catch {
                /* ignore */
            }
            setIsOpen(false);
        }
    }, [flash?.quick_lead_ok]);

    useEffect(() => {
        if (isSuppressed) return;

        // Honour throttles.
        try {
            const submittedAt = Number(window.localStorage.getItem(SUBMITTED_KEY) || 0);
            if (submittedAt && Date.now() - submittedAt < SUBMIT_SUPPRESS_MS) return;
            const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
            if (dismissedAt && Date.now() - dismissedAt < SHOW_AGAIN_AFTER_MS) return;
        } catch {
            /* storage blocked — proceed without throttle */
        }

        let opened = false;
        const open = () => {
            if (opened) return;
            opened = true;
            setIsOpen(true);
        };

        const timer = setTimeout(open, TIME_TRIGGER_MS);

        // Exit-intent: mouse leaves the viewport through the top edge.
        const onMouseOut = (e) => {
            if (e.clientY <= 0 && (e.relatedTarget == null || e.toElement == null)) {
                open();
            }
        };
        document.addEventListener("mouseout", onMouseOut);

        return () => {
            clearTimeout(timer);
            document.removeEventListener("mouseout", onMouseOut);
        };
    }, [url, isSuppressed]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "auto";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    const dismiss = () => {
        try {
            window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
        } catch {
            /* ignore */
        }
        setIsOpen(false);
    };

    if (!isOpen || isSuppressed) return null;

    return (
        <div
            className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
            onClick={dismiss}
        >
            <div
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={dismiss}
                    aria-label="Close"
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors z-10"
                >
                    <X size={18} />
                </button>

                <div className="px-6 pt-8 pb-2 text-center">
                    <p className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.3em] mb-2">
                        Before you go
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#282728] leading-tight mb-2">
                        Get your free NZ pathway plan
                    </h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                        Leave 3 quick details and our team will reply within 24 hours with the right next step — education, immigration or both.
                    </p>
                </div>

                <div className="px-6 pb-6">
                    <QuickLeadForm
                        source="exit-intent"
                        variant="card"
                        headline="Your details"
                        subtext="No obligation. We never share your contact info."
                        className="!shadow-none !border-0 !p-0"
                    />
                </div>
            </div>
        </div>
    );
}
