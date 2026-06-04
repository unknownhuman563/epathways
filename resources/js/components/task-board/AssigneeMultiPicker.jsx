import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

// Shared multi-select staff picker. Used by NewTaskModal and TaskDetailModal
// so the create + edit flows feel identical. Selected staff render as
// removable chips; the search field reveals a checkbox dropdown filtered
// by the query. "Assign to myself" is offered when the current user isn't
// already on the list.

const DEPARTMENT_LABEL = {
    sales:         "Sales",
    education:     "Education",
    immigration:   "Immigration",
    accommodation: "Accommodation",
    admin:         "Admin",
};

export default function AssigneeMultiPicker({
    value = [],
    onChange,
    visibleStaff = [],
    allStaff = [],
    currentUser = null,
    placeholder = "Leave blank — I'll handle it myself",
}) {
    const [q, setQ]       = useState("");
    const [open, setOpen] = useState(false);
    const containerRef    = useRef(null);

    useEffect(() => {
        const onDoc = (e) => {
            if (containerRef.current && ! containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const selectedIds = value.map(String);
    const selected    = selectedIds
        .map((id) => allStaff.find((s) => String(s.id) === id))
        .filter(Boolean);

    const meAlreadyAssigned = currentUser
        && selectedIds.includes(String(currentUser.id));

    const filtered = visibleStaff
        .filter((s) => ! selectedIds.includes(String(s.id)))
        .filter((s) => {
            if (! q.trim()) return true;
            const needle = q.trim().toLowerCase();
            return (s.name || "").toLowerCase().includes(needle)
                || (s.role || "").toLowerCase().includes(needle);
        })
        .slice(0, 30);

    const toggle = (id) => {
        const idStr = String(id);
        if (selectedIds.includes(idStr)) {
            onChange(value.filter((v) => String(v) !== idStr));
        } else {
            onChange([...value, Number(id)]);
        }
    };

    const remove = (id) => onChange(value.filter((v) => String(v) !== String(id)));

    const addMe = () => {
        if (! currentUser || meAlreadyAssigned) return;
        onChange([...value, Number(currentUser.id)]);
    };

    return (
        <div ref={containerRef} className="relative">
            <div
                className="min-h-[42px] w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white flex flex-wrap gap-1.5 items-center cursor-text"
                onClick={() => setOpen(true)}
            >
                {selected.length === 0 && ! open && (
                    <span className="text-sm text-gray-400 px-1.5 select-none">
                        {placeholder}
                    </span>
                )}
                {selected.map((s) => {
                    const isMe = currentUser && String(s.id) === String(currentUser.id);
                    return (
                        <span
                            key={s.id}
                            className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[11px] font-semibold ${
                                isMe ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"
                            }`}
                        >
                            {isMe ? "Me" : s.name}
                            {! isMe && s.role && (
                                <span className="opacity-60 font-normal">· {DEPARTMENT_LABEL[s.role] || s.role}</span>
                            )}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); remove(s.id); }}
                                className="ml-0.5 w-4 h-4 inline-flex items-center justify-center rounded-full hover:bg-black/10"
                                aria-label={`Remove ${s.name}`}
                            >
                                <X size={9} />
                            </button>
                        </span>
                    );
                })}
                <input
                    type="text"
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder={selected.length === 0 ? "" : "Add another…"}
                    className="flex-1 min-w-[120px] px-1.5 py-0.5 text-sm bg-transparent outline-none"
                />
            </div>

            {open && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                    {currentUser && ! meAlreadyAssigned && (
                        <button
                            type="button"
                            onClick={addMe}
                            className="w-full text-left px-3 py-2 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50 border-b border-gray-100 inline-flex items-center gap-2"
                        >
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center text-[10px] font-bold">
                                Me
                            </span>
                            Assign to myself ({currentUser.name})
                        </button>
                    )}

                    {filtered.length === 0 ? (
                        <div className="px-3 py-3 text-[12px] text-gray-500 text-center">
                            {q.trim()
                                ? "No matches."
                                : selected.length === visibleStaff.length
                                    ? "Everyone is already on this task."
                                    : "Type to search…"}
                        </div>
                    ) : (
                        filtered.map((s) => {
                            const isMe = currentUser && String(s.id) === String(currentUser.id);
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => toggle(s.id)}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                                >
                                    <input
                                        type="checkbox"
                                        checked={false}
                                        readOnly
                                        className="rounded"
                                    />
                                    <span className="font-medium text-gray-900 truncate">
                                        {isMe ? `${s.name} (me)` : s.name}
                                    </span>
                                    {s.role && (
                                        <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-400">
                                            {DEPARTMENT_LABEL[s.role] || s.role}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
