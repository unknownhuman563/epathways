import { useRef, useState, useEffect } from "react";
import EmailEditor from "react-email-editor";
import { X, Save, Loader2, AlertTriangle } from "lucide-react";

// Laravel accepts the encrypted XSRF-TOKEN cookie as an X-XSRF-TOKEN header, so
// image uploads pass CSRF without a meta tag.
function xsrfHeader() {
    const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return m ? { "X-XSRF-TOKEN": decodeURIComponent(m[1]) } : {};
}

// Minimal Unlayer design wrapping a single content block. `content` is a
// ready-made Unlayer content descriptor.
function singleBlockDesign(content) {
    return {
        counters: { u_row: 1, u_column: 1, u_content_text: 1, u_content_html: 1 },
        body: {
            id: "body",
            rows: [{
                id: "u_row_1",
                cells: [1],
                columns: [{ id: "u_column_1", contents: [content], values: {} }],
                values: {},
            }],
            values: {},
        },
        schemaVersion: 16,
    };
}

// Simple content → a native TEXT block, so it's fully inline-editable (click &
// type) in the canvas rather than locked behind the HTML code panel.
function textBlockDesign(html) {
    return singleBlockDesign({
        id: "u_content_text_1",
        type: "text",
        values: {
            text: html,
            containerPadding: "10px",
            selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
            _meta: { htmlID: "u_content_text_1", htmlClassNames: "u_content_text" },
        },
    });
}

// Pick the block type: text (inline-editable) for simple content, HTML (preserves
// layout) only when the content has tables/images a text block can't hold.
function seedDesign(html) {
    return /<(table|img)\b/i.test(html) ? htmlBlockDesign(html) : textBlockDesign(html);
}

// Wrap existing template HTML in a minimal Unlayer design (one HTML block) so a
// template that was never built in Unlayer still shows its current content when
// opened — the user can edit it or drop native blocks around it.
function htmlBlockDesign(html) {
    // Unlayer resets <p>/<h*> margins to 0 inside an HTML block, which collapses
    // the paragraph spacing. Restore it with a scoped style so the seeded content
    // keeps its original layout.
    const wrapped =
        "<style>.ep-legacy p{margin:0 0 16px;}.ep-legacy h1,.ep-legacy h2,.ep-legacy h3{margin:0 0 12px;}.ep-legacy ul,.ep-legacy ol{margin:0 0 16px;padding-left:22px;}.ep-legacy{line-height:1.6;color:#333333;font-size:14px;}</style>"
        + `<div class="ep-legacy">${html}</div>`;

    return {
        counters: { u_row: 1, u_column: 1, u_content_html: 1 },
        body: {
            id: "body",
            rows: [{
                id: "u_row_1",
                cells: [1],
                columns: [{
                    id: "u_column_1",
                    contents: [{
                        id: "u_content_html_1",
                        type: "html",
                        values: {
                            html: wrapped,
                            hideDesktop: false,
                            displayCondition: null,
                            containerPadding: "10px",
                            selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
                            _meta: { htmlID: "u_content_html_1", htmlClassNames: "u_content_html" },
                        },
                    }],
                    values: {},
                }],
                values: {},
            }],
            values: {},
        },
        schemaVersion: 16,
    };
}

/**
 * Modern drag-and-drop email builder (Unlayer via react-email-editor). Images
 * upload to OUR server (not Unlayer's CDN). Loads a saved design for re-editing,
 * or seeds an existing template's HTML so its content shows; on save exports
 * both the design (to re-open later) and the final HTML email.
 */
const HEADER_PX = 57;

export default function EmailBuilder({ initialDesign = null, initialHtml = "", uploadUrl, onSave, onClose }) {
    const unlayerRef = useRef(null);
    const [status, setStatus] = useState("loading"); // loading | ready | error
    // react-email-editor sizes the editor by a NUMERIC minHeight (px) — a calc()
    // string is ignored — so drive it from the viewport and keep it in sync.
    const [editorH, setEditorH] = useState(() => (typeof window !== "undefined" ? window.innerHeight - HEADER_PX : 700));

    useEffect(() => {
        const onResize = () => setEditorH(window.innerHeight - HEADER_PX);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // If the Unlayer editor script hasn't loaded in time, it's almost always
    // blocked (ad-blocker / network / firewall) — surface that instead of a blank.
    useEffect(() => {
        const t = setTimeout(() => setStatus((s) => (s === "loading" ? "error" : s)), 20000);
        return () => clearTimeout(t);
    }, []);

    const onReady = (unlayer) => {
        unlayerRef.current = unlayer;
        setStatus("ready");

        // Route the image tool's uploads to our own endpoint.
        unlayer.registerCallback("image", async (file, done) => {
            try {
                const form = new FormData();
                form.append("files[]", file.attachments[0]);
                const res = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { ...xsrfHeader(), Accept: "application/json" },
                    credentials: "same-origin",
                    body: form,
                });
                const json = await res.json();
                done({ progress: 100, url: json?.data?.[0]?.src || "" });
            } catch (e) {
                done({ progress: 100, url: "" });
            }
        });

        try {
            if (initialDesign) {
                unlayer.loadDesign(initialDesign);
            } else if (initialHtml && initialHtml.trim()) {
                // Never built in Unlayer — seed the current content (editable text
                // block for simple content, HTML block for table/image layouts).
                unlayer.loadDesign(seedDesign(initialHtml));
            }
        } catch (e) { /* start from blank */ }
    };

    const save = () => {
        const unlayer = unlayerRef.current;
        if (!unlayer) return;
        unlayer.exportHtml((data) => onSave?.(data.html, data.design));
    };

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
                <h3 className="text-sm font-bold text-gray-900">Customize email body</h3>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-100">
                        <X size={15} /> Cancel
                    </button>
                    <button type="button" onClick={save} className="inline-flex items-center gap-2 px-5 py-2 bg-[#436235] text-white text-sm font-bold rounded-xl hover:bg-[#375029]">
                        <Save size={15} /> Save &amp; close
                    </button>
                </div>
            </div>
            <div className="flex-1 min-h-0 relative overflow-hidden">
                {status === "loading" && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white text-sm text-gray-500">
                        <Loader2 className="animate-spin" size={22} /> Loading the email builder…
                    </div>
                )}
                {status === "error" && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white text-center px-8">
                        <AlertTriangle className="text-amber-500" size={28} />
                        <p className="text-sm font-semibold text-gray-800">The email builder couldn&rsquo;t load.</p>
                        <p className="text-xs text-gray-500 max-w-md">Its editor loads from <code className="bg-gray-100 rounded px-1">editor.unlayer.com</code>. This is usually blocked by an ad-blocker, browser extension, VPN, or network firewall. Disable blockers for this site (or try another network/browser) and reopen.</p>
                        <button type="button" onClick={onClose} className="mt-1 px-4 py-2 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-100">Close</button>
                    </div>
                )}
                <EmailEditor
                    onReady={onReady}
                    minHeight={editorH}
                    options={{ appearance: { theme: "modern_light" } }}
                />
            </div>
        </div>
    );
}
