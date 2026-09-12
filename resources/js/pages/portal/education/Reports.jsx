import { useEffect, useMemo, useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { BookOpen, CheckCircle2, FileText, PencilLine, Save, X, RefreshCw, GraduationCap, Users, UserPlus, ClipboardList } from "lucide-react";

// Period presets — mirror the Immigration report.
const PRESETS = [
    { key: "today", label: "Today" },
    { key: "this_week", label: "This week" },
    { key: "two_weeks", label: "Last 2 weeks" },
    { key: "this_month", label: "This month" },
    { key: "last_month", label: "Last month" },
    { key: "quarter", label: "Last 3 months" },
    { key: "custom", label: "Custom" },
];

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short" }) : "—");

const SUMMARY_TITLES = { __new_students: "New students", __total_students: "Total students", __new_leads: "New leads", __register: "In the pipeline" };

// Each Students tab (Education / English / Immigration) tracks its own status
// set. Literal class strings only — Tailwind v4 JIT can't see concatenated names.
const DEPT_META = {
    education: { label: "Education", tab: "bg-blue-600", ring: "ring-blue-500", chip: "bg-blue-50 text-blue-700", head: "bg-blue-700" },
    english: { label: "English", tab: "bg-violet-600", ring: "ring-violet-500", chip: "bg-violet-50 text-violet-700", head: "bg-violet-700" },
    immigration: { label: "Immigration", tab: "bg-indigo-600", ring: "ring-indigo-500", chip: "bg-indigo-50 text-indigo-700", head: "bg-indigo-700" },
};

export default function EducationReports({ range = {}, pipeline = [], summary = {}, summaryLists = {}, totalRegister = 0, movements = 0, register = {}, departments = {}, programs = {}, conclusion = {}, generated_at = null, generated_by = null, error = null }) {
    const [customFrom, setCustomFrom] = useState(range.from || "");
    const [customTo, setCustomTo] = useState(range.to || "");
    // Which card's client list is open (null = none; lists don't show by default).
    // A value is either a stage name (pipeline card) or a "__key" (summary card).
    const [selectedStage, setSelectedStage] = useState(null);
    const go = (preset, extra = {}) => router.get("/portal/education/reports", { preset, ...extra }, { preserveScroll: true, preserveState: true });

    // Cap the reveal panel to the graph's height (desktop only) so the two
    // columns stay uniform — the client list then scrolls inside the panel
    // instead of stretching the row taller than the graph.
    const graphRef = useRef(null);
    const [graphH, setGraphH] = useState(null);
    useEffect(() => {
        const el = graphRef.current;
        if (!el) return;
        const mq = window.matchMedia("(min-width: 1024px)");
        const update = () => setGraphH(mq.matches ? el.offsetHeight : null);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        window.addEventListener("resize", update);
        return () => { ro.disconnect(); window.removeEventListener("resize", update); };
    }, [pipeline, selectedStage]);

    // Resolve the open card to a { title, rows } list.
    const openList = useMemo(() => {
        if (!selectedStage) return null;
        if (selectedStage === "__register") return { title: "On the register", rows: Object.values(register).flat() };
        if (selectedStage.startsWith("__")) return { title: SUMMARY_TITLES[selectedStage], rows: summaryLists[selectedStage.slice(2)] || [] };
        return { title: selectedStage, rows: register[selectedStage] || [] };
    }, [selectedStage, register, summaryLists]);

    // Keep the report live: refresh its data on a short interval and whenever
    // the tab regains focus, so stage/status changes made elsewhere reflect
    // here without a manual reload. Only the data props re-fetch (partial),
    // and local state (e.g. the note editor) is preserved.
    useEffect(() => {
        const refresh = () => router.reload({
            preserveScroll: true,
            preserveState: true,
            only: ["pipeline", "summary", "summaryLists", "register", "departments", "totalRegister", "movements", "programs", "conclusion", "generated_at"],
        });
        const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
        const id = setInterval(refresh, 20000);
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", refresh);
        return () => {
            clearInterval(id);
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", refresh);
        };
    }, []);

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-16">
            <Head title="Education Report" />

            <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">Updates and reporting</p>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">Education report</h1>
                <p className="text-sm text-gray-500 mt-1">{totalRegister} lead{totalRegister === 1 ? "" : "s"} in the pipeline · {movements} movement{movements === 1 ? "" : "s"} in {range.label?.toLowerCase()}.</p>
            </div>

            {/* Period tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 flex flex-wrap items-center gap-1">
                {PRESETS.map((p) => (
                    <button key={p.key} onClick={() => (p.key === "custom" ? go("custom", { from: customFrom, to: customTo }) : go(p.key))}
                        className={`px-3.5 py-2 rounded-xl text-[12px] font-bold uppercase tracking-wide transition-colors ${range.preset === p.key ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                        {p.label}
                    </button>
                ))}
                <span className="ml-auto flex items-center gap-3 pr-2 text-[12px] text-gray-400">
                    <span className="inline-flex items-center gap-1.5 text-blue-600 font-semibold" title="This report refreshes automatically">
                        <RefreshCw size={12} /> Live
                    </span>
                    <span>Showing <span className="font-semibold text-gray-600">{range.label}</span> · {range.days} day{range.days === 1 ? "" : "s"}</span>
                </span>
            </div>

            {range.preset === "custom" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-wrap items-end gap-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">From
                        <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="block mt-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm" />
                    </label>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">To
                        <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="block mt-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm" />
                    </label>
                    <button onClick={() => go("custom", { from: customFrom, to: customTo })} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">Apply</button>
                </div>
            )}

            {error ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">{error}</div>
            ) : (
                <>
                    {/* Section 01 — Education (the students register, broken down by
                        department: Education / English / Immigration, each under its
                        own real status set) */}
                    <Section n="01" title="Education">
                        <DepartmentBreakdown departments={departments} />
                    </Section>

                    {/* Section 02 — Pipeline overview. Graph only by default; a
                        client-list panel opens to the right when a bar is clicked. */}
                    <Section n="02" title="Pipeline position">
                        <div className="flex flex-col lg:flex-row gap-4 items-start">
                            <div className="w-full min-w-0 lg:flex-1">
                                <div ref={graphRef}>
                                    <PipelineChart pipeline={pipeline} selected={selectedStage} onSelect={(s) => setSelectedStage(selectedStage === s ? null : s)} />
                                </div>
                                <p className="mt-2 text-[11px] text-gray-400">Click any bar to open that stage's client list on the right.</p>
                            </div>
                            {openList && (
                                <div className="w-full lg:w-96 shrink-0">
                                    <div className="flex flex-col" style={graphH ? { height: graphH } : undefined}>
                                        <StageCard stage={openList.title} rows={openList.rows} singleCol fill onClose={() => setSelectedStage(null)} />
                                    </div>
                                    <p className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Moved during {range.label?.toLowerCase()}</p>
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* Section 03 — ePortal Programs */}
                    <Section n="03" title="ePortal Programs">
                        <div className="grid grid-cols-3 gap-3">
                            <Stat icon={BookOpen} value={programs.total} label="Total programs" sub="In the catalogue" />
                            <Stat icon={CheckCircle2} value={programs.published} label="Published" sub="Live on the site" />
                            <Stat icon={FileText} value={programs.draft} label="Drafts" sub="Not yet published" />
                        </div>
                    </Section>

                    {/* Section 04 — Conclusion */}
                    <Section n="04" title="Conclusion">
                        <ConclusionCard conclusion={conclusion} />
                    </Section>

                    <p className="text-center text-[11px] text-gray-400">
                        Generated {generated_at ? new Date(generated_at).toLocaleString("en-NZ") : "—"}{generated_by ? ` · ${generated_by}` : ""} · ePathways Education
                    </p>
                </>
            )}
        </div>
    );
}

