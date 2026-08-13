import React, { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { Clock, LogIn, LogOut, Save, Settings, AlertTriangle, CheckCircle, BarChart3, Download, ChevronDown, ListChecks, ChevronLeft, ChevronRight, Plus, CalendarDays, FileSignature, Eraser, X, Check } from "lucide-react";

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Carried-forward pending items from earlier days — the checklist to close.
function CarriedChecklist({ carried }) {
    const [items, setItems] = useState(carried);
    useEffect(() => setItems(carried), [carried]);
    if (!items.length) return null;

    const done = (it) => {
        setItems((p) => p.filter((x) => !(x.entry_id === it.entry_id && x.index === it.index)));
        router.post("/dtr/pending/toggle", { entry_id: it.entry_id, index: it.index, done: true }, { preserveScroll: true, preserveState: true });
    };

    return (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
                <ListChecks size={16} className="text-amber-700" />
                <h2 className="text-sm font-bold text-amber-800">Carry-over checklist — {items.length} pending item{items.length === 1 ? "" : "s"} to close</h2>
            </div>
            <div className="space-y-1.5">
                {items.map((it) => (
                    <label key={`${it.entry_id}-${it.index}`} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-white border border-amber-100 hover:border-amber-300 cursor-pointer transition-colors">
                        <input type="checkbox" onChange={() => done(it)} className="mt-0.5 accent-emerald-600" />
                        <span className="text-sm text-gray-800 flex-1">{it.text}</span>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">from {it.date}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

// Interactive month calendar — colours each day by its logged status and
// lets you click a logged day to open its editor in the table.
function DtrCalendar({ entries, leaves = [], holidays = {}, today, expanded, onPick }) {
    const byDate = useMemo(() => Object.fromEntries(entries.map((e) => [e.work_date, e])), [entries]);
    const leaveByDate = useMemo(() => {
        const m = {};
        leaves.filter((l) => l.status === "approved").forEach((l) => {
            const d = new Date(l.start_date + "T00:00:00");
            const end = new Date(l.end_date + "T00:00:00");
            while (d <= end) {
                m[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`] = l.type;
                d.setDate(d.getDate() + 1);
            }
        });
        return m;
    }, [leaves]);
    const [cur, setCur] = useState(() => { const d = new Date(today + "T00:00:00"); return { y: d.getFullYear(), m: d.getMonth() }; });
    const first = new Date(cur.y, cur.m, 1);
    const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate();
    const pad = (n) => String(n).padStart(2, "0");
    const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    const step = (delta) => setCur((c) => { let m = c.m + delta, y = c.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return { y, m }; });

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{first.toLocaleString("en-US", { month: "long" })} {cur.y}</h3>
                <div className="flex items-center gap-1">
                    <button onClick={() => step(-1)} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft size={18} /></button>
                    <button onClick={() => step(1)} className="p-2 rounded-lg hover:bg-gray-100"><ChevronRight size={18} /></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-gray-400 mb-1.5">{DOW.map((d) => <div key={d}>{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-1.5">
                {cells.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const ds = `${cur.y}-${pad(cur.m + 1)}-${pad(d)}`;
                    const e = byDate[ds];
                    const leaveType = leaveByDate[ds];
                    const holidayName = holidays[ds];
                    const isToday = ds === today;
                    // Future days hold no data yet — informational only (leave /
                    // holiday colouring stays) but not clickable, so no dropdown.
                    const isFuture = ds > today;
                    const missing = e && e.net_hrs != null && e.tasks_count === 0;
                    const late = e && e.attendance === "Late";
                    const cellCls = leaveType ? "bg-indigo-50 border-indigo-200"
                        : missing ? "bg-amber-50 border-amber-200"
                        : late ? "bg-rose-50 border-rose-200"
                        : e ? "bg-emerald-50 border-emerald-200"
                        : holidayName ? "bg-orange-50 border-orange-200"
                        : isFuture ? "bg-gray-50/40 border-gray-100"
                        : "bg-white border-gray-100 hover:border-gray-300";
                    const label = leaveType ? leaveType
                        : late ? "Late"
                        : missing ? "No task"
                        : (e && e.net_hrs != null) ? `${e.net_hrs.toFixed(1)}h`
                        : holidayName || "";
                    const labelTone = leaveType ? "text-indigo-600" : late ? "text-rose-600" : missing ? "text-amber-600" : e ? "text-emerald-700" : "text-orange-600";
                    const inner = (
                        <>
                            <span className={`text-sm font-bold ${isFuture ? "text-gray-300" : (e || leaveType || holidayName) ? "text-gray-800" : "text-gray-400"}`}>{d}</span>
                            {holidayName && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-orange-400" />}
                            {label && <span className={`absolute bottom-2 left-2.5 truncate max-w-[calc(100%-1.25rem)] text-[10px] font-bold ${labelTone} ${isFuture ? "opacity-70" : ""}`}>{label}</span>}
                        </>
                    );
                    const base = `relative h-24 rounded-xl border p-2.5 text-left ${cellCls} ${isToday ? "ring-2 ring-[#436235]" : ""} ${expanded === ds ? "ring-2 ring-gray-900 ring-offset-1" : ""}`;
                    const title = [leaveType && `Leave — ${leaveType}`, holidayName, isFuture ? "Upcoming — no record yet" : null].filter(Boolean).join(" · ") || undefined;
                    return isFuture ? (
                        <div key={i} title={title} className={`${base} cursor-default`}>{inner}</div>
                    ) : (
                        <button key={i} onClick={() => onPick(ds)} title={title}
                            className={`${base} transition-all hover:shadow-sm cursor-pointer`}>{inner}</button>
                    );
                })}
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-[11px] text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 inline-block" /> Logged</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 inline-block" /> No task</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-100 inline-block" /> Late</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-100 inline-block" /> Leave</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> Holiday</span>
            </div>
        </div>
    );
}

const leaveBadge = (s) => s === "approved" ? "bg-emerald-100 text-emerald-700" : s === "rejected" ? "bg-rose-100 text-rose-700" : s === "deferred" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700";

// Leave-type descriptions lifted from the Application for Leave form.
const LEAVE_TYPE_HINT = {
    "Annual Leave": "Paid recreation leave (pro-rata for part-time).",
    "Personal / Sick Leave": "Own illness or injury.",
    "Carer's Leave": "Caring for an ill family / household member or emergency.",
    "Compassionate / Bereavement Leave": "Life-threatening illness, injury or death of a family / household member.",
    "Other": "e.g. leave in advance, cashing-out request.",
};
const DECISIONS = ["Approved", "Approved in part", "Declined", "Deferred"];

// Section header bar matching the paper form's look.
function SectionBar({ n, title }) {
    return (
        <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#436235]">Section {n}</p>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
        </div>
    );
}

// Draw-your-signature field — same widget as the agreement signing: a raw
// canvas whose cursor coordinates are scaled to its pixel resolution, so ink
// lands exactly under the pointer even though CSS stretches the box to full
// width. Captures a PNG data URI on each stroke, with a Clear link.
function SignaturePad({ label = "Draw your signature", value, onChange, penColor = "#111827" }) {
    const canvasRef = useRef(null);
    const drawing = useRef(false);
    const last = useRef({ x: 0, y: 0 });
    const dirty = useRef(false);

    // Pen style.
    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext("2d");
        ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = penColor;
    }, [penColor]);

    // Redraw a saved signature back onto the canvas (e.g. reopening a signed
    // record). Skipped while the user is mid-drawing so it never clobbers ink.
    useEffect(() => {
        const c = canvasRef.current;
        if (!c || !value || dirty.current) return;
        const img = new Image();
        img.onload = () => { const ctx = c.getContext("2d"); ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height); };
        img.src = value;
    }, [value]);

    // Map a pointer event to canvas pixel coordinates (accounts for CSS scale).
    const pos = (e) => {
        const c = canvasRef.current;
        const r = c.getBoundingClientRect();
        const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
        const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
        return { x: cx * (c.width / r.width), y: cy * (c.height / r.height) };
    };
    const start = (e) => { e.preventDefault(); drawing.current = true; last.current = pos(e); };
    const move = (e) => {
        if (!drawing.current) return;
        e.preventDefault();
        const ctx = canvasRef.current.getContext("2d");
        const p = pos(e);
        ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        last.current = p; dirty.current = true;
    };
    const end = () => {
        if (!drawing.current) return;
        drawing.current = false;
        onChange(canvasRef.current.toDataURL("image/png"));
    };
    const clear = () => {
        const c = canvasRef.current;
        c.getContext("2d").clearRect(0, 0, c.width, c.height);
        dirty.current = false;
        onChange(null);
    };

    return (
        <div>
            <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-400 mb-2 flex items-center gap-1.5">
                <FileSignature size={12} /> {label}
            </p>
            <div className="border-2 border-dashed border-gray-200 bg-white rounded-lg max-w-md">
                <canvas ref={canvasRef} width={460} height={240}
                    className="w-full h-[240px] touch-none cursor-crosshair block"
                    onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
                    onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
            </div>
            <button type="button" onClick={clear} className="mt-2 text-[12px] font-semibold text-gray-500 hover:text-gray-700 inline-flex items-center gap-1.5">
                <Eraser size={13} /> Clear
            </button>
        </div>
    );
}

// The full Application for Leave form — Sections 1–4, submitted by the staffer.
function LeaveForm({ account = {}, setting = {}, leaveTypes = [], minLeaveDate = "", today = "" }) {
    const [f, setF] = useState({
        full_name: account.name || "",
        position: setting.position || "",
        type: "",
        other_specify: "",
        start_date: minLeaveDate,
        end_date: minLeaveDate,
        return_date: "",
        total_days: "",
        half_day: "N/A",
        reason: "",
        declaration: false,
        employee_signature: null,
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
    const setV = (k, v) => setF((p) => ({ ...p, [k]: v }));
    const input = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30 focus:border-[#436235]";

    const validate = () => {
        const e = {};
        if (!f.full_name.trim()) e.full_name = "Required.";
        if (!f.type) e.type = "Select a leave type.";
        if (f.type === "Other" && !f.other_specify.trim()) e.other_specify = "Please specify.";
        if (!f.start_date) e.start_date = "Required.";
        if (!f.end_date) e.end_date = "Required.";
        if (!f.declaration) e.declaration = "You must accept the declaration.";
        if (!f.employee_signature) e.employee_signature = "Please add your signature.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };
    const submit = () => {
        if (!validate()) return;
        setSaving(true);
        router.post("/dtr/leaves", { ...f, declaration: f.declaration ? 1 : 0 }, {
            preserveScroll: true,
            onError: (errs) => setErrors(errs),
            onFinish: () => setSaving(false),
            onSuccess: () => setF((p) => ({ ...p, type: "", other_specify: "", reason: "", declaration: false, employee_signature: null })),
        });
    };
    const err = (k) => errors[k] ? <p className="text-[11px] text-rose-600 mt-1">{errors[k]}</p> : null;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                <h2 className="text-lg font-bold text-gray-900">Application for Leave</h2>
                <p className="text-sm text-gray-500 mt-0.5">Complete Sections 1–4 and sign the declaration. Must be filed at least 1 week ahead. Your manager completes Section 5.</p>
            </div>

            <div className="p-6 space-y-8">
                {/* Section 1 */}
                <div>
                    <SectionBar n={1} title="Employee Details" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Full name <span className="text-gray-300 normal-case">(Surname, Given name)</span></span>
                            <input className={input} value={f.full_name} onChange={set("full_name")} placeholder="Cruz, Maria" />
                            {err("full_name")}
                        </label>
                        <label className="block">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Position / Job title</span>
                            <input className={input} value={f.position} onChange={set("position")} />
                        </label>
                    </div>
                </div>

                {/* Section 2 */}
                <div>
                    <SectionBar n={2} title="Type of Leave Requested" />
                    <p className="text-[11px] text-gray-400 mb-3">Select one. Refer to the Leave Policy for the entitlements that apply to your employment type.</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {leaveTypes.map((t) => {
                            const selected = f.type === t;
                            return (
                                <button type="button" key={t} onClick={() => setV("type", t)}
                                    className={`text-left rounded-xl border p-3 transition-all ${selected ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${selected ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-300"}`}>{selected && <Check size={13} />}</span>
                                        <span className="text-sm font-bold text-gray-900">{t}</span>
                                    </div>
                                    {LEAVE_TYPE_HINT[t] && <p className="text-[11px] text-gray-500 mt-1 ml-7">{LEAVE_TYPE_HINT[t]}</p>}
                                </button>
                            );
                        })}
                    </div>
                    {err("type")}
                    {f.type === "Other" && (
                        <label className="block mt-3">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">If "Other", please specify</span>
                            <input className={input} value={f.other_specify} onChange={set("other_specify")} />
                            {err("other_specify")}
                        </label>
                    )}
                </div>

                {/* Section 3 */}
                <div>
                    <SectionBar n={3} title="Leave Period & Details" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="block">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">First day of leave</span>
                            <input type="date" min={minLeaveDate} className={input} value={f.start_date} onChange={set("start_date")} />
                            {err("start_date")}
                        </label>
                        <label className="block">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Last day of leave</span>
                            <input type="date" min={f.start_date || minLeaveDate} className={input} value={f.end_date} onChange={set("end_date")} />
                            {err("end_date")}
                        </label>
                        <label className="block">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Date returning to work</span>
                            <input type="date" min={f.end_date || minLeaveDate} className={input} value={f.return_date} onChange={set("return_date")} />
                        </label>
                        <label className="block">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Total working days requested</span>
                            <input type="number" step="0.5" min="0" className={input} value={f.total_days} onChange={set("total_days")} />
                        </label>
                        <label className="block">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Half day?</span>
                            <select className={input} value={f.half_day} onChange={set("half_day")}>
                                <option value="N/A">N/A</option><option value="AM">AM</option><option value="PM">PM</option>
                            </select>
                        </label>
                    </div>
                    <label className="block mt-4">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Reason for leave / additional details</span>
                        <textarea rows={2} className={`${input} resize-y`} value={f.reason} onChange={set("reason")} placeholder="Optional…" />
                    </label>
                </div>

                {/* Section 4 */}
                <div>
                    <SectionBar n={4} title="Employee Declaration" />
                    <label className="flex items-start gap-2.5 cursor-pointer rounded-xl border border-gray-200 p-3 hover:border-gray-300">
                        <input type="checkbox" checked={f.declaration} onChange={(e) => setV("declaration", e.target.checked)} className="mt-0.5 w-4 h-4 accent-emerald-600" />
                        <span className="text-[13px] text-gray-700">I declare that the information provided in this application is true and correct. I have requested this leave in accordance with the Company Leave Policy and, where leave in advance is granted, I agree that any leave debt may be deducted from my final pay should I leave before it is repaid.</span>
                    </label>
                    {err("declaration")}
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-6">
                        <div>
                            <SignaturePad label="Employee signature" value={f.employee_signature} onChange={(v) => setV("employee_signature", v)} />
                            {err("employee_signature")}
                        </div>
                        <div className="pb-1">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Date</span>
                            <p className="text-sm font-semibold text-gray-700 border-b border-gray-300 pb-1 min-w-[140px]">{today || "—"}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
                <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#436235] text-white text-sm font-bold rounded-xl hover:bg-[#375029] disabled:opacity-60 transition-colors">
                    <FileSignature size={15} /> {saving ? "Submitting…" : "Submit application"}
                </button>
            </div>
        </div>
    );
}

// Read-only field pair for the detail view.
function RO({ label, children, className = "" }) {
    return (
        <div className={className}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm text-gray-800">{children || <span className="text-gray-300">—</span>}</p>
        </div>
    );
}

// Detail view of a submitted leave — the whole application read-only, plus the
// Section 5 manager assessment (editable + signable for admins, read-only for
// the staffer). Signatures are fetched on open so they stay out of list loads.
function LeaveDetailModal({ id, canManage, onClose }) {
    const [leave, setLeave] = useState(null);
    const [loading, setLoading] = useState(true);
    const [m, setM] = useState({ decision: "", working_days_approved: "", operational_impact: "", manager_comments: "", manager_signature: null });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        fetch(`/dtr/leaves/${id}`, { headers: { Accept: "application/json" }, credentials: "same-origin" })
            .then((r) => r.json())
            .then((d) => { if (!alive) return; setLeave(d); setLoading(false); setM({ decision: d.decision || "", working_days_approved: d.working_days_approved || "", operational_impact: d.operational_impact || "", manager_comments: d.manager_comments || "", manager_signature: d.manager_signature || null }); })
            .catch(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [id]);

    const submitAssessment = () => {
        if (!m.decision) return;
        setSaving(true);
        router.post(`/dtr/leaves/${id}/review`, m, { preserveScroll: true, onFinish: () => setSaving(false), onSuccess: () => onClose() });
    };
    const input = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30 focus:border-[#436235]";

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Leave application</h2>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18} /></button>
                </div>

                {loading || !leave ? (
                    <div className="px-6 py-16 text-center text-sm text-gray-400">Loading…</div>
                ) : (
                    <div className="p-6 space-y-7">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-900">{leave.full_name || leave.user || "—"}</p>
                                <p className="text-xs text-gray-500">{leave.position || "—"}</p>
                            </div>
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${leaveBadge(leave.status)}`}>{leave.decision || leave.status}</span>
                        </div>

                        <div>
                            <SectionBar n={2} title="Type of Leave" />
                            <p className="text-sm text-gray-800">{leave.type}{leave.other_specify ? ` — ${leave.other_specify}` : ""}</p>
                        </div>

                        <div>
                            <SectionBar n={3} title="Leave Period & Details" />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <RO label="First day">{leave.start_date}</RO>
                                <RO label="Last day">{leave.end_date}</RO>
                                <RO label="Returning">{leave.return_date}</RO>
                                <RO label="Total days">{leave.total_days}</RO>
                                <RO label="Half day">{leave.half_day}</RO>
                            </div>
                            <RO label="Reason" className="mt-4">{leave.reason}</RO>
                        </div>

                        <div>
                            <SectionBar n={4} title="Employee Declaration" />
                            <p className="text-[13px] text-gray-600 flex items-center gap-2">{leave.declaration ? <Check size={15} className="text-emerald-600" /> : <X size={15} className="text-rose-500" />} Declaration {leave.declaration ? "accepted" : "not accepted"}.</p>
                            <div className="mt-3 flex items-end gap-6">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Employee signature</p>
                                    {leave.employee_signature
                                        ? <div className="border border-gray-200 rounded-lg bg-white p-2 inline-block"><img src={leave.employee_signature} alt="employee signature" className="h-14" /></div>
                                        : <span className="text-xs text-gray-300">Not signed</span>}
                                </div>
                                <RO label="Date">{leave.employee_signed_at}</RO>
                            </div>
                        </div>

                        {/* Section 5 — manager assessment */}
                        <div className="rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-4 py-2 bg-slate-600 text-white text-[10px] font-bold uppercase tracking-[0.18em]">For office use only — Manager & HR</div>
                            <div className="p-4">
                                <SectionBar n={5} title="Manager Assessment & Approval" />
                                {canManage ? (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Decision</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {DECISIONS.map((d) => {
                                                    const on = m.decision === d;
                                                    return (
                                                        <button key={d} type="button" onClick={() => setM((p) => ({ ...p, decision: d }))}
                                                            className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all ${on ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>{d}</button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <label className="block">
                                                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Working days approved</span>
                                                <input className={input} value={m.working_days_approved} onChange={(e) => setM((p) => ({ ...p, working_days_approved: e.target.value }))} />
                                            </label>
                                            <label className="block">
                                                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Operational impact assessed</span>
                                                <select className={input} value={m.operational_impact} onChange={(e) => setM((p) => ({ ...p, operational_impact: e.target.value }))}>
                                                    <option value="">—</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                                                </select>
                                            </label>
                                        </div>
                                        <label className="block">
                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Manager comments / reason if declined</span>
                                            <textarea rows={2} className={`${input} resize-y`} value={m.manager_comments} onChange={(e) => setM((p) => ({ ...p, manager_comments: e.target.value }))} />
                                        </label>
                                        <SignaturePad label="Manager signature" value={m.manager_signature} onChange={(v) => setM((p) => ({ ...p, manager_signature: v }))} />
                                        <div className="flex justify-end">
                                            <button onClick={submitAssessment} disabled={saving || !m.decision} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#436235] text-white text-sm font-bold rounded-xl hover:bg-[#375029] disabled:opacity-50 transition-colors">
                                                <Save size={15} /> {saving ? "Saving…" : "Record decision"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {leave.decision ? (
                                            <>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    <RO label="Decision">{leave.decision}</RO>
                                                    <RO label="Working days approved">{leave.working_days_approved}</RO>
                                                    <RO label="Operational impact">{leave.operational_impact}</RO>
                                                </div>
                                                <RO label="Manager comments">{leave.manager_comments}</RO>
                                                <div className="flex items-end gap-6">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Manager signature</p>
                                                        {leave.manager_signature
                                                            ? <div className="border border-gray-200 rounded-lg bg-white p-2 inline-block"><img src={leave.manager_signature} alt="manager signature" className="h-14" /></div>
                                                            : <span className="text-xs text-gray-300">Not signed</span>}
                                                    </div>
                                                    <RO label="Date">{leave.manager_signed_at}</RO>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-400">Awaiting your manager's assessment.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// The Leave tab. Staff file an application + see their own; admins additionally
// get an overview dashboard (pending queue + all-staff leave) and open any
// application to record the Section 5 manager assessment.
function LeaveTab({ leaves = [], leaveTypes = [], minLeaveDate = "", canManage = false, adminLeaves = [], adminPendingLeaves = [], account = {}, setting = {}, today = "" }) {
    const [detailId, setDetailId] = useState(null);

    const myRequests = (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">My leave requests</h3>
            {leaves.length === 0 ? (
                <p className="text-xs text-gray-400">No leave filed yet.</p>
            ) : (
                <div className="space-y-2">
                    {leaves.map((l) => (
                        <button key={l.id} onClick={() => setDetailId(l.id)} className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50/60 text-left transition-colors">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800">{l.type}</p>
                                <p className="text-[11px] text-gray-500">{l.start_date}{l.end_date !== l.start_date ? ` → ${l.end_date}` : ""}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${leaveBadge(l.status)}`}>{l.decision || l.status}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    if (!canManage) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <LeaveForm account={account} setting={setting} leaveTypes={leaveTypes} minLeaveDate={minLeaveDate} today={today} />
                </div>
                <div className="lg:sticky lg:top-6">{myRequests}</div>
                {detailId && <LeaveDetailModal id={detailId} canManage={false} onClose={() => setDetailId(null)} />}
            </div>
        );
    }

    const counts = {
        pending: adminLeaves.filter((l) => l.status === "pending").length,
        approved: adminLeaves.filter((l) => l.status === "approved").length,
        rejected: adminLeaves.filter((l) => l.status === "rejected").length,
    };

    return (
        <div className="space-y-6">
            {/* Stat row */}
            <div className="grid grid-cols-3 gap-4">
                {[["Pending", counts.pending, "text-amber-600"], ["Approved", counts.approved, "text-emerald-600"], ["Rejected", counts.rejected, "text-rose-600"]].map(([label, val, tone]) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                        <p className={`text-2xl font-bold ${tone}`}>{val}</p>
                    </div>
                ))}
            </div>

            {/* Balanced dashboard row: queue + table on the left, my requests on the right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    {/* Pending approval queue */}
                    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/60">
                            <h3 className="text-sm font-bold text-amber-800">Awaiting approval · {adminPendingLeaves.length}</h3>
                        </div>
                        {adminPendingLeaves.length === 0 ? (
                            <p className="px-6 py-6 text-sm text-gray-400">No leave requests waiting.</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {adminPendingLeaves.map((l) => (
                                    <div key={l.id} className="flex items-center justify-between gap-4 px-6 py-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900">{l.user || l.full_name || "—"} · <span className="text-gray-600">{l.type}</span></p>
                                            <p className="text-xs text-gray-500">{l.start_date}{l.end_date !== l.start_date ? ` → ${l.end_date}` : ""}{l.reason ? ` · ${l.reason}` : ""}</p>
                                        </div>
                                        <button onClick={() => setDetailId(l.id)} className="px-3 py-1.5 rounded-lg bg-[#436235] text-white text-xs font-bold hover:bg-[#375029] transition-colors shrink-0">Review &amp; decide</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* All staff leaves */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900">All staff leave</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        <th className="px-4 py-3">Staff</th><th className="px-3 py-3">Type</th>
                                        <th className="px-3 py-3">Dates</th><th className="px-3 py-3">Decision</th><th className="px-3 py-3">Status</th><th className="px-3 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {adminLeaves.length === 0 ? (
                                        <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No leave filed by anyone yet.</td></tr>
                                    ) : adminLeaves.map((l) => (
                                        <tr key={l.id} onClick={() => setDetailId(l.id)} className="hover:bg-gray-50/50 cursor-pointer">
                                            <td className="px-4 py-2.5 font-semibold text-gray-800">{l.user || l.full_name || "—"}</td>
                                            <td className="px-3 py-2.5 text-gray-600">{l.type}</td>
                                            <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{l.start_date}{l.end_date !== l.start_date ? ` → ${l.end_date}` : ""}</td>
                                            <td className="px-3 py-2.5 text-gray-600">{l.decision || "—"}</td>
                                            <td className="px-3 py-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${leaveBadge(l.status)}`}>{l.status}</span></td>
                                            <td className="px-3 py-2.5 text-right text-gray-300"><ChevronDown size={14} className="-rotate-90" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="lg:sticky lg:top-6">{myRequests}</div>
            </div>

            {/* File your own leave — full width so it reads as its own section */}
            <LeaveForm account={account} setting={setting} leaveTypes={leaveTypes} minLeaveDate={minLeaveDate} today={today} />

            {detailId && <LeaveDetailModal id={detailId} canManage={true} onClose={() => setDetailId(null)} />}
        </div>
    );
}

const MIN_TASK_ROWS = 5; // starting rows; users add more as needed
const blankTasks = () => Array.from({ length: MIN_TASK_ROWS }, () => ({ task: "", pending: "" }));

const toMinutes = (hhmm) => {
    if (!hhmm) return null;
    const [h, m] = String(hhmm).split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
};
const to12h = (hhmm) => {
    if (!hhmm) return "—";
    const [h, m] = String(hhmm).split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    const hh = ((h + 11) % 12) + 1;
    return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
};

// Client-side mirror of the server's Net/Variance/Attendance formula for a live
// preview before saving. The saved rows carry the authoritative values.
const compute = (timeIn, timeOut, s) => {
    const std = Number(s?.std_hours ?? 8);
    const brk = Number(s?.break_hours ?? 1);
    const brkAfter = Number(s?.break_after ?? 6);
    const grace = Number(s?.grace_mins ?? 10);
    let net = null, variance = null, attendance = null;
    const inM = toMinutes(timeIn), outM0 = toMinutes(timeOut);
    if (inM != null && outM0 != null) {
        let outM = outM0 <= inM ? outM0 + 24 * 60 : outM0;
        const worked = (outM - inM) / 60;
        net = Math.round((worked >= brkAfter ? worked - brk : worked) * 100) / 100;
        variance = Math.round((net - std) * 100) / 100;
    }
    if (inM != null && s?.sched_in) {
        attendance = inM <= toMinutes(s.sched_in) + grace ? "On Time" : "Late";
    }
    return { net, variance, attendance };
};

export default function DtrPage({ setting = null, entries = [], carried = [], leaves = [], leaveTypes = [], minLeaveDate = "", holidays = {}, account = {}, today = "", canSummary = false, canManage = false, adminLeaves = [], adminPendingLeaves = [] }) {
    const ready = setting && setting.is_complete;
    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <Head title="DTR — Daily Time & Task Record" />
            {ready
                ? <DailyRecord setting={setting} entries={entries} carried={carried} leaves={leaves} leaveTypes={leaveTypes} minLeaveDate={minLeaveDate} holidays={holidays} account={account} today={today} canSummary={canSummary} canManage={canManage} adminLeaves={adminLeaves} adminPendingLeaves={adminPendingLeaves} />
                : <NotSetUp account={account} canManage={canManage} />}
        </div>
    );
}

// Shown to a staffer whose DTR admin hasn't configured yet. Staff no longer
// set up their own — the schedule/timezone/hours are set for them, so this is
// a wait-state (or, for admins, a shortcut into the setup manager).
function NotSetUp({ account, canManage }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-16 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
                    <Clock size={26} />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Your DTR isn't set up yet</h1>
                <p className="text-sm text-gray-500 mt-2 max-w-md">
                    An admin sets your schedule, timezone and hours before you can start clocking in.
                    Once that's done your Daily Time Record will appear here.
                    {account?.name ? <> Linked account: <span className="font-semibold text-gray-700">{account.name}</span>.</> : null}
                </p>
                {canManage && (
                    <Link href="/admin/dtr/manage" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#436235] text-white text-sm font-bold rounded-xl hover:bg-[#375029] transition-colors">
                        <Settings size={15} /> Set up staff DTR
                    </Link>
                )}
            </div>
        </div>
    );
}

// ── Daily record ───────────────────────────────────────────────────────────
// Client-side CSV export of the user's logged days (payroll-ready columns).
function exportCsv(entries, setting) {
    const header = ["Date", "Day", "Time In", "Time Out", "Net Hrs", "Variance", "Attendance", "Tasks", "Open", "Remarks"];
    const rows = entries.map((e) => [
        e.work_date, e.day, to12h(e.time_in), to12h(e.time_out),
        e.net_hrs ?? "", e.variance ?? "", e.attendance ?? "",
        e.tasks_count, e.open_count, (e.remarks || "").replace(/\s+/g, " "),
    ]);
    const csv = [header, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `DTR_${(setting.label || "record").replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Editor for a single day — reused for Today (clock-driven, read-only times)
// and for editing/backfilling a past day (editable times). Keyed by date so
// each instance mounts fresh from its own entry.
function DayEditor({ setting, entry, date, isToday = false, carried = [] }) {
    const [timeIn, setTimeIn] = useState(entry?.time_in || "");
    const [timeOut, setTimeOut] = useState(entry?.time_out || "");
    const [remarks, setRemarks] = useState(entry?.remarks || "");
    const [tasks, setTasks] = useState(() => {
        const rows = (entry?.tasks || []).map((r) => ({ task: r.task || "", pending: r.pending || "" }));
        while (rows.length < MIN_TASK_ROWS) rows.push({ task: "", pending: "" });
        return rows;
    });
    const [saving, setSaving] = useState(false);

    const live = compute(timeIn, timeOut, setting);
    const filledTasks = tasks.filter((t) => t.task.trim()).length;
    const filledOpen = tasks.filter((t) => t.pending.trim()).length;
    const setTask = (i, k) => (e) => setTasks((p) => p.map((r, idx) => idx === i ? { ...r, [k]: e.target.value } : r));
    const addRow = () => setTasks((p) => [...p, { task: "", pending: "" }]);
    const stampNow = () => new Date().toLocaleTimeString("en-GB", { timeZone: setting.timezone || "UTC", hour: "2-digit", minute: "2-digit", hour12: false });

    const saveDay = (override = {}) => {
        setSaving(true);
        router.post("/dtr/entry", {
            work_date: date,
            time_in: (override.time_in ?? timeIn) || null,
            time_out: (override.time_out ?? timeOut) || null,
            tasks: tasks.filter((t) => t.task.trim() || t.pending.trim()),
            remarks: remarks || null,
        }, { preserveScroll: true, preserveState: true, onFinish: () => setSaving(false) });
    };
    const clockIn = () => { const t = stampNow(); setTimeIn(t); saveDay({ time_in: t }); };
    const clockOut = () => { const t = stampNow(); setTimeOut(t); saveDay({ time_out: t }); };

    // Past days are locked — nobody edits a closed record, not even an admin
    // or super_admin. Only "today" stays editable so people can clock in and
    // log the day's tasks.
    const readOnly = !isToday;

    const input = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30 focus:border-[#436235]";
    const varTone = live.variance == null ? "" : live.variance >= 0 ? "text-emerald-600" : "text-rose-600";
    const tid = (i) => `dtr-task-${date}-${i}`;

    return (
        <div className="p-6 space-y-5">
            {isToday && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-[#436235]/[0.06] to-transparent border border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            timeOut ? "bg-gray-100 text-gray-500" : timeIn ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                        }`}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</p>
                            <p className="text-sm font-bold text-gray-900">
                                {timeOut ? `Done for the day · ${to12h(timeIn)} – ${to12h(timeOut)}` : timeIn ? `Working since ${to12h(timeIn)}` : "Not clocked in yet"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={clockIn} disabled={!!timeIn} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#436235] text-white text-sm font-bold hover:bg-[#375029] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"><LogIn size={16} /> Clock in</button>
                        <button onClick={clockOut} disabled={!timeIn || !!timeOut} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><LogOut size={16} /> Clock out</button>
                    </div>
                </div>
            )}

            {/* Unified stat strip */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-gray-100">
                    <div className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Time in</p>
                        <p className="text-lg font-bold text-gray-900">{timeIn ? to12h(timeIn) : "—"}</p>
                    </div>
                    <div className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Time out</p>
                        <p className="text-lg font-bold text-gray-900">{timeOut ? to12h(timeOut) : "—"}</p>
                    </div>
                    <div className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Net hrs</p>
                        <p className="text-lg font-bold text-gray-900">{live.net != null ? live.net.toFixed(2) : "—"}</p>
                    </div>
                    <div className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Variance</p>
                        <p className={`text-lg font-bold ${varTone || "text-gray-900"}`}>{live.variance != null ? (live.variance >= 0 ? "+" : "") + live.variance.toFixed(2) : "—"}</p>
                    </div>
                    <div className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Attendance</p>
                        {live.attendance
                            ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${live.attendance === "Late" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{live.attendance === "Late" ? <AlertTriangle size={11} /> : <CheckCircle size={11} />} {live.attendance}</span>
                            : <p className="text-lg font-bold text-gray-300">—</p>}
                    </div>
                    <div className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Schedule</p>
                        <p className="text-sm font-semibold text-gray-700">{to12h(setting.sched_in)} – {to12h(setting.sched_out)}</p>
                    </div>
                </div>
            </div>

            {/* Carried-over pending from previous days — only when there are any.
                Lives inside today's Tasks & Pending so it's worked here. */}
            {isToday && carried.length > 0 && <CarriedChecklist carried={carried} />}

            {/* Task grid */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Tasks & pending</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 tabular-nums">{filledTasks} tasks</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 tabular-nums">{filledOpen} open</span>
                    </div>
                </div>
                {readOnly ? (
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="grid grid-cols-[36px_1fr_1fr] bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <div className="px-2 py-2.5 text-center">#</div>
                            <div className="px-3 py-2.5 border-l border-gray-200">Task completed</div>
                            <div className="px-3 py-2.5 border-l border-gray-200">Pending / for tomorrow</div>
                        </div>
                        {tasks.filter((t) => t.task.trim() || t.pending.trim()).length === 0 ? (
                            <div className="px-3 py-4 text-center text-xs text-gray-400">No tasks were logged this day.</div>
                        ) : tasks.filter((t) => t.task.trim() || t.pending.trim()).map((row, i) => (
                            <div key={i} className="grid grid-cols-[36px_1fr_1fr] border-b border-gray-100 last:border-b-0">
                                <div className="flex items-center justify-center text-[11px] text-gray-400 tabular-nums">{i + 1}</div>
                                <div className="px-3 py-2 text-sm text-gray-800 border-l border-gray-100">{row.task || <span className="text-gray-300">—</span>}</div>
                                <div className="px-3 py-2 text-sm text-gray-800 border-l border-gray-100">{row.pending || <span className="text-gray-300">—</span>}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="grid grid-cols-[36px_1fr_1fr] bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <div className="px-2 py-2.5 text-center">#</div>
                            <div className="px-3 py-2.5 border-l border-gray-200">Task completed</div>
                            <div className="px-3 py-2.5 border-l border-gray-200">Pending / for tomorrow</div>
                        </div>
                        {tasks.map((row, i) => (
                            <div key={i} className="grid grid-cols-[36px_1fr_1fr] border-b border-gray-100 last:border-b-0 hover:bg-gray-50/40 transition-colors">
                                <div className="flex items-center justify-center text-[11px] text-gray-400 tabular-nums">{i + 1}</div>
                                <input
                                    id={tid(i)}
                                    onKeyDown={(e) => {
                                        if (e.key !== "Enter") return;
                                        e.preventDefault();
                                        if (i === tasks.length - 1) { addRow(); requestAnimationFrame(() => document.getElementById(tid(i + 1))?.focus()); }
                                        else document.getElementById(tid(i + 1))?.focus();
                                    }}
                                    className="px-3 py-2 text-sm bg-transparent border-l border-gray-100 outline-none focus:bg-[#436235]/[0.05]"
                                    placeholder="What did you work on?" value={row.task} onChange={setTask(i, "task")}
                                />
                                <input className="px-3 py-2 text-sm bg-transparent border-l border-gray-100 outline-none focus:bg-[#436235]/[0.05]" placeholder="Anything carried over?" value={row.pending} onChange={setTask(i, "pending")} />
                            </div>
                        ))}
                        <button type="button" onClick={addRow} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[#436235] hover:bg-[#436235]/[0.05] border-t border-gray-100 transition-colors">
                            <Plus size={13} /> Add line
                        </button>
                    </div>
                )}
            </div>

            <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Remarks</span>
                {readOnly
                    ? <p className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 min-h-[2.5rem] whitespace-pre-wrap">{remarks || <span className="text-gray-300">—</span>}</p>
                    : <textarea rows={2} className={`${input} resize-y`} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Anything worth noting…" />}
            </div>

            {readOnly ? (
                <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400">
                        <Clock size={13} /> Closed record — view only
                    </span>
                    <a href={`/dtr/report?date=${date}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#436235] text-white text-sm font-bold rounded-xl hover:bg-[#375029] transition-colors">
                        <Download size={15} /> Generate daily report
                    </a>
                </div>
            ) : (
                <div className="flex justify-end">
                    <button onClick={() => saveDay()} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#436235] text-white text-sm font-bold rounded-xl hover:bg-[#375029] disabled:opacity-60 transition-colors">
                        <Save size={15} /> {saving ? "Saving…" : "Save today"}
                    </button>
                </div>
            )}
        </div>
    );
}

function DailyRecord({ setting, entries, carried = [], leaves = [], leaveTypes = [], minLeaveDate = "", holidays = {}, account, today, canSummary = false, canManage = false, adminLeaves = [], adminPendingLeaves = [] }) {
    const [expanded, setExpanded] = useState(null);
    const [view, setView] = useState("dtr");
    const pendingLeaveCount = adminPendingLeaves.length;

    const todayEntry = entries.find((e) => e.work_date === today);
    const past = entries.filter((e) => e.work_date !== today);

    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400 mb-1">Daily Time & Task Record</p>
                    <h1 className="text-2xl font-bold text-gray-900">{setting.label || "My DTR"}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {account.name} · {setting.position || "—"} · {setting.team || "—"} · {setting.timezone.replace(/_/g, " ")}
                        {setting.reports_to ? ` · reports to ${setting.reports_to}` : ""}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => exportCsv(entries, setting)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        <Download size={15} /> Export CSV
                    </button>
                    {canManage && (
                        <Link href="/admin/dtr/reports" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                            <CalendarDays size={15} /> Daily Reports
                        </Link>
                    )}
                    {canSummary && (
                        <Link href="/admin/dtr/summary" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                            <BarChart3 size={15} /> Team Summary
                        </Link>
                    )}
                    {canManage && (
                        <Link href="/admin/dtr/manage" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                            <Settings size={15} /> Manage DTR
                        </Link>
                    )}
                </div>
            </div>

            {/* View tabs — DTR · Calendar · Leave */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-max">
                <button onClick={() => setView("dtr")} className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-colors ${view === "dtr" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800"}`}>DTR</button>
                <button onClick={() => setView("calendar")} className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-colors ${view === "calendar" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800"}`}>Calendar</button>
                <button onClick={() => setView("leave")} className={`relative px-5 py-1.5 rounded-lg text-sm font-bold transition-colors ${view === "leave" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800"}`}>
                    Leave
                    {canManage && pendingLeaveCount > 0 && <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold align-middle">{pendingLeaveCount}</span>}
                </button>
            </div>

            {view === "dtr" && (<>
            {/* Today */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-br from-gray-50 to-white">
                    <Clock size={16} className="text-[#436235]" />
                    <h2 className="text-base font-bold text-gray-900">Today — {today}</h2>
                </div>
                <DayEditor key={today} setting={setting} entry={todayEntry} date={today} isToday carried={carried} />
            </div>

            {/* Recent entries */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900">Recent days</h2>
                    <p className="text-[11px] text-gray-400">Click a row to view that day (locked)</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-gray-50/60 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Date</th><th className="px-3 py-3">Day</th>
                                <th className="px-3 py-3">In</th><th className="px-3 py-3">Out</th>
                                <th className="px-3 py-3">Net</th><th className="px-3 py-3">Var</th>
                                <th className="px-3 py-3">Attendance</th><th className="px-3 py-3">Tasks</th><th className="px-3 py-3">Open</th>
                                <th className="px-3 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {past.length === 0 ? (
                                <tr><td colSpan="10" className="px-4 py-10 text-center text-gray-400">No past days yet.</td></tr>
                            ) : past.map((e) => (
                                <React.Fragment key={e.id}>
                                    <tr onClick={() => setExpanded(expanded === e.work_date ? null : e.work_date)} className="hover:bg-gray-50/60 cursor-pointer">
                                        <td className="px-4 py-2.5 font-semibold text-gray-800">{e.work_date}</td>
                                        <td className="px-3 py-2.5 text-gray-500">{e.day}</td>
                                        <td className="px-3 py-2.5">{to12h(e.time_in)}</td>
                                        <td className="px-3 py-2.5">{to12h(e.time_out)}</td>
                                        <td className="px-3 py-2.5 font-semibold">{e.net_hrs != null ? e.net_hrs.toFixed(2) : "—"}</td>
                                        <td className={`px-3 py-2.5 font-semibold ${e.variance == null ? "" : e.variance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                            {e.variance != null ? (e.variance >= 0 ? "+" : "") + e.variance.toFixed(2) : "—"}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            {e.attendance ? (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${e.attendance === "Late" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                    {e.attendance === "Late" ? <AlertTriangle size={10} /> : <CheckCircle size={10} />} {e.attendance}
                                                </span>
                                            ) : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-3 py-2.5 tabular-nums">
                                            {e.net_hrs != null && e.tasks_count === 0
                                                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700"><AlertTriangle size={10} /> No task</span>
                                                : e.tasks_count}
                                        </td>
                                        <td className="px-3 py-2.5 tabular-nums">{e.open_count}</td>
                                        <td className="px-3 py-2.5 text-right">
                                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${expanded === e.work_date ? "rotate-180" : ""}`} />
                                        </td>
                                    </tr>
                                    {expanded === e.work_date && (
                                        <tr>
                                            <td colSpan="10" className="p-0 bg-gray-50/40 border-t border-gray-100">
                                                <DayEditor key={e.work_date} setting={setting} entry={e} date={e.work_date} />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            </>)}

            {view === "calendar" && (
                <div className="space-y-6">
                    <DtrCalendar entries={entries} leaves={leaves} holidays={holidays} today={today} expanded={expanded} onPick={(ds) => setExpanded(ds)} />
                    {expanded && (() => {
                        const dayEntry = entries.find((e) => e.work_date === expanded);
                        return (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-gray-50 to-white">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays size={16} className="text-[#436235]" />
                                        <h2 className="text-base font-bold text-gray-900">{expanded}{expanded === today ? " · Today" : ""}</h2>
                                    </div>
                                    {!dayEntry && <span className="text-[11px] text-gray-400">{expanded === today ? "No record yet — add one below" : "No record for this day"}</span>}
                                </div>
                                <DayEditor key={expanded} setting={setting} entry={dayEntry} date={expanded} isToday={expanded === today} carried={expanded === today ? carried : []} />
                            </div>
                        );
                    })()}
                </div>
            )}

            {view === "leave" && (
                <LeaveTab leaves={leaves} leaveTypes={leaveTypes} minLeaveDate={minLeaveDate} canManage={canManage} adminLeaves={adminLeaves} adminPendingLeaves={adminPendingLeaves} account={account} setting={setting} today={today} />
            )}
        </>
    );
}
