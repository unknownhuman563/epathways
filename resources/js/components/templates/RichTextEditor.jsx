import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { TextStyle, Color, FontSize } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { TextAlign } from "@tiptap/extension-text-align";
import { Link } from "@tiptap/extension-link";
import {
    Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, List, ListOrdered,
    AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Highlighter, Baseline, RemoveFormatting,
    MousePointerClick, Wand2,
} from "lucide-react";

// A body with tables/images is a rich layout the plain editor can't render — it
// gets a live preview here and is edited with the "Customize email body" builder.
const hasRichHtml = (html) => /<(table|img)\b/i.test(String(html || ""));

/**
 * The stock Link mark only round-trips href/rel/target, so saving a template
 * silently strips the inline `style` off CTA anchors — a green button turns
 * back into a plain blue link. Carrying `style` through keeps buttons intact.
 */
const StyledLink = Link.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            style: {
                default: null,
                parseHTML: (el) => el.getAttribute("style"),
                renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
            },
        };
    },
});

// House CTA pill — matches the buttons in DefaultMessageTemplatesSeeder.
const BUTTON_STYLE =
    "display:inline-block;padding:12px 26px;background:#2e7d32;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;";

const FONT_SIZES = [
    { label: "Small", value: "13px" },
    { label: "Normal", value: "" },
    { label: "Large", value: "18px" },
    { label: "X-Large", value: "24px" },
    { label: "Huge", value: "32px" },
];

function Btn({ active, disabled, onClick, title, children }) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            disabled={disabled}
            className={`h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 transition-colors ${
                active ? "bg-gray-900 text-white hover:bg-gray-900" : ""
            } disabled:opacity-40`}
        >
            {children}
        </button>
    );
}

const Divider = () => <span className="w-px h-5 bg-gray-200 mx-1" />;

/**
 * Simple-text email editor (TipTap), shown at email width. Rich layouts (tables/
 * images built in the "Customize email body" builder) render as a live preview
 * instead — the plain editor can't hold them, and would flatten them.
 */
export default function RichTextEditor({ value = "", onChange }) {
    const lastValue = useRef(value);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                link: false,
                heading: { levels: [1, 2, 3] },
            }),
            StyledLink.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener", target: "_blank" } }),
            TextStyle,
            Color,
            FontSize,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
        ],
        content: value || "",
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: "tiptap-body min-h-[380px] w-full max-w-[600px] mx-auto bg-white rounded shadow-sm px-8 py-6 outline-none text-sm text-gray-800",
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            lastValue.current = html;
            onChange?.(html);
        },
    });

    useEffect(() => {
        if (!editor) return;
        if (value === lastValue.current) return;
        lastValue.current = value;
        if (value !== editor.getHTML()) {
            editor.commands.setContent(value || "", { emitUpdate: false });
        }
    }, [value, editor]);

    if (!editor) {
        return <div className="min-h-[280px] rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />;
    }

    const currentSize = editor.getAttributes("textStyle").fontSize || "";

    const setSize = (v) => {
        if (v) editor.chain().focus().setFontSize(v).run();
        else editor.chain().focus().unsetFontSize().run();
    };

    const setLink = () => {
        const prev = editor.getAttributes("link").href || "";
        const url = window.prompt("Link URL", prev);
        if (url === null) return;
        if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
        else editor.chain().focus().extendMarkRange("link")
            .setLink({ href: url, style: editor.getAttributes("link").style || null }).run();
    };

    const setButton = () => {
        const prev = editor.getAttributes("link").href || "";
        const url = window.prompt("Button link URL", prev);
        if (url === null || url === "") return;
        editor.chain().focus().extendMarkRange("link")
            .setLink({ href: url, style: BUTTON_STYLE }).run();
    };

    return (
        <div className="rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-gray-300 overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
                <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={15} /></Btn>
                <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={15} /></Btn>
                <Btn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={15} /></Btn>

                <Divider />

                <select
                    title="Text size"
                    value={currentSize}
                    onChange={(e) => setSize(e.target.value)}
                    className="h-8 text-xs rounded-md border border-gray-200 bg-white px-1.5 text-gray-600 outline-none"
                >
                    {FONT_SIZES.map((s) => <option key={s.label} value={s.value}>{s.label}</option>)}
                </select>
                <Btn title="Heading" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={15} /></Btn>
                <Btn title="Subheading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={15} /></Btn>

                <Divider />

                <label title="Text color" className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 cursor-pointer relative">
                    <Baseline size={15} />
                    <input
                        type="color"
                        value={editor.getAttributes("textStyle").color || "#000000"}
                        onInput={(e) => editor.chain().focus().setColor(e.target.value).run()}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                </label>
                <label title="Highlight" className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 cursor-pointer relative">
                    <Highlighter size={15} />
                    <input
                        type="color"
                        value={editor.getAttributes("highlight").color || "#fff176"}
                        onInput={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                </label>

                <Divider />

                <Btn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={15} /></Btn>
                <Btn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={15} /></Btn>
                <Btn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={15} /></Btn>

                <Divider />

                <Btn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={15} /></Btn>
                <Btn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={15} /></Btn>
                <Btn title="Link" active={editor.isActive("link")} onClick={setLink}><LinkIcon size={15} /></Btn>
                <Btn title="Button" active={editor.isActive("link", { style: BUTTON_STYLE })} onClick={setButton}><MousePointerClick size={15} /></Btn>

                <Divider />

                <Btn title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><RemoveFormatting size={15} /></Btn>
            </div>

            {hasRichHtml(value) && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-100 bg-amber-50 text-[11px] text-amber-800">
                    <Wand2 size={13} className="text-[#436235] shrink-0" />
                    <span>This template has a rich layout. You can edit the text here, but it may simplify tables/images — use <strong>Customize email body</strong> to keep the full design.</span>
                </div>
            )}

            {/* Email-width canvas on a light ground, so it reads like a real email. */}
            <div className="bg-gray-100 p-4">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
