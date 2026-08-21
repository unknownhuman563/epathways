/**
 * Case Overview — the at-a-glance dashboard: where the case is in the pipeline,
 * what needs attention, document + family progress, the key facts, and recent
 * activity. Wired to the real case props; a few derived numbers fall back
 * gracefully when the underlying data isn't present.
 */
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "—");
const fmtShort = (iso) => (iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short" }) : "—");
const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString("en-NZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
const money = (n) => `$${Number(n || 0).toLocaleString("en-NZ")}`;

export default function OverviewTab(props) {
    const {
        lead = {}, documents = [], checklistProgress = {}, findings = { items: [] },
        financials = {}, dependents = [], activity = [], notes = [], engagement = {},
        onNavigate,
    } = props;

    const go = (tab) => onNavigate && onNavigate(tab);

    const openedIso = lead.created_at || lead.immigration_converted_at || null;
    const daysOpen = openedIso ? Math.max(0, Math.floor((Date.now() - new Date(openedIso).getTime()) / 86400000)) : null;
    const reqTotal = checklistProgress.required_total ?? 0;
    const reqApproved = checklistProgress.required_approved ?? 0;
    const withAdviser = documents.filter((d) => d.status === "Checked").length;
    const outstanding = financials?.totals?.outstanding ?? financials?.totals?.balance ?? 0;
    const paidAt = (financials?.payments || []).map((p) => p.paid_at).filter(Boolean).sort()[0] || null;

    // Document status tally across the case's files.
    const tally = documents.reduce((a, d) => {
        const s = (d.status || "").toLowerCase();
        if (s === "approved") a.approved++;
        else if (s === "checked") a.checked++;
        else if (s === "submitted" || s === "underreview" || s === "under_review") a.submitted++;
        return a;
    }, { approved: 0, checked: 0, submitted: 0 });
    const missing = Math.max(0, reqTotal - (tally.approved + tally.checked + tally.submitted));

    // Per-category document progress (matches the checklist split).
    const infoForm = { done: props.vif && (props.vif.status === "Approved" || props.vif.completed) ? 1 : 0, total: 1 };
    const applicant = { done: reqApproved, total: reqTotal };
    const depDone = dependents.reduce((s, d) => s + (d.progress?.required_done ?? 0), 0);
    const depTotal = dependents.reduce((s, d) => s + (d.progress?.required_total ?? 0), 0);

    // Pipeline stepper — each stage's state derived from case milestones.
    const steps = [
        { key: "assessment", label: "Assessment", done: !!lead.immigration_converted_at, sub: lead.immigration_converted_at ? `converted ${fmtShort(lead.immigration_converted_at)}` : "not converted" },
        { key: "engagement", label: "Engagement", done: !!engagement.sent, sub: engagement.signed ? `signed ${fmtShort(engagement.signed_at)}` : engagement.sent ? "sent" : "not sent" },
        { key: "invoice", label: "Invoice", done: !!paidAt, sub: paidAt ? `paid ${fmtShort(paidAt)}` : "not paid" },
        { key: "documents", label: "Documents", done: reqTotal > 0 && reqApproved >= reqTotal, sub: `${reqApproved} of ${reqTotal} approved` },
        { key: "lodgement", label: "INZ lodgement", done: /lodg|decision|approv|declin/i.test(lead.inz_status || ""), sub: lead.inz_status && /lodg|decision|approv|declin/i.test(lead.inz_status) ? lead.inz_status : "not started" },
        { key: "decision", label: "Decision", done: /approv|declin/i.test(lead.inz_status || ""), sub: /approv|declin/i.test(lead.inz_status || "") ? lead.inz_status : "—" },
    ];
    // Colour rule: completed stages are teal; every incomplete stage up to and
    // including the one just past the furthest completed milestone (the current
    // frontier) is amber; stages beyond the frontier are grey.
    const stepFrontier = steps.map((s) => s.done).lastIndexOf(true) + 1;

    // Needs attention — real findings first, then derived document nudges.
    const attentionItems = [];
    (findings.items || []).filter((f) => ["blocking", "check"].includes(f.severity)).slice(0, 4).forEach((f) => {
        attentionItems.push({ id: `f-${f.id}`, severity: f.severity, title: f.title, detail: f.detail, action: "Resolve", tab: "documents" });
    });
    if (withAdviser > 0) {
        attentionItems.unshift({ id: "adviser", severity: "blocking", title: `${withAdviser} document${withAdviser === 1 ? "" : "s"} waiting on the adviser`, detail: "Referred for the licensed adviser's verdict.", action: "Open review", tab: "documents" });
    }
    if (reqTotal > reqApproved) {
        attentionItems.push({ id: "req", severity: "check", title: `${reqTotal - reqApproved} required document${reqTotal - reqApproved === 1 ? "" : "s"} not yet approved`, detail: `${tally.submitted} submitted, ${tally.checked} checked by manager, ${missing} missing`, action: "Request", tab: "documents" });
    }

    const pinned = notes.find((n) => n.pinned) || null;
    const recent = (activity || []).slice(0, 5);

    return (
        <div className="space-y-5">
            {/* Where this case is — full-width row, edge to edge */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 className="text-[15px] font-bold text-gray-900">Where this case is
                        {daysOpen != null && <span className="text-[12px] font-normal text-gray-400 ml-2">Day {daysOpen}{lead.target_lodgement_at ? ` · target lodgement ${fmtDate(lead.target_lodgement_at)}` : ""}</span>}
                    </h2>
                </div>
                <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
                        {steps.map((s, i) => {
                            const state = s.done ? "done" : i <= stepFrontier ? "current" : "todo";
                            return (
                                <div key={s.key}>
                                    <div className={`h-1.5 rounded-full ${state === "done" ? "bg-teal-600" : state === "current" ? "bg-amber-500" : "bg-gray-200"}`} />
                                    <p className="text-[12.5px] font-semibold text-gray-900 mt-2">{s.label}</p>
                                    <p className={`text-[11px] mt-0.5 ${state === "current" ? "text-amber-600" : "text-gray-400"}`}>{s.sub}</p>
                                </div>
                            );
                        })}
                    </div>
            </section>

            {/* Two-column body below the full-width pipeline */}
            <div className="flex flex-col lg:flex-row gap-5 items-start">
                <div className="space-y-5 w-full min-w-0" style={{ flex: "1 1 0%" }}>
                {/* Needs attention */}
                {attentionItems.length > 0 && (
                    <section className="bg-red-50/40 rounded-2xl border border-red-100 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-[15px] font-bold text-gray-900">Needs attention</h2>
                            <span className="text-[11px] font-bold text-red-600 bg-white border border-red-200 rounded-full px-2 py-0.5">{attentionItems.length}</span>
                        </div>
                        <div className="space-y-2">
                            {attentionItems.map((a) => (
                                <div key={a.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.severity === "blocking" ? "bg-red-500" : "bg-amber-500"}`} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-semibold text-gray-900">{a.title}</p>
                                        {a.detail && <p className="text-[11.5px] text-gray-500 truncate">{a.detail}</p>}
                                    </div>
                                    <button type="button" onClick={() => go(a.tab)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 flex-shrink-0">{a.action}</button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Documents progress */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <h2 className="text-[15px] font-bold text-gray-900">Documents <span className="text-[12px] font-normal text-gray-400 ml-1">{reqApproved} of {reqTotal} approved · {documents.length} files on file</span></h2>
                        <button type="button" onClick={() => go("documents")} className="text-[13px] font-semibold text-teal-700 hover:underline">Open documents</button>
                    </div>
                    <ProgressBar segments={[
                        { v: tally.approved, cls: "bg-teal-700" },
                        { v: tally.checked, cls: "bg-teal-500" },
                        { v: tally.submitted, cls: "bg-amber-500" },
                        { v: missing, cls: "bg-gray-200" },
                    ]} total={reqTotal || (tally.approved + tally.checked + tally.submitted + missing) || 1} />
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11.5px] text-gray-600">
                        <Legend cls="bg-teal-700" label={`${tally.approved} approved`} />
                        <Legend cls="bg-teal-500" label={`${tally.checked} checked by manager`} />
                        <Legend cls="bg-amber-500" label={`${tally.submitted} submitted`} />
                        <Legend cls="bg-gray-200" label={`${missing} missing`} />
                    </div>
                    <div className="mt-4 space-y-3">
                        <CategoryRow label="Information form" done={infoForm.done} total={infoForm.total} />
                        <CategoryRow label="Applicant documents" done={applicant.done} total={applicant.total} />
                        {depTotal > 0 && <CategoryRow label="Dependant documents" done={depDone} total={depTotal} />}
                    </div>
                </section>

                {/* Family included */}
                {dependents.length > 0 && (
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <h2 className="text-[15px] font-bold text-gray-900">Family included <span className="text-[12px] font-normal text-gray-400 ml-1">{dependents.length} dependant{dependents.length === 1 ? "" : "s"}</span></h2>
                            <button type="button" onClick={() => go("dependants")} className="text-[13px] font-semibold text-teal-700 hover:underline">Open family</button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {dependents.map((dep) => {
                                const done = dep.progress?.required_done ?? 0;
                                const total = dep.progress?.required_total ?? 0;
                                return (
                                    <div key={dep.id} className="py-2.5 flex items-center gap-3">
                                        <span className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-semibold text-gray-900 truncate">{dep.full_name}</p>
                                            <p className="text-[11px] text-gray-400 truncate">{dep.dob ? `DOB ${dep.dob}` : ""}{dep.nationality ? ` · ${dep.nationality}` : ""}{dep.visa_name ? ` · ${dep.visa_name}` : ""}</p>
                                        </div>
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize flex-shrink-0">{dep.relationship}</span>
                                        {total > 0 && (
                                            <>
                                                <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden flex-shrink-0"><div className="h-full rounded-full bg-teal-600" style={{ width: `${(done / total) * 100}%` }} /></div>
                                                <span className="text-[11px] text-gray-500 tabular-nums w-10 text-right flex-shrink-0">{done}/{total}</span>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>

            {/* SIDEBAR */}
            <div className="w-full space-y-4" style={{ flex: "0 0 340px", maxWidth: "100%" }}>
                {/* Case facts */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-[15px] font-bold text-gray-900 mb-3">Case facts</h2>
                    <dl className="space-y-2.5">
                        <Fact k="Visa type" v={lead.inz_visa_type || "Not set"} />
                        <Fact k="Pipeline" v={[lead.stage || lead.immigration_stage, lead.inz_status].filter(Boolean).join(" · ") || "—"} />
                        <Fact k="Licensed adviser" v={lead.immigration_assignee_name || lead.immigration_assignee || "Unassigned"} />
                        <Fact k="Case manager" v={lead.case_manager_name || lead.immigration_manager_name || "—"} />
                        <Fact k="Opened" v={fmtDate(openedIso)} />
                        <Fact k="Target lodgement" v={lead.target_lodgement_at ? fmtDate(lead.target_lodgement_at) : "—"} />
                        <Fact k="Source" v={lead.is_assessment_converted ? "Assessment conversion" : "Sales-converted"} />
                    </dl>
                </section>

                {/* Stat tiles */}
                <div className="grid grid-cols-2 gap-3">
                    <Stat big={daysOpen != null ? String(daysOpen) : "—"} label="days open" />
                    <Stat big={`${reqApproved}/${reqTotal}`} label="documents approved" tone="amber" />
                    <Stat big={String(withAdviser)} label="with the adviser" tone={withAdviser > 0 ? "red" : undefined} />
                    <Stat big={money(outstanding)} label="outstanding on invoice" tone={outstanding > 0 ? "amber" : "teal"} />
                </div>

                {/* Pinned note */}
                {pinned && (
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-1.5">
                            <h2 className="text-[14px] font-bold text-gray-900">Pinned note</h2>
                            <span className="text-[9px] font-bold uppercase text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Staff only</span>
                        </div>
                        <p className="text-[12.5px] text-gray-600 leading-relaxed">{pinned.body || pinned.note || pinned.content}</p>
                        <p className="text-[11px] text-gray-400 mt-1.5">{pinned.author_name || pinned.author || ""}{pinned.created_at ? ` · ${fmtShort(pinned.created_at)}` : ""}</p>
                    </section>
                )}

                {/* Recent activity */}
                {recent.length > 0 && (
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[14px] font-bold text-gray-900">Recent activity</h2>
                            <button type="button" onClick={() => go("notes")} className="text-[12px] font-semibold text-teal-700 hover:underline">All</button>
                        </div>
                        <ul className="space-y-3">
                            {recent.map((a, i) => (
                                <li key={a.id || i} className="flex items-start gap-2.5">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[12px] text-gray-700 leading-snug">{a.description || a.title || "Activity"}</p>
                                        <p className="text-[11px] text-gray-400">{fmtDateTime(a.created_at)}{a.actor_name ? ` · ${a.actor_name}` : ""}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                </div>
            </div>
        </div>
    );
}

function ProgressBar({ segments, total }) {
    return (
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
            {segments.filter((s) => s.v > 0).map((s, i) => (
                <div key={i} className={s.cls} style={{ width: `${(s.v / total) * 100}%` }} />
            ))}
        </div>
    );
}

function Legend({ cls, label }) {
    return <span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-sm ${cls}`} /> {label}</span>;
}

function CategoryRow({ label, done, total }) {
    const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0;
    return (
        <div className="flex items-center gap-4">
            <span className="text-[13px] text-gray-700 w-40 flex-shrink-0">{label}</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full bg-teal-600" style={{ width: `${pct}%` }} /></div>
            <span className="text-[12px] text-gray-500 tabular-nums w-12 text-right flex-shrink-0">{done}/{total}</span>
        </div>
    );
}

function Fact({ k, v }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex-shrink-0 pt-0.5">{k}</dt>
            <dd className="text-[12.5px] font-semibold text-gray-900 text-right min-w-0">{v}</dd>
        </div>
    );
}

function Stat({ big, label, tone }) {
    const color = tone === "amber" ? "text-amber-600" : tone === "red" ? "text-red-600" : tone === "teal" ? "text-teal-600" : "text-gray-900";
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className={`text-2xl font-bold tabular-nums ${color}`}>{big}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
        </div>
    );
}
