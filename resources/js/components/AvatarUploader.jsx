import { useRef, useState } from "react";
import { usePage, router } from "@inertiajs/react";
import { Camera, Trash2, Loader2 } from "lucide-react";

/**
 * Self-contained profile-photo control. Reads the current user from the
 * shared auth prop (which carries avatar_url), shows the photo or an
 * initials fallback, and uploads/removes via the role-agnostic
 * /profile/avatar endpoints. The topbar avatar updates automatically once
 * Inertia re-shares auth.user after a successful upload.
 */
export default function AvatarUploader({ accent = "bg-gray-900", size = "w-16 h-16" }) {
    const { props } = usePage();
    const user = props.auth?.user || {};
    const error = props.errors?.avatar;
    const inputRef = useRef(null);
    const [busy, setBusy] = useState(false);

    const initial = (user.name || "?").slice(0, 1).toUpperCase();

    const pick = () => inputRef.current?.click();

    const upload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusy(true);
        router.post("/profile/avatar", { avatar: file }, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setBusy(false);
                if (inputRef.current) inputRef.current.value = "";
            },
        });
    };

    const remove = () => {
        if (!window.confirm("Remove your profile photo?")) return;
        setBusy(true);
        router.delete("/profile/avatar", { preserveScroll: true, onFinish: () => setBusy(false) });
    };

    return (
        <div className="flex items-center gap-4">
            <button
                type="button"
                onClick={pick}
                className={`relative ${size} rounded-2xl overflow-hidden group flex items-center justify-center text-2xl font-bold text-white ${accent}`}
                title="Change photo"
            >
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    <span>{initial}</span>
                )}
                <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {busy ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                </span>
            </button>

            <div className="flex flex-col gap-1.5">
                <button
                    type="button"
                    onClick={pick}
                    disabled={busy}
                    className="text-xs font-semibold text-gray-700 hover:text-gray-900 disabled:opacity-50 text-left"
                >
                    Change photo
                </button>
                {user.avatar_url && (
                    <button
                        type="button"
                        onClick={remove}
                        disabled={busy}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50 inline-flex items-center gap-1"
                    >
                        <Trash2 size={12} /> Remove
                    </button>
                )}
                <p className="text-[10px] text-gray-400">JPG, PNG or WebP · max 5MB</p>
                {error && <p className="text-[11px] text-rose-600">{error}</p>}
            </div>

            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={upload} />
        </div>
    );
}
