import { useMemo, useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    BadgeCheck, CheckCircle2, ShieldCheck, GraduationCap, Mail, Clock, Loader2,
    ExternalLink, Search, X, Check, Plus, School, CalendarDays, Send,
    Trash2, ArrowLeftRight, DollarSign, AlertCircle, ChevronRight,
} from "lucide-react";

// ── Program Verification ────────────────────────────────────────────────────
// Reviewer (super admin / education) works a queue of submitted study proposals:
// pick a proposal on the left, confirm each program's fee / school / intake and
// verify it, run the pre-approval checks, then approve — with or without the
// client email. Only on approval does the shortlist reach the client's tracker.

const money = (n) => {
    const v = Number(n);
    return Number.isFinite(v) && v > 0 ? v.toLocaleString("en-NZ", { maximumFractionDigits: 0 }) : "—";
};

const timeAgo = (iso) => {
    if (!iso) return "";
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60) || 1}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    const d = Math.floor(s / 86400);
    return d === 1 ? "Yesterday" : `${d} days ago`;
};

const fmtDateTime = (iso) => iso
    ? new Date(iso).toLocaleString("en-NZ", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

export default function ProgramVerification({
    proposals = [], counts = { pending: 0, verified: 0, approved_today: 0 },
    programs = [], schools = [], leadBase = "/admin",
}) {
    const [filter, setFilter] = useState("pending"); // pending | verified | approved
    const [activeId, setActiveId] = useState(proposals[0]?.id ?? null);

    const list = useMemo(() => proposals.filter((p) => {
        if (filter === "approved") return !!p.approved_at;
        return p.status === filter;
    }), [proposals, filter]);

    // Keep a valid active row as the filter / data changes.
    useEffect(() => {
        if (!list.find((p) => p.id === activeId)) setActiveId(list[0]?.id ?? null);
    }, [list]); // eslint-disable-line react-hooks/exhaustive-deps

    const active = proposals.find((p) => p.id === activeId) || null;

    return (
        <div className="max-w-[1500px] mx-auto pb-10">
            <Head title="Program Verification" />

            <div className="flex items-center gap-3 flex-wrap mb-4">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <BadgeCheck size={20} /> Program Verification
                </h1>
                <span className="text-[12px] text-gray-500">
                    {counts.pending} pending · {counts.verified} verified · {counts.approved_today} approved today
                </span>
            </div>

            <div className="flex gap-5 items-start">
                {/* ── Left rail — filters + queue ─────────────────────────── */}
                <aside className="w-[300px] shrink-0 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        <FilterStat active={filter === "pending"} onClick={() => setFilter("pending")} value={counts.pending} label="Pending" />
                        <FilterStat active={filter === "verified"} onClick={() => setFilter("verified")} value={counts.verified} label="Verified" />
                        <FilterStat active={filter === "approved"} onClick={() => setFilter("approved")} value={counts.approved_today} label="Approved" />
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Oldest first</span>
                    </div>

                    <div className="space-y-2 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
                        {list.length === 0 ? (
                            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-400">
                                <ShieldCheck size={22} className="mx-auto mb-2 text-gray-300" />
                                <p className="text-[12px] font-medium">Nothing here</p>
                            </div>
                        ) : list.map((p) => (
                            <QueueCard key={p.id} p={p} active={p.id === activeId} onClick={() => setActiveId(p.id)} />
                        ))}
                    </div>
                </aside>

                {/* ── Main — selected proposal ─────────────────────────────── */}
                <main className="flex-1 min-w-0">
                    {active ? (
                        <ProposalPanel key={active.id} p={active} catalogue={programs} schools={schools} leadBase={leadBase} />
                    ) : (
                        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center text-gray-400">
                            <ShieldCheck size={26} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm font-medium">Select a proposal to review</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

function FilterStat({ active, onClick, value, label }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                active ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-200 text-gray-900 hover:border-gray-300"
            }`}
        >
            <div className="text-lg font-bold leading-none tabular-nums">{value}</div>
            <div className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${active ? "text-gray-300" : "text-gray-400"}`}>{label}</div>
        </button>
    );
}

function QueueCard({ p, active, onClick }) {
    const noteTone = /transcript|duplicate|missing/i.test(p.note || "")
        ? "text-rose-600"
        : /ready/i.test(p.note || "") ? "text-emerald-600" : "text-amber-600";
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left rounded-xl border bg-white p-3 transition-all ${
                active ? "border-l-[3px] border-l-emerald-500 border-y-gray-100 border-r-gray-100 shadow-sm ring-1 ring-emerald-100" : "border-gray-100 hover:border-gray-200"
            }`}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <span className="text-[13px] font-bold text-gray-900 truncate">{p.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono ml-1.5">{p.lead_id}</span>
                </div>
                <StatusPill status={p.status} small />
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
                {p.programs_count} program{p.programs_count === 1 ? "" : "s"} · {timeAgo(p.submitted_at || p.verified_at || p.approved_at)}
            </div>
            {p.note && <div className={`text-[11px] font-medium mt-0.5 ${noteTone}`}>{p.note}</div>}
        </button>
    );
}

function StatusPill({ status, small }) {
    const map = {
        pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" },
        verified: { label: "Verified", cls: "bg-blue-50 text-blue-700 border-blue-200" },
        approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    };
    const m = map[status] || map.pending;
    return (
        <span className={`inline-flex items-center rounded-md font-bold uppercase tracking-wider border ${m.cls} ${small ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"}`}>
            {m.label}
        </span>
    );
}

// ── The selected proposal panel ─────────────────────────────────────────────
function ProposalPanel({ p, catalogue, schools, leadBase }) {
    const [tab, setTab] = useState("programs");
    const [busy, setBusy] = useState(null);
    const [selected, setSelected] = useState(() => new Set(p.programs.map((x) => x.id)));
    const [adding, setAdding] = useState(false);
    const [bulkMode, setBulkMode] = useState(null); // 'fee' | 'school'
    const [bulkFee, setBulkFee] = useState("");
    const [bulkSchool, setBulkSchool] = useState("");
    const [requesting, setRequesting] = useState(false);

    const post = (url, data, opts = {}) => {
        setBusy(opts.key || url);
        router.post(url, data, { preserveScroll: true, ...opts, onFinish: () => setBusy(null) });
    };

    const toggleSel = (id) => setSelected((s) => {
        const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
    });
    const allSelected = p.programs.length > 0 && selected.size === p.programs.length;
    const toggleAll = () => setSelected(allSelected ? new Set() : new Set(p.programs.map((x) => x.id)));
    const selIds = [...selected];

    // ── Actions ──────────────────────────────────────────────────────────
    const metaUpdate = (metaMap, key) => post(`/program-verification/${p.id}/programs-meta`, { meta: metaMap }, { key });

    const verifySelected = () => {
        if (!selIds.length) return;
        metaUpdate(Object.fromEntries(selIds.map((id) => [id, { status: "verified" }])), "verify-sel");
    };
    const toggleRowStatus = (row) => metaUpdate(
        { [row.id]: { status: row.p_status === "verified" ? "needs_check" : "verified" } }, `row-${row.id}`
    );
    const removeSelected = () => {
        const remaining = p.programs.filter((x) => !selected.has(x.id));
        if (!remaining.length) { alert("Keep at least one program."); return; }
        post(`/program-verification/${p.id}/programs`, {
            program_ids: remaining.map((x) => x.id),
            reasons: Object.fromEntries(remaining.filter((x) => x.reason).map((x) => [x.id, x.reason])),
        }, { key: "remove" });
    };
    const applyBulkFee = () => {
        const fee = Number(bulkFee);
        if (!Number.isFinite(fee) || fee <= 0 || !selIds.length) return;
        metaUpdate(Object.fromEntries(selIds.map((id) => [id, { fee, fee_confirmed: true }])), "bulk-fee");
        setBulkMode(null); setBulkFee("");
    };
    const applyBulkSchool = () => {
        if (!bulkSchool || !selIds.length) return;
        metaUpdate(Object.fromEntries(selIds.map((id) => [id, { school: bulkSchool }])), "bulk-school");
        setBulkMode(null); setBulkSchool("");
    };
    const addPrograms = (ids) => {
        const merged = [...new Set([...p.programs.map((x) => x.id), ...ids])].slice(0, 5);
        post(`/program-verification/${p.id}/programs`, {
            program_ids: merged,
            reasons: Object.fromEntries(p.programs.filter((x) => x.reason).map((x) => [x.id, x.reason])),
        }, { key: "add", onSuccess: () => setAdding(false) });
    };
    const approve = (opts) => post(`/program-verification/${p.id}/approve`, opts, { key: opts.verify_all ? "verify-all" : opts.send_email === false ? "approve-noemail" : "approve" });

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                        {p.initials}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-[16px] font-bold text-gray-900 truncate">{p.name}</h2>
                            <StatusPill status={p.status} />
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-x-3 gap-y-0.5 flex-wrap">
                            <span className="font-mono">{p.lead_id}</span>
                            {p.email && <span>{p.email}</span>}
                            <span>Submitted {fmtDateTime(p.submitted_at)}{p.submitted_by ? ` by ${p.submitted_by}` : ""}</span>
                        </div>
                        <Link href={`${leadBase}/leads/${p.id}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 mt-1">
                            View lead profile <ExternalLink size={11} />
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setRequesting(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-[12px] font-semibold hover:bg-gray-50"
                    >
                        Request changes
                    </button>
                    <button
                        type="button"
                        onClick={() => approve({ verify_all: true, send_email: true })}
                        disabled={busy === "verify-all" || p.status === "approved"}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-bold hover:bg-black disabled:opacity-40"
                    >
                        {busy === "verify-all" ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />} Verify &amp; approve all
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-gray-100 flex items-center gap-1">
                <Tab active={tab === "programs"} onClick={() => setTab("programs")}>Programs ({p.programs_count})</Tab>
                <Tab active={tab === "documents"} onClick={() => setTab("documents")}>Documents ({p.documents_count})</Tab>
                <Tab active={tab === "activity"} onClick={() => setTab("activity")}>Activity</Tab>
                <Tab active={tab === "preview"} onClick={() => setTab("preview")}>Client preview</Tab>
            </div>

            {tab === "programs" && (
                <div className="p-6 space-y-5">
                    {/* Bulk bar */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 flex-wrap text-[12px]">
                            <label className="inline-flex items-center gap-2 font-semibold text-gray-700">
                                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 text-gray-900" />
                                {selected.size} programme{selected.size === 1 ? "" : "s"} selected
                            </label>
                            <span className="text-gray-200">|</span>
                            <BulkLink onClick={verifySelected} busy={busy === "verify-sel"}>Verify</BulkLink>
                            <BulkLink onClick={() => { setBulkMode(bulkMode === "fee" ? null : "fee"); setBulkSchool(""); }}>Edit fee</BulkLink>
                            <BulkLink onClick={() => { setBulkMode(bulkMode === "school" ? null : "school"); setBulkFee(""); }}>Reassign school</BulkLink>
                            <BulkLink onClick={removeSelected} busy={busy === "remove"} tone="danger">Remove</BulkLink>
                        </div>
                        <div className="text-[12px] text-gray-500">
                            Total tuition <span className="font-bold text-gray-900">NZD {money(p.total_tuition)}</span>
                        </div>
                    </div>

                    {/* Bulk inline editors */}
                    {bulkMode === "fee" && (
                        <InlineBulk label="Set annual fee (NZD) for selected" onCancel={() => setBulkMode(null)} onApply={applyBulkFee} busy={busy === "bulk-fee"}>
                            <input type="number" value={bulkFee} onChange={(e) => setBulkFee(e.target.value)} placeholder="24500"
                                className="w-40 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900" />
                        </InlineBulk>
                    )}
                    {bulkMode === "school" && (
                        <InlineBulk label="Reassign selected to school" onCancel={() => setBulkMode(null)} onApply={applyBulkSchool} busy={busy === "bulk-school"}>
                            <select value={bulkSchool} onChange={(e) => setBulkSchool(e.target.value)}
                                className="w-64 px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gray-900">
                                <option value="">Select school…</option>
                                {schools.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </InlineBulk>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto -mx-2">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                    <th className="w-8 pl-2 py-2" />
                                    <th className="py-2 pr-3">Programme</th>
                                    <th className="py-2 px-3">School</th>
                                    <th className="py-2 px-3">Intake</th>
                                    <th className="py-2 px-3 text-right">Annual fee</th>
                                    <th className="py-2 px-3 text-right pr-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {p.programs.map((row) => (
                                    <ProgramRow
                                        key={row.id} row={row} selected={selected.has(row.id)}
                                        onToggle={() => toggleSel(row.id)}
                                        onStatus={() => toggleRowStatus(row)}
                                        onFee={(fee) => metaUpdate({ [row.id]: { fee, fee_confirmed: true } }, `row-${row.id}`)}
                                        onSchool={(school) => metaUpdate({ [row.id]: { school } }, `row-${row.id}`)}
                                        schools={schools}
                                        busy={busy === `row-${row.id}`}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                        <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900">
                            <Plus size={13} /> Add programme
                        </button>
                        <span className="text-gray-400">
                            Staff proposed {p.staff_proposed_count} · you edited {p.edited_count}
                        </span>
                    </div>

                    {/* Checks + On approval */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                        <ChecksCard checks={p.checks} />
                        <OnApprovalCard p={p} busy={busy} onApproveNoEmail={() => approve({ send_email: false })} />
                    </div>
                </div>
            )}

            {tab === "documents" && <DocsTab p={p} leadBase={leadBase} />}
            {tab === "activity" && <ActivityTab p={p} />}
            {tab === "preview" && <PreviewTab p={p} />}

            {adding && (
                <AddProgramModal
                    catalogue={catalogue}
                    existing={p.programs.map((x) => x.id)}
                    onClose={() => setAdding(false)}
                    onAdd={addPrograms}
                    busy={busy === "add"}
                />
            )}
            {requesting && (
                <RequestChangesModal
                    onClose={() => setRequesting(false)}
                    onSend={(message) => post(`/program-verification/${p.id}/request-changes`, { message }, { key: "req", onSuccess: () => setRequesting(false) })}
                    busy={busy === "req"}
                />
            )}
        </div>
    );
}

function Tab({ active, onClick, children }) {
    return (
        <button type="button" onClick={onClick}
            className={`px-1 py-3 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
                active ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"
            } mr-5`}>
            {children}
        </button>
    );
}

function BulkLink({ children, onClick, busy, tone }) {
    return (
        <button type="button" onClick={onClick} disabled={busy}
            className={`inline-flex items-center gap-1 font-semibold hover:underline disabled:opacity-50 ${tone === "danger" ? "text-rose-600" : "text-gray-700"}`}>
            {busy ? <Loader2 size={12} className="animate-spin" /> : null}{children}
        </button>
    );
}

function InlineBulk({ label, children, onApply, onCancel, busy }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-2.5 flex-wrap">
            <span className="text-[12px] font-semibold text-gray-600">{label}</span>
            {children}
            <button type="button" onClick={onApply} disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[12px] font-bold hover:bg-black disabled:opacity-50">
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Apply
            </button>
            <button type="button" onClick={onCancel} className="text-[12px] font-semibold text-gray-500 hover:text-gray-800">Cancel</button>
        </div>
    );
}

function ProgramRow({ row, selected, onToggle, onStatus, onFee, onSchool, schools, busy }) {
    const [editingFee, setEditingFee] = useState(false);
    const [feeVal, setFeeVal] = useState(row.fee ?? "");
    const [editingSchool, setEditingSchool] = useState(false);
    const verified = row.p_status === "verified";

    return (
        <tr className="align-top">
            <td className="pl-2 py-3">
                <input type="checkbox" checked={selected} onChange={onToggle} className="w-4 h-4 rounded border-gray-300 text-gray-900 mt-0.5" />
            </td>
            <td className="py-3 pr-3">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-gray-900">{row.title}</span>
                    {row.level != null && (
                        <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-100 text-gray-600">L{row.level}</span>
                    )}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                    {row.is_first_choice && <span className="text-emerald-600 font-medium">Client's first choice — </span>}
                    {row.reason || (row.is_first_choice ? "fee confirmed with school." : "No reason given by staff")}
                </div>
            </td>
            <td className="py-3 px-3 text-[12px] text-gray-700">
                {editingSchool ? (
                    <select autoFocus defaultValue={row.school || ""} onChange={(e) => { onSchool(e.target.value); setEditingSchool(false); }} onBlur={() => setEditingSchool(false)}
                        className="px-2 py-1 border border-gray-200 rounded-md text-[12px] bg-white focus:outline-none focus:border-gray-900">
                        <option value="">—</option>
                        {schools.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                ) : (
                    <button type="button" onClick={() => setEditingSchool(true)} className="hover:text-gray-900 hover:underline">
                        {row.school || <span className="text-gray-300">Assign</span>}
                    </button>
                )}
            </td>
            <td className="py-3 px-3 text-[12px] text-gray-700">{row.intake || <span className="text-gray-300">—</span>}</td>
            <td className="py-3 px-3 text-right">
                {editingFee ? (
                    <span className="inline-flex items-center gap-1">
                        <input type="number" autoFocus value={feeVal} onChange={(e) => setFeeVal(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { onFee(Number(feeVal)); setEditingFee(false); } if (e.key === "Escape") setEditingFee(false); }}
                            className="w-24 px-2 py-1 border border-gray-200 rounded-md text-[12px] text-right focus:outline-none focus:border-gray-900" />
                        <button type="button" onClick={() => { onFee(Number(feeVal)); setEditingFee(false); }} className="text-emerald-600"><Check size={14} /></button>
                    </span>
                ) : (
                    <button type="button" onClick={() => { setFeeVal(row.fee ?? ""); setEditingFee(true); }} className="group">
                        <span className="text-[13px] font-semibold text-gray-900 tabular-nums">{money(row.fee)}</span>
                        <span className={`block text-[10px] ${row.edited ? "text-indigo-500" : row.fee_confirmed ? "text-emerald-600" : "text-rose-500"}`}>
                            {row.edited ? "edited by you" : row.fee_confirmed ? "confirmed" : "fee unconfirmed"}
                        </span>
                    </button>
                )}
            </td>
            <td className="py-3 px-3 pr-2 text-right">
                <button type="button" onClick={onStatus} disabled={busy}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-colors disabled:opacity-50 ${
                        verified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"
                    }`}>
                    {busy ? <Loader2 size={11} className="animate-spin" /> : verified ? <Check size={11} /> : <AlertCircle size={11} />}
                    {verified ? "Verified" : "Needs check"}
                </button>
            </td>
        </tr>
    );
}

