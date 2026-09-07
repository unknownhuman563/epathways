import React from 'react';

/**
 * The three presentational strips that make up a lead profile's Overview tab:
 * the five-tile stat bar under the header, the six-step progress rail, and the
 * activity timeline at the foot of the tab.
 *
 * Everything rendered here is a fact counted server-side in
 * LeadController::buildOverview(). Nothing is inferred in the browser — where a
 * figure is unknown the payload sends null and these components say so, rather
 * than showing a plausible-looking number.
 *
 * Shared by every portal that renders the profile (admin, sales, education,
 * immigration, agent, sub-agent …) so the read of "where is this lead" is
 * identical wherever staff open it.
 */

const fmtDateTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-NZ', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};
const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' }).toLowerCase();
};

/** "6 hours" / "3 days" — how long the lead has sat where it is. */
const sinceLabel = (iso) => {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return null;
    const hours = Math.floor((Date.now() - t) / 3600000);
    if (hours < 1) return 'less than an hour';
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'}`;
};

function Chip({ tone = 'gray', children }) {
    const tones = {
        gray: 'bg-gray-100 text-gray-600',
        amber: 'bg-amber-50 text-amber-700',
        red: 'bg-red-50 text-red-700',
        emerald: 'bg-emerald-50 text-emerald-700',
    };
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${tones[tone]}`}>
            {children}
        </span>
    );
}

function Tile({ label, value, chip, caption, valueTone = 'text-gray-900' }) {
    return (
        <div className="px-4 py-3 min-w-0">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-gray-400 truncate">{label}</p>
            <div className="flex items-baseline gap-1.5 mt-1 min-w-0">
                <span className={`text-[14px] font-bold truncate ${value ? valueTone : 'text-gray-300'}`}>
                    {value || 'Not set'}
                </span>
                {chip}
            </div>
            {caption && <p className="text-[10.5px] text-gray-400 mt-0.5 leading-snug line-clamp-2">{caption}</p>}
        </div>
    );
}

/**
 * The five-tile bar: stage, owner, readiness, programs, last contact.
 *
 * Renders the grid only — no card of its own. It is mounted inside the profile
 * header's card so the two read as one block, which is also why the top border
 * lives here rather than as a gap between two cards.
 *
 * Always five across, scrolling sideways when the column is too narrow, rather
 * than reflowing. A breakpoint here kept collapsing the row into two ragged
 * ones — and five facts read as a row or not at all.
 */
export function LeadStatStrip({ overview }) {
    if (!overview) return null;
    const { stage, owner, readiness, programs, last_contact: lastContact } = overview;

    const blockingCount = readiness?.blocking?.length || 0;
    const stageSince = sinceLabel(stage?.since);
    const programTitles = (programs?.titles || []).map((p) => p.title).filter(Boolean).join(', ');

    return (
        <div className="border-t border-gray-100 overflow-x-auto">
        <div className="grid grid-cols-5 divide-x divide-gray-100 min-w-[720px]">
            <Tile
                label="Stage"
                value={stage?.label}
                chip={stage?.day != null && <Chip>Day {stage.day}</Chip>}
                caption={stageSince ? `in this stage ${stageSince}` : null}
            />
            <Tile
                label="Owner"
                value={owner?.name}
                caption={owner?.assigned_at ? `assigned ${fmtDateTime(owner.assigned_at)}` : 'not assigned yet'}
            />
            <Tile
                label="Record readiness"
                value={readiness ? `${readiness.percent}%` : null}
                chip={blockingCount > 0 && <Chip tone="amber">{blockingCount} blocking</Chip>}
                caption={readiness ? `${readiness.filled} of ${readiness.total} fields filled` : null}
            />
            <Tile
                label="Programs shortlisted"
                value={programs ? String(programs.count) : null}
                chip={programs?.count > 0 && (
                    programs.chosen_id
                        ? <Chip tone="emerald">Chosen</Chip>
                        : <Chip tone={programs.sent ? 'gray' : 'amber'}>{programs.sent ? 'Sent' : 'Not sent'}</Chip>
                )}
                caption={programTitles || 'none shortlisted yet'}
            />
            <Tile
                label="Last contact"
                value={lastContact?.label}
                caption={lastContact
                    ? `${fmtDateTime(lastContact.at)} · ${lastContact.replied ? 'replied' : 'no reply'}`
                    : 'no messages sent yet'}
            />
        </div>
        </div>
    );
}

// Each step's rail colour. `blocked` is amber rather than red on purpose: it is
// work outstanding, not a failure — the red is saved for overdue commitments.
const STATE_BAR = {
    done: 'bg-emerald-600',
    active: 'bg-amber-500',
    blocked: 'bg-amber-500',
    todo: 'bg-gray-200',
};

/**
 * The six-step rail: created → details → documents → assessment → proposal →
 * agreement.
 *
 * Always six across. The steps are a sequence, so wrapping them onto a second
 * row breaks the thing the rail is for — on a narrow screen the row scrolls
 * sideways instead, which keeps the order readable.
 */
export function LeadProgressStrip({ overview }) {
    if (!overview?.steps?.length) return null;

    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <h2 className="text-[15px] font-bold text-gray-900 mb-3">
                Where this lead is
                {overview.stage?.day != null && (
                    <span className="text-[12px] font-normal text-gray-400 ml-2">Day {overview.stage.day}</span>
                )}
            </h2>

            <div className="overflow-x-auto">
                <div className="grid grid-cols-6 gap-x-4 min-w-[620px]">
                    {overview.steps.map((s) => (
                        <div key={s.key} className="min-w-0">
                            <div className={`h-[3px] rounded-full ${STATE_BAR[s.state] || STATE_BAR.todo}`} />
                            <p className={`text-[13px] font-bold mt-2 truncate ${s.state === 'todo' ? 'text-gray-400' : 'text-gray-900'}`}>
                                {s.label}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5 leading-snug truncate" title={s.caption}>{s.caption}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Rows arrive as { kind, title, detail, reference, actor_name, actor_role, date }
// from LeadController::buildActivity — NOT the raw ActivityLog columns. Reading
// them as `action`/`description`/`created_at` silently rendered blank rows.
const KIND_CHIP = [
    [/mail|email|message|campaign|notif/i, 'Email', 'bg-gray-100 text-gray-600'],
    [/request|blocked|missing|pending/i, 'Action needed', 'bg-amber-50 text-amber-700'],
    [/delete|revoke|fail|reject/i, 'Removed', 'bg-red-50 text-red-700'],
    [/^source\./i, 'Source', 'bg-gray-100 text-gray-600'],
    [/stage|status|convert/i, 'Stage', 'bg-gray-100 text-gray-600'],
];
const chipFor = (a) => {
    const hay = `${a.kind || ''} ${a.title || ''}`;
    for (const [re, label, cls] of KIND_CHIP) {
        if (re.test(hay)) return [label, cls];
    }
    return [null, null];
};
const dotFor = (a) => {
    const [label] = chipFor(a);
    if (label === 'Action needed') return 'bg-amber-500';
    if (label === 'Removed') return 'bg-red-500';
    return 'bg-emerald-600';
};

/** Chronological audit feed for the lead — newest first. */
export function LeadActivityTimeline({ activity = [], pending = [] }) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';

    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50/40">
                <h2 className="text-[14px] font-bold text-gray-900">
                    Activity <span className="text-[11px] font-normal text-gray-400 ml-1">{activity.length} event{activity.length === 1 ? '' : 's'}</span>
                </h2>
                <span className="text-[11px] text-gray-400 shrink-0">All times {tz}</span>
            </div>

            {activity.length === 0 && pending.length === 0 ? (
                <p className="px-5 py-10 text-center text-[12px] text-gray-400">Nothing has happened on this lead yet.</p>
            ) : (
                <ul className="divide-y divide-gray-50">
                    {activity.map((a, i) => {
                        const [chip, chipCls] = chipFor(a);
                        // Who / what, on one line under the title. Entries with no
                        // actor (a source record, say) fall back to their detail.
                        const sub = [
                            a.actor_name ? `${a.actor_name}${a.actor_role ? ` · ${a.actor_role}` : ''}` : null,
                            a.detail,
                            a.reference,
                        ].filter(Boolean).join(' · ');
                        return (
                            <li key={`${a.kind}-${a.date}-${i}`} className="flex items-start gap-3 px-5 py-3">
                                <div className="w-[86px] shrink-0 pt-0.5">
                                    <p className="text-[11px] font-mono text-gray-500 leading-tight">{fmtDate(a.date)}</p>
                                    <p className="text-[11px] font-mono text-gray-400 leading-tight">{fmtTime(a.date)}</p>
                                </div>
                                <span className={`w-2 h-2 rounded-full shrink-0 mt-[7px] ${dotFor(a)}`} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                                        {a.title || a.kind}
                                        {chip && (
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${chipCls}`}>
                                                {chip}
                                            </span>
                                        )}
                                    </p>
                                    {sub && <p className="text-[11.5px] text-gray-400 mt-0.5 leading-snug">{sub}</p>}
                                </div>
                            </li>
                        );
                    })}

                    {/* What has not happened yet, shown hollow so it never reads as done. */}
                    {pending.map((p) => (
                        <li key={p.key} className="flex items-start gap-3 px-5 py-3">
                            <div className="w-[86px] shrink-0 pt-0.5">
                                <p className="text-[11px] font-mono text-gray-300 leading-tight">Pending</p>
                                <p className="text-[11px] font-mono text-gray-300 leading-tight">—</p>
                            </div>
                            <span className="w-2 h-2 rounded-full border border-gray-300 bg-white shrink-0 mt-[7px]" />
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-gray-400">{p.label}</p>
                                <p className="text-[11.5px] text-gray-400 mt-0.5 leading-snug">{p.caption}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