// Section 01 pipeline as a horizontal bar graph. Each stage is a clickable
// bar sized to its share of the largest stage; selecting one reveals its
// client list below. Terminal ("outside process") stages are amber.
function PipelineChart({ pipeline = [], selected, onSelect }) {
    const max = Math.max(1, ...pipeline.map((p) => p.count));
    if (pipeline.length === 0) {
        return <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-[13px] text-gray-400">No leads in the pipeline for this period.</div>;
    }
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-1.5">
            {pipeline.map((p) => {
                const isSel = selected === p.stage;
                const pct = Math.max(2, Math.round((p.count / max) * 100));
                return (
                    <button
                        key={p.stage}
                        type="button"
                        onClick={() => onSelect(p.stage)}
                        title="Click to see this stage's clients"
                        className={`group w-full text-left rounded-lg px-2 py-1.5 transition-colors ${isSel ? "bg-blue-50" : "hover:bg-gray-50"}`}
                    >
                        <div className="flex items-center gap-3">
                            {/* Label column */}
                            <div className="w-40 sm:w-52 shrink-0 flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isSel ? "bg-blue-700 text-white" : "bg-blue-50 text-blue-700"}`}>{p.num}</span>
                                <span className={`text-[12px] font-semibold truncate ${isSel ? "text-blue-800" : "text-gray-800"}`}>{p.stage}</span>
                            </div>
                            {/* Bar column */}
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                                <div className="flex-1 h-6 rounded-md bg-gray-100 overflow-hidden">
                                    <div className="h-full rounded-md transition-all" style={{ width: `${pct}%`, backgroundColor: "#4f39f6" }} />
                                </div>
                                <span className={`w-12 text-right text-[15px] font-black tabular-nums ${isSel ? "text-blue-800" : "text-gray-900"}`}>{p.count}</span>
                                {p.moved > 0 && !p.outside && (
                                    <span className="hidden sm:inline text-[10px] font-bold text-blue-600 w-12 shrink-0">+{p.moved}</span>
                                )}
                                {p.outside && (
                                    <span className="hidden sm:inline text-[10px] font-bold text-amber-500 w-12 shrink-0">Outside</span>
                                )}
                                {p.moved === 0 && !p.outside && <span className="hidden sm:inline w-12 shrink-0" />}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function Section({ n, title, children }) {
    return (
        <div>
            <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-[13px] font-bold shrink-0">{n}</span>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Section · updates and reporting</p>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
                </div>
            </div>
            {children}
        </div>
    );
}

// Per-department status breakdown. Each department (Education / English /
// Immigration) has its OWN status set; a client can appear under more than one
// department, matching the Students-page tab badges. Click a status card to
// reveal the clients sitting at it.
function DepartmentBreakdown({ departments = {} }) {
    const keys = ["education", "english", "immigration"].filter((k) => departments[k]);
    const [active, setActive] = useState(keys[0] || "education");
    const [openStage, setOpenStage] = useState(null);
    const dept = departments[active] || { total: 0, moved: 0, stages: [] };
    const meta = DEPT_META[active] || DEPT_META.education;
    const open = openStage ? dept.stages.find((s) => s.stage === openStage) || null : null;
    const switchTo = (k) => { setActive(k); setOpenStage(null); };

    // Cap the reveal panel to the cards' height so the two columns stay uniform
    // (desktop only), the same as the pipeline graph.
    const cardsRef = useRef(null);
    const [cardsH, setCardsH] = useState(null);
    useEffect(() => {
        const el = cardsRef.current;
        if (!el) return;
        const mq = window.matchMedia("(min-width: 1024px)");
        const update = () => setCardsH(mq.matches ? el.offsetHeight : null);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        window.addEventListener("resize", update);
        return () => { ro.disconnect(); window.removeEventListener("resize", update); };
    }, [active, openStage, dept.stages.length]);

    if (keys.length === 0) {
        return <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-[13px] text-gray-400">No department data.</div>;
    }

    return (
        <div className="space-y-3">
            {/* Department tabs with total badges */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 flex flex-wrap items-center gap-1">
                {keys.map((k) => {
                    const m = DEPT_META[k];
                    const on = active === k;
                    return (
                        <button key={k} type="button" onClick={() => switchTo(k)}
                            className={`px-3.5 py-2 rounded-xl text-[12px] font-bold uppercase tracking-wide transition-colors inline-flex items-center gap-2 ${on ? `${m.tab} text-white` : "text-gray-500 hover:bg-gray-50"}`}>
                            {m.label}
                            <span className={`text-[11px] rounded-full px-1.5 py-0.5 tabular-nums ${on ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>{departments[k].total}</span>
                        </button>
                    );
                })}
                <span className="ml-auto pr-2 text-[12px] text-gray-400">{dept.moved} moved in period</span>
            </div>

            {/* Status cards on the left; the client list opens as a panel on the
                right when a card is clicked (matching the pipeline position). */}
            <div className="flex flex-col lg:flex-row gap-4 items-start">
                <div className="w-full min-w-0 lg:flex-1" ref={cardsRef}>
                    {dept.stages.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-[13px] text-gray-400">No {meta.label.toLowerCase()} clients in this period.</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {dept.stages.map((s) => {
                                const selected = openStage === s.stage;
                                return (
                                    <button key={s.stage} type="button" onClick={() => setOpenStage(selected ? null : s.stage)}
                                        title="Click to see clients at this status"
                                        className={`text-left rounded-2xl border shadow-sm p-4 bg-white transition-all ${selected ? `ring-2 ${meta.ring} ring-offset-1 border-transparent` : "border-gray-100 hover:border-gray-300 hover:shadow-md"}`}>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${meta.chip}`}>{s.moved > 0 ? `+${s.moved}` : "—"}</span>
                                            <span className="text-3xl font-black tabular-nums leading-none text-gray-900">{s.count}</span>
                                        </div>
                                        <p className="text-[12.5px] font-bold mt-2 text-gray-900">{s.stage}</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    <p className="mt-2 text-[11px] text-gray-400">Click any status card to open its client list on the right.</p>
                </div>
                {open && (
                    <div className="w-full lg:w-96 shrink-0">
                        <div className="flex flex-col" style={cardsH ? { height: cardsH } : undefined}>
                            <StageCard stage={`${meta.label} · ${open.stage}`} rows={open.clients} headClass={meta.head} singleCol fill onClose={() => setOpenStage(null)} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StageCard({ stage, rows = [], onClose, headClass = "bg-blue-700", singleCol = false, fill = false }) {
    const list = Array.isArray(rows) ? rows : [];
    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${fill ? "flex-1 min-h-0 flex flex-col" : ""}`}>
            <div className={`px-4 py-3 ${headClass} text-white flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-2">
                    <h4 className="text-[14px] font-bold">{stage}</h4>
                    <span className="text-[11px] font-bold bg-white/20 rounded-full px-2 py-0.5 tabular-nums">{list.length}</span>
                </div>
                {onClose && (
                    <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-white/15 text-white/90" title="Close"><X size={15} /></button>
                )}
            </div>
            {list.length === 0 ? (
                <p className="px-4 py-8 text-center text-[12.5px] text-gray-300">No clients on this stage.</p>
            ) : (
                <ul className={`divide-y divide-gray-50 overflow-y-auto ${fill ? "flex-1 min-h-0" : singleCol ? "max-h-[70vh]" : "max-h-[460px] sm:columns-2 sm:divide-y-0"}`}>
                    {list.map((r) => (
                        <li key={r.id} className="px-4 py-2 flex items-center gap-2 border-b border-gray-50 break-inside-avoid">
                            {r.moved && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                            <span className={`text-[12.5px] truncate ${r.moved ? "font-bold text-gray-900" : "text-gray-700"}`}>{r.name}</span>
                            {r.ref && <span className="text-[11px] text-gray-400 shrink-0">({r.ref})</span>}
                            <span className="ml-auto text-[11px] text-gray-400 shrink-0">{fmtDate(r.date)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function Stat({ icon: Icon, value, label, sub, dark, onClick, selected }) {
    const Tag = onClick ? "button" : "div";
    return (
        <Tag
            type={onClick ? "button" : undefined}
            onClick={onClick}
            title={onClick ? "Click to see the list" : undefined}
            className={`text-left w-full bg-white rounded-2xl border shadow-sm p-4 transition-all ${selected ? "ring-2 ring-blue-500 ring-offset-1" : "border-gray-100"} ${onClick ? "hover:border-blue-300 hover:shadow-md" : ""}`}
        >
            <div className="flex items-start justify-between">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? "bg-gray-900 text-white" : "bg-blue-600 text-white"}`}><Icon size={18} /></span>
                <span className="text-3xl font-black text-gray-900 tabular-nums leading-none">{value ?? 0}</span>
            </div>
            <p className="text-[13px] font-bold text-gray-900 mt-3">{label}</p>
            {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
        </Tag>
    );
}

function ConclusionCard({ conclusion = {} }) {
    const [editing, setEditing] = useState(false);
    const [note, setNote] = useState(conclusion.note || "");
    const [saving, setSaving] = useState(false);
    const stats = conclusion.stats || {};

    const save = () => {
        setSaving(true);
        router.post("/portal/education/reports/note", { note_key: conclusion.note_key, note }, {
            preserveScroll: true, onSuccess: () => setEditing(false), onFinish: () => setSaving(false),
        });
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <MiniStat value={stats.movements} label="Lead movements" />
                <MiniStat value={stats.qualified} label="Newly qualified" />
                <MiniStat value={stats.proposals} label="Proposals sent" />
                <MiniStat value={stats.register} label="In the pipeline" />
            </div>
            <p className="text-[13px] text-gray-700 leading-relaxed">{conclusion.auto}</p>

            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Commentary for this period</p>
                    {!editing && (
                        <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800">
                            <PencilLine size={12} /> {conclusion.note ? "Edit" : "Add note"}
                        </button>
                    )}
                </div>
                {editing ? (
                    <div>
                        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Add the week's commentary, follow-ups and the week ahead…" />
                        <div className="flex items-center justify-end gap-2 mt-2">
                            <button onClick={() => { setEditing(false); setNote(conclusion.note || ""); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-gray-600 rounded-lg hover:bg-gray-100"><X size={13} /> Cancel</button>
                            <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-[12px] font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"><Save size={13} /> {saving ? "Saving…" : "Save"}</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">{conclusion.note || <span className="text-gray-300">No commentary added for this period.</span>}</p>
                )}
            </div>
        </div>
    );
}

function MiniStat({ value, label }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5 text-center">
            <p className="text-2xl font-black text-gray-900 tabular-nums leading-none">{value ?? 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">{label}</p>
        </div>
    );
}