function ChecksCard({ checks }) {
    const items = [
        ["All fees confirmed against school price list", checks.fees],
        ["Intakes still open", checks.intakes],
        ["Passport and transcript on file", checks.documents],
        ["No duplicate proposal for this lead", checks.duplicate],
    ];
    return (
        <div className="rounded-2xl border border-gray-100 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-3">Checks before approval</p>
            <div className="space-y-2.5">
                {items.map(([label, c]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 text-[12.5px] text-gray-700">
                            {c.done
                                ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                                : <AlertCircle size={15} className="text-amber-500 shrink-0" />}
                            {label}
                        </span>
                        <span className={`text-[12px] font-semibold shrink-0 ${c.done ? "text-emerald-600" : "text-amber-600"}`}>{c.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function OnApprovalCard({ p, busy, onApproveNoEmail }) {
    return (
        <div className="rounded-2xl bg-gray-900 text-white p-4 flex flex-col">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40 mb-2">On approval</p>
            <p className="text-[12.5px] text-gray-200 leading-relaxed flex-1">
                {p.name.split(" ")[0]} sees these {p.programs_count} programme{p.programs_count === 1 ? "" : "s"} on their tracker and receives the confirmation email from <span className="font-semibold text-white">study@epathways.co.nz</span>.
            </p>
            <div className="flex items-center gap-2 mt-3">
                <Link href={`/track`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[12px] font-semibold">
                    <Mail size={13} /> Preview email
                </Link>
                <button type="button" onClick={onApproveNoEmail} disabled={busy === "approve-noemail" || p.status === "approved"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-gray-900 text-[12px] font-bold hover:bg-gray-100 disabled:opacity-40">
                    {busy === "approve-noemail" ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve without email
                </button>
            </div>
        </div>
    );
}

function DocsTab({ p, leadBase }) {
    return (
        <div className="p-6">
            <div className="rounded-xl border border-gray-100 p-8 text-center text-gray-500">
                <p className="text-[13px]">{p.documents_count} document{p.documents_count === 1 ? "" : "s"} on file for {p.name}.</p>
                <Link href={`${leadBase}/leads/${p.id}?tab=documents`} className="inline-flex items-center gap-1.5 mt-2 text-[12px] font-semibold text-indigo-600 hover:text-indigo-800">
                    Open documents <ExternalLink size={12} />
                </Link>
            </div>
        </div>
    );
}

function ActivityTab({ p }) {
    const items = [
        p.submitted_at && ["Submitted for verification", p.submitted_by, p.submitted_at],
        p.verified_at && ["Verified", p.verified_by, p.verified_at],
        p.approved_at && ["Approved", p.approved_by, p.approved_at],
    ].filter(Boolean);
    return (
        <div className="p-6 space-y-3">
            {p.changes_requested && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
                    <span className="font-bold">Changes requested:</span> {p.changes_requested.message}
                </div>
            )}
            {items.length === 0 ? <p className="text-[12.5px] text-gray-400">No activity yet.</p> : items.map(([label, who, at], i) => (
                <div key={i} className="flex items-center gap-3 text-[12.5px]">
                    <ChevronRight size={13} className="text-gray-300" />
                    <span className="font-semibold text-gray-800">{label}</span>
                    <span className="text-gray-400">{who ? `by ${who} · ` : ""}{fmtDateTime(at)}</span>
                </div>
            ))}
        </div>
    );
}

function PreviewTab({ p }) {
    return (
        <div className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-3">What the client will see</p>
            <div className="space-y-2">
                {p.programs.map((row) => (
                    <div key={row.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700">Level {row.level}</span>
                            <GraduationCap size={13} className="text-gray-400" />
                            <span className="text-[14px] font-semibold text-gray-900">{row.title}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600">
                            {row.school && <span className="inline-flex items-center gap-1"><School size={11} className="text-gray-400" /> {row.school}</span>}
                            {row.intake && <span className="inline-flex items-center gap-1"><CalendarDays size={11} className="text-gray-400" /> {row.intake}</span>}
                            {row.fee > 0 && <span className="inline-flex items-center gap-1"><DollarSign size={11} className="text-gray-400" /> NZD {money(row.fee)}</span>}
                        </div>
                        {row.reason && <p className="mt-2 text-[12px] text-emerald-900 bg-emerald-50/70 border border-emerald-100 rounded-lg px-3 py-2">{row.reason}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Modals ──────────────────────────────────────────────────────────────────
function AddProgramModal({ catalogue, existing, onClose, onAdd, busy }) {
    const [search, setSearch] = useState("");
    const [picked, setPicked] = useState([]);
    const room = 5 - existing.length;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return catalogue
            .filter((c) => !existing.includes(c.id))
            .filter((c) => !q || (c.title || "").toLowerCase().includes(q) || (c.school || "").toLowerCase().includes(q))
            .slice(0, 100);
    }, [catalogue, existing, search]);

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl h-[80vh] flex flex-col overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-[15px] font-bold text-gray-900">Add programme</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">Up to {room} more can be added.</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X size={18} /></button>
                </div>
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or school…"
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-gray-900" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {filtered.map((c) => {
                        const on = picked.includes(c.id);
                        const full = !on && picked.length >= room;
                        return (
                            <button key={c.id} type="button" disabled={full}
                                onClick={() => setPicked((prev) => on ? prev.filter((x) => x !== c.id) : [...prev, c.id])}
                                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${on ? "border-gray-900 bg-gray-900 text-white" : full ? "border-gray-100 opacity-40 cursor-not-allowed" : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"}`}>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-semibold truncate">{c.title}</p>
                                        <p className={`text-[11px] ${on ? "text-gray-300" : "text-gray-500"}`}>L{c.level} · {c.school || "—"} · {c.intake || "—"}</p>
                                    </div>
                                    {on && <Check size={15} className="shrink-0" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
                    <button type="button" onClick={() => onAdd(picked)} disabled={busy || picked.length === 0}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-black disabled:opacity-50">
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add {picked.length || ""}
                    </button>
                </div>
            </div>
        </div>
    );
}

function RequestChangesModal({ onClose, onSend, busy }) {
    const [msg, setMsg] = useState("");
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-gray-900">Request changes</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X size={18} /></button>
                </div>
                <div className="p-5">
                    <textarea rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="What needs revising? (the submitter sees this)"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 resize-y" />
                </div>
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
                    <button type="button" onClick={() => onSend(msg)} disabled={busy}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-black disabled:opacity-50">
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
                    </button>
                </div>
            </div>
        </div>
    );
}
