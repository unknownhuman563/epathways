import { useEffect, useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import {
    DndContext, DragOverlay, KeyboardSensor, PointerSensor,
    useDraggable, useDroppable, useSensor, useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
    STATUS_LABEL, STATUS_DOT, statusLabel, tempBadge, daysStyle, initials, STAGE_INPUTS,
} from "@/lib/onboardingMeta";
import ConvertTenantModal from "./ConvertTenantModal";
import TransitionModal from "./TransitionModal";
import StageEmailModal from "./StageEmailModal";
import { hasStageEmail } from "@/lib/stageEmails";

export default function OnboardingKanban({ board = [], options = {} }) {
    const stages = options.stages ?? [];
    const terminals = options.terminals ?? [];
    const transitions = options.transitions ?? {};
    const columns = [...stages, ...terminals];

    const [local, setLocal] = useState(board);
    useEffect(() => setLocal(board), [board]);

    const [activeId, setActiveId] = useState(null);
    const [convertFor, setConvertFor] = useState(null);     // submission
    const [emailFor, setEmailFor] = useState(null); // { submission, target }
    const [transitionFor, setTransitionFor] = useState(null); // { submission, target }
    const [collapsed, setCollapsed] = useState(() =>
        Object.fromEntries(terminals.map((t) => [t, true])));

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor),
    );

    const grouped = useMemo(() => {
        const out = Object.fromEntries(columns.map((c) => [c, []]));
        for (const s of local) (out[s.status] ?? (out[s.status] = [])).push(s);
        return out;
    }, [local, columns.join(",")]);

    const move = (sub, target) => {
        const prev = sub.status;
        setLocal((list) => list.map((s) => (s.id === sub.id ? { ...s, status: target } : s)));
        router.patch(`/portal/accommodation/applications/${sub.id}/status`, { status: target }, {
            preserveScroll: true,
            preserveState: true,
            onError: () => {
                setLocal((list) => list.map((s) => (s.id === sub.id ? { ...s, status: prev } : s)));
                toast.error("Could not update stage");
            },
        });
    };

    const handleDragEnd = ({ active, over }) => {
        setActiveId(null);
        if (!over) return;
        const sub = local.find((s) => String(s.id) === String(active.id));
        if (!sub) return;
        const target = String(over.id);
        const from = sub.status;
        if (from === target) return;

        if (!(transitions[from] ?? []).includes(target)) {
            toast.error(`Cannot move from ${statusLabel(from)} to ${statusLabel(target)}`);
            return;
        }
        if (target === "moved_in") { setConvertFor(sub); return; }
        if (hasStageEmail(target)) { setEmailFor({ submission: sub, target }); return; }
        if (STAGE_INPUTS[target]) { setTransitionFor({ submission: sub, target }); return; }
        move(sub, target);
    };

    const activeSub = activeId ? local.find((s) => String(s.id) === String(activeId)) : null;

    return (
        <>
            <DndContext
                sensors={sensors}
                onDragStart={(e) => setActiveId(e.active.id)}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveId(null)}
            >
                <div className="flex gap-3 overflow-x-auto pb-3">
                    {columns.map((status) => (
                        <Column
                            key={status}
                            status={status}
                            cards={grouped[status] ?? []}
                            collapsed={!!collapsed[status]}
                            onToggle={() => setCollapsed((c) => ({ ...c, [status]: !c[status] }))}
                        />
                    ))}
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeSub && <Card sub={activeSub} overlay />}
                </DragOverlay>
            </DndContext>

            {convertFor && (
                <ConvertTenantModal
                    submission={convertFor}
                    properties={options.properties ?? []}
                    contractTypes={options.contract_types ?? []}
                    onClose={() => setConvertFor(null)}
                />
            )}
            {transitionFor && (
                <TransitionModal
                    submission={transitionFor.submission}
                    target={transitionFor.target}
                    onClose={() => setTransitionFor(null)}
                />
            )}
            {emailFor && (
                <StageEmailModal
                    submission={emailFor.submission}
                    target={emailFor.target}
                    onClose={() => setEmailFor(null)}
                />
            )}
        </>
    );
}

function Column({ status, cards, collapsed, onToggle }) {
    const { setNodeRef, isOver } = useDroppable({ id: status });

    if (collapsed) {
        return (
            <div ref={setNodeRef} className={`flex-shrink-0 w-12 flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-2 ${isOver ? "ring-2 ring-gray-900/15" : ""}`}>
                <button onClick={onToggle} className="text-gray-400 hover:text-gray-700 text-xs">›</button>
                <span className={`mt-2 h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
                <span className="mt-2 rounded-full border border-gray-200 bg-white px-1.5 text-[10px] font-bold text-gray-700">{cards.length}</span>
                <span className="mt-2 text-[11px] font-semibold text-gray-600" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{statusLabel(status)}</span>
            </div>
        );
    }

    return (
        <div className={`flex-shrink-0 w-[260px] flex flex-col rounded-2xl border border-gray-200 bg-white p-3 ${isOver ? "ring-2 ring-[#1F5A8B]/20" : ""}`}>
            <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="inline-flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
                    {statusLabel(status)}
                    <span className="font-normal text-gray-400">({cards.length})</span>
                </h3>
                {onToggle && (status === "declined" || status === "not_proceeding") && (
                    <button onClick={onToggle} className="text-gray-400 hover:text-gray-700 text-xs">‹</button>
                )}
            </div>
            <div ref={setNodeRef} className="flex-1 min-h-[120px] space-y-2">
                {cards.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-center text-[11px] text-gray-400">Empty</div>
                ) : (
                    cards.map((s) => <DraggableCard key={s.id} sub={s} />)
                )}
            </div>
        </div>
    );
}

function DraggableCard({ sub }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(sub.id) });
    const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card sub={sub} />
        </div>
    );
}

function Card({ sub, overlay = false }) {
    const propLabel = sub.property?.code ? `#${sub.property.code}` : (sub.property?.address || sub.property_interested);
    return (
        <div
            className={`rounded-xl border border-gray-100 bg-white p-3 shadow-sm ${overlay ? "rotate-1 shadow-lg" : "cursor-grab hover:border-gray-200"}`}
            onClick={() => !overlay && router.visit(`/portal/accommodation/applications/${sub.id}`)}
        >
            <div className="flex items-center justify-between">
                {tempBadge(sub.lead_temperature) && (
                    <span className="text-[11px] font-semibold text-gray-500">{tempBadge(sub.lead_temperature)}</span>
                )}
                {sub.assigned_to && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1F5A8B] text-[9px] font-bold text-white" title={sub.assigned_to.name}>
                        {initials(sub.assigned_to.name)}
                    </span>
                )}
            </div>
            <p className="mt-1 text-sm font-semibold text-gray-900">{sub.full_legal_name}</p>
            {propLabel && <p className="text-xs text-gray-500">{propLabel}</p>}
            <p className={`mt-1 text-[11px] ${daysStyle(sub.days_at_current_stage)}`}>
                {sub.days_at_current_stage ?? 0}d at stage
            </p>
        </div>
    );
}
