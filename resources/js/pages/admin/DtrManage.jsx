import React, { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { Clock, ArrowLeft, Settings, CheckCircle2, CircleDashed, X, Save, Search, Download } from "lucide-react";

// Known teams → their timezone. Picking a team auto-fills the tz so PH/NZ
// staff can't mismatch them. Add teams here as they're onboarded.
const TEAM_TZ = { "Philippines": "Asia/Manila", "New Zealand": "Pacific/Auckland" };
const KNOWN_TEAMS = Object.keys(TEAM_TZ);

const ROLE_LABEL = {
    super_admin: "Super Admin", admin: "Admin", sales: "Sales", education: "Education",
    english: "English", immigration: "Immigration", accommodation: "Accommodation",
    finance: "Finance", agent: "Agent", immigration_manager: "Immigration Mgr",
    immigration_adviser: "Immigration Adviser",
};
const roleName = (r) => ROLE_LABEL[r] || r;

const to12h = (hhmm) => {
    if (!hhmm) return "—";
    const [h, m] = String(hhmm).split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    const hh = ((h + 11) % 12) + 1;
    return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
};

// Module-level so the inputs keep a stable identity across renders (defining
// this inside the form component remounts inputs on every keystroke).
function Field({ label, hint, children }) {
    return (
        <label className="block">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</span>
            {children}
            {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
        </label>
    );
}

// Setup modal for one staffer — create or edit their yellow cells.
function SetupModal({ person, onClose }) {
    const setting = person.setting;
    const tzOptions = useMemo(() => {
        try { return Intl.supportedValuesOf("timeZone"); }
        catch { return ["Asia/Manila", "Pacific/Auckland", "Australia/Sydney", "UTC"]; }
    }, []);
    const [f, setF] = useState({
        label: setting?.label || `${person.name} · DTR`,
        position: setting?.position || "",
        team: setting?.team || "",
        timezone: setting?.timezone || "Asia/Manila",
        sched_in: setting?.sched_in || "09:00",
        sched_out: setting?.sched_out || "18:00",
        break_hours: setting?.break_hours ?? 1,
        reports_to: setting?.reports_to || "",
        std_hours: setting?.std_hours ?? 8,
        grace_mins: setting?.grace_mins ?? 10,
        break_after: setting?.break_after ?? 6,
    });
    const [saving, setSaving] = useState(false);
    const [otherTeam, setOtherTeam] = useState(!!setting?.team && !KNOWN_TEAMS.includes(setting.team));
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

    const onTeamChange = (e) => {
        const v = e.target.value;
        if (v === "__other") { setOtherTeam(true); setF((p) => ({ ...p, team: "" })); return; }
        setOtherTeam(false);
        setF((p) => ({ ...p, team: v, timezone: TEAM_TZ[v] || p.timezone }));
    };

    const save = () => {
        setSaving(true);
        router.post("/dtr/setup", { ...f, user_id: person.id }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
            onSuccess: () => onClose(),
        });
    };

    const input = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30 focus:border-[#436235]";

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white flex items-start justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400 mb-1">{setting ? "Edit DTR setup" : "New DTR setup"}</p>
                        <h2 className="text-xl font-bold text-gray-900">{person.name}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{roleName(person.role)} · {person.email}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"><X size={18} /></button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <Field label="DTR name"><input className={input} value={f.label} onChange={set("label")} placeholder="e.g. Angelika · DTR" /></Field>
                    <Field label="Position"><input className={input} value={f.position} onChange={set("position")} /></Field>
                    <Field label="Team" hint="Sets their holidays & default timezone">
                        <select className={input} value={otherTeam ? "__other" : f.team} onChange={onTeamChange}>
                            <option value="">Select team…</option>
                            {KNOWN_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                            <option value="__other">Other…</option>
                        </select>
                        {otherTeam && (
                            <input className={`${input} mt-2`} value={f.team} onChange={set("team")} placeholder="Custom team name" />
                        )}
                    </Field>

                    <Field label="Time zone">
                        <select className={input} value={f.timezone} onChange={set("timezone")}>
                            {tzOptions.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                        </select>
                    </Field>
                    <Field label="Sched. in" hint="When their duty starts"><input type="time" className={input} value={f.sched_in} onChange={set("sched_in")} /></Field>
                    <Field label="Sched. out" hint="When they're done for the day"><input type="time" className={input} value={f.sched_out} onChange={set("sched_out")} /></Field>

                    <Field label="Break (hrs)"><input type="number" step="0.25" min="0" className={input} value={f.break_hours} onChange={set("break_hours")} /></Field>
                    <Field label="Break after (hrs)" hint="Break is deducted once they work past this"><input type="number" step="0.5" min="0" className={input} value={f.break_after} onChange={set("break_after")} /></Field>
                    <Field label="Std hrs / day"><input type="number" step="0.5" min="0" className={input} value={f.std_hours} onChange={set("std_hours")} /></Field>

                    <Field label="Grace (mins)" hint="Late is counted after this"><input type="number" step="1" min="0" className={input} value={f.grace_mins} onChange={set("grace_mins")} /></Field>
                    <Field label="Reports to"><input className={input} value={f.reports_to} onChange={set("reports_to")} /></Field>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
                    <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#436235] text-white text-sm font-bold rounded-xl hover:bg-[#375029] disabled:opacity-60 transition-colors">
                        <Save size={15} /> {saving ? "Saving…" : (setting ? "Save changes" : "Create DTR")}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Pick a date, then download that staffer's daily-report PDF.
function ReportModal({ person, onClose }) {
    const [date, setDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
    const download = () => {
        if (!date) return;
        window.open(`/dtr/report?date=${date}&user=${person.id}`, "_blank");
        onClose();
    };
    const input = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30 focus:border-[#436235]";
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden my-16" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white flex items-start justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400 mb-1">Generate daily report</p>
                        <h2 className="text-lg font-bold text-gray-900">{person.name}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18} /></button>
                </div>
                <div className="p-6">
                    <label className="block">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Report date</span>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
                    </label>
                    <p className="text-[11px] text-gray-400 mt-2">Downloads a PDF of {person.name.split(" ")[0]}'s time, tasks and remarks for the selected day.</p>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
                    <button onClick={download} disabled={!date} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#436235] text-white text-sm font-bold rounded-xl hover:bg-[#375029] disabled:opacity-60 transition-colors">
                        <Download size={15} /> Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DtrManage({ staff = [] }) {
    const [editing, setEditing] = useState(null);
    const [reportFor, setReportFor] = useState(null);
    const [q, setQ] = useState("");

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return staff;
        return staff.filter((s) => `${s.name} ${s.email} ${roleName(s.role)} ${s.setting?.team || ""}`.toLowerCase().includes(t));
    }, [staff, q]);

    const setUpCount = staff.filter((s) => s.setting?.is_complete).length;

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <Head title="DTR — Setup Manager" />

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <Link href="/admin/dtr" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-2">
                        <ArrowLeft size={14} /> Back to my DTR
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">DTR Setup Manager</h1>
                    <p className="text-sm text-gray-500 mt-1">Set each staff member's schedule, timezone and hours. They clock in/out and log tasks against it — they don't configure their own.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Set up</p>
                        <p className="text-lg font-bold text-[#436235]">{setUpCount}<span className="text-gray-300"> / {staff.length}</span></p>
                    </div>
                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search staff…"
                            className="pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30 focus:border-[#436235] w-56" />
                    </div>
                </div>
            </div>

            {/* Staff table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider">
                                <th className="px-4 py-3">Staff</th>
                                <th className="px-3 py-3">Role</th>
                                <th className="px-3 py-3">Position</th>
                                <th className="px-3 py-3">Team</th>
                                <th className="px-3 py-3">Schedule</th>
                                <th className="px-3 py-3 text-right">Std / Grace</th>
                                <th className="px-3 py-3">Status</th>
                                <th className="px-3 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No staff match your search.</td></tr>
                            ) : filtered.map((s) => {
                                const set = s.setting;
                                const ready = set?.is_complete;
                                return (
                                    <tr key={s.id} className="hover:bg-gray-50/60">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-gray-800">{s.name}</p>
                                            <p className="text-[11px] text-gray-400">{s.email}</p>
                                        </td>
                                        <td className="px-3 py-3 text-gray-500">{roleName(s.role)}</td>
                                        <td className="px-3 py-3 text-gray-500">{set?.position || "—"}</td>
                                        <td className="px-3 py-3 text-gray-500">{set?.team || "—"}</td>
                                        <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{set ? `${to12h(set.sched_in)} – ${to12h(set.sched_out)}` : "—"}</td>
                                        <td className="px-3 py-3 text-right tabular-nums text-gray-500">{set ? `${Number(set.std_hours).toFixed(1)}h / ${set.grace_mins}m` : "—"}</td>
                                        <td className="px-3 py-3">
                                            {ready ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700"><CheckCircle2 size={11} /> Set up</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700"><CircleDashed size={11} /> Not set up</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <div className="inline-flex items-center gap-2 justify-end">
                                                {ready && (
                                                    <button onClick={() => setReportFor(s)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                                                        <Download size={13} /> Report
                                                    </button>
                                                )}
                                                <button onClick={() => setEditing(s)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${ready ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" : "bg-[#436235] text-white hover:bg-[#375029]"}`}>
                                                    <Settings size={13} /> {ready ? "Edit" : "Set up"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <Clock size={12} /> Staff see their DTR under their own portal once you've set it up here. Picking a known team auto-fills the correct timezone.
            </p>

            {editing && <SetupModal person={editing} onClose={() => setEditing(null)} />}
            {reportFor && <ReportModal person={reportFor} onClose={() => setReportFor(null)} />}
        </div>
    );
}
