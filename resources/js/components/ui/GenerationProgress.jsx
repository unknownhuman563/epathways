import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileSignature } from "lucide-react";

// A friendly progress overlay for the ~15-20s engagement generation. There are
// no real progress events (it's one synchronous request), so the bar eases
// toward ~92% over time and the request completing hides the overlay.
const STEPS = [
    "Preparing your documents…",
    "Rendering the PDFs…",
    "Applying adviser details & signatures…",
    "Almost there…",
];

export default function GenerationProgress({ active, title = "Generating documents" }) {
    const [pct, setPct] = useState(0);
    const [stepIdx, setStepIdx] = useState(0);
    const timer = useRef(null);

    useEffect(() => {
        if (!active) {
            clearInterval(timer.current);
            setPct(0);
            setStepIdx(0);
            return;
        }
        setPct(8);
        setStepIdx(0);
        const started = Date.now();
        timer.current = setInterval(() => {
            const elapsed = Date.now() - started;
            // Ease toward ~92% over ~20s; never quite reach 100% until it's done.
            const target = Math.min(92, 8 + (elapsed / 20000) * 84);
            setPct((p) => Math.max(p, target));
            setStepIdx(Math.min(STEPS.length - 1, Math.floor(elapsed / 5000)));
        }, 300);
        return () => clearInterval(timer.current);
    }, [active]);

    if (!active) return null;

    return createPortal(
        <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                    <FileSignature size={22} />
                </div>
                <h2 className="text-sm font-bold text-gray-900 mt-3">{title}</h2>
                <p className="text-[12.5px] text-gray-500 mt-1 min-h-[18px]">{STEPS[stepIdx]}</p>
                <div className="mt-4 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-teal-600 transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[11px] text-gray-400 mt-2 tabular-nums">{Math.round(pct)}% · this can take a moment</p>
            </div>
        </div>,
        document.body,
    );
}
